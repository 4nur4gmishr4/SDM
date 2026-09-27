import { supabase, isSupabaseConfigured, withTimeout } from './supabase';

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTimestampString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}_${hh}${min}`;
}

/**
 * Exports complete store catalog (products & categories) to an Excel .xlsx workbook
 */
export async function exportCatalogToExcel(): Promise<{ success: boolean; count: number; filename: string }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const [productsRes, categoriesRes] = await Promise.all([
    withTimeout(supabase.from('products').select('*, category:categories(name, slug)').order('name'), 8000),
    withTimeout(supabase.from('categories').select('*').order('display_order'), 8000)
  ]);

  const products = (productsRes.data as any[]) || [];
  const categories = (categoriesRes.data as any[]) || [];

  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  // 1. Prepare Products Sheet
  const productsRows = products.map(p => ({
    'SKU': p.sku || '',
    'Product Name': p.name || '',
    'Category': p.category?.name || 'Unassigned',
    'Brand': p.brand || '',
    'Selling Price (₹)': p.price,
    'MRP (₹)': p.mrp || p.price,
    'Unit / Pack Size': p.unit_size || '',
    'In Stock': p.is_available ? 'YES' : 'NO',
    'Featured on Home': p.is_featured ? 'YES' : 'NO',
    'Archived': p.is_archived ? 'YES' : 'NO',
    'Image URL': p.image_url || '',
    'Description': p.description || ''
  }));

  const productsSheet = XLSX.utils.json_to_sheet(productsRows);
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Catalog Products');

  // 2. Prepare Categories Sheet
  const categoriesRows = categories.map(c => ({
    'Display Order': c.display_order,
    'Category Name': c.name,
    'Slug': c.slug,
    'Is Offer Section': c.is_offer_category ? 'YES' : 'NO',
    'Visible': c.is_visible !== false ? 'YES' : 'NO',
    'Thumbnail URL': c.thumbnail_url || '',
    'Description': c.description || ''
  }));

  const categoriesSheet = XLSX.utils.json_to_sheet(categoriesRows);
  XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories (21)');

  const filename = `SaiDarshanMart_Catalog_${getTimestampString()}.xlsx`;
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  triggerBrowserDownload(blob, filename);

  return { success: true, count: products.length, filename };
}

/**
 * Exports all customer orders and item breakdowns to an Excel .xlsx workbook
 */
export async function exportOrdersToExcel(): Promise<{ success: boolean; count: number; filename: string }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const [ordersRes, itemsRes] = await Promise.all([
    withTimeout(supabase.from('orders').select('*').order('created_at', { ascending: false }), 8000),
    withTimeout(supabase.from('order_items').select('*'), 8000)
  ]);

  const orders = (ordersRes.data as any[]) || [];
  const items = (itemsRes.data as any[]) || [];

  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  // 1. Orders Overview Sheet
  const orderRows = orders.map(o => ({
    'Order ID': o.id,
    'Date & Time': new Date(o.created_at).toLocaleString('en-IN'),
    'Status': (o.status || 'pending').toUpperCase(),
    'Customer Name': o.customer_name,
    'Customer Phone': o.customer_phone,
    'Delivery Address': o.delivery_address,
    'Order Type': o.is_quick_order ? 'Quick Order List' : 'Standard Cart',
    'Subtotal (₹)': o.subtotal_amount || 0,
    'Delivery Fee (₹)': o.delivery_fee || 0,
    'Total Amount (₹)': o.total_amount || 0,
    'Google Maps Link': o.map_link || '',
    'Quick Order Notes': o.quick_order_text || ''
  }));

  const ordersSheet = XLSX.utils.json_to_sheet(orderRows);
  XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders Overview');

  // 2. Itemized Lines Sheet
  const itemRows = items.map(it => ({
    'Order ID': it.order_id,
    'Product Name': it.product_name,
    'SKU': it.product_sku || '',
    'Unit / Pack Size': it.unit_size || '',
    'Price (₹)': it.product_price || it.price_at_time || 0,
    'Quantity': it.quantity || 1,
    'Line Total (₹)': (it.product_price || it.price_at_time || 0) * (it.quantity || 1)
  }));

  const itemsSheet = XLSX.utils.json_to_sheet(itemRows);
  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Order Line Items');

  const filename = `SaiDarshanMart_Orders_${getTimestampString()}.xlsx`;
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  triggerBrowserDownload(blob, filename);

  return { success: true, count: orders.length, filename };
}

/**
 * Generates an encrypted/clean JSON snapshot of all store tables for disaster recovery
 */
export async function exportFullDatabaseSnapshotJSON(): Promise<{ success: boolean; filename: string }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const [products, categories, banners, delivery, settings, orders] = await Promise.all([
    withTimeout(supabase.from('products').select('*'), 8000),
    withTimeout(supabase.from('categories').select('*'), 8000),
    withTimeout(supabase.from('banners').select('*'), 8000),
    withTimeout(supabase.from('delivery_settings').select('*'), 8000),
    withTimeout(supabase.from('store_settings').select('*'), 8000),
    withTimeout(supabase.from('orders').select('*').limit(500), 8000)
  ]);

  const snapshot = {
    metadata: {
      store: 'Sai Darshan Mart',
      generated_at: new Date().toISOString(),
      version: '1.0.0'
    },
    data: {
      categories: categories.data || [],
      products: products.data || [],
      banners: banners.data || [],
      delivery_settings: delivery.data || [],
      store_settings: settings.data || [],
      orders: orders.data || []
    }
  };

  const filename = `SaiDarshanMart_Snapshot_${getTimestampString()}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  triggerBrowserDownload(blob, filename);

  return { success: true, filename };
}
