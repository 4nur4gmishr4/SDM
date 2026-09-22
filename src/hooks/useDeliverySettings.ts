import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK_DELIVERY_SETTINGS } from '../lib/mockData';
import type { DeliverySettings } from '../types/delivery';

export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchSettings() {
      try {
        const { data, error: fetchError } = await supabase
          .from('delivery_settings')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .single();

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
