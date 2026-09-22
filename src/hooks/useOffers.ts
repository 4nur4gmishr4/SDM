import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Offer } from '../types/offer';

export function useOffers(options = { fetchAll: false }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchOffers() {
      try {
        setIsLoading(true);
        let query = supabase.from('offers').select('*').order('sort_order', { ascending: true });
        
        if (!options.fetchAll) {
          query = query.eq('is_active', true);
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        
        if (mounted && data) {
          setOffers(data as Offer[]);
        }
      } catch (err: any) {
        console.error('Error fetching offers:', err);
        if (mounted) setError(err.message || 'Failed to fetch offers');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchOffers();

    return () => {
      mounted = false;
    };
  }, []); // Omitting options.fetchAll for simplicity in mock

  return { offers, isLoading, error };
}
