import { supabase } from './supabase';
import { mockCategories, mockProducts, mockBanners, mockDeliverySettings } from './mockData';

export async function seedDatabase() {
  try {
    // 1. Seed Categories
    console.log('Seeding categories...');
    const { error: catError } = await supabase
      .from('categories')
      .upsert(mockCategories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image_url: c.image_url,
        is_active: c.is_active,
        sort_order: c.sort_order
      })));
    
    if (catError) throw new Error(`Categories Error: ${catError.message}`);

    // 2. Seed Products
    console.log('Seeding products...');
    const { error: prodError } = await supabase
      .from('products')
      .upsert(mockProducts.map(p => ({
        id: p.id,
        category_id: p.category_id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        stock_quantity: p.stock_quantity,
        is_available: p.is_available,
        is_featured: p.is_featured,
        is_archived: p.is_archived,
        image_url: p.image_url,
        unit: p.unit
      })));
    
    if (prodError) throw new Error(`Products Error: ${prodError.message}`);

    // 3. Seed Banners
    console.log('Seeding banners...');
    const { error: bannerError } = await supabase
      .from('banners')
      .upsert(mockBanners.map(b => ({
        id: b.id,
        title: b.title,
        text: b.text,
        image_url: b.image_url,
        link_url: b.link_url,
        is_active: b.is_active,
        sort_order: b.sort_order
      })));
    
    if (bannerError) throw new Error(`Banners Error: ${bannerError.message}`);

    // 4. Seed Delivery Settings
    console.log('Seeding delivery settings...');
    const { error: delError } = await supabase
      .from('delivery_settings')
      .upsert([{
        id: mockDeliverySettings.id,
        rules_text: mockDeliverySettings.rules_text,
        flat_fee: mockDeliverySettings.flat_fee,
        is_active: mockDeliverySettings.is_active
      }]);
    
    if (delError) throw new Error(`Delivery Error: ${delError.message}`);

    console.log('Database seeded successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Seeding failed:', error);
    return { success: false, error: error.message };
  }
}
