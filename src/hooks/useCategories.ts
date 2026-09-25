import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import type { Category } from '../types/category';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setCategories([]);
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
            .order('display_order', { ascending: true }),
          5000
        );

        if (fetchError) throw fetchError;
        
        if (mounted) {
          const list = (data as Category[]) || [];
          // Filter visible
          const visible = list.filter(c => (c as any).is_visible !== false && (c as any).is_active !== false);
          setCategories(visible);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching categories:', err.message);
        if (mounted) {
          setError(err.message || 'Failed to fetch categories');
          setCategories([]);
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
