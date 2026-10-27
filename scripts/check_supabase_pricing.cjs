const { createClient } = require('@supabase/supabase-js');

async function checkSupabasePricing() {
  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Querying Parle-G in Supabase products table...');
  const { data: parleProducts, error } = await supabase
    .from('products')
    .select('id, sku, name, unit_size, price, mrp, is_archived')
    .ilike('name', '%parle%')
    .order('sku');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${parleProducts.length} Parle products in Supabase:`);
  parleProducts.forEach(p => {
    console.log(`[${p.sku}] ${p.name} | Size: ${p.unit_size} | Price: ₹${p.price} | MRP: ₹${p.mrp} | Archived: ${p.is_archived}`);
  });

  // Check how many active products in Supabase have fractional decimal prices
  console.log('\nChecking all active products in Supabase for decimal prices...');
  let totalActive = 0;
  let decimalCount = 0;
  let from = 0;
  let decimalSamples = [];

  while (true) {
    const { data } = await supabase
      .from('products')
      .select('id, sku, name, price, mrp')
      .eq('is_archived', false)
      .range(from, from + 999);

    if (!data || data.length === 0) break;
    totalActive += data.length;

    for (const p of data) {
      if (p.price && Number(p.price) % 1 !== 0) {
        decimalCount++;
        if (decimalSamples.length < 10) {
          decimalSamples.push({ sku: p.sku, name: p.name, price: p.price, mrp: p.mrp });
        }
      }
    }

    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Total active products: ${totalActive}`);
  console.log(`Active products with decimal prices: ${decimalCount} (${Math.round(decimalCount / totalActive * 100)}%)`);
  console.log('Decimal samples:', decimalSamples);
}

checkSupabasePricing().catch(console.error);
