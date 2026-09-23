import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import { MOCK_BANNERS } from '../lib/mockData';
import type { Banner } from '../types/banner';

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>(() =>
    !isSupabaseConfigured ? MOCK_BANNERS : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setBanners(MOCK_BANNERS);
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
            .order('sort_order', { ascending: true }),
          2000
        );

        if (fetchError) throw fetchError;
        
        if (mounted) {
          if (data && data.length > 0) {
            setBanners(data as Banner[]);
          } else {
            setBanners(MOCK_BANNERS);
          }
        }
      } catch (err: any) {
        console.warn('Falling back to testing banners:', err.message);
        if (mounted) {
          setError(err.message || null);
          setBanners(MOCK_BANNERS);
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
