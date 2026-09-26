/**
 * Master Excel Catalog Importer for Sai Darshan Mart
 * 
 * Usage:
 * 1. Direct API Upsert (requires SUPABASE_SERVICE_ROLE_KEY or live admin auth):
 *    node scripts/import_excel_catalog.js
 * 
 * 2. Generate SQL file for Supabase SQL Editor:
 *    node scripts/import_excel_catalog.js --sql
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
let supabaseKey = '';
let serviceRoleKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    const val = v.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (k === 'VITE_SUPABASE_URL') supabaseUrl = val;
    if (k === 'VITE_SUPABASE_ANON_KEY') supabaseKey = val;
    if (k === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = val;
  }
}

// Pre-seeded categories mapping (matches supabase_schema.sql IDs)
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

function generateSku(name, pack, index) {
  const clean = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  const packClean = (pack || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4);
  return `SDM-${clean}-${packClean}-${String(index).padStart(4, '0')}`;
}

async function main() {
  const excelPath = path.resolve(__dirname, '../main_data/ALL PRODUCT LIST.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Excel file not found at:', excelPath);
    process.exit(1);
  }

  console.log('----------------------------------------------------');
  console.log('Sai Darshan Mart — Master Catalog Import');
  console.log('----------------------------------------------------');
  console.log('Loading Excel:', excelPath);

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Read ${rows.length} total rows from sheet "${sheetName}".`);
  console.log('Processing catalog and eliminating duplicates / headers...');

  const items = [];
  const seenNames = new Set();
  let rowIndex = 0;

  for (let i = 5; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[1]) continue;

    const rawName = cleanString(r[1]);
    if (!rawName || rawName === 'Name' || rawName.includes('Page No') || rawName.includes('Price List') || rawName.includes('SAI DARSHAN')) {
      continue;
    }

    const pack = cleanString(r[2]) || '1 unit';
    const brand = cleanString(r[3]);
    const mrp = parseNumber(r[4], 0);
    const srate = parseNumber(r[6], parseNumber(r[5], mrp));
    const price = srate > 0 ? srate : (mrp > 0 ? mrp : 10);
    const finalMrp = mrp >= price ? mrp : price;

    rowIndex++;
    const sku = generateSku(rawName, pack, rowIndex);
    const categoryId = categorizeProduct(rawName, brand);

    items.push({
      sku,
      name: rawName,
      brand: brand || null,
      category_id: categoryId,
      price: price,
      mrp: finalMrp,
      unit_size: pack,
      stock_quantity: 50,
      description: brand ? `${rawName} by ${brand}. Fresh stock available at Sai Darshan Mart, Jabalpur.` : `${rawName}. Fresh grocery item from Sai Darshan Mart, Jabalpur.`,
      is_available: true,
      is_featured: rowIndex <= 24, // First 24 items featured on home
      variants: []
    });
  }

  console.log(`✅ Extracted ${items.length} clean products.`);

  // If --sql flag is passed, generate SQL script
  const isSqlMode = process.argv.includes('--sql');
  if (isSqlMode) {
    const outSqlPath = path.resolve(__dirname, '../main_data/imported_products.sql');
    console.log(`Writing SQL insert script to: ${outSqlPath}`);

    const writeStream = fs.createWriteStream(outSqlPath, { encoding: 'utf8' });
    writeStream.write('-- SAI DARSHAN MART — MASTER IMPORTED PRODUCTS CATALOG\n');
    writeStream.write('-- Generated automatically from ALL PRODUCT LIST.xlsx\n\n');

    const chunkSize = 500;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      writeStream.write('INSERT INTO public.products (sku, name, brand, category_id, price, mrp, unit_size, stock_quantity, description, is_available, is_featured, variants)\nVALUES\n');
      
      const valuesSql = chunk.map(item => {
        const escName = item.name.replace(/'/g, "''");
        const escBrand = item.brand ? `'${item.brand.replace(/'/g, "''")}'` : 'NULL';
        const escDesc = item.description ? `'${item.description.replace(/'/g, "''")}'` : 'NULL';
        return `  ('${item.sku}', '${escName}', ${escBrand}, '${item.category_id}', ${item.price}, ${item.mrp}, '${item.unit_size.replace(/'/g, "''")}', ${item.stock_quantity}, ${escDesc}, ${item.is_available}, ${item.is_featured}, '[]'::jsonb)`;
      }).join(',\n');

      writeStream.write(valuesSql);
      writeStream.write('\nON CONFLICT (sku) DO UPDATE SET\n  price = EXCLUDED.price,\n  mrp = EXCLUDED.mrp,\n  is_available = EXCLUDED.is_available;\n\n');
    }

    writeStream.end();
    console.log(`🎉 SQL file generated with ${items.length} products!`);
    return;
  }

  // Direct Supabase API import
  const keyToUse = serviceRoleKey || supabaseKey;
  if (!serviceRoleKey) {
    console.log('----------------------------------------------------');
    console.log('⚠️  Notice: SUPABASE_SERVICE_ROLE_KEY is not in .env.');
    console.log('Direct insertion via node requires the Secret/Service Role key to bypass RLS.');
    console.log('Options:');
    console.log('1. Add SUPABASE_SERVICE_ROLE_KEY=your_secret_key in .env and run again.');
    console.log('   OR');
    console.log('2. Run with --sql: npm run import:sql');
    console.log('   (Generates main_data/imported_products.sql to run directly in Supabase SQL Editor)');
    console.log('   OR');
    console.log('3. Import via Admin Panel UI: http://localhost:5173/admin/products');
    console.log('----------------------------------------------------');
    return;
  }

  console.log('Connecting to Supabase using Service Role Key...');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const batchSize = 200;
  let successCount = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'sku' });

    if (error) {
      console.error(`❌ Error on batch ${i} - ${i + batch.length}:`, error.message);
    } else {
      successCount += batch.length;
      process.stdout.write(`\rProgress: ${successCount} / ${items.length} products imported (${Math.round((successCount / items.length) * 100)}%)...`);
    }
  }

  console.log(`\n🎉 Successfully imported ${successCount} products into Supabase!`);
}

main().catch(err => {
  console.error('Fatal error during import:', err);
  process.exit(1);
});
