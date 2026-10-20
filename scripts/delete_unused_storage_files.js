import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminConfig } from './env_loader.js';

const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
const supabase = createClient(supabaseUrl, supabaseKey);

const filesToDelete = [
  'banners/Buy1Get1.png',
  'icons/Favicon.png',
  'icons/Favicon_1790505513725.png',
  'categories/appliances.jpg',
  'categories/baby-care.jpg',
  'categories/bakery-products.jpg',
  'categories/beverages-drinks.jpg',
  'categories/chocolates-confectionery.jpg',
  'categories/cooking-oils-ghee.jpg',
  'categories/dairy-products.jpg',
  'categories/dining-chairs-furniture.jpg',
  'categories/electricals-electronics.jpg',
  'categories/food-grains-atta-dals.jpg',
  'categories/grocery-staples.jpg',
  'categories/home-cleaners.jpg',
  'categories/personal-care.jpg',
  'categories/pet-supplies.jpg',
  'categories/plastic-items-storage.jpg',
  'categories/sai-darshan-specials.jpg',
  'categories/spices-seasonings.jpg',
  'categories/stationery-supplies.jpg',
  'store/img_0526.jpg',
  'store/img_0605.jpg',
  'store/img_0606.jpg',
  'store/img_2554.jpg',
  'store/img_9082.jpg',
  'store/img_9085.jpg',
  'store/media_manifest.json'
];

async function deleteUnusedFiles() {
  console.log(`Starting deletion of ${filesToDelete.length} unused files from store-media bucket...`);

  const { data, error } = await supabase.storage
    .from('store-media')
    .remove(filesToDelete);

  if (error) {
    console.error('❌ Deletion failed with error:', error);
    process.exit(1);
  }

  console.log('✅ Successfully removed files from Supabase Storage:');
  console.log(data);

  // Verify remaining files
  async function listRecursive(folder = '') {
    const { data: list, error: listErr } = await supabase.storage.from('store-media').list(folder, { limit: 1000 });
    if (listErr) return [];
    let result = [];
    for (const item of (list || [])) {
      const fullPath = folder ? folder + '/' + item.name : item.name;
      if (item.id === null || !item.metadata) {
        result = result.concat(await listRecursive(fullPath));
      } else {
        result.push(fullPath);
      }
    }
    return result;
  }

  const remaining = await listRecursive();
  console.log(`\n🎉 Verification Complete! Remaining files in storage: ${remaining.length}`);
  remaining.forEach(r => console.log('  ✔ ' + r));
}

deleteUnusedFiles().catch(console.error);
