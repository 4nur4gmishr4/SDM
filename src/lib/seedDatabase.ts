import { supabase } from './supabase';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_BANNERS, MOCK_DELIVERY_SETTINGS } from './mockData';
import type { Category } from '../types/category';
import type { Product } from '../types/product';
import type { Banner } from '../types/banner';

export async function seedDatabase() {
  try {
    // 1. Seed Categories
    console.log('Seeding categories...');
    const { error: catError } = await supabase
      .from('categories')
      .upsert(MOCK_CATEGORIES.map((c: Category) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        thumbnail_url: c.thumbnail_url,
        is_visible: c.is_visible,
        is_offer_category: c.is_offer_category,
        display_order: c.display_order
      })));
    
    if (catError) throw new Error(`Categories Error: ${catError.message}`);

    // 2. Seed Products
    console.log('Seeding products...');
    const { error: prodError } = await supabase
      .from('products')
      .upsert(MOCK_PRODUCTS.map((p: Product) => ({
        id: p.id,
        category_id: p.category_id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        unit_size: p.unit_size,
        is_available: p.is_available,
        is_featured: p.is_featured,
        is_archived: p.is_archived,
        image_url: p.image_url
      })));
    
    if (prodError) throw new Error(`Products Error: ${prodError.message}`);

    // 3. Seed Banners
    console.log('Seeding banners...');
    const { error: bannerError } = await supabase
      .from('banners')
      .upsert(MOCK_BANNERS.map((b: Banner) => ({
        id: b.id,
        title: b.title,
        text: b.text,
        image_url: b.image_url,
        link_url: b.link_url,
        is_active: b.is_active,
        display_order: b.display_order
      })));
    
    if (bannerError) throw new Error(`Banners Error: ${bannerError.message}`);

    // 4. Seed Delivery Settings
    console.log('Seeding delivery settings...');
    const { error: delError } = await supabase
      .from('delivery_settings')
      .upsert([{
        id: MOCK_DELIVERY_SETTINGS.id,
        rules_text: MOCK_DELIVERY_SETTINGS.rules_text,
        flat_fee: MOCK_DELIVERY_SETTINGS.flat_fee,
        is_active: MOCK_DELIVERY_SETTINGS.is_active
      }]);
    
    if (delError) throw new Error(`Delivery Error: ${delError.message}`);

    console.log('Database seeded successfully!');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown seeding error';
    console.error('Seeding failed:', error);
    return { success: false, error: message };
  }
}
