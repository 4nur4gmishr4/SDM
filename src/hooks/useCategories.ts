import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import { MOCK_CATEGORIES } from '../lib/mockData';
import type { Category } from '../types/category';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => MOCK_CATEGORIES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setCategories(MOCK_CATEGORIES);
      setIsLoading(false);
      return;
    }

    async function fetchCategories() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await withTimeout(
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          2000
        );

        if (fetchError) throw fetchError;
        
        if (mounted) {
          if (data && data.length > 0) {
            setCategories(data as Category[]);
          } else {
            setCategories(MOCK_CATEGORIES);
          }
        }
      } catch (err: any) {
        console.warn('Falling back to testing categories:', err.message);
        if (mounted) {
          setError(err.message || null);
          setCategories(MOCK_CATEGORIES);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  return { categories, isLoading, error };
}
