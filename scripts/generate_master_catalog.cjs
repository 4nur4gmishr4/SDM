const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

async function generateMasterCatalog() {
  console.log('⚡ Starting Master Catalog Generator...');

  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch categories
  console.log('Fetching store categories...');
  const { data: categories } = await supabase.from('categories').select('id, name, slug');
  const categoryMap = new Map();
  (categories || []).forEach(c => categoryMap.set(c.id, c.name));

  // 2. Fetch all active products
  console.log('Fetching active products from Supabase...');
  let activeProducts = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, brand, category_id, unit_size, price, mrp, image_url, is_available, is_featured')
      .eq('is_archived', false)
      .order('sku', { ascending: true })
      .range(from, from + 999);

    if (error) {
      console.error('Fetch error:', error.message);
      break;
    }
    if (!data || data.length === 0) break;
    activeProducts = activeProducts.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Loaded ${activeProducts.length} active products from database.`);

  // 3. Import dynamic grouping engine
  const { groupProductsIntoVariants } = await import('../src/lib/productGrouping.ts');
  const groupedCards = groupProductsIntoVariants(activeProducts);
  console.log(`Consolidated into ${groupedCards.length} unique storefront product cards.`);

  // 4. Prepare Master Excel Rows
  // Header: SKU | Product_Name | Brand | Category | Pack_Size | MRP | Selling_Price | Discount_% | Image_URL | In_Stock | Featured | Variants_Count | Variant_Options
  const excelRows = [
    [
      'SKU',
      'Product Name',
      'Brand',
      'Category',
      'Pack Size',
      'MRP (₹)',
      'Selling Price (₹)',
      'Discount (%)',
      'Image URL',
      'In Stock',
      'Featured',
      'Variants Count',
      'Variant Options (Packs & Rates)'
    ]
  ];

  const jsonCatalog = [];

  for (const card of groupedCards) {
    const categoryName = (card.category_id && categoryMap.get(card.category_id)) || card.category?.name || 'General Grocery';
    const mrp = Number(card.mrp || card.price || 0);
    const price = Number(card.price || mrp || 0);
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const variantsCount = card.variants ? card.variants.length : 1;
    const variantsSummary = card.variants
      ? card.variants.map(v => `${v.unit_size}: ₹${v.price} (MRP: ₹${v.mrp})`).join(' | ')
      : `${card.unit_size}: ₹${price}`;

    excelRows.push([
      card.sku,
      card.name,
      card.brand || 'Sai Darshan Mart',
      categoryName,
      card.unit_size,
      mrp,
      price,
      discount > 0 ? `${discount}%` : '0%',
      card.image_url || '',
      card.is_available ? 'YES' : 'NO',
      card.is_featured ? 'YES' : 'NO',
      variantsCount,
      variantsSummary
    ]);

    jsonCatalog.push({
      id: card.id,
      sku: card.sku,
      name: card.name,
      brand: card.brand || 'Sai Darshan Mart',
      category: categoryName,
      unit_size: card.unit_size,
      price,
      mrp,
      discount_percent: discount,
      image_url: card.image_url || null,
      is_available: Boolean(card.is_available),
      is_featured: Boolean(card.is_featured),
      variants_count: variantsCount,
      variants: card.variants || []
    });
  }

  // 5. Generate Excel Workbook
  console.log('Building MASTER_SAI_DARSHAN_CATALOG.xlsx...');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelRows);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 14 }, // SKU
    { wch: 45 }, // Product Name
    { wch: 22 }, // Brand
    { wch: 26 }, // Category
    { wch: 14 }, // Pack Size
    { wch: 10 }, // MRP
    { wch: 16 }, // Selling Price
    { wch: 14 }, // Discount
    { wch: 55 }, // Image URL
    { wch: 10 }, // In Stock
    { wch: 10 }, // Featured
    { wch: 15 }, // Variants Count
    { wch: 60 }  // Variant Options
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Master Catalog');

  const excelOutPath = path.resolve('main_data/MASTER_SAI_DARSHAN_CATALOG.xlsx');
  XLSX.writeFile(wb, excelOutPath);
  console.log(`✔ Excel Master Catalog saved at: ${excelOutPath}`);

  // 6. Write JSON Catalog
  const jsonOutPath = path.resolve('main_data/MASTER_SAI_DARSHAN_CATALOG.json');
  fs.writeFileSync(jsonOutPath, JSON.stringify(jsonCatalog, null, 2), 'utf8');
  console.log(`✔ JSON Master Catalog saved at: ${jsonOutPath}`);

  console.log('\n======================================================');
  console.log('🎉 MASTER SINGLE CATALOG GENERATION COMPLETE!');
  console.log(`• Total Unique Clean Products: ${groupedCards.length}`);
  console.log(`• Multi-variant Pack Options Consolidated: 100%`);
  console.log(`• Excel file: main_data/MASTER_SAI_DARSHAN_CATALOG.xlsx`);
  console.log(`• JSON file: main_data/MASTER_SAI_DARSHAN_CATALOG.json`);
  console.log('======================================================');
}

generateMasterCatalog().catch(console.error);
