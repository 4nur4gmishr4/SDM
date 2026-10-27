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
  name = name.replace(/\bPow\b/i, 'Powder');
  name = name.replace(/\b1\+500\s*(?:ltr|l)?\.?/i, '1.5 L');
  name = name.replace(/\b2\+1\b/i, 'Buy 2 Get 1 Free');

  // 4. Clean stray middle dots separating letters (e.g. "Go.Baby" -> "Go Baby")
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
    if (/[a-z]/.test(w) && /[A-Z]/.test(w) && !/^[A-Z]+$/.test(w)) {
      return w;
    }
    const lower = w.toLowerCase();
    if (index > 0 && ['and', 'with', 'for', 'in', 'of', '&'].includes(lower)) {
      return lower === '&' ? '&' : lower;
    }
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

async function runDryRun() {
  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('⚡ Fetching products for Flipkart transformation dry run...');

  let allProducts = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, brand, unit_size')
      .eq('is_archived', false)
      .range(from, from + 999);

    if (error || !data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Analyzing ${allProducts.length} products...`);

  let modifiedCount = 0;
  let unchangedCount = 0;
  const sampleChanges = [];

  for (const p of allProducts) {
    const proposed = formatToFlipkartStandard(p.name, p.brand, p.unit_size);
    if (proposed !== p.name) {
      modifiedCount++;
      if (sampleChanges.length < 50) {
        sampleChanges.push({
          sku: p.sku,
          brand: p.brand,
          before: p.name,
          after: proposed
        });
      }
    } else {
      unchangedCount++;
    }
  }

  console.log('\n======================================================');
  console.log('🎯 FLIPKART RE-BRANDING DRY RUN METRICS');
  console.log('======================================================');
  console.log(`Total Active Products:              ${allProducts.length}`);
  console.log(`Products to be Polished & Updated:  ${modifiedCount} (${((modifiedCount / allProducts.length) * 100).toFixed(1)}%)`);
  console.log(`Already Perfectly Formatted:        ${unchangedCount} (${((unchangedCount / allProducts.length) * 100).toFixed(1)}%)`);
  console.log('======================================================\n');

  console.log('Sample 20 High-Impact Transformations:');
  sampleChanges.slice(0, 20).forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.sku}]`);
    console.log(`   BEFORE: "${c.before}"`);
    console.log(`   AFTER : "${c.after}"\n`);
  });
}

runDryRun().catch(console.error);
