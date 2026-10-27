const { createClient } = require('@supabase/supabase-js');

async function analyzeAllNames() {
  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Fetching all active products to analyze naming patterns...');

  let allProducts = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, brand, unit_size, price, mrp, image_url')
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

  console.log(`Fetched ${allProducts.length} active products from database.`);

  // Analyze various naming issues
  const trailingDots = [];
  const middleDots = [];
  const allCapsNames = [];
  const multipleSpaces = [];
  const danglingHyphens = [];
  const posGarbage = [];
  const unitNotStandardized = [];
  const doubleBrands = [];
  const emptyParentheses = [];
  const cleanFlipkartFormatted = [];

  for (const p of allProducts) {
    const name = p.name || '';
    
    // Check if clean Flipkart format: Starts with Title, ends with (unit)
    const isFlipkartPattern = /^[A-Z][a-zA-Z0-9\s&'-]+\s+\([0-9.]+\s*(?:g|kg|ml|L|Pcs|Pack|unit)\)$/.test(name);
    if (isFlipkartPattern) {
      cleanFlipkartFormatted.push(p);
      continue;
    }

    if (/\.\s*$/.test(name)) {
      trailingDots.push(p);
    }
    if (/[a-zA-Z]\.[a-zA-Z]/.test(name)) {
      middleDots.push(p);
    }
    if (/^[A-Z0-9\s/.,&+-]{8,}$/.test(name) && !/[a-z]/.test(name)) {
      allCapsNames.push(p);
    }
    if (/\s{2,}/.test(name)) {
      multipleSpaces.push(p);
    }
    if (/-\s*$/.test(name) || /^\s*-/.test(name) || /\s+-\s+/.test(name)) {
      danglingHyphens.push(p);
    }
    if (/\/-|\d+\/-|\bPO4\b|\bSD\b|\bTOI\b|\bBATH\.\b/i.test(name)) {
      posGarbage.push(p);
    }
    if (/\b\d+\s*(?:GM|GMS|ML|LTR|KG|KGS)\b/i.test(name) && !/\([0-9.]+\s*(?:g|kg|ml|L)\)/.test(name)) {
      unitNotStandardized.push(p);
    }
    if (/\(\s*\)|\(\s*\.\.\s*\)/.test(name)) {
      emptyParentheses.push(p);
    }
    if (p.brand && p.brand !== 'Other' && p.brand !== 'Sai Darshan') {
      const brandWord = p.brand.split(/\s+/)[0];
      if (brandWord.length > 3) {
        const regex = new RegExp(`^${brandWord}\\s+${brandWord}\\b`, 'i');
        if (regex.test(name)) {
          doubleBrands.push(p);
        }
      }
    }
  }

  console.log('\n======================================================');
  console.log('📊 DATABASE PRODUCT NAME AUDIT ANALYSIS');
  console.log('======================================================');
  console.log(`Total Active Products:              ${allProducts.length}`);
  console.log(`Already Flipkart Formatted:         ${cleanFlipkartFormatted.length} (${((cleanFlipkartFormatted.length / allProducts.length) * 100).toFixed(1)}%)`);
  console.log(`ALL-CAPS Names (Needs Title Case):  ${allCapsNames.length}`);
  console.log(`Unstandardized Units (e.g. 500GM):  ${unitNotStandardized.length}`);
  console.log(`Multiple Spaces in Name:            ${multipleSpaces.length}`);
  console.log(`Trailing Dots (e.g. "30G."):        ${trailingDots.length}`);
  console.log(`Middle Stray Dots (e.g. "Go.Baby"): ${middleDots.length}`);
  console.log(`Dangling / Stray Hyphens:           ${danglingHyphens.length}`);
  console.log(`POS Abbreviations / Garbage:        ${posGarbage.length}`);
  console.log(`Empty Parentheses "()" or "(..)":   ${emptyParentheses.length}`);
  console.log(`Double Brand Repetitions:           ${doubleBrands.length}`);
  console.log('======================================================\n');

  console.log('--- Examples of Already Clean Flipkart Formatted (Gold Standard) ---');
  cleanFlipkartFormatted.slice(0, 5).forEach(p => console.log(`  ✔ [${p.sku}] ${p.name}`));

  console.log('\n--- Examples of ALL-CAPS Names ---');
  allCapsNames.slice(0, 5).forEach(p => console.log(`  ❌ [${p.sku}] "${p.name}"`));

  console.log('\n--- Examples of Trailing & Middle Dots ---');
  trailingDots.slice(0, 5).forEach(p => console.log(`  ❌ [${p.sku}] "${p.name}"`));
  middleDots.slice(0, 5).forEach(p => console.log(`  ❌ [${p.sku}] "${p.name}"`));

  console.log('\n--- Examples of POS Garbage / Messy Names ---');
  posGarbage.slice(0, 5).forEach(p => console.log(`  ❌ [${p.sku}] "${p.name}"`));
}

analyzeAllNames().catch(console.error);
