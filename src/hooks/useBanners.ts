import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import type { Banner } from '../types/banner';

export function useBanners() {
  const queryResult = useQuery({
    queryKey: ['banners'],
    queryFn: async (): Promise<Banner[]> => {
      if (!isSupabaseConfigured) return [];

      const { data, error } = await withTimeout(
        supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        5000
      );

      if (error) throw error;
      return (data as Banner[]) || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  return {
    banners: queryResult.data || [],
    isLoading: queryResult.isLoading,
    error: queryResult.error ? (queryResult.error as Error).message : null,
  };
}
