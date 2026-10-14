import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import type { Product } from '../types/product';
import { expandSearchQuery } from '../lib/searchUtils';
import { groupProductsIntoVariants, extractBaseNameAndUnit } from '../lib/productGrouping';

interface UseProductsOptions {
  categoryId?: string;
  isFeatured?: boolean;
  searchQuery?: string;
  limit?: number;
  fetchAll?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const queryResult = useQuery({
    queryKey: ['products', options],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      
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

      // Always prioritize curated / featured items first from the database
      query = query.order('is_featured', { ascending: false });

      const { data, error: fetchError } = await withTimeout(query, 8000);
      if (fetchError) throw fetchError;

      const rawProducts = (data as Product[]) || [];
      return groupProductsIntoVariants(rawProducts);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    products: queryResult.data || [],
    isLoading: queryResult.isLoading,
    error: queryResult.error ? queryResult.error.message : null,
  };
}

export function useProduct(id?: string) {
  const queryResult = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id || !isSupabaseConfigured) return null;

      const { data, error: fetchError } = await withTimeout(
        supabase
          .from('products')
          .select('*, category:categories(id, name, slug)')
          .eq('id', id)
          .single(),
        5000
      );
        
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!data) return null;

      const baseProduct = data as Product;
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
    error: queryResult.error ? queryResult.error.message : null,
  };
}
