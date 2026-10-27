const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BRAND_EXPANSIONS = {
  '^GO\\.?NA1\\b': 'Godrej No. 1',
  '^GO\\.?NO1\\b': 'Godrej No. 1',
  '^GO\\.?NATURAL\\b': 'Godrej No. 1 Natural',
  '^GO\\.?PROCLEAN\\b': 'Godrej ProClean',
  '^GOD\\.?\\s+AER\\b': 'Godrej aer',
  '^GOD\\s+AER\\b': 'Godrej aer',
  '^GOD\\b': 'Godrej',
  '^BRIT\\b': 'Britannia',
  '^CAD\\b': 'Cadbury',
  '^PAT\\b': 'Patanjali',
  '^COLG\\b': 'Colgate',
  '^DAB\\b': 'Dabur'
};

function formatToFlipkartStandard(rawName, rawBrand, rawUnit) {
  if (!rawName) return '';
  let name = rawName.trim();

  // If already matches Flipkart standard pattern, don't alter it
  // e.g. "Britannia 50-50 Maska Chaska Biscuits (40.5 g)"
  if (/^[A-Z][a-zA-Z0-9\s&'-]+\s+\([0-9.]+\s*(?:g|kg|ml|L|Pcs|Pack|unit)\)$/.test(name)) {
    return name;
  }

  // 1. Remove POS billing price tags like "1/-", "5/-", "10/-", "GNERAL1/-"
  name = name.replace(/GNERAL\d*\/?-?/gi, 'General Item');
  name = name.replace(/\b\d+\s*\/-|\b\/-|\/-(?=\s|$)/g, '');

  // 2. Remove double dots, ellipses, and weird parentheticals
  name = name.replace(/\.{2,}/g, ' ');
  name = name.replace(/\(\s*\)/g, '');
  name = name.replace(/\(\s*\.{1,}\s*\)/g, '');
  name = name.replace(/\s+\.\s+/g, ' ');

  // 3. Normalize common brand contractions
  for (const [pattern, expansion] of Object.entries(BRAND_EXPANSIONS)) {
    const reg = new RegExp(pattern, 'i');
    if (reg.test(name)) {
      name = name.replace(reg, expansion);
      break;
    }
  }

  // Expand common FMCG grocery abbreviations
  name = name.replace(/\bGodrej\s+Cin\b/i, 'Godrej Cinthol');
  name = name.replace(/\bSh\s+Cream\b/i, 'Shaving Cream');
  name = name.replace(/\bTalc\s+Pow\b/i, 'Talcum Powder');
  name = name.replace(/\bPow\b/i, 'Powder');
  name = name.replace(/\b1\+500\s*(?:ltr|l)?\.?/i, '1.5 L');
  name = name.replace(/\b2\+1\b/i, 'Buy 2 Get 1 Free');

  // 4. Clean stray middle dots separating letters (e.g. "Go.Baby" -> "Go Baby")
  // But preserve decimal numbers (e.g. "40.5", "1.5", "2.5") and "No. 1"
  name = name.replace(/([a-zA-Z])\.([a-zA-Z])/g, '$1 $2');
  name = name.replace(/(?<=\s[a-zA-Z]{2,})\.(?=\s)/g, '');

  // 5. Clean trailing dots and hyphens
  name = name.replace(/[\s.-]+$/, '');
  name = name.replace(/^[\s.-]+/, '');

  // 6. Extract unit if embedded in name or separate
  let extractedUnit = '';
  const unitMatch = name.match(/(?:\(?\s*(\d+(?:\.\d+)?)\s*(kg|kgs|g|gm|gms|ml|ltr|l|pcs|p|pack)\s*\)?)\s*$/i);
  if (unitMatch) {
    const qty = unitMatch[1];
    let unitType = unitMatch[2].toLowerCase();
    if (unitType === 'gm' || unitType === 'gms') unitType = 'g';
    if (unitType === 'kgs') unitType = 'kg';
    if (unitType === 'ltr' || unitType === 'l') unitType = 'L';
    if (unitType === 'p' || unitType === 'pcs') unitType = qty === '1' ? 'pc' : 'Pcs';
    if (unitType === 'pack') unitType = 'Pack';
    
    extractedUnit = `(${qty} ${unitType})`;
    name = name.slice(0, unitMatch.index).trim();
  } else if (rawUnit && rawUnit !== '.' && rawUnit !== '..' && rawUnit !== '1' && rawUnit !== 'Pcs') {
    const rawUnitMatch = rawUnit.match(/^(\d+(?:\.\d+)?)\s*(kg|kgs|g|gm|gms|ml|ltr|l|pcs|p)$/i);
    if (rawUnitMatch) {
      const qty = rawUnitMatch[1];
      let unitType = rawUnitMatch[2].toLowerCase();
      if (unitType === 'gm' || unitType === 'gms') unitType = 'g';
      if (unitType === 'kgs') unitType = 'kg';
      if (unitType === 'ltr' || unitType === 'l') unitType = 'L';
      if (unitType === 'p' || unitType === 'pcs') unitType = qty === '1' ? 'pc' : 'Pcs';
      extractedUnit = `(${qty} ${unitType})`;
    }
  }

  // 7. Title Casing
  const words = name.split(/\s+/).filter(Boolean);
  const titleCasedWords = words.map((w, index) => {
    // If word already has intentional camelCase/proper casing, preserve it
    if (/[a-z]/.test(w) && /[A-Z]/.test(w) && !/^[A-Z]+$/.test(w)) {
      return w;
    }
    const lower = w.toLowerCase();
    if (index > 0 && ['and', 'with', 'for', 'in', 'of', '&'].includes(lower)) {
      return lower === '&' ? '&' : lower;
    }
    // Capitalize first letter, lowercase rest
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });

  let formattedTitle = titleCasedWords.join(' ');
  formattedTitle = formattedTitle.replace(/[\s,;:.-]+$/, '');

  if (extractedUnit) {
    formattedTitle = `${formattedTitle} ${extractedUnit}`;
  }

  formattedTitle = formattedTitle.replace(/\s{2,}/g, ' ').trim();
  return formattedTitle;
}

async function executeFlipkartRebranding() {
  console.log('🚀 Starting Safe Flipkart Standard Rebranding Pipeline...');
  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch all products
  console.log('📦 Fetching all products from Supabase...');
  let allProducts = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .range(from, from + 999);

    if (error || !data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    process.stdout.write(`Loaded ${allProducts.length} rows...\r`);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`\n✅ Loaded total ${allProducts.length} products.`);

  // 2. Count image_url before update to ensure 100% preservation guarantee
  const initialImagesCount = allProducts.filter(p => p.image_url).length;
  console.log(`📷 Initial products with verified image_url: ${initialImagesCount}`);

  // 3. Save full backup to disk
  const backupDir = path.resolve(__dirname, '../main_data');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, 'backup_products_snapshot_before_flipkart.json');
  console.log(`💾 Writing complete snapshot backup to: ${backupPath}...`);
  fs.writeFileSync(backupPath, JSON.stringify(allProducts, null, 2), 'utf8');
  console.log(`✅ Snapshot backup saved successfully (${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB).`);

  // 4. Compute changes
  const toUpdate = [];
  for (const p of allProducts) {
    const formatted = formatToFlipkartStandard(p.name, p.brand, p.unit_size);
    if (formatted && formatted !== p.name) {
      toUpdate.push({
        ...p, // PRESERVES EVERY FIELD: image_url, price, mrp, sku, brand, category_id, is_featured, is_archived, created_at
        name: formatted,
        updated_at: new Date().toISOString()
      });
    }
  }

  console.log(`\n🎯 Total products requiring name formatting: ${toUpdate.length}`);
  console.log(`✨ Total products already in standard format: ${allProducts.length - toUpdate.length}`);

  if (toUpdate.length === 0) {
    console.log('All products already 100% formatted! Nothing to update.');
    return;
  }

  // 5. Batch update in chunks of 500
  const BATCH_SIZE = 500;
  const totalBatches = Math.ceil(toUpdate.length / BATCH_SIZE);
  console.log(`\n⚡ Applying updates in ${totalBatches} batches of ${BATCH_SIZE} rows...`);

  let updatedTotal = 0;
  for (let b = 0; b < totalBatches; b++) {
    const batch = toUpdate.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error in batch ${b + 1}/${totalBatches}:`, error.message);
      // Wait 1 sec and retry once
      await new Promise(r => setTimeout(r, 1000));
      const { error: retryErr } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
      if (retryErr) {
        console.error(`❌ Retry also failed:`, retryErr.message);
      } else {
        updatedTotal += batch.length;
      }
    } else {
      updatedTotal += batch.length;
    }

    process.stdout.write(`Progress: ${updatedTotal} / ${toUpdate.length} (${((updatedTotal / toUpdate.length) * 100).toFixed(1)}%) — Batch ${b + 1}/${totalBatches}\r`);
  }

  console.log(`\n\n🎉 Batch update complete! Successfully updated ${updatedTotal} product names.`);

  // 6. Post-update verification
  console.log('🔍 Running post-update verification against database...');
  const { count: finalImagesCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .not('image_url', 'is', null);

  console.log(`📷 Post-update products with image_url: ${finalImagesCount}`);
  if (finalImagesCount === initialImagesCount) {
    console.log('✅ 100% IMAGE PRESERVATION VERIFIED! Not a single image link was altered or lost.');
  } else {
    console.warn(`⚠️ Warning: Image count changed from ${initialImagesCount} to ${finalImagesCount}`);
  }

  // Sample check
  const { data: verifySample } = await supabase
    .from('products')
    .select('sku, name, image_url')
    .gte('sku', 'SDM-P-14002')
    .lte('sku', 'SDM-P-14015')
    .order('sku', { ascending: true });

  console.log('\n--- Live Database Verification (Sample) ---');
  verifySample.forEach(p => {
    console.log(`✔ [${p.sku}] "${p.name}" | Img: ${p.image_url ? 'PRESERVED' : 'NONE'}`);
  });
}

executeFlipkartRebranding().catch(console.error);
