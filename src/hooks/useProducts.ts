import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import type { Product } from '../types/product';
import { expandSearchQuery, matchesSearchQuery } from '../lib/searchUtils';
import { groupProductsIntoVariants, extractBaseNameAndUnit } from '../lib/productGrouping';
import { fetchMasterCatalog, getMasterCatalogProduct, fetchImagedCatalog } from '../lib/masterCatalog';

interface UseProductsOptions {
  categoryId?: string;
  isFeatured?: boolean;
  searchQuery?: string;
  limit?: number;
  fetchAll?: boolean;
  includeMasterCatalog?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const queryResult = useQuery({
    queryKey: ['products', options],
    queryFn: async () => {
      // 1. Fetch curated imaged products from Supabase
      let imagedProducts: Product[] = [];
      if (isSupabaseConfigured) {
        if (options.fetchAll && !options.limit) {
          // Instant high-performance retrieval from static imaged catalog (<50ms)
          imagedProducts = await fetchImagedCatalog();

          if (options.categoryId) {
            if (options.categoryId === 'ca000000-0000-0000-0000-000000000019') {
              imagedProducts = imagedProducts.filter(p => /offer|special|deal/i.test(p.name));
            } else if (options.categoryId === 'ca000000-0000-0000-0000-000000000020') {
              imagedProducts = imagedProducts.filter(p => /1\+1|free|buy 1/i.test(p.name));
            } else if (options.categoryId === 'ca000000-0000-0000-0000-000000000021') {
              imagedProducts = imagedProducts.filter(p => /combo|saver|pack/i.test(p.name));
            } else {
              imagedProducts = imagedProducts.filter(p => p.category_id === options.categoryId);
            }

            if (imagedProducts.length < 20) {
              try {
                const { data: supaCatProducts } = await withTimeout(
                  supabase
                    .from('products')
                    .select('*, category:categories(id, name, slug)')
                    .eq('category_id', options.categoryId)
                    .eq('is_archived', false)
                    .limit(100),
                  4000
                );
                if (supaCatProducts && supaCatProducts.length > 0) {
                  const supaList = supaCatProducts as Product[];
                  const existingIds = new Set(imagedProducts.map(p => p.id));
                  const newItems = supaList.filter(p => !existingIds.has(p.id));
                  imagedProducts = [...imagedProducts, ...newItems];
                }
              } catch (e) {
                console.warn('Could not supplement category from Supabase:', e);
              }
            }
          }

          if (options.searchQuery && options.searchQuery.trim()) {
            const clean = options.searchQuery.trim();
            imagedProducts = imagedProducts.filter(p => matchesSearchQuery(p.name, p.brand, clean));
          }
        } else {
          let query = supabase.from('products').select('*, category:categories(id, name, slug)');

          if (!options.fetchAll) {
            query = query.eq('is_archived', false);
          }

          if (options.categoryId) {
            if (options.categoryId === 'ca000000-0000-0000-0000-000000000019') {
              query = query.or('name.ilike.%offer%,name.ilike.%special%,name.ilike.%deal%');
            } else if (options.categoryId === 'ca000000-0000-0000-0000-000000000020') {
              query = query.or('name.ilike.%1+1%,name.ilike.%free%,name.ilike.%buy 1%');
            } else if (options.categoryId === 'ca000000-0000-0000-0000-000000000021') {
              query = query.or('name.ilike.%combo%,name.ilike.%saver%,name.ilike.%pack%');
            } else {
              query = query.eq('category_id', options.categoryId);
            }
          }

          if (options.isFeatured) {
            query = query.eq('is_featured', true);
          }

          if (options.searchQuery && options.searchQuery.trim()) {
            const clean = options.searchQuery.trim();
            const terms = expandSearchQuery(clean).slice(0, 6);
            const orConditions = terms.flatMap(t => [
              `name.ilike.%${t}%`,
              `brand.ilike.%${t}%`,
              `sku.ilike.%${t}%`
            ]).join(',');
            query = query.or(orConditions);
          }

          if (options.limit) {
            query = query.limit(options.limit);
          }

          query = query.order('is_featured', { ascending: false });

          const { data, error: fetchError } = await withTimeout(query, 8000);
          if (fetchError) throw fetchError;
          imagedProducts = (data as Product[]) || [];
        }
      }

      imagedProducts.forEach(p => { p.catalog_source = 'imaged'; });
      const finalImaged = options.fetchAll ? imagedProducts : groupProductsIntoVariants(imagedProducts);

      // 2. Smart High-Speed ERP Catalog Loading:
      // Only download the heavy 2.62MB ERP catalog when customer actually searches or explicitly requests it.
      // Category browsing renders instantly (<50ms) using verified imaged catalog.
      if (options.includeMasterCatalog !== false && !options.isFeatured) {
        const hasSearch = options.searchQuery && options.searchQuery.trim();
        if (hasSearch || options.includeMasterCatalog === true) {
          try {
            let erpItems = await fetchMasterCatalog();

            if (hasSearch) {
              const cleanQuery = options.searchQuery!.trim();
              erpItems = erpItems.filter(p => matchesSearchQuery(p.name, p.brand, cleanQuery));
            }

            if (options.limit && finalImaged.length >= options.limit) {
              return finalImaged.slice(0, options.limit);
            }

            if (options.limit) {
              const remaining = options.limit - finalImaged.length;
              return [...finalImaged, ...erpItems.slice(0, remaining)];
            }

            return [...finalImaged, ...erpItems];
          } catch (err) {
            console.warn('Could not load master ERP items in useProducts:', err);
          }
        }
      }

      return finalImaged;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const allItems = queryResult.data || [];
  const totalCount = 40208;
  const imagedCount = 9053;
  const erpCount = 31155;

  return {
    products: allItems,
    isLoading: queryResult.isLoading,
    error: queryResult.error ? (queryResult.error as Error).message : null,
    totalCount,
    imagedCount,
    erpCount
  };
}

export function useProduct(id?: string) {
  const queryResult = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;

      // 1. If it is an ERP or static imaged catalog product
      if (id.startsWith('sdm-erp-') || id.startsWith('SDM-ERP-')) {
        const item = await getMasterCatalogProduct(id);
        if (item) {
          try {
            const imaged = await fetchImagedCatalog();
            const { baseName } = extractBaseNameAndUnit(item);
            const siblings = imaged.filter(p => {
              const { baseName: sibBase } = extractBaseNameAndUnit(p);
              return sibBase.toLowerCase() === baseName.toLowerCase();
            });
            if (siblings.length > 1) {
              const grouped = groupProductsIntoVariants(siblings, id);
              const matchedGroup = grouped.find(g => g.name.toLowerCase() === baseName.toLowerCase());
              if (matchedGroup) return matchedGroup;
            }
          } catch (e) {
            console.warn('Could not group variants for product:', e);
          }
          return item;
        }
      }

      if (!isSupabaseConfigured) return null;

      // 2. Otherwise fetch from Supabase
      const { data, error: fetchError } = await withTimeout(
        supabase
          .from('products')
          .select('*, category:categories(id, name, slug)')
          .eq('id', id)
          .single(),
        5000
      );
        
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!data) {
        // Fallback: check if id exists in master ERP catalog
        return await getMasterCatalogProduct(id);
      }

      const baseProduct = data as Product;
      baseProduct.catalog_source = 'imaged';
      const { baseName } = extractBaseNameAndUnit(baseProduct);

      // Fetch sibling pack size variants for this product
      try {
        const { data: siblings } = await supabase
          .from('products')
          .select('*, category:categories(id, name, slug)')
          .ilike('name', `${baseName}%`)
          .eq('is_archived', false)
          .limit(20);

        if (siblings && siblings.length > 1) {
          const grouped = groupProductsIntoVariants(siblings as Product[], id);
          const matchedGroup = grouped.find(g => g.name.toLowerCase() === baseName.toLowerCase());
          if (matchedGroup) return matchedGroup;
        }
      } catch {
        // Fallback to standalone product
      }

      return baseProduct;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    product: queryResult.data || null,
    isLoading: queryResult.isLoading,
    error: queryResult.error ? (queryResult.error as Error).message : null,
  };
}
