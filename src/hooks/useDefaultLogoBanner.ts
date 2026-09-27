import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import type { DefaultLogoBannerConfig } from '../types/banner';

export const INITIAL_DEFAULT_LOGO_BANNER: DefaultLogoBannerConfig = {
  image_url: 'https://otyojqnnwbrteknyqcpi.supabase.co/storage/v1/object/public/store-media/banners/SaiDarshanLogoBanner.png',
  local_url: 'https://otyojqnnwbrteknyqcpi.supabase.co/storage/v1/object/public/store-media/banners/SaiDarshanLogoBanner.png',
  title: 'Sai Darshan Shopping Mart',
  subtitle: 'Aapki Apni Supermarket • Sanjeevni Nagar Main Road, Jabalpur',
  link_url: '/shop',
  is_enabled: true,
};

const STORAGE_KEY = 'sdm_default_logo_banner';
const SETTING_KEY = 'default_logo_banner';

export function useDefaultLogoBanner() {
  const [logoBanner, setLogoBanner] = useState<DefaultLogoBannerConfig>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignore
    }
    return INITIAL_DEFAULT_LOGO_BANNER;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch from Supabase
  useEffect(() => {
    let mounted = true;

    async function fetchConfig() {
      if (!isSupabaseConfigured) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: fetchErr } = await withTimeout(
          supabase
            .from('store_settings')
            .select('*')
            .eq('key', SETTING_KEY)
            .maybeSingle(),
          5000
        );

        if (fetchErr) {
          console.warn('Could not fetch default logo banner:', fetchErr.message);
        } else if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (mounted) {
              const merged = { ...INITIAL_DEFAULT_LOGO_BANNER, ...parsed };
              setLogoBanner(merged);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            }
          } catch (pe) {
            console.error('Failed to parse default logo banner JSON:', pe);
          }
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Error loading default logo banner');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchConfig();

    return () => {
      mounted = false;
    };
  }, []);

  // Update config
  const updateLogoBanner = useCallback(async (newConfig: DefaultLogoBannerConfig) => {
    setLogoBanner(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    if (!isSupabaseConfigured) return;

    try {
      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .eq('key', SETTING_KEY)
        .maybeSingle();

      const payload = {
        ...newConfig,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        await supabase
          .from('store_settings')
          .update({
            value: JSON.stringify(payload),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('store_settings')
          .insert({
            key: SETTING_KEY,
            value: JSON.stringify(payload),
            updated_at: new Date().toISOString(),
          });
      }
    } catch (err: any) {
      console.error('Error saving default logo banner to Supabase:', err);
      throw err;
    }
  }, []);

  return {
    logoBanner,
    isLoading,
    error,
    updateLogoBanner,
  };
}
