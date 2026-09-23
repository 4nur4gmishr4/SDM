import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import { MOCK_PRODUCTS } from '../lib/mockData';
import type { Product } from '../types/product';

interface UseProductsOptions {
  categoryId?: string;
  isFeatured?: boolean;
  searchQuery?: string;
  limit?: number;
  fetchAll?: boolean;
}

function getMockProducts(options: UseProductsOptions = {}): Product[] {
  let list = [...MOCK_PRODUCTS];
  if (!options.fetchAll) {
    list = list.filter(p => !p.is_archived);
  }
  if (options.categoryId) {
    list = list.filter(p => p.category_id === options.categoryId);
  }
  if (options.isFeatured) {
    list = list.filter(p => p.is_featured);
  }
  if (options.searchQuery) {
    const q = options.searchQuery.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (options.limit) {
    list = list.slice(0, options.limit);
  }
  return list;
}

export function useProducts(options: UseProductsOptions = {}) {
  // If Supabase is unconfigured, serve mock products instantly with zero delay
  const [products, setProducts] = useState<Product[]>(() => 
    !isSupabaseConfigured ? getMockProducts(options) : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // If no backend configured, immediately use mock data without waiting
    if (!isSupabaseConfigured) {
      setProducts(getMockProducts(options));
      setIsLoading(false);
      return;
    }

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

        const { data, error: fetchError } = await withTimeout(query, 2000);
        if (fetchError) throw fetchError;

        if (mounted) {
          if (data && data.length > 0) {
            setProducts(data as Product[]);
          } else {
            setProducts(getMockProducts(options));
          }
        }
      } catch (err: any) {
        console.warn('Falling back to testing products:', err.message);
        if (mounted) {
          setError(err.message || null);
          setProducts(getMockProducts(options));
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
  const [product, setProduct] = useState<Product | null>(() => {
    if (!id) return null;
    return !isSupabaseConfigured ? (MOCK_PRODUCTS.find(p => p.id === id) || null) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!id) return false;
    return isSupabaseConfigured;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setProduct(MOCK_PRODUCTS.find(p => p.id === id) || null);
      setIsLoading(false);
      return;
    }

    async function fetchProduct() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await withTimeout(
          supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single(),
          2000
        );
          
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        
        if (mounted) {
          if (data) {
            setProduct(data as Product);
          } else {
            setProduct(MOCK_PRODUCTS.find(p => p.id === id) || null);
          }
        }
      } catch (err: any) {
        console.warn('Falling back to testing product details:', err.message);
        if (mounted) {
          setError(err.message || null);
          setProduct(MOCK_PRODUCTS.find(p => p.id === id) || null);
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
