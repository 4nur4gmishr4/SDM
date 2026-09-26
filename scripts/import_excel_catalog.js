/**
 * Clean Master Catalog Importer for Sai Darshan Mart
 * Imports all products from pristine ALL PRODUCT LIST.xlsx into Supabase
 * Strictly NO images (image_url = null)
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

const CATEGORIES = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Fresh Vegetables & Fruits', keywords: ['VEG', 'POTATO', 'ONION', 'TOMATO', 'FRUIT', 'APPLE', 'BANANA', 'LEMON', 'MATAR', 'ALOO', 'PYAZ'] },
  { id: 'c2222222-2222-2222-2222-222222222222', name: 'Dairy & Bakery', keywords: ['MILK', 'AMUL', 'BUTTER', 'PANEER', 'CHEESE', 'BREAD', 'CURD', 'DAIRY', 'GHEE', 'TOAST', 'RUSK', 'EGG'] },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'Atta, Rice & Dals', keywords: ['ATTA', 'RICE', 'CHAWAL', 'DAL', 'PULSE', 'BESAN', 'SUJI', 'MAIDA', 'POHA', 'GRAIN', 'WHEAT', 'MOONG', 'CHANA', 'TOOR', 'URAD', 'RAJMA'] },
  { id: 'c4444444-4444-4444-4444-444444444444', name: 'Snacks & Munchies', keywords: ['BISCUIT', 'CHIPS', 'NAMKEEN', 'MAGGI', 'NOODLE', 'KURKURE', 'LAYS', 'CHIKKI', 'CHOCOLATE', 'CADBURY', 'SWEET', 'CANDY', 'SNACK', 'BHUJIA', 'SEV', 'POPCORN', 'WAFER'] },
  { id: 'c5555555-5555-5555-5555-555555555555', name: 'Oils & Masalas', keywords: ['OIL', 'MASALA', 'SPICE', 'SALT', 'SUGAR', 'MIRCH', 'HALDI', 'DHANIYA', 'JEERA', 'MUSTARD', 'FORTUNE', 'SAFFOLA', 'SOYA', 'HING', 'GARAM'] },
  { id: 'c6666666-6666-6666-6666-666666666666', name: 'Beverages & Drinks', keywords: ['TEA', 'COFFEE', 'JUICE', 'COLD DRINK', 'PEPSI', 'COKE', 'SPRITE', 'MAAZA', 'FROOTI', 'BOURN VITA', 'HORLICKS', 'SYRUP', 'WATER', 'ENERGY DRINK', 'SQUASH'] },
  { id: 'c7777777-7777-7777-7777-777777777777', name: 'Household & Cleaning', keywords: ['SURF', 'DETERGENT', 'VIM', 'CLEANER', 'HARPIC', 'COLIN', 'WASHING', 'SOAP POWDER', 'PHENYL', 'BROOM', 'POOJA', 'AGARBATTI', 'MOSQUITO', 'ALL OUT', 'GOOD KNIGHT'] },
  { id: 'c8888888-8888-8888-8888-888888888888', name: 'Personal Care & Beauty', keywords: ['SHAMPOO', 'SOAP', 'DETTOL', 'LIFEBUOY', 'DOVE', 'FACEWASH', 'CREAM', 'LOTION', 'TOOTHPASTE', 'COLGATE', 'BRUSH', 'HAIR OIL', 'PARACHUTE', 'BOROLINE', 'SUTHOL', 'POWDER', 'SHAVING'] },
  { id: 'c9999999-9999-9999-9999-999999999999', name: 'Baby Care', keywords: ['BABY', 'DIAPER', 'PAMPERS', 'HUGGIES', 'MAMY POKO', 'CERELAC', 'JOHNSON', 'BABY WIPES'] },
  { id: 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Plastics & Kitchenware', keywords: ['PLASTIC', 'BOTTLE', 'CONTAINER', 'BUCKET', 'MUG', 'BOWL', 'STEEL', 'KITCHEN', 'BOX', 'BASKET', 'TRAY'] }
];

function categorizeProduct(name, brand) {
  const combined = `${name} ${brand || ''}`.toUpperCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => combined.includes(k))) {
      return cat.id;
    }
  }
  return 'c4444444-4444-4444-4444-444444444444'; // Default to snacks/packaged
}

function cleanString(val) {
  if (!val) return '';
  return String(val).replace(/\s+/g, ' ').trim();
}

function parseNumber(val, fallback = 0) {
  if (val === undefined || val === null || val === '') return fallback;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? fallback : num;
}

async function main() {
  const excelPath = path.resolve(__dirname, '../main_data/ALL PRODUCT LIST.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Excel file not found at:', excelPath);
    process.exit(1);
  }

  console.log('====================================================');
  console.log('Sai Darshan Mart — Clean Pristine Catalog Import');
  console.log('Strictly NO images (image_url = null)');
  console.log('====================================================');
  console.log('Reading Excel:', excelPath);

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Read ${rows.length} total rows from sheet "${sheetName}".`);
  console.log('Cleaning data and filtering headers...');

  const items = [];
  let itemIndex = 0;

  for (let i = 5; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[1]) continue;

    const rawName = cleanString(r[1]);
    if (!rawName || rawName === 'Name' || rawName.includes('Page No') || rawName.includes('Price List') || rawName.includes('SAI DARSHAN')) {
      continue;
    }

    itemIndex++;
    const pack = cleanString(r[2]) || '1 unit';
    const brand = cleanString(r[3]);
    const mrp = parseNumber(r[4], 0);
    const srate = parseNumber(r[6], parseNumber(r[5], mrp));
    const price = srate > 0 ? srate : (mrp > 0 ? mrp : 10);
    const finalMrp = mrp >= price ? mrp : price;
    const categoryId = categorizeProduct(rawName, brand);
    const sku = `SDM-${String(itemIndex).padStart(6, '0')}`;

    items.push({
      sku,
      name: rawName,
      brand: brand && !/^\d+$/.test(brand) ? brand : null,
      category_id: categoryId,
      price: price,
      mrp: finalMrp,
      unit_size: pack,
      stock_quantity: 50,
      description: brand ? `${rawName} by ${brand}. Fresh stock available at Sai Darshan Mart, Jabalpur.` : `${rawName}. Fresh grocery item from Sai Darshan Mart, Jabalpur.`,
      image_url: null, // Strictly NO images
      is_available: true,
      is_featured: itemIndex <= 24,
      is_archived: false,
      variants: [],
    });
  }

  console.log(`✅ Extracted ${items.length} clean products ready for import.`);

  if (!serviceRoleKey || !supabaseUrl) {
    console.error('❌ Supabase service role key or URL missing in .env!');
    process.exit(1);
  }

  console.log('Connecting to Supabase using Service Role Key...');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Clear products table
  console.log('Clearing existing products in Supabase...');
  const { error: delErr } = await supabase.from('products').delete().neq('name', '___NON_EXISTENT___');
  if (delErr) {
    console.warn('Delete warning:', delErr.message);
  } else {
    console.log('✅ Supabase products table cleared.');
  }

  console.log('Importing clean products in batches of 500...');
  const batchSize = 500;
  let successCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const { error: insertErr } = await supabase.from('products').insert(batch);

    if (insertErr) {
      console.error(`❌ Error on batch ${i} - ${i + batch.length}:`, insertErr.message);
    } else {
      successCount += batch.length;
      const pct = ((successCount / items.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\rProgress: ${successCount} / ${items.length} products imported (${pct}%) in ${elapsed}s...`);
    }
  }

  console.log(`\n\n🎉 Done! Successfully imported ${successCount} clean products into Supabase (strictly zero images)!`);
}

main().catch(err => {
  console.error('Fatal error during clean import:', err);
  process.exit(1);
});
