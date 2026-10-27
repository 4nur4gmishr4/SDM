const { createClient } = require('@supabase/supabase-js');

async function main() {
  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('⚡ Starting Comprehensive Catalog Alignment & Variant Reconciliation...');

  // 1. Fetch ALL products (both active and archived)
  let allProducts = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, brand, unit_size, price, mrp, image_url, is_available, is_featured, is_archived')
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

  console.log(`Loaded ${allProducts.length} total products in database.`);

  const toUnarchive = [];
  const toArchive = [];

  // Helper to test if unit is pure garbage
  function isGarbageUnit(unit) {
    if (!unit) return true;
    const u = unit.trim().toLowerCase();
    if (!u || u === '.' || u === '-' || u === 'j' || u === 'o' || u === 'p' || u === 'g' || u === 'pck' || u === 'd') return true;
    if (/^\d+$/.test(u)) return true; // bare "1", "2"
    if (/^\d+\/-$/.test(u)) return true; // "20/-"
    if (/^\d+\s*pc$/i.test(u) && parseInt(u) > 12) return true;
    return false;
  }

  // Parse grams from name or unit
  function parseWeightGrams(name, unit) {
    const combined = `${name || ''} ${unit || ''}`.toLowerCase();
    const kg = combined.match(/(\d+(?:\.\d+)?)\s*k(?:g|ilo)?\b/);
    if (kg) return parseFloat(kg[1]) * 1000;
    const g = combined.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gms|gram|grams)\b/);
    if (g) return parseFloat(g[1]);
    const l = combined.match(/(\d+(?:\.\d+)?)\s*(?:l|lt|ltr|liter|litre)\b/);
    if (l) return parseFloat(l[1]) * 1000;
    const ml = combined.match(/(\d+(?:\.\d+)?)\s*ml\b/);
    if (ml) return parseFloat(ml[1]);
    const pack = combined.match(/(\d+)\s*(?:pack|pcs|pc|p)\b/);
    if (pack) {
      const cnt = parseInt(pack[1]);
      if (cnt <= 12) return cnt * 70;
    }
    return null;
  }

  // 1. Specific Fix for Maggi:
  // Identify authentic Maggi 2-Minute Noodles rows
  const maggiNoodles = allProducts.filter(p => /maggi.*2-minute.*masala.*instant noodles/i.test(p.name));
  console.log(`Found ${maggiNoodles.length} Maggi 2-Minute Masala Instant Noodles rows.`);

  // We want exactly 3 clean options for Maggi 2-Minute Masala Noodles:
  // Option 1: 70g @ ₹14 or ₹15
  // Option 2: 280g (4-Pack) @ ₹57 or ₹58 or ₹60
  // Option 3: 560g or 960g/1kg @ ₹120 or ₹165
  const maggiSingle = maggiNoodles.find(p => p.sku === 'SDM-P-21569' || (parseWeightGrams(p.name, p.unit_size) === 70 && (p.price === 14 || p.price === 15)));
  const maggi4Pack = maggiNoodles.find(p => p.sku === 'SDM-P-21617' || (parseWeightGrams(p.name, p.unit_size) === 280 && p.price >= 55 && p.price <= 60));
  const maggiFamily = maggiNoodles.find(p => p.sku === 'SDM-P-21558' || (parseWeightGrams(p.name, p.unit_size) === 560 && p.price >= 115 && p.price <= 125));
  const maggi1Kg = maggiNoodles.find(p => p.sku === 'SDM-P-21716' || (parseWeightGrams(p.name, p.unit_size) >= 960 && p.price >= 160 && p.price <= 185));

  const authenticMaggiSkus = new Set([
    maggiSingle?.sku,
    maggi4Pack?.sku,
    maggiFamily?.sku,
    maggi1Kg?.sku,
  ].filter(Boolean));

  console.log('Authentic Maggi 2-Minute options selected:');
  maggiNoodles.forEach(p => {
    if (authenticMaggiSkus.has(p.sku)) {
      console.log('   KEEP/ACTIVATE ->', p.sku, '|', p.name, '| unit:', p.unit_size, '| price: ₹' + p.price, '| mrp: ₹' + p.mrp);
      if (p.is_archived) toUnarchive.push(p.id);
    } else {
      // Archive duplicate/anomalous maggi 2-minute noodles rows
      if (!p.is_archived) toArchive.push(p.id);
    }
  });

  // 2. Specific Fix for Maggi Veg Atta Noodles:
  const maggiAtta = allProducts.filter(p => /maggi.*veg atta.*instant noodles/i.test(p.name));
  const attaSingle = maggiAtta.find(p => (parseWeightGrams(p.name, p.unit_size) || 0) >= 70 && (parseWeightGrams(p.name, p.unit_size) || 0) <= 80 && p.price >= 18 && p.price <= 30);
  const atta4Pack = maggiAtta.find(p => (parseWeightGrams(p.name, p.unit_size) || 0) >= 280 && (parseWeightGrams(p.name, p.unit_size) || 0) <= 300 && p.price >= 70 && p.price <= 116);
  const attaFamily = maggiAtta.find(p => (parseWeightGrams(p.name, p.unit_size) || 0) >= 400 && p.price >= 160);

  const authenticAttaSkus = new Set([
    attaSingle?.sku,
    atta4Pack?.sku,
    attaFamily?.sku,
  ].filter(Boolean));

  console.log('Authentic Maggi Veg Atta options selected:');
  maggiAtta.forEach(p => {
    if (authenticAttaSkus.has(p.sku)) {
      console.log('   KEEP/ACTIVATE ->', p.sku, '|', p.name, '| unit:', p.unit_size, '| price: ₹' + p.price, '| mrp: ₹' + p.mrp);
      if (p.is_archived) toUnarchive.push(p.id);
    } else {
      if (!p.is_archived) toArchive.push(p.id);
    }
  });

  // 3. Specific Fix for Maggi Ketchup:
  const maggiKetchup = allProducts.filter(p => /maggi.*rich tomato.*ketchup/i.test(p.name));
  const ketchupSmall = maggiKetchup.find(p => (parseWeightGrams(p.name, p.unit_size) || 0) >= 75 && (parseWeightGrams(p.name, p.unit_size) || 0) <= 90 && p.price >= 15 && p.price <= 25);
  const ketchupMed = maggiKetchup.find(p => (parseWeightGrams(p.name, p.unit_size) || 0) >= 500 && (parseWeightGrams(p.name, p.unit_size) || 0) <= 600 && p.price >= 60 && p.price <= 115);
  const ketchupLarge = maggiKetchup.find(p => (parseWeightGrams(p.name, p.unit_size) || 0) >= 960 && p.price >= 150 && p.price <= 165);

  const authenticKetchupSkus = new Set([
    ketchupSmall?.sku,
    ketchupMed?.sku,
    ketchupLarge?.sku,
  ].filter(Boolean));

  console.log('Authentic Maggi Ketchup options selected:');
  maggiKetchup.forEach(p => {
    if (authenticKetchupSkus.has(p.sku)) {
      console.log('   KEEP/ACTIVATE ->', p.sku, '|', p.name, '| unit:', p.unit_size, '| price: ₹' + p.price, '| mrp: ₹' + p.mrp);
      if (p.is_archived) toUnarchive.push(p.id);
    } else {
      if (!p.is_archived) toArchive.push(p.id);
    }
  });

  // 4. Archive all products across DB that have pure garbage units ('j', 'o', 'P', '.', bare numbers)
  allProducts.forEach(p => {
    if (!p.is_archived && isGarbageUnit(p.unit_size)) {
      toArchive.push(p.id);
    }
  });

  // 5. Unarchive legitimate products that were accidentally archived in earlier deduplication
  // E.g. Parle-G 250g, Parle-G 800g, Parle-G 45g
  const parleGItems = allProducts.filter(p => /parle-g/i.test(p.name) && p.is_archived);
  for (const p of parleGItems) {
    const g = parseWeightGrams(p.name, p.unit_size);
    if (g && p.price > 0 && p.price < 100) {
      toUnarchive.push(p.id);
    }
  }

  console.log(`\n=== Proposed DB Actions ===`);
  console.log(`Total rows to unarchive (restore authentic variants): ${toUnarchive.length}`);
  console.log(`Total rows to archive (junk units, pricing anomalies, duplicate rows): ${toArchive.length}`);

  // Apply updates in batches
  const BATCH_SIZE = 100;

  if (toUnarchive.length > 0) {
    console.log(`\nUnarchiving ${toUnarchive.length} authentic products...`);
    for (let i = 0; i < toUnarchive.length; i += BATCH_SIZE) {
      const batch = toUnarchive.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('products').update({ is_archived: false }).in('id', batch);
      if (error) console.error('Unarchive error:', error.message);
    }
    console.log('✔ Unarchived successfully!');
  }

  if (toArchive.length > 0) {
    console.log(`\nArchiving ${toArchive.length} junk/duplicate products...`);
    for (let i = 0; i < toArchive.length; i += BATCH_SIZE) {
      const batch = toArchive.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('products').update({ is_archived: true, is_featured: false }).in('id', batch);
      if (error) console.error('Archive error:', error.message);
    }
    console.log('✔ Archived successfully!');
  }

  console.log('\n🎉 Database catalog reconciliation and variant consistency complete!');
}

main().catch(console.error);
