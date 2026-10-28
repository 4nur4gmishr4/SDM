import type { Product } from '../types/product';

let cachedMasterCatalog: Product[] | null = null;
let fetchPromise: Promise<Product[]> | null = null;

/**
 * Loads the pre-compiled Master Store Catalog (ERP Non-Imaged)
 * Contains 38,381 active priced store products exported from Sai Darshan Shopping Mart ERP.
 */
export async function fetchMasterCatalog(): Promise<Product[]> {
  if (cachedMasterCatalog) return cachedMasterCatalog;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch('/data/store-master-catalog-compact.json');
      if (!res.ok) {
        console.warn('Master catalog fetch failed with status:', res.status);
        return [];
      }
      const tuples: [string, string, string, string, string, number, number][] = await res.json();
      const products: Product[] = tuples.map(([id, sku, name, brand, unit_size, price, mrp]) => ({
        id,
        sku,
        name,
        brand,
        unit_size: unit_size || '1 unit',
        price,
        mrp: mrp || price,
        category_id: '',
        stock_quantity: 50,
        is_available: true,
        is_featured: false,
        is_archived: false,
        image_url: null,
        description: null,
        catalog_source: 'erp',
        variants: []
      }));
      cachedMasterCatalog = products;
      return products;
    } catch (err) {
      console.warn('Could not load master ERP catalog:', err);
      return [];
    }
  })();

  return fetchPromise;
}

/**
 * Find an individual non-imaged ERP product by id or SKU
 */
export async function getMasterCatalogProduct(idOrSku: string): Promise<Product | null> {
  const catalog = await fetchMasterCatalog();
  const lower = idOrSku.toLowerCase();
  return catalog.find(p => p.id.toLowerCase() === lower || p.sku.toLowerCase() === lower) || null;
}
