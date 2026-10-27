const { createClient } = require('@supabase/supabase-js');

async function run() {
  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Sample from the curated section (SDM-P-00001 to SDM-P-01000)
  const { data: curatedSample } = await supabase
    .from('products')
    .select('id, name, sku, brand, unit_size, price, mrp, image_url')
    .gte('sku', 'SDM-P-00001')
    .lte('sku', 'SDM-P-00050')
    .order('sku', { ascending: true })
    .limit(30);

  console.log('Sample curated products (SDM-P-00001+):');
  curatedSample.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.sku}] "${p.name}" | Unit: "${p.unit_size}" | Brand: "${p.brand}" | Img: ${Boolean(p.image_url)}`);
  });
}

run().catch(console.error);
