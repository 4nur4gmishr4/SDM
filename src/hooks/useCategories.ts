import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types/category';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchCategories() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (fetchError) throw fetchError;
        
        if (mounted && data) {
          setCategories(data as Category[]);
        }
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        if (mounted) setError(err.message || 'Failed to fetch categories');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []); // Should technically depend on options but omitting for simplicity

  return { categories, isLoading, error };
}
