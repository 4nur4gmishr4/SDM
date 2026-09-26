import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import { STORE_MEDIA_ITEMS, type StoreMediaItem } from '../data/storeMedia';

const STORAGE_KEY = 'sdm_store_about_visuals';
const SETTING_KEY = 'store_about_visuals';

// Merge stored items with permanent items to ensure all permanent items are always preserved
function mergeWithPermanentItems(stored: StoreMediaItem[]): StoreMediaItem[] {
  if (!Array.isArray(stored) || stored.length === 0) {
    return STORE_MEDIA_ITEMS;
  }

  // Ensure every item has an is_active property (default true)
  const normalized = stored.map(item => ({
    ...item,
    is_active: item.is_active !== false,
  }));

  // Ensure any missing permanent item is kept
  const existingIds = new Set(normalized.map(i => i.id));
  const missingPermanent = STORE_MEDIA_ITEMS.filter(p => !existingIds.has(p.id));

  return [...normalized, ...missingPermanent];
}

function loadInitialItems(): StoreMediaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergeWithPermanentItems(parsed);
    }
  } catch (err) {
    console.warn('Failed to parse cached store visuals from localStorage:', err);
  }
  return STORE_MEDIA_ITEMS;
}

export function useStoreMedia() {
  const [items, setItems] = useState<StoreMediaItem[]>(loadInitialItems);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync to database and localStorage
  const syncItems = useCallback(async (newItems: StoreMediaItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    if (!isSupabaseConfigured) return;

    try {
      // Check if setting already exists
      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .eq('key', SETTING_KEY)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('store_settings')
          .update({
            value: JSON.stringify(newItems),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('store_settings')
          .insert({
            key: SETTING_KEY,
            value: JSON.stringify(newItems),
            updated_at: new Date().toISOString(),
          });
      }
    } catch (err: any) {
      console.error('Error saving store visuals to Supabase:', err);
    }
  }, []);

  // Fetch from Supabase on mount
  useEffect(() => {
    let mounted = true;

    async function fetchVisuals() {
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
          console.warn('Could not fetch store visuals from Supabase:', fetchErr.message);
        } else if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            const merged = mergeWithPermanentItems(parsed);
            if (mounted) {
              setItems(merged);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            }
          } catch (pe) {
            console.error('Failed to parse store visuals JSON from Supabase:', pe);
          }
        } else {
          // Setting doesn't exist yet in Supabase -> seed with permanent items
          try {
            await supabase
              .from('store_settings')
              .insert({
                key: SETTING_KEY,
                value: JSON.stringify(STORE_MEDIA_ITEMS),
                updated_at: new Date().toISOString(),
              });
          } catch (ie) {
            console.warn('Could not seed default store visuals in Supabase:', ie);
          }
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Error loading store visuals');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchVisuals();

    return () => {
      mounted = false;
    };
  }, []);

  // Toggle item active/inactive
  const toggleActive = useCallback(async (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, is_active: item.is_active === false ? true : false } : item
    );
    await syncItems(updated);
  }, [items, syncItems]);

  // Update specific item
  const updateItem = useCallback(async (id: string, updates: Partial<StoreMediaItem>) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    await syncItems(updated);
  }, [items, syncItems]);

  // Add new visual item
  const addItem = useCallback(async (newItem: StoreMediaItem) => {
    const updated = [...items, { ...newItem, is_active: newItem.is_active !== false }];
    await syncItems(updated);
  }, [items, syncItems]);

  // Delete item
  const deleteItem = useCallback(async (id: string) => {
    const updated = items.filter(item => item.id !== id);
    await syncItems(updated);
  }, [items, syncItems]);

  // Reset to default permanent 6 items
  const resetToDefaults = useCallback(async () => {
    await syncItems(STORE_MEDIA_ITEMS);
  }, [syncItems]);

  // Active items for frontend customers
  const activeItems = items.filter(item => item.is_active !== false);

  return {
    items,
    activeItems,
    isLoading,
    error,
    toggleActive,
    updateItem,
    addItem,
    deleteItem,
    resetToDefaults,
    syncItems,
  };
}
