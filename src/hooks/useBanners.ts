import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import type { Banner } from '../types/banner';

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setBanners([]);
      setIsLoading(false);
      return;
    }

    async function fetchBanners() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await withTimeout(
          supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true }),
          5000
        );

        if (fetchError) throw fetchError;
        
        if (mounted) {
          setBanners((data as Banner[]) || []);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching banners:', err.message);
        if (mounted) {
          setError(err.message || 'Failed to fetch banners');
          setBanners([]);
        }
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
