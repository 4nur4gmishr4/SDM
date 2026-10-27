const { createClient } = require('@supabase/supabase-js');

// Brand normalization dictionary
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

  // 2b. Remove isolated dots surrounded by whitespace: " . " -> " "
  name = name.replace(/\s+\.\s+/g, ' ');

  // 3. Normalize common brand contractions
  for (const [pattern, expansion] of Object.entries(BRAND_EXPANSIONS)) {
    const reg = new RegExp(pattern, 'i');
    if (reg.test(name)) {
      name = name.replace(reg, expansion);
      break;
    }
  }

  // Expand Cinthol abbreviations for Godrej products
  name = name.replace(/\bGodrej\s+Cin\b/i, 'Godrej Cinthol');
  name = name.replace(/\bSh\s+Cream\b/i, 'Shaving Cream');
  name = name.replace(/\bPow\b/i, 'Powder');
  name = name.replace(/\b1\+500\s*(?:ltr|l)?\.?/i, '1.5 L');
  name = name.replace(/\b2\+1\b/i, 'Buy 2 Get 1 Free');

  // 4. Clean stray middle dots separating letters (e.g. "Go.Baby" -> "Go Baby")
  // But preserve decimal numbers (e.g. "40.5", "1.5", "2.5") and "No.1"
  name = name.replace(/([a-zA-Z])\.([a-zA-Z])/g, '$1 $2');
  name = name.replace(/(?<=\s[a-zA-Z]{2,})\.(?=\s)/g, ''); // remove dot after words

  // 5. Clean trailing dots and hyphens
  name = name.replace(/[\s.-]+$/, '');
  name = name.replace(/^[\s.-]+/, '');

  // 6. Extract unit if embedded in name or separate
  let extractedUnit = '';
  
  // Check for unit at the end: e.g. "100GM", "200G", "1KG", "500ML", "1LTR", "10P", "450g", "(500 g)"
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
    // Strip extracted unit from main title
    name = name.slice(0, unitMatch.index).trim();
  } else if (rawUnit && rawUnit !== '.' && rawUnit !== '..' && rawUnit !== '1' && rawUnit !== 'Pcs') {
    // Check if rawUnit has a valid weight/volume
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

  // 7. If the name is ALL-CAPS or all-lowercase, convert to clean Title Case
  // Protect words like "No.1", "50-50", "2-Minute"
  const words = name.split(/\s+/).filter(Boolean);
  const titleCasedWords = words.map((w, index) => {
    // If word is already properly cased with lowercase letters (e.g. "Choclairs", "Bournvita"), preserve it
    if (/[a-z]/.test(w) && /[A-Z]/.test(w) && !/^[A-Z]+$/.test(w)) {
      return w;
    }
    // Minor words in lowercase if not first word
    const lower = w.toLowerCase();
    if (index > 0 && ['and', 'with', 'for', 'in', 'of', '&'].includes(lower)) {
      return lower === '&' ? '&' : lower;
    }
    // Capitalize first letter, lowercase rest
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });

  let formattedTitle = titleCasedWords.join(' ');

  // 8. Clean trailing hyphens, commas, colons, and DOTS
  formattedTitle = formattedTitle.replace(/[\s,;:.-]+$/, '');

  // 9. Re-attach unit in standard Flipkart format: Title (Unit)
  if (extractedUnit) {
    formattedTitle = `${formattedTitle} ${extractedUnit}`;
  }

  // 10. Clean any double spaces
  formattedTitle = formattedTitle.replace(/\s{2,}/g, ' ').trim();

  return formattedTitle;
}

async function run() {
  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: sample } = await supabase
    .from('products')
    .select('id, name, sku, brand, unit_size')
    .eq('is_archived', false)
    .gte('sku', 'SDM-P-14001')
    .limit(40);

  console.log('--- Real Flipkart Formatter Test on 40 Problematic Database Items ---');
  sample.forEach(p => {
    const formatted = formatToFlipkartStandard(p.name, p.brand, p.unit_size);
    console.log(`BEFORE: "${p.name}"`);
    console.log(`AFTER : "${formatted}"\n`);
  });
}

run().catch(console.error);
