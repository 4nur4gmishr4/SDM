import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import type { DeliverySettings } from '../types/delivery';

const DEFAULT_SETTINGS: DeliverySettings = {
  id: 'default',
  rules_text: (import.meta.env.VITE_DELIVERY_RULES_TEXT as string) || 'Doorstep grocery delivery across Jabalpur. Free delivery on orders above ₹500.',
  flat_fee: Number(import.meta.env.VITE_DEFAULT_FLAT_FEE) || 30,
  free_delivery_threshold: Number(import.meta.env.VITE_DEFAULT_FREE_THRESHOLD) || 500,
  is_active: true
};

export function useDeliverySettings() {
  const queryResult = useQuery({
    queryKey: ['delivery_settings'],
    queryFn: async (): Promise<DeliverySettings> => {
      if (!isSupabaseConfigured) return DEFAULT_SETTINGS;

      try {
        const { data, error } = await withTimeout(
          supabase
            .from('delivery_settings')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single(),
          5000
        );

        if (error && error.code !== 'PGRST116') throw error;
        return (data as DeliverySettings) || DEFAULT_SETTINGS;
      } catch (err) {
        console.warn('Using standard delivery settings fallback:', err);
        return DEFAULT_SETTINGS;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    initialData: DEFAULT_SETTINGS,
  });

  return {
    settings: queryResult.data,
    isLoading: queryResult.isLoading,
  };
}
