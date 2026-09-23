import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import { MOCK_DELIVERY_SETTINGS } from '../lib/mockData';
import type { DeliverySettings } from '../types/delivery';

export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySettings | null>(() =>
    !isSupabaseConfigured ? MOCK_DELIVERY_SETTINGS : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => isSupabaseConfigured);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setSettings(MOCK_DELIVERY_SETTINGS);
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
          2000
        );

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        
        if (mounted) {
          if (data) {
            setSettings(data as DeliverySettings);
          } else {
            setSettings(MOCK_DELIVERY_SETTINGS);
          }
        }
      } catch (error) {
        console.warn('Falling back to testing delivery settings:', error);
        if (mounted) {
          setSettings(MOCK_DELIVERY_SETTINGS);
        }
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
