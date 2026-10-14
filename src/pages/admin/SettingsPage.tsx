import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { exportFullDatabaseSnapshotJSON } from '../../lib/backupPipeline';
import { AdminFormSkeleton } from '../../components/common';
import type { DeliverySettings } from '../../types/delivery';
import './SettingsPage.css';

const DEFAULT_SETTINGS: DeliverySettings = {
  id: 'default',
  rules_text: (import.meta.env.VITE_DELIVERY_RULES_TEXT as string) || 'Doorstep grocery delivery across Jabalpur. Free delivery on orders above ₹500.',
  flat_fee: Number(import.meta.env.VITE_DEFAULT_FLAT_FEE) || 30,
  free_delivery_threshold: Number(import.meta.env.VITE_DEFAULT_FREE_THRESHOLD) || 500,
  is_active: true
};

export function SettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const pageTitle = 'Store Settings | Sai Darshan Shopping Mart Admin';

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
            free_delivery_threshold: settings.free_delivery_threshold,
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
            free_delivery_threshold: settings.free_delivery_threshold,
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
        <div className="admin-table-container admin-settings-container">
          <form id="settings-form" onSubmit={handleSave} className="admin-settings-form">
            <h2 className="typescale-title-large">Delivery Configuration</h2>
            
            <div className="admin-form-group">
              <label className="admin-form-group__label">Delivery Rules / Information Text</label>
              <textarea
                value={settings?.rules_text || ''}
                onChange={(e) => setSettings(s => ({ ...s, rules_text: e.target.value }))}
                placeholder="e.g. Free delivery within 5km for orders above ₹500."
                rows={4}
                className="admin-form-group__textarea"
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-group__label">Flat Delivery Fee (₹)</label>
              <input
                type="number"
                value={settings?.flat_fee?.toString() || '0'}
                onChange={(e) => setSettings(s => ({ ...s, flat_fee: parseFloat(e.target.value) || 0 }))}
                className="admin-form-group__input"
                required
              />
              <p className="admin-form-group__hint">
                Charged to customer when order is below free delivery threshold. Set to 0 for free delivery on all orders.
              </p>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-group__label">Free Delivery Threshold (₹)</label>
              <input
                type="number"
                value={settings?.free_delivery_threshold?.toString() || '0'}
                onChange={(e) => setSettings(s => ({ ...s, free_delivery_threshold: parseFloat(e.target.value) || 0 }))}
                placeholder="500"
                className="admin-form-group__input"
              />
              <p className="admin-form-group__hint">
                Orders above this subtotal get 100% FREE Delivery automatically (e.g. ₹500).
              </p>
            </div>

            <div className="admin-settings-actions">
              <button type="submit" className="sdm-btn sdm-btn--primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          <hr className="admin-settings-divider" />

          <div className="admin-form-group">
            <h2 className="typescale-title-large">Database Connection &amp; Backups</h2>
            <div className={`admin-db-status ${isSupabaseConfigured ? 'admin-db-status--connected' : 'admin-db-status--disconnected'}`}>
              <span className="material-symbols-outlined admin-db-status__icon">
                {isSupabaseConfigured ? 'check_circle' : 'warning'}
              </span>
              <div className="admin-db-status__content">
                <strong>{isSupabaseConfigured ? 'Connected to Supabase' : 'Supabase Not Configured'}</strong>
                <p className="admin-db-status__desc">
                  {isSupabaseConfigured 
                    ? 'Products, categories, and orders are live and stored in your private database.'
                    : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect your database.'}
                </p>
              </div>
            </div>

            {isSupabaseConfigured && (
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={async () => {
                    setIsExporting(true);
                    try {
                      await exportFullDatabaseSnapshotJSON();
                    } catch (err) {
                      console.error('Backup snapshot error:', err);
                      alert('Failed to generate snapshot');
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  className="sdm-btn sdm-btn--outlined"
                  title="Generate a full offline JSON disaster recovery snapshot of all store tables"
                >
                  <span className="material-symbols-outlined">
                    {isExporting ? 'hourglass_top' : 'cloud_download'}
                  </span>
                  <span>{isExporting ? 'Generating Snapshot...' : 'Backup Full Database Snapshot (.json)'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
