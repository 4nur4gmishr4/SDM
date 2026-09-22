import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/product';

interface UseProductsOptions {
  categoryId?: string;
  isFeatured?: boolean;
  searchQuery?: string;
  limit?: number;
  fetchAll?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProducts() {
      try {
        setIsLoading(true);
        let query = supabase.from('products').select('*');

        if (!options.fetchAll) {
          query = query.eq('is_archived', false);
        }

        if (options.categoryId) {
          query = query.eq('category_id', options.categoryId);
        }

        if (options.isFeatured) {
          query = query.eq('is_featured', true);
        }

        if (options.searchQuery) {
          query = query.or(`name.ilike.%${options.searchQuery}%,sku.ilike.%${options.searchQuery}%`);
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        if (mounted && data) {
          setProducts(data as Product[]);
        }
      } catch (err: any) {
        console.error('Error fetching products:', err);
        if (mounted) setError(err.message || 'Failed to fetch products');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [options.categoryId, options.isFeatured, options.searchQuery, options.limit, options.fetchAll]);

  return { products, isLoading, error };
}

export function useProduct(id?: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setIsLoading(false);
      return;
    }

    async function fetchProduct() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        if (mounted && data) {
          setProduct(data as Product);
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        if (mounted) setError(err.message || 'Failed to fetch product');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  return { product, isLoading, error };
}
