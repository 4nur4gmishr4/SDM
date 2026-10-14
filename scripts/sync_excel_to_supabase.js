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

async function syncExcelToSupabase() {
  console.log('⚡ Syncing Master Excel to Supabase...');

  const excelPath = path.resolve(__dirname, '../main_data/ALL PRODUCT LIST.xlsx');
  const fileBuffer = fs.readFileSync(excelPath);
  const wb = XLSX.read(fileBuffer, { type: 'buffer' });
  const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  const items = [];
  for (let i = 6; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || !r[1] || r[7] !== 'YES') continue;

    const name = String(r[1]).trim();
    const unit = String(r[2] || '').trim();
    const brand = String(r[3] || 'Other').trim();
    const mrp = parseFloat(r[4]) || 0;
    const rate = parseFloat(r[5]) || mrp;
    const img = String(r[8] || '').trim();

    items.push({
      sku: `SDM-${i + 1}`,
      name,
      brand,
      unit_size: unit || '1 Unit',
      price: rate || mrp || 10,
      mrp: mrp || rate || 10,
      image_url: img || null,
      is_available: true,
      is_featured: true,
      description: `Authentic ${name} available for same-day delivery at Sai Darshan Shopping Mart.`
    });
  }

  console.log(`Loaded ${items.length} curated products to sync.`);

  const BATCH_SIZE = 100;
  let synced = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'sku' });
    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
    } else {
      synced += batch.length;
      process.stdout.write(`Synced ${synced} / ${items.length} products to Supabase live...\r`);
    }
  }

  console.log(`\n🎉 Successfully synced ${synced} products to Supabase!`);
}

syncExcelToSupabase().catch(console.error);
