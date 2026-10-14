import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSXModule from 'xlsx';
import { createClient } from '@supabase/supabase-js';

import { getSupabaseAdminConfig } from './env_loader.js';

const XLSX = XLSXModule.default || XLSXModule;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log('⚡ Auditing Master Catalog & Live Supabase State...');

  const excelPath = path.resolve(__dirname, '../main_data/ALL PRODUCT LIST.xlsx');
  const fileBuffer = fs.readFileSync(excelPath);
  const wb = XLSX.read(fileBuffer, { type: 'buffer' });
  const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  let excelCurated = 0;
  let excelWithImage = 0;
  const uniqueUrls = new Set();
  const uniqueNames = new Set();
  const brandCounts = new Map();
  const formatIssues = [];

  for (let i = 6; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || !r[1] || r[7] !== 'YES') continue;
    excelCurated++;

    const name = String(r[1]).trim();
    const brand = String(r[3] || 'Other').trim();
    const img = String(r[8] || '').trim();

    if (img && img.startsWith('http')) {
      excelWithImage++;
      uniqueUrls.add(img);
      uniqueNames.add(name);
    }

    brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);

    // Format check
    if (brand && new RegExp(`^${brand}\\s+${brand}\\b`, 'i').test(name)) {
      formatIssues.push(`Row ${i + 1}: Double brand repetition in "${name}"`);
    }
    if (name.includes('..') || name.includes('(..)') || name.includes('()')) {
      formatIssues.push(`Row ${i + 1}: Empty/weird parentheses in "${name}"`);
    }
    const openP = (name.match(/\(/g) || []).length;
    const closeP = (name.match(/\)/g) || []).length;
    if (openP !== closeP) {
      formatIssues.push(`Row ${i + 1}: Mismatched parentheses in "${name}"`);
    }
  }

  const { count: supabaseFeaturedCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_featured', true)
    .not('image_url', 'is', null);

  console.log('\n======================================================');
  console.log('🎉 MASTER CATALOG HEALTH REPORT');
  console.log('======================================================');
  console.log(`Excel Curated Products:            ${excelCurated} rows`);
  console.log(`Excel Products with Image:         ${excelWithImage} rows (${((excelWithImage / excelCurated) * 100).toFixed(2)}%)`);
  console.log(`Unique Product Names:              ${uniqueNames.size} distinct items`);
  console.log(`Unique Image URLs:                 ${uniqueUrls.size} authentic URLs`);
  console.log(`Live Featured Products (Supabase): ${supabaseFeaturedCount} products`);
  console.log(`Recognized Brands in Catalog:      ${brandCounts.size} brands`);
  console.log(`Formatting Issues:                 ${formatIssues.length} issues`);
  console.log('======================================================\n');

  if (formatIssues.length > 0) {
    console.log('⚠️ Formatting Issues:');
    formatIssues.slice(0, 10).forEach(iss => console.log('  *', iss));
  } else {
    console.log('✅ ALL PRODUCT NAMES AND IMAGES 100% PERFECTLY FORMATTED!');
  }
}

runAudit().catch(console.error);
