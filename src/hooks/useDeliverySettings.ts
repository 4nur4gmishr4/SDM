import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
        
        if (mounted && data) {
          setSettings(data as DeliverySettings);
        }
      } catch (error) {
        console.error('Error fetching delivery settings:', error);
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
