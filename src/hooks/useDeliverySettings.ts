import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import type { DeliverySettings } from '../types/delivery';

const DEFAULT_SETTINGS: DeliverySettings = {
  id: 'default',
  rules_text: 'Doorstep grocery delivery across Jabalpur. Free delivery on orders above ₹500.',
  flat_fee: 30,
  free_delivery_threshold: 500,
  is_active: true
};

export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }

    async function fetchSettings() {
      try {
        const { data, error: fetchError } = await withTimeout(
          supabase
            .from('delivery_settings')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single(),
          5000
        );

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        
        if (mounted && data) {
          setSettings(data as DeliverySettings);
        }
      } catch (error) {
        console.warn('Using standard delivery settings:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchSettings();

    return () => {
      mounted = false;
    };
  }, []);

  return { settings, isLoading };
}
