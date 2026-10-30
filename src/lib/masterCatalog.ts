import type { Product } from '../types/product';

let cachedMasterCatalog: Product[] | null = null;
let fetchPromise: Promise<Product[]> | null = null;

let cachedImagedCatalog: Product[] | null = null;
let fetchImagedPromise: Promise<Product[]> | null = null;

/**
 * Loads the pre-compiled Master Store Catalog (ERP Non-Imaged)
 * Contains 31,155 active priced store products without photos exported from Sai Darshan Shopping Mart ERP.
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
      const tuples: [string, string, string, string, string, number, number, string?][] = await res.json();
      const products: Product[] = tuples.map(([id, sku, name, brand, unit_size, price, mrp, image_url]) => ({
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
        image_url: image_url || null,
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

const IMAGED_CATEGORY_MAP: Record<string, string> = {
  'Grocery & Staples': 'c2000000-0000-0000-0000-000000000002',
  'Atta, Rice & Dals': 'c3333333-3333-3333-3333-333333333333',
  'Dairy & Breakfast': 'c2222222-2222-2222-2222-222222222222',
  'Edible Oils & Spices': 'c5555555-5555-5555-5555-555555555555',
  'Snacks & Biscuits': 'c4444444-4444-4444-4444-444444444444',
  'Chocolates & Sweets': 'c4444444-4444-4444-4444-444444444444',
  'Beverages, Tea & Coffee': 'c6666666-6666-6666-6666-666666666666',
  'Personal Care & Beauty': 'c8888888-8888-8888-8888-888888888888',
  'Household & Cleaning': 'c7777777-7777-7777-7777-777777777777',
  'Kitchenware & Utilities': 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Baby Care': 'c9999999-9999-9999-9999-999999999999',
  'Dry Fruits & Nuts': 'c2000000-0000-0000-0000-000000000002',
  'Instant Foods & Noodles': 'c4444444-4444-4444-4444-444444444444',
  'Pooja Needs': 'c2000000-0000-0000-0000-000000000002',
};

function resolveCategoryId(catName: string, prodName: string): string {
  const name = (prodName || '').toLowerCase();
  if (/biscuit|cookie|rusk|cake|toast|bun|bread|pav|muffin/i.test(name)) {
    return 'c3000000-0000-0000-0000-000000000005'; // Bakery Products
  }
  if (/masala|mirch|haldi|dhaniya|jeera|rai|methi|clove|elaichi|cardamom|cinnamon|pepper|hing|spice|seasoning/i.test(name)) {
    return 'c4000000-0000-0000-0000-000000000007'; // Spices & Seasonings
  }
  if (/oil|ghee|mustard|soyabean|sunflower|refined|tel/i.test(name)) {
    return 'c5555555-5555-5555-5555-555555555555'; // Cooking Oils & Ghee
  }
  if (/atta|rice|dal|chawal|flour|gehu|maida|sooji|suji|besan|poha|moong|chana|toor|urad/i.test(name)) {
    return 'c3333333-3333-3333-3333-333333333333'; // Food Grains, Atta & Dals
  }
  if (/milk|paneer|butter|cheese|dahi|curd|chaas|lassi|dairy/i.test(name)) {
    return 'c2222222-2222-2222-2222-222222222222'; // Dairy Products
  }
  if (/diaper|baby|wipes|cerelac|lactogen|johnson/i.test(name)) {
    return 'c9999999-9999-9999-9999-999999999999'; // Baby Care
  }
  if (/tea|chai|coffee|juice|drink|coke|pepsi|sprite|frooti|maaza|limca|beverage/i.test(name)) {
    return 'c6666666-6666-6666-6666-666666666666'; // Beverages & Cold Drinks
  }
  if (/chocolate|cadbury|candy|toffee|lollipop|sweet|gems|perk|kitkat|munch/i.test(name)) {
    return 'c4444444-4444-4444-4444-444444444444'; // Chocolates & Confectionery
  }
  if (/surf|detergent|vim|dishwash|cleaner|harpic|colin|lizol|rin|tide|ariel|comfort|phenyl/i.test(name)) {
    return 'c7777777-7777-7777-7777-777777777777'; // Home Cleaners
  }
  if (/soap|shampoo|paste|colgate|brush|lotion|deo|perfume|facewash|bodywash|conditioner|powder|hair/i.test(name)) {
    return 'c8888888-8888-8888-8888-888888888888'; // Personal Care
  }
  if (/bottle|bucket|mug|container|plastic|tray|bowl|box|dustbin|broom|wiper|mop/i.test(name)) {
    return 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // Plastic Items & Storage
  }
  if (/dog|cat|pet|pedigree|whiskas/i.test(name)) {
    return 'c9000000-0000-0000-0000-000000000018'; // Pet Supplies & Care
  }
  if (/pen|pencil|notebook|copy|register|stapler|fevicol/i.test(name)) {
    return 'c5000000-0000-0000-0000-000000000014'; // Stationery & Supplies
  }
  return IMAGED_CATEGORY_MAP[catName] || 'c2000000-0000-0000-0000-000000000002'; // Daily Grocery & Staples fallback
}

/**
 * Loads the pre-compiled Imaged Catalog (7,226 Verified FMCG Products)
 */
export async function fetchImagedCatalog(): Promise<Product[]> {
  if (cachedImagedCatalog) return cachedImagedCatalog;
  if (fetchImagedPromise) return fetchImagedPromise;

  fetchImagedPromise = (async () => {
    try {
      const res = await fetch('/data/store-imaged-catalog.json');
      if (!res.ok) {
        console.warn('Imaged catalog fetch failed with status:', res.status);
        return [];
      }
      const tuples: [string, string, string, string, string, number, number, string, string][] = await res.json();
      const products: Product[] = tuples.map(([id, sku, name, brand, unit_size, price, mrp, image_url, category_name]) => ({
        id,
        sku,
        name,
        brand,
        unit_size: unit_size || '1 unit',
        price,
        mrp: mrp || price,
        category_id: resolveCategoryId(category_name, name),
        stock_quantity: 50,
        is_available: true,
        is_featured: false,
        is_archived: false,
        image_url,
        description: null,
        catalog_source: 'imaged',
        variants: []
      }));
      cachedImagedCatalog = products;
      return products;
    } catch (err) {
      console.warn('Could not load imaged catalog:', err);
      return [];
    }
  })();

  return fetchImagedPromise;
}

/**
 * Find an individual product by id or SKU across both Imaged and Master ERP catalogs
 */
export async function getMasterCatalogProduct(idOrSku: string): Promise<Product | null> {
  const lower = idOrSku.toLowerCase();

  // 1. Check verified imaged catalog first (fastest & has packaging photos)
  try {
    const imaged = await fetchImagedCatalog();
    const foundImaged = imaged.find(p => p.id.toLowerCase() === lower || p.sku.toLowerCase() === lower);
    if (foundImaged) return foundImaged;
  } catch (err) {
    console.warn('Could not query imaged catalog in getMasterCatalogProduct:', err);
  }

  // 2. Check complete store master catalog
  try {
    const master = await fetchMasterCatalog();
    const foundMaster = master.find(p => p.id.toLowerCase() === lower || p.sku.toLowerCase() === lower);
    if (foundMaster) return foundMaster;
  } catch (err) {
    console.warn('Could not query master ERP catalog in getMasterCatalogProduct:', err);
  }

  return null;
}
