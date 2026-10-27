const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

async function fixCatalogPricing() {
  console.log('⚡ Starting Complete Retail Pricing Normalization...');

  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Read POS / Curated Excel
  console.log('Reading archive Excel dataset for ground-truth POS pricing...');
  const excelPath = 'main_data/archive_raw_backup/OLD_ALL_PRODUCT_LIST.xlsx';
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Index ground truth by:
  // - normalized name + mrp
  // - normalized name
  const exactPriceMap = new Map();
  const namePriceMap = new Map();

  for (let i = 6; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || !r[1]) continue;

    const rawName = String(r[1]).trim();
    const cleanName = rawName.toLowerCase();
    const mrp = parseFloat(r[4]) || 0;
    const dealerCost = parseFloat(r[5]) || 0;
    const srate = parseFloat(r[6]) || 0;

    // Authentic Indian Retail Calculation:
    let authenticMrp = mrp > 0 ? mrp : (srate > 0 ? srate : 0);
    let authenticPrice = authenticMrp;

    if (srate > 0 && srate <= authenticMrp) {
      authenticPrice = srate;
    } else {
      authenticPrice = authenticMrp;
    }

    // Clean up dealer fractional paise (e.g. 1.78 -> 2, 4.45 -> 5, 8.9 -> 10, etc.)
    if (authenticPrice % 1 !== 0) {
      // If authenticPrice matches dealerCost or ratio is ~0.89 of MRP, it's wholesale cost!
      if (Math.abs(authenticPrice - dealerCost) < 0.05 && authenticMrp > 0) {
        authenticPrice = authenticMrp;
      } else {
        authenticPrice = Math.round(authenticPrice);
      }
    }

    const entry = {
      mrp: authenticMrp,
      price: authenticPrice,
      dealerCost,
      srate
    };

    if (authenticMrp > 0) {
      const key = `${cleanName}___${authenticMrp}`;
      if (!exactPriceMap.has(key)) exactPriceMap.set(key, entry);
    }

    if (!namePriceMap.has(cleanName) && authenticMrp > 0) {
      namePriceMap.set(cleanName, entry);
    }
  }

  console.log(`Ground-truth indexed: ${namePriceMap.size} unique products with valid POS rates.`);

  // 2. Fetch all products from Supabase
  console.log('Fetching all active products from Supabase...');
  let allProducts = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, sku, name, unit_size, price, mrp, is_archived')
      .eq('is_archived', false)
      .range(from, from + 999);

    if (error) {
      console.error('Fetch error:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Fetched ${allProducts.length} active products from Supabase.`);

  // 3. Evaluate each product against retail logic
  const updates = [];
  const toArchive = [];
  let correctedDecimals = 0;
  let correctedDummyFallbacks = 0;
  let sampleCorrections = [];

  for (const p of allProducts) {
    const nameLower = (p.name || '').trim().toLowerCase();
    const curMrp = parseFloat(p.mrp) || 0;
    const curPrice = parseFloat(p.price) || 0;

    let targetMrp = curMrp;
    let targetPrice = curPrice;

    // Check if item has the infamous dummy fallback "price: 25, mrp: 29"
    const isDummyFallback = (curPrice === 25 && curMrp === 29);

    // Look up ground truth in POS Excel
    const match = exactPriceMap.get(`${nameLower}___${curMrp}`) || namePriceMap.get(nameLower);

    if (match && match.mrp > 0) {
      targetMrp = match.mrp;
      targetPrice = match.price;
    } else if (isDummyFallback) {
      // Unpriced POS row with dummy 25/29 fallback -> archive it so it does not pollute store
      toArchive.push(p.id);
      correctedDummyFallbacks++;
      continue;
    }

    // Check if targetPrice still has decimal paise
    if (targetPrice % 1 !== 0) {
      // If price is <= 50, standard Indian retail pack has round MRP
      if (targetMrp <= 50) {
        // If price is ~89% of MRP, it was dealer cost: sell at full MRP
        if (targetMrp > 0 && Math.abs(targetPrice - targetMrp * 0.89) < 0.2) {
          targetPrice = targetMrp;
        } else {
          targetPrice = Math.round(targetPrice);
        }
      } else {
        targetPrice = Math.round(targetPrice);
      }
      correctedDecimals++;
    }

    // Monotonicity & bounds check
    if (targetPrice > targetMrp && targetMrp > 0) {
      targetPrice = targetMrp;
    }
    if (targetMrp <= 0 && targetPrice > 0) {
      targetMrp = targetPrice;
    }

    // Only update if changed
    if (targetPrice !== curPrice || targetMrp !== curMrp) {
      updates.push({
        id: p.id,
        sku: p.sku,
        name: p.name,
        price: targetPrice,
        mrp: targetMrp
      });

      if (sampleCorrections.length < 30) {
        sampleCorrections.push({
          sku: p.sku,
          name: p.name,
          oldPrice: curPrice,
          oldMrp: curMrp,
          newPrice: targetPrice,
          newMrp: targetMrp,
          difference: `${curPrice} -> ${targetPrice}`
        });
      }
    }
  }

  console.log('\n======================================================');
  console.log(`Total Products to Update: ${updates.length}`);
  console.log(`Corrupt Dummy Fallbacks (25/29) to Archive: ${toArchive.length}`);
  console.log(`Decimal/Wholesale Prices Fixed: ${correctedDecimals}`);
  console.log('======================================================');

  console.log('\n--- Sample 25 Price Corrections ---');
  console.table(sampleCorrections.slice(0, 25));

  // 4. Execute updates in Supabase in batches of 100
  console.log('\nExecuting price updates in Supabase...');
  const BATCH_SIZE = 100;
  let updatedCount = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Batch error at ${i}:`, error.message);
    } else {
      updatedCount += batch.length;
      process.stdout.write(`Updated ${updatedCount} / ${updates.length} products...\r`);
    }
  }

  console.log(`\n✔ Successfully updated ${updatedCount} products in Supabase.`);

  // 5. Execute archiving for unpriced dummy rows
  if (toArchive.length > 0) {
    console.log(`Archiving ${toArchive.length} unpriced dummy products...`);
    let archivedCount = 0;
    for (let i = 0; i < toArchive.length; i += BATCH_SIZE) {
      const batchIds = toArchive.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('products').update({ is_archived: true }).in('id', batchIds);
      if (!error) archivedCount += batchIds.length;
    }
    console.log(`✔ Archived ${archivedCount} unpriced dummy rows.`);
  }

  console.log('\n🎉 RETAIL PRICING NORMALIZATION COMPLETE!');
}

fixCatalogPricing().catch(console.error);
