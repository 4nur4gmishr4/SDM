import { supabase, isSupabaseConfigured, withTimeout } from './supabase';

export interface TrafficAnalyticsData {
  total_page_views: number;
  daily_visitors: Record<string, number>;
  daily_views: Record<string, number>;
  page_breakdown: Record<string, number>;
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  last_updated: string;
}

const STORAGE_KEY_VISITOR = 'sdm_visitor_id';
const STORAGE_KEY_LAST_VISIT = 'sdm_last_visit_date';
const STORAGE_KEY_LOCAL_BUFFER = 'sdm_analytics_local_buffer';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 600) return 'mobile';
  if (width < 960) return 'tablet';
  return 'desktop';
}

function getOrCreateVisitorId(): { id: string; isNewToday: boolean } {
  if (typeof window === 'undefined') {
    return { id: 'ssr-visitor', isNewToday: false };
  }

  let visitorId = localStorage.getItem(STORAGE_KEY_VISITOR);
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    try {
      localStorage.setItem(STORAGE_KEY_VISITOR, visitorId);
    } catch {
      // storage unavailable
    }
  }

  const today = getTodayString();
  const lastVisit = localStorage.getItem(STORAGE_KEY_LAST_VISIT);
  const isNewToday = lastVisit !== today;

  if (isNewToday) {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_VISIT, today);
    } catch {
      // storage unavailable
    }
  }

  return { id: visitorId, isNewToday };
}

let syncTimeout: any = null;

/**
 * Tracks a page view and updates traffic metrics in Supabase store_settings.
 * Debounced and silent to avoid impacting page performance.
 */
export function trackPageView(pathname: string): void {
  if (typeof window === 'undefined') return;

  // Ignore admin routes from customer traffic metrics
  if (pathname.startsWith('/admin')) return;

  const device = getDeviceType();
  const { isNewToday } = getOrCreateVisitorId();

  // Buffer event in localStorage
  let buffer: { views: number; newVisitors: number; path: string; device: string } = {
    views: 1,
    newVisitors: isNewToday ? 1 : 0,
    path: pathname || '/',
    device
  };

  try {
    const existing = localStorage.getItem(STORAGE_KEY_LOCAL_BUFFER);
    if (existing) {
      const parsed = JSON.parse(existing);
      buffer.views += parsed.views || 0;
      buffer.newVisitors += parsed.newVisitors || 0;
    }
    localStorage.setItem(STORAGE_KEY_LOCAL_BUFFER, JSON.stringify(buffer));
  } catch {
    // storage fallback
  }

  // Debounced push to Supabase
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncTrafficToServer(pathname, isNewToday, device);
  }, 2500);
}

async function syncTrafficToServer(pathname: string, isNewToday: boolean, device: 'mobile' | 'tablet' | 'desktop') {
  if (!isSupabaseConfigured) return;

  try {
    const normPath = pathname.split('?')[0] || '/';

    // 1. Primary: Try calling secure Postgres RPC (works under strict RLS without table write privileges)
    try {
      const { error: rpcErr } = await withTimeout(
        supabase.rpc('record_page_view', {
          p_path: normPath,
          p_is_new: isNewToday,
          p_device: device
        }),
        3000
      );
      if (!rpcErr) {
        localStorage.removeItem(STORAGE_KEY_LOCAL_BUFFER);
        return;
      }
    } catch {
      // RPC not yet deployed in database, proceed with fallback
    }

    // 2. Fallback: Direct row update
    const { data, error } = await withTimeout(
      supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'site_analytics_traffic')
        .single(),
      4000
    );

    if (error && error.code !== 'PGRST116') return;

    let traffic: TrafficAnalyticsData;
    if (data?.value) {
      try {
        traffic = JSON.parse(data.value);
      } catch {
        traffic = createDefaultTrafficData();
      }
    } else {
      traffic = createDefaultTrafficData();
    }

    const today = getTodayString();

    // Increment page views
    traffic.total_page_views = (traffic.total_page_views || 0) + 1;

    // Daily views
    if (!traffic.daily_views) traffic.daily_views = {};
    traffic.daily_views[today] = (traffic.daily_views[today] || 0) + 1;

    // Daily visitors
    if (!traffic.daily_visitors) traffic.daily_visitors = {};
    if (isNewToday) {
      traffic.daily_visitors[today] = (traffic.daily_visitors[today] || 0) + 1;
    } else if (!traffic.daily_visitors[today]) {
      traffic.daily_visitors[today] = 1;
    }

    // Page breakdown
    if (!traffic.page_breakdown) traffic.page_breakdown = {};
    traffic.page_breakdown[normPath] = (traffic.page_breakdown[normPath] || 0) + 1;

    // Devices
    if (!traffic.devices) traffic.devices = { mobile: 0, desktop: 0, tablet: 0 };
    traffic.devices[device] = (traffic.devices[device] || 0) + 1;

    traffic.last_updated = new Date().toISOString();

    // Update in Supabase
    await withTimeout(
      supabase
        .from('store_settings')
        .update({ value: JSON.stringify(traffic) })
        .eq('key', 'site_analytics_traffic'),
      4000
    );

    // Clear local buffer upon successful sync
    localStorage.removeItem(STORAGE_KEY_LOCAL_BUFFER);
  } catch (err) {
    // Non-fatal telemetry fail
    console.debug('Traffic sync queued for next navigation:', err);
  }
}

function createDefaultTrafficData(): TrafficAnalyticsData {
  return {
    total_page_views: 0,
    daily_visitors: {},
    daily_views: {},
    page_breakdown: {},
    devices: { mobile: 0, desktop: 0, tablet: 0 },
    last_updated: new Date().toISOString()
  };
}

/**
 * Fetches traffic metrics for the Admin Analytics dashboard.
 */
export async function fetchTrafficAnalytics(): Promise<TrafficAnalyticsData> {
  if (!isSupabaseConfigured) {
    return createDefaultTrafficData();
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'site_analytics_traffic')
        .single(),
      5000
    );

    if (error) throw error;
    if (data?.value) {
      return JSON.parse(data.value);
    }
  } catch (err) {
    console.error('Error fetching traffic analytics:', err);
  }

  return createDefaultTrafficData();
}
