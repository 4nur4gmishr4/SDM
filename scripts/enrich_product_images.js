/**
 * Product Image Search & Excel Link Enricher
 * Searches exact WebP/JPG product images on the web,
 * adds them to Column H ("Image_URL") in ALL PRODUCT LIST.xlsx,
 * and updates live Supabase products table simultaneously.
 * 
 * Usage:
 *   node scripts/enrich_product_images.js --limit 50
 *   node scripts/enrich_product_images.js --limit 200
 *   node scripts/enrich_product_images.js --featured
 *   node scripts/enrich_product_images.js --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSXModule from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const XLSX = XLSXModule.default || XLSXModule;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let serviceRoleKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    const val = v.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (k === 'VITE_SUPABASE_URL') supabaseUrl = val;
    if (k === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = val;
  }
}

const supabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

// Search function: OpenFoodFacts -> DuckDuckGo Images
async function fetchImageForProduct(name, brand, pack) {
  const cleanName = name.replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const query = `${cleanName} ${pack || ''}`.trim();

  // 1. Open Food Facts
  try {
    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=1`;
    const offRes = await fetch(offUrl, { headers: { 'User-Agent': 'SaiDarshanMart/1.0' } });
    if (offRes.ok) {
      const data = await offRes.json();
      const p = data.products?.[0];
      const img = p?.image_front_url || p?.image_url || p?.image_small_url;
      if (img) return img;
    }
  } catch (e) {
    // continue
  }

  // 2. DuckDuckGo Image Search
  try {
    const ddgQuery = `${cleanName} ${pack || ''} grocery india`.trim();
    const step1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(ddgQuery)}`);
    const html = await step1.text();
    const match = html.match(/vqd=([0-9-]+)/) || html.match(/vqd=['"]([0-9-]+)['"]/);
    if (match && match[1]) {
      const vqd = match[1];
      const step2 = await fetch(`https://duckduckgo.com/i.js?l=in-en&o=json&q=${encodeURIComponent(ddgQuery)}&vqd=${vqd}&f=,,,type:photo,`);
      if (step2.ok) {
        const json = await step2.json();
        // Look for webp or clean cdn images
        const webpMatch = json.results?.find(r => r.image && (r.image.includes('.webp') || r.image.includes('format=webp')));
        if (webpMatch?.image) return webpMatch.image;

        const anyImg = json.results?.find(r => r.image && !r.image.includes('.svg') && !r.image.includes('favicon'));
        if (anyImg?.image) return anyImg.image;
      }
    }
  } catch (e) {
    // continue
  }

  return null;
}

async function main() {
  const excelPath = path.resolve(__dirname, '../main_data/ALL PRODUCT LIST.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Excel file not found at:', excelPath);
    process.exit(1);
  }

  console.log('----------------------------------------------------');
  console.log('Sai Darshan Mart — Product Image Enricher');
  console.log('----------------------------------------------------');
  console.log('Loading Excel workbook:', excelPath);

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Add Column H "Image_URL" to row 5 if missing
  if (!rows[5][7] || String(rows[5][7]).trim() !== 'Image_URL') {
    rows[5][7] = 'Image_URL';
    console.log('✅ Added "Image_URL" column at Column H (index 7).');
  }

  // Parse CLI args
  const args = process.argv.slice(2);
  let limit = 50;
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10);
  }
  if (args.includes('--all')) {
    limit = 999999;
  }
  const featuredOnly = args.includes('--featured');

  console.log(`Processing configuration: limit = ${limit}, featuredOnly = ${featuredOnly}`);

  const topBrands = ['AMUL', 'BRITANNIA', 'PARLE', 'CADBURY', 'MAGGI', 'SURF', 'FORTUNE', 'AASHIRVAAD', 'TATA', 'VIM', 'DETTOL', 'HALDIRAM', 'DOVE', 'COLGATE', 'PEPSI', 'COKE'];

  // Find candidate rows
  const candidates = [];
  for (let i = 6; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[1]) continue;
    const name = String(r[1]).trim();
    if (!name || name === 'Name' || name.includes('Page No') || name.includes('Price List') || name.includes('SAI DARSHAN')) continue;

    // Check if already has an image link
    if (r[7] && String(r[7]).trim().startsWith('http')) {
      continue;
    }

    const pack = r[2] ? String(r[2]).trim() : '';
    const brand = r[3] ? String(r[3]).trim() : '';

    if (featuredOnly) {
      const isTop = topBrands.some(b => name.toUpperCase().includes(b) || brand.toUpperCase().includes(b));
      if (!isTop) continue;
    }

    candidates.push({ rowIndex: i, name, brand, pack });
    if (candidates.length >= limit) break;
  }

  console.log(`Found ${candidates.length} products to search and enrich.`);
  if (candidates.length === 0) {
    console.log('🎉 No products need images! All matching products already have image URLs.');
    return;
  }

  let enrichedCount = 0;

  for (let c = 0; c < candidates.length; c++) {
    const { rowIndex, name, brand, pack } = candidates[c];
    process.stdout.write(`[${c + 1}/${candidates.length}] Searching: "${name}" (${pack})... `);

    const imageUrl = await fetchImageForProduct(name, brand, pack);

    if (imageUrl) {
      rows[rowIndex][7] = imageUrl;
      enrichedCount++;
      console.log(`FOUND! => ${imageUrl.slice(0, 70)}...`);

      // Update in Supabase
      if (supabase) {
        try {
          await supabase.from('products').update({ image_url: imageUrl }).eq('name', name);
        } catch (dbErr) {
          // ignore
        }
      }
    } else {
      console.log('Not found.');
    }

    // Save every 10 items or at the end
    if ((c + 1) % 10 === 0 || c === candidates.length - 1) {
      const updatedSheet = XLSX.utils.aoa_to_sheet(rows);
      workbook.Sheets[sheetName] = updatedSheet;
      XLSX.writeFile(workbook, excelPath);
      console.log(`💾 Saved progress to Excel (${enrichedCount} images saved so far).`);
    }

    // Gentle delay to avoid search engine throttling
    await new Promise(res => setTimeout(res, 800));
  }

  console.log('----------------------------------------------------');
  console.log(`🎉 Finished! Successfully enriched ${enrichedCount} products with image URLs.`);
  console.log(`Workbook updated: ${excelPath}`);
  console.log('----------------------------------------------------');
}

main().catch(err => {
  console.error('Error during image enrichment:', err);
  process.exit(1);
});
