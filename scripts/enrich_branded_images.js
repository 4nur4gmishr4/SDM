/**
 * ⚡ 15-Parallel High-Speed Branded Products Image Enricher
 * 
 * Fetches high-resolution e-commerce packaging images for only genuine branded items,
 * prioritizes top household brands first, and updates:
 * 1. main_data/BRANDED_PRODUCTS_CATALOG.xlsx (Column G: Image_URL)
 * 2. main_data/ALL PRODUCT LIST.xlsx (Column H: Image_URL)
 * 3. Live Supabase database (products.image_url)
 * 
 * Usage:
 *   node scripts/enrich_branded_images.js
 *   node scripts/enrich_branded_images.js --limit 500
 *   node scripts/enrich_branded_images.js --concurrency 15
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

// Multi-engine search prioritizing Indian grocery e-commerce CDNs (Blinkit, BigBasket, Amazon, IndiaMART)
async function searchProductImage(name, brand, pack) {
  const cleanName = name.replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const query = `${brand ? brand + ' ' : ''}${cleanName} ${pack || ''}`.replace(/\s+/g, ' ').trim();

  // 1. Open Food Facts (for packaged foods, biscuits, dairy, snacks, chocolates)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=1`;
    const offRes = await fetch(offUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SaiDarshanMart-Supermarket-App/1.0' }
    });
    clearTimeout(timeout);

    if (offRes.ok) {
      const offData = await offRes.json();
      const p = offData.products?.[0];
      const img = p?.image_front_url || p?.image_url || p?.image_small_url;
      if (img && (img.includes('.jpg') || img.includes('.jpeg') || img.includes('.png') || img.includes('.webp'))) {
        return img;
      }
    }
  } catch (e) {}

  // 2. DuckDuckGo Image Search (with grocery e-commerce CDN priority)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const ddgQuery = `${query} grocery packet india`;
    const step1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(ddgQuery)}`, { signal: controller.signal });
    const html = await step1.text();
    clearTimeout(timeout);

    const match = html.match(/vqd=([0-9-]+)/) || html.match(/vqd=['"]([0-9-]+)['"]/);
    if (match && match[1]) {
      const vqd = match[1];
      const step2 = await fetch(`https://duckduckgo.com/i.js?l=in-en&o=json&q=${encodeURIComponent(ddgQuery)}&vqd=${vqd}&f=,,,type:photo,`);
      if (step2.ok) {
        const json = await step2.json();
        // Priority 1: Trusted grocery e-commerce CDNs (Blinkit, BigBasket, Amazon, JioMart, Flipkart, IndiaMART, Clevup)
        const ecomMatch = json.results?.find(r => r.image && (
          r.image.includes('grofers') ||
          r.image.includes('blinkit') ||
          r.image.includes('bigbasket') ||
          r.image.includes('bbassets') ||
          r.image.includes('amazon') ||
          r.image.includes('jiomart') ||
          r.image.includes('flipkart') ||
          r.image.includes('imimg') ||
          r.image.includes('clevup') ||
          r.image.includes('.webp') ||
          r.image.includes('format=webp')
        ));
        if (ecomMatch?.image) return ecomMatch.image;

        // Priority 2: Any clean product photo
        const cleanFallback = json.results?.find(r => r.image && !r.image.includes('.svg') && !r.image.includes('favicon') && !r.image.includes('logo'));
        if (cleanFallback?.image) return cleanFallback.image;
      }
    }
  } catch (e) {}

  // 3. Direct Bing Image Search Fallback
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2200);
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query + ' packet india amazon bigbasket')}&first=1`;
    const res = await fetch(bingUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const matches = [...html.matchAll(/murl&quot;:&quot;(https:[^&]+)&quot;/g)];
      for (const m of matches) {
        const url = m[1];
        if (url && !url.includes('.svg') && !url.includes('favicon') && !url.includes('logo') && !url.includes('icon')) {
          return url;
        }
      }
    }
  } catch (e) {}

  return null;
}

// Brand prioritization weights (Tier 1 brands first)
const TIER1_BRANDS = [
  'NESTLE', 'MAGGI', 'CADBURY', 'AMUL', 'BRITANNIA', 'PARLE', 'SURF EXCEL', 'COLGATE', 'DETTOL',
  'FORTUNE', 'AASHIRVAAD', 'TATA', 'LAYS', 'KURKURE', 'BINGO', 'HALDIRAM', 'WHISPER', 'PAMPERS',
  'DOVE', 'LUX', 'SANTOOR', 'LIFEBUOY', 'VIM', 'ARIEL', 'TIDE', 'RIN', 'WHEEL', 'HARPIC', 'LIZOL',
  'HORLICKS', 'BOURNVITA', 'BOOST', 'COMPLAN', 'PEPSI', 'COKE', 'SPRITE', 'THUMS UP', 'MAAZA',
  'FROOTI', 'REAL', 'ROOH AFZA', 'HEAD & SHOULDERS', 'PANTENE', 'CLINIC PLUS', 'SUNSILK', 'PARACHUTE',
  'NIVEA', 'VASELINE', 'PONDS', 'LAKME', 'GARNIER', 'HIMALAYA', 'PATANJALI', 'MILTON', 'FOGG', 'AXE'
];

function getBrandPriority(brandName, productName) {
  const text = `${brandName} ${productName}`.toUpperCase();
  for (let i = 0; i < TIER1_BRANDS.length; i++) {
    if (text.includes(TIER1_BRANDS[i])) {
      return i; // Lower index = higher priority
    }
  }
  return 999;
}

async function main() {
  const brandedExcelPath = path.resolve(__dirname, '../main_data/BRANDED_PRODUCTS_CATALOG.xlsx');
  const allExcelPath = path.resolve(__dirname, '../main_data/ALL PRODUCT LIST.xlsx');

  if (!fs.existsSync(brandedExcelPath)) {
    console.error('❌ BRANDED_PRODUCTS_CATALOG.xlsx not found. Running extractor first...');
    const { execSync } = await import('child_process');
    execSync('node scripts/extract_branded_products.js', { stdio: 'inherit' });
  }

  console.log('====================================================');
  console.log('⚡ 15-Parallel High-Speed Branded Image Enricher');
  console.log('====================================================');
  console.log('Loading Branded Catalog:', brandedExcelPath);

  const workbook = XLSX.readFile(brandedExcelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Add Column G "Image_URL" if missing
  if (!rows[0][6] || String(rows[0][6]).trim() !== 'Image_URL') {
    rows[0][6] = 'Image_URL';
    console.log('✅ Added "Image_URL" column to BRANDED_PRODUCTS_CATALOG.xlsx (Column G).');
  }

  // Load all product list for cross-updating
  let allWorkbook = null;
  let allRows = null;
  let allSheetName = null;
  const allProductRowMap = new Map(); // Name -> rowIndex in ALL PRODUCT LIST.xlsx

  if (fs.existsSync(allExcelPath)) {
    allWorkbook = XLSX.readFile(allExcelPath);
    allSheetName = allWorkbook.SheetNames[0];
    allRows = XLSX.utils.sheet_to_json(allWorkbook.Sheets[allSheetName], { header: 1 });
    if (!allRows[5][7] || String(allRows[5][7]).trim() !== 'Image_URL') {
      allRows[5][7] = 'Image_URL';
    }
    for (let r = 6; r < allRows.length; r++) {
      if (allRows[r] && allRows[r][1]) {
        const cleanName = String(allRows[r][1]).trim();
        if (!allProductRowMap.has(cleanName)) {
          allProductRowMap.set(cleanName, r);
        }
      }
    }
    console.log(`Loaded ${allRows.length.toLocaleString()} rows from ALL PRODUCT LIST.xlsx for dual-sync.`);
  }

  // CLI Arguments
  const args = process.argv.slice(2);
  let concurrency = 15; // 15 workers in parallel
  const concIdx = args.indexOf('--concurrency');
  if (concIdx !== -1 && args[concIdx + 1]) {
    concurrency = parseInt(args[concIdx + 1], 10);
  }

  let limit = 999999;
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10);
  }

  // Collect pending rows
  const candidates = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;

    // Skip if already has image
    if (r[6] && String(r[6]).trim().startsWith('http')) {
      continue;
    }

    const name = String(r[0]).trim();
    const brand = r[1] ? String(r[1]).trim() : '';
    const category = r[2] ? String(r[2]).trim() : '';
    const pack = r[3] ? String(r[3]).trim() : '';

    const priority = getBrandPriority(brand, name);
    candidates.push({ rowIndex: i, name, brand, category, pack, priority });
  }

  // Sort by priority (Tier 1 popular brands first)
  candidates.sort((a, b) => a.priority - b.priority);

  const selectedCandidates = candidates.slice(0, limit);
  const total = selectedCandidates.length;

  console.log(`🚀 Workers active: ${concurrency} parallel streams`);
  console.log(`📦 Pending branded products to enrich: ${total.toLocaleString()}`);
  console.log(`⭐ Prioritized top tier household brands (Maggi, Cadbury, Amul, Britannia, Parle, Surf Excel, etc.) first!`);
  console.log('Press Ctrl + C anytime to pause — progress is saved automatically.\n');

  if (total === 0) {
    console.log('🎉 All branded products already have image URLs!');
    return;
  }

  let completed = 0;
  let foundCount = 0;
  let dirtyCount = 0;
  let activeIndex = 0;
  const startTime = Date.now();
  const supabaseBatch = [];

  // Save Excel files atomically
  const saveExcels = () => {
    try {
      // 1. Save BRANDED_PRODUCTS_CATALOG.xlsx
      const updatedSheet = XLSX.utils.aoa_to_sheet(rows);
      workbook.Sheets[sheetName] = updatedSheet;
      XLSX.writeFile(workbook, brandedExcelPath);

      // 2. Save ALL PRODUCT LIST.xlsx
      if (allWorkbook && allRows) {
        const updatedAllSheet = XLSX.utils.aoa_to_sheet(allRows);
        allWorkbook.Sheets[allSheetName] = updatedAllSheet;
        XLSX.writeFile(allWorkbook, allExcelPath);
      }

      dirtyCount = 0;
    } catch (e) {
      // ignore concurrent write locks
    }
  };

  // Flush to Supabase
  const flushSupabase = async () => {
    if (!supabase || supabaseBatch.length === 0) return;
    const items = supabaseBatch.splice(0, supabaseBatch.length);
    for (const item of items) {
      supabase.from('products').update({ image_url: item.url }).eq('name', item.name).then(() => {}).catch(() => {});
    }
  };

  // Safe Ctrl+C handler
  let isExiting = false;
  process.on('SIGINT', () => {
    if (isExiting) process.exit(0);
    isExiting = true;
    console.log('\n\n⏸️  Pausing and saving current progress to Excel...');
    saveExcels();
    console.log(`✅ Saved! ${foundCount} images preserved.`);
    process.exit(0);
  });

  // Auto-save interval every 15s
  const autoSaveTimer = setInterval(() => {
    if (dirtyCount > 0) {
      saveExcels();
      flushSupabase();
    }
  }, 15000);

  // Worker loop
  async function worker(workerId) {
    while (activeIndex < selectedCandidates.length && !isExiting) {
      const idx = activeIndex++;
      if (idx >= selectedCandidates.length) break;

      const item = selectedCandidates[idx];
      const imageUrl = await searchProductImage(item.name, item.brand, item.pack);

      completed++;
      if (imageUrl) {
        rows[item.rowIndex][6] = imageUrl;
        foundCount++;
        dirtyCount++;

        // Update ALL PRODUCT LIST row if present
        if (allRows && allProductRowMap.has(item.name)) {
          const allRowIdx = allProductRowMap.get(item.name);
          allRows[allRowIdx][7] = imageUrl;
        }

        supabaseBatch.push({ name: item.name, url: imageUrl });
      }

      // Stats calculation
      const elapsedSec = (Date.now() - startTime) / 1000;
      const speed = completed / (elapsedSec || 1);
      const remainingItems = total - completed;
      const etaSec = remainingItems / (speed || 1);
      const etaMins = Math.round(etaSec / 60);
      const percent = ((completed / total) * 100).toFixed(1);
      const hitRate = Math.round((foundCount / (completed || 1)) * 100);

      process.stdout.write(
        `\r[${completed.toLocaleString()}/${total.toLocaleString()}] (${percent}%) | ` +
        `Speed: ${speed.toFixed(1)}/s | ` +
        `Found: ${foundCount.toLocaleString()} (${hitRate}%) | ` +
        `ETA: ~${etaMins}m  `
      );

      // Save every 50 items
      if (dirtyCount >= 50) {
        saveExcels();
        flushSupabase();
      }

      await new Promise(r => setTimeout(r, 50));
    }
  }

  // Launch 15 concurrent workers
  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  clearInterval(autoSaveTimer);
  saveExcels();
  await flushSupabase();

  const totalMinutes = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log('\n====================================================');
  console.log(`🎉 Finished in ${totalMinutes} minutes!`);
  console.log(`Total images found & saved: ${foundCount.toLocaleString()} / ${total.toLocaleString()}`);
  console.log(`1. Branded catalog updated: ${brandedExcelPath}`);
  console.log(`2. Master catalog updated: ${allExcelPath}`);
  console.log(`3. Supabase products table synced!`);
  console.log('====================================================');
}

main().catch(err => {
  console.error('\nFatal error in branded image enricher:', err);
  process.exit(1);
});
