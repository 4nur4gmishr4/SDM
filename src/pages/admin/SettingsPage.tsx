import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { AdminFormSkeleton } from '../../components/common';
import type { DeliverySettings } from '../../types/delivery';

const DEFAULT_SETTINGS: DeliverySettings = {
  id: 'default',
  rules_text: 'Doorstep grocery delivery across Jabalpur. Free delivery on orders above ₹500.',
  flat_fee: 30,
  free_delivery_threshold: 500,
  is_active: true
};

export function SettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pageTitle = 'Store Settings — Sai Darshan Mart Admin';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const fetchSettings = async () => {
    if (!isSupabaseConfigured) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await withTimeout(
        supabase
          .from('delivery_settings')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .single(),
        5000
      );

      const { data, error } = response as any;
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings(data as DeliverySettings);
      }
    } catch (error) {
      console.warn('Error fetching settings, using defaults:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setIsSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('delivery_settings')
          .update({
            rules_text: settings.rules_text,
            flat_fee: settings.flat_fee,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('delivery_settings')
          .insert([{
            rules_text: settings.rules_text,
            flat_fee: settings.flat_fee,
            is_active: true
          }]);
        if (error) throw error;
      }
      
      alert('Settings saved successfully.');
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-layout-content admin-products-page">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <div className="admin-products-header">
        <h1 className="admin-products-title">Store Settings</h1>
      </div>

      {isLoading ? (
        <AdminFormSkeleton />
      ) : (
        <div className="admin-table-container" style={{ padding: '24px', maxWidth: '600px', flex: 'none' }}>
          <form id="settings-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 className="typescale-title-large">Delivery Configuration</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: 'var(--md-sys-typescale-label-large-size)' }}>Delivery Rules / Information Text</label>
              <textarea
                value={settings?.rules_text || ''}
                onChange={(e) => setSettings(s => ({ ...s, rules_text: e.target.value }))}
                placeholder="e.g. Free delivery within 5km for orders above ₹500."
                rows={4}
                style={{
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid var(--md-sys-color-outline)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: 'var(--md-sys-typescale-label-large-size)' }}>Flat Delivery Fee (₹)</label>
              <input
                type="number"
                value={settings?.flat_fee?.toString() || '0'}
                onChange={(e) => setSettings(s => ({ ...s, flat_fee: parseFloat(e.target.value) || 0 }))}
                style={{
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid var(--md-sys-color-outline)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  width: '200px'
                }}
                required
              />
              <p style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Set to 0 for free delivery.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '16px' }}>
              <button type="submit" className="sdm-btn sdm-btn--primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          <hr style={{ margin: '32px 0', borderColor: 'var(--md-sys-color-outline-variant)', opacity: 0.5 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 className="typescale-title-large">Database Connection</h2>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: isSupabaseConfigured ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-error-container)',
              color: isSupabaseConfigured ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-error-container)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                {isSupabaseConfigured ? 'check_circle' : 'warning'}
              </span>
              <div>
                <strong>{isSupabaseConfigured ? 'Connected to Supabase' : 'Supabase Not Configured'}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  {isSupabaseConfigured 
                    ? 'Products, categories, and orders are live and stored in your private database.'
                    : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect your database.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
