import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminConfig } from './env_loader.js';

const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
const supabase = createClient(supabaseUrl, supabaseKey);

async function reconcileDatabaseConsistency() {
  console.log('🔍 Starting Comprehensive Database Consistency Reconciler...');

  // 1. Fetch all active products
  let allProducts = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, price, mrp, unit_size, is_featured, is_archived, image_url')
      .eq('is_archived', false)
      .range(from, from + 999);

    if (error) {
      console.error('Fetch error:', error.message);
      break;
    }
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Fetched ${allProducts.length} active products from Supabase.`);

  // 2. Group by exact normalized name
  const nameGroups = new Map();
  for (const p of allProducts) {
    const key = p.name.trim().toLowerCase();
    if (!nameGroups.has(key)) nameGroups.set(key, []);
    nameGroups.get(key).push(p);
  }

  const idsToArchive = [];
  const primaryRows = [];

  for (const rows of nameGroups.values()) {
    if (rows.length === 1) {
      primaryRows.push(rows[0]);
      continue;
    }

    // Sort to determine the single authentic retail store row:
    rows.sort((a, b) => {
      const aSkuNum = parseInt(a.sku.replace(/\D/g, '')) || 0;
      const bSkuNum = parseInt(b.sku.replace(/\D/g, '')) || 0;

      // 1. Primary store catalog SKUs (< 15000) take precedence over old historical dump SKUs (>= 15000)
      if (aSkuNum < 15000 && bSkuNum >= 15000) return -1;
      if (bSkuNum < 15000 && aSkuNum >= 15000) return 1;

      // 2. Prefer row with verified image
      if (a.image_url && !b.image_url) return -1;
      if (!a.image_url && b.image_url) return 1;

      // 3. Prefer valid price > 0
      if (a.price > 0 && b.price <= 0) return -1;
      if (b.price > 0 && a.price <= 0) return 1;

      // 4. Prefer current active retail MRP (not expired historical lower rate)
      if ((b.mrp || 0) !== (a.mrp || 0)) {
        return (b.mrp || 0) - (a.mrp || 0);
      }

      // 5. Stable order by earlier SKU
      return aSkuNum - bSkuNum;
    });

    const primary = rows[0];
    primaryRows.push(primary);

    // All others are obsolete duplicates -> archive them
    for (let i = 1; i < rows.length; i++) {
      idsToArchive.push(rows[i].id);
    }
  }

  console.log(`Identified ${primaryRows.length} primary authentic products.`);
  console.log(`Identified ${idsToArchive.length} duplicate/obsolete rows to archive.`);

  // Batch archive duplicate rows
  const BATCH_SIZE = 100;
  let archivedCount = 0;
  for (let i = 0; i < idsToArchive.length; i += BATCH_SIZE) {
    const batch = idsToArchive.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('products')
      .update({ is_archived: true, is_featured: false })
      .in('id', batch);

    if (error) {
      console.error(`Error archiving batch ${i}:`, error.message);
    } else {
      archivedCount += batch.length;
    }
  }

  console.log(`✅ Successfully archived ${archivedCount} duplicate rows.`);

  // Specifically fix Dalda items for 100% precision:
  // Dalda 15 L -> SDM-P-08153 (price 1650, mrp 1650, 15L Tin image)
  // Dalda 1 L -> SDM-P-08157 (price 99, mrp 150, 1L pouch image)
  // Dalda 500 ml -> SDM-P-08158 (price 50, mrp 75, pouch image)
  console.log('🔄 Fine-tuning Dalda authentic variants...');
  
  await supabase
    .from('products')
    .update({
      is_archived: false,
      is_featured: true,
      price: 1650,
      mrp: 1650,
      image_url: 'https://m.media-amazon.com/images/I/51NRG47771L._SL600_.jpg'
    })
    .eq('sku', 'SDM-P-08153');

  await supabase
    .from('products')
    .update({
      is_archived: false,
      is_featured: true,
      price: 99,
      mrp: 150,
      image_url: 'https://m.media-amazon.com/images/I/51DF5Z9IM-L._SL600_.jpg'
    })
    .eq('sku', 'SDM-P-08157');

  await supabase
    .from('products')
    .update({
      is_archived: false,
      is_featured: true,
      price: 50,
      mrp: 75,
      image_url: 'https://m.media-amazon.com/images/I/51DF5Z9IM-L._SL600_.jpg'
    })
    .eq('sku', 'SDM-P-08158');

  // Verify Dalda state after reconciliation
  const { data: daldaCheck } = await supabase
    .from('products')
    .select('id, name, sku, price, mrp, unit_size, is_featured, is_archived, image_url')
    .ilike('name', 'Dalda%')
    .eq('is_archived', false);

  console.log('\nFinal Active Dalda Products in Database:');
  console.table(daldaCheck);

  console.log('🎉 Database Consistency Reconciled Successfully!');
}

reconcileDatabaseConsistency();
