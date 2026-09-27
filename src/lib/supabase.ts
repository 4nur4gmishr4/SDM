import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.info(
    'Supabase credentials not configured or using placeholders. Using instant local testing catalog.'
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);

export const SUPABASE_BASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://otyojqnnwbrteknyqcpi.supabase.co';
export const SUPABASE_STORAGE_URL = `${SUPABASE_BASE_URL}/storage/v1/object/public`;
export const SUPABASE_STORE_MEDIA_BASE = `${SUPABASE_STORAGE_URL}/store-media/store/`;
export const SUPABASE_BANNERS_MEDIA_BASE = `${SUPABASE_STORAGE_URL}/store-media/banners/`;

/**
 * Executes a promise with an automatic timeout fallback
 * Prevents requests from hanging on cold starts or unstable networks.
 */
export async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 2000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase request timed out')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

