import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    async function fetchProducts() {
      try {
        setIsLoading(true);
        let query = supabase.from('products').select('*, category:categories(id, name, slug)');

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

        const { data, error: fetchError } = await withTimeout(query, 5000);
        if (fetchError) throw fetchError;

        if (mounted) {
          setProducts((data as Product[]) || []);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching products:', err.message);
        if (mounted) {
          setError(err.message || 'Failed to fetch products');
          setProducts([]);
        }
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    async function fetchProduct() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await withTimeout(
          supabase
            .from('products')
            .select('*, category:categories(id, name, slug)')
            .eq('id', id)
            .single(),
          5000
        );
          
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        
        if (mounted) {
          setProduct((data as Product) || null);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching product details:', err.message);
        if (mounted) {
          setError(err.message || 'Failed to load product');
          setProduct(null);
        }
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
