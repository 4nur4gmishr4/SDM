const { createClient } = require('@supabase/supabase-js');

async function archiveObsoleteRelics() {
  console.log('⚡ Archiving Discontinued / Obsolete FMCG Relics in Supabase...');

  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Fetching active products...');
  let active = [];
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from('products')
      .select('id, sku, name, unit_size, price, mrp')
      .eq('is_archived', false)
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    active = active.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Auditing ${active.length} active products...`);

  const toArchive = [];
  const reasons = [];

  for (const p of active) {
    const name = (p.name || '').toLowerCase();
    const price = Number(p.price) || 0;
    const mrp = Number(p.mrp) || 0;

    // 1. Zero/Negative Price
    if (price <= 0 || mrp <= 0) {
      toArchive.push(p.id);
      reasons.push(`[${p.sku}] ${p.name} -> Zero/negative price (₹${price}/₹${mrp})`);
      continue;
    }

    // 2. Discontinued Biscuits (< ₹5 or < 35g for standard biscuits like Parle-G ₹2 pack)
    const isBiscuit = /biscuit|cookie|rusk|gluco|parle-g|parle g|50-50|good day|bourbon|bounce|cream/i.test(name);
    if (isBiscuit && (price < 5 || (p.unit_size && (p.unit_size.includes('17.7') || p.unit_size.includes('21 g') || p.unit_size.includes('24.5') || p.unit_size.includes('28 g')) && price < 5))) {
      toArchive.push(p.id);
      reasons.push(`[${p.sku}] ${p.name} -> Discontinued ₹2/micro biscuit pack (Price: ₹${price})`);
      continue;
    }

    // 3. Discontinued Noodles (< ₹10 or < 50g)
    const isNoodle = /noodle|maggi|yippee|top ramen|wai wai/i.test(name);
    if (isNoodle && (price < 10 || (p.unit_size && (p.unit_size.includes('30 g') || p.unit_size.includes('31 g') || p.unit_size.includes('32 g'))))) {
      toArchive.push(p.id);
      reasons.push(`[${p.sku}] ${p.name} -> Discontinued ₹5/sample noodle pack (Price: ₹${price})`);
      continue;
    }

    // 4. Obsolete Cooking Oil Promo Sachets (< 150ml/g)
    const isCookingOil = (name.includes('oil') || name.includes('tel') || name.includes('ghee')) &&
      !/hair|massage|shampoo|baby|body|face|essential|olive/i.test(name);
    if (isCookingOil && (p.unit_size && (p.unit_size.includes('60 g') || p.unit_size.includes('75 g')) && price < 30)) {
      toArchive.push(p.id);
      reasons.push(`[${p.sku}] ${p.name} -> Obsolete promo cooking oil pouch (${p.unit_size} @ ₹${price})`);
      continue;
    }
  }

  console.log('\n======================================================');
  console.log(`Total Obsolete Items to Archive: ${toArchive.length}`);
  console.log('======================================================');
  reasons.forEach(r => console.log('  *', r));

  // Execute archive in batches
  if (toArchive.length > 0) {
    console.log(`\nArchiving ${toArchive.length} products in Supabase...`);
    const BATCH_SIZE = 100;
    let archived = 0;
    for (let i = 0; i < toArchive.length; i += BATCH_SIZE) {
      const batchIds = toArchive.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('products').update({ is_archived: true }).in('id', batchIds);
      if (error) {
        console.error('Batch error:', error);
      } else {
        archived += batchIds.length;
      }
    }
    console.log(`✔ Successfully archived ${archived} obsolete/discontinued products!`);
  }
}

archiveObsoleteRelics().catch(console.error);
