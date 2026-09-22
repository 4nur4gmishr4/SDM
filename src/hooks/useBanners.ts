import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Banner } from '../types/banner';

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchBanners() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (fetchError) throw fetchError;
        
        if (mounted && data) {
          setBanners(data as Banner[]);
        }
      } catch (err: any) {
        console.error('Error fetching banners:', err);
        if (mounted) setError(err.message || 'Failed to fetch banners');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchBanners();

    return () => {
      mounted = false;
    };
  }, []);

  return { banners, isLoading, error };
}
