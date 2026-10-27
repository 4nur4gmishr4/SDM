const { createClient } = require('@supabase/supabase-js');

async function run() {
  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: sample, count } = await supabase
    .from('products')
    .select('id, name, sku, brand, unit_size, is_archived', { count: 'exact' })
    .eq('is_archived', false)
    .limit(30);

  console.log('Active products count:', count);
  console.log('Sample 30 products:');
  sample.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.sku}] "${p.name}" | Unit: "${p.unit_size}" | Brand: "${p.brand}"`);
  });

  // Let's also check total count of all products (including archived)
  const { count: totalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  console.log('Total products in DB (all):', totalCount);

  // Check how many have images vs no images
  const { count: withImgCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false)
    .not('image_url', 'is', null);
  console.log('Active products with image:', withImgCount);
}

run().catch(console.error);
