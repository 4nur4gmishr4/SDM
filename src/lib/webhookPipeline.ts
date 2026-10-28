import { supabase, isSupabaseConfigured, withTimeout } from './supabase';

export interface PipelineAutomationConfig {
  webhook_enabled: boolean;
  webhook_url: string;
  auto_backup_enabled: boolean;
  last_backup_at: string | null;
  github_repo: string;
  updated_at: string;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineAutomationConfig = {
  webhook_enabled: false,
  webhook_url: '',
  auto_backup_enabled: true,
  last_backup_at: null,
  github_repo: (import.meta.env.VITE_GITHUB_REPO as string) || 'amit-saidarshan/SaiDarshanMart',
  updated_at: new Date().toISOString()
};

/**
 * Fetches the current pipeline and webhook automation configuration
 */
export async function getPipelineConfig(): Promise<PipelineAutomationConfig> {
  if (!isSupabaseConfigured) return DEFAULT_PIPELINE_CONFIG;

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'pipeline_automation_config')
        .single(),
      4000
    );

    if (error && error.code !== 'PGRST116') return DEFAULT_PIPELINE_CONFIG;
    if (data?.value) {
      return JSON.parse(data.value);
    }
  } catch (err) {
    console.error('Error fetching pipeline config:', err);
  }

  return DEFAULT_PIPELINE_CONFIG;
}

/**
 * Saves pipeline automation configuration to Supabase store_settings
 */
export async function savePipelineConfig(config: Partial<PipelineAutomationConfig>): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    if (config.webhook_url && config.webhook_url.trim()) {
      const trimmed = config.webhook_url.trim();
      if (!trimmed.startsWith('https://')) {
        throw new Error('Webhook URL must use secure HTTPS protocol (https://)');
      }
    }

    const current = await getPipelineConfig();
    const updated: PipelineAutomationConfig = {
      ...current,
      ...config,
      updated_at: new Date().toISOString()
    };

    const { error } = await withTimeout(
      supabase
        .from('store_settings')
        .update({ value: JSON.stringify(updated) })
        .eq('key', 'pipeline_automation_config'),
      5000
    );

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error saving pipeline config:', err);
    return false;
  }
}

/**
 * Dispatches an automated outbound webhook when a new order is received
 */
export async function dispatchOrderWebhook(order: {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  map_link?: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: Array<{ name: string; quantity: number; price: number; unit_size?: string }>;
  is_quick_order?: boolean;
  quick_order_text?: string | null;
}): Promise<boolean> {
  try {
    const config = await getPipelineConfig();
    const targetUrl = config.webhook_url?.trim();
    if (!config.webhook_enabled || !targetUrl || !targetUrl.startsWith('https://')) {
      return false;
    }

    const payload = {
      event: 'order.created',
      timestamp: new Date().toISOString(),
      store: 'Sai Darshan Shopping Mart, Jabalpur',
      order: {
        id: order.id,
        type: order.is_quick_order ? 'quick_order' : 'standard_cart',
        customer: {
          name: order.customer_name,
          phone: order.customer_phone,
          address: order.delivery_address,
          map_link: order.map_link || null
        },
        financials: {
          subtotal: order.subtotal,
          delivery_fee: order.delivery_fee,
          total_payable: order.total
        },
        items_count: order.items?.length || 0,
        items: order.items,
        quick_order_notes: order.quick_order_text || null
      }
    };

    // Non-blocking fetch
    fetch(config.webhook_url.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Store-Identifier': 'sai-darshan-mart-jabalpur'
      },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn('Webhook dispatch network error (non-fatal):', err);
    });

    return true;
  } catch (err) {
    console.warn('Failed to process webhook pipeline:', err);
    return false;
  }
}

/**
 * Tests the webhook endpoint with a simulated payload
 */
export async function testWebhookEndpoint(targetUrl: string): Promise<{ success: boolean; message: string }> {
  if (!targetUrl.trim().startsWith('http://') && !targetUrl.trim().startsWith('https://')) {
    return { success: false, message: 'Invalid URL. Must begin with http:// or https://' };
  }

  try {
    const testPayload = {
      event: 'pipeline.health_check',
      timestamp: new Date().toISOString(),
      store: 'Sai Darshan Shopping Mart (Test Ping)',
      message: 'Automated test ping from Sai Darshan Shopping Mart Admin Pipeline Suite.',
      sample_order: {
        id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
        customer_name: 'Test Customer',
        phone: '+91 99999 99999',
        total: 450,
        status: 'pending'
      }
    };

    const res = await fetch(targetUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Store-Identifier': 'sai-darshan-mart-test'
      },
      body: JSON.stringify(testPayload),
      mode: 'no-cors' // Allows test dispatch across Discord, Slack, Zapier without CORS errors
    });

    return {
      success: true,
      message: `Test ping dispatched successfully to ${new URL(targetUrl).hostname} (Status: ${res.status || 'Dispatched'})`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error while attempting to reach webhook URL'
    };
  }
}

