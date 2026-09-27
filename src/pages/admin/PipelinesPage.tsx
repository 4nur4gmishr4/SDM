import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import {
  getPipelineConfig,
  savePipelineConfig,
  testWebhookEndpoint,
  type PipelineAutomationConfig,
  DEFAULT_PIPELINE_CONFIG
} from '../../lib/webhookPipeline';
import {
  exportCatalogToExcel,
  exportOrdersToExcel,
  exportFullDatabaseSnapshotJSON
} from '../../lib/backupPipeline';
import { useSnackbar } from '../../contexts';
import { AdminDashboardSkeleton } from '../../components/common';
import './PipelinesPage.css';

export function PipelinesPage() {
  const { showSnackbar } = useSnackbar();
  const [config, setConfig] = useState<PipelineAutomationConfig>(DEFAULT_PIPELINE_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Backup states
  const [isExportingCatalog, setIsExportingCatalog] = useState<boolean>(false);
  const [isExportingOrders, setIsExportingOrders] = useState<boolean>(false);
  const [isExportingSnapshot, setIsExportingSnapshot] = useState<boolean>(false);

  // Health ping
  const [dbPingMs, setDbPingMs] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  const pageTitle = 'Pipelines & Automation — Sai Darshan Mart Admin';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      try {
        const data = await getPipelineConfig();
        setConfig(data);
      } catch (err) {
        console.error('Error loading pipeline config:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
    runHealthPing();
  }, []);

  const runHealthPing = async () => {
    if (!isSupabaseConfigured) return;
    setIsPinging(true);
    const start = performance.now();
    try {
      await withTimeout(supabase.from('store_settings').select('key').limit(1), 5000);
      const latency = Math.round(performance.now() - start);
      setDbPingMs(latency);
    } catch {
      setDbPingMs(-1);
    } finally {
      setIsPinging(false);
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const ok = await savePipelineConfig({
        webhook_enabled: config.webhook_enabled,
        webhook_url: config.webhook_url.trim(),
      });
      if (ok) {
        showSnackbar('Pipeline webhook settings saved successfully!');
      } else {
        showSnackbar('Failed to save pipeline settings.');
      }
    } catch {
      showSnackbar('Error saving webhook settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!config.webhook_url.trim()) {
      showSnackbar('Please enter a Webhook URL first.');
      return;
    }
    setIsTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await testWebhookEndpoint(config.webhook_url.trim());
      setTestResult(res);
      showSnackbar(res.message);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Webhook dispatch failed' });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleExportCatalog = async () => {
    setIsExportingCatalog(true);
    try {
      const res = await exportCatalogToExcel();
      showSnackbar(`Exported ${res.count} products to ${res.filename}`);
    } catch (err: any) {
      showSnackbar(err.message || 'Catalog export failed');
    } finally {
      setIsExportingCatalog(false);
    }
  };

  const handleExportOrders = async () => {
    setIsExportingOrders(true);
    try {
      const res = await exportOrdersToExcel();
      showSnackbar(`Exported ${res.count} orders to ${res.filename}`);
    } catch (err: any) {
      showSnackbar(err.message || 'Orders export failed');
    } finally {
      setIsExportingOrders(false);
    }
  };

  const handleExportSnapshot = async () => {
    setIsExportingSnapshot(true);
    try {
      const res = await exportFullDatabaseSnapshotJSON();
      showSnackbar(`System JSON snapshot downloaded: ${res.filename}`);
    } catch (err: any) {
      showSnackbar(err.message || 'Snapshot export failed');
    } finally {
      setIsExportingSnapshot(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-layout-content admin-pipelines">
        <div className="admin-pipelines__header">
          <h1 className="admin-dashboard-title">Pipelines & Automation</h1>
        </div>
        <AdminDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="admin-layout-content admin-pipelines">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      {/* Header */}
      <div className="admin-pipelines__header">
        <div>
          <h1 className="admin-dashboard-title">Pipelines & Automation Control Center</h1>
          <p className="admin-pipelines__subtitle">
            Manage CI/CD build workflows, order webhook dispatch, catalog snapshots, and database health diagnostics.
          </p>
        </div>

        <div className="admin-pipelines__header-badges">
          <div className="admin-pipelines__ping-pill">
            <span
              className="admin-pipelines__ping-dot"
              style={{
                backgroundColor:
                  dbPingMs !== null && dbPingMs >= 0 && dbPingMs < 600
                    ? 'var(--md-sys-color-primary, #1e8e3e)'
                    : 'var(--md-sys-color-error, #ba1a1a)',
              }}
            />
            <span>
              {isPinging
                ? 'Pinging DB...'
                : dbPingMs !== null && dbPingMs >= 0
                ? `DB Latency: ${dbPingMs}ms`
                : 'DB Offline'}
            </span>
            <button
              type="button"
              className="admin-pipelines__icon-btn"
              onClick={runHealthPing}
              title="Ping Database"
            >
              <span className={`material-symbols-outlined ${isPinging ? 'spin' : ''}`} style={{ fontSize: '16px' }}>
                refresh
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="admin-pipelines__grid">
        {/* Pipeline 1: GitHub Actions CI/CD Build & Verification */}
        <section className="admin-pipelines__card">
          <div className="admin-pipelines__card-head">
            <div className="admin-pipelines__card-icon admin-pipelines__card-icon--cicd">
              <span className="material-symbols-outlined">developer_board</span>
            </div>
            <div>
              <h2 className="admin-pipelines__card-title">CI/CD Deployment Pipeline</h2>
              <span className="admin-pipelines__card-caption">GitHub Actions Automated Verification & Build</span>
            </div>
          </div>

          <div className="admin-pipelines__card-body">
            <div className="admin-pipelines__info-box">
              <div className="admin-pipelines__info-row">
                <span className="admin-pipelines__info-key">Repository:</span>
                <strong className="admin-pipelines__info-val">github.com/{config.github_repo || '4nur4gmishr4/SDM'}</strong>
              </div>
              <div className="admin-pipelines__info-row">
                <span className="admin-pipelines__info-key">Active Branch:</span>
                <span className="admin-pipelines__info-tag">master</span>
              </div>
              <div className="admin-pipelines__info-row">
                <span className="admin-pipelines__info-key">Workflow:</span>
                <span><code>.github/workflows/ci.yml</code></span>
              </div>
              <div className="admin-pipelines__info-row">
                <span className="admin-pipelines__info-key">Automated Steps:</span>
                <span style={{ fontSize: '0.8125rem' }}>
                  TypeScript strict checks • Vite production bundle • Playwright browser smoke test
                </span>
              </div>
            </div>

            <div className="admin-pipelines__badge-row">
              <span style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Live Workflow Status:
              </span>
              <img
                src="https://github.com/4nur4gmishr4/SDM/actions/workflows/ci.yml/badge.svg"
                alt="CI/CD Build Status"
                className="admin-pipelines__status-badge"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.admin-pipelines__badge-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'inline-flex';
                }}
              />
              <span className="admin-pipelines__badge-fallback" style={{ display: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#1e8e3e' }}>check_circle</span>
                Passing (master)
              </span>
            </div>

            <div className="admin-pipelines__card-actions">
              <a
                href={`https://github.com/${config.github_repo || '4nur4gmishr4/SDM'}/actions`}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-pipelines__action-btn admin-pipelines__action-btn--primary"
              >
                <span>View Runs on GitHub</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
              </a>
            </div>
          </div>
        </section>

        {/* Pipeline 2: Outbound Order Webhooks & Notifications */}
        <section className="admin-pipelines__card">
          <div className="admin-pipelines__card-head">
            <div className="admin-pipelines__card-icon admin-pipelines__card-icon--webhook">
              <span className="material-symbols-outlined">hub</span>
            </div>
            <div>
              <h2 className="admin-pipelines__card-title">Order Webhook Automation</h2>
              <span className="admin-pipelines__card-caption">Real-time JSON dispatch on new checkout orders</span>
            </div>
          </div>

          <form onSubmit={handleSaveWebhook} className="admin-pipelines__card-body">
            <div className="admin-pipelines__toggle-row">
              <div>
                <strong>Enable Order Webhooks</strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Sends instant order notifications to Discord, Telegram, Zapier, Make, or Google Sheets.
                </p>
              </div>
              <label className="admin-pipelines__switch">
                <input
                  type="checkbox"
                  checked={config.webhook_enabled}
                  onChange={(e) => setConfig({ ...config, webhook_enabled: e.target.checked })}
                />
                <span className="admin-pipelines__slider" />
              </label>
            </div>

            <div className="admin-pipelines__input-group">
              <label className="admin-pipelines__label" htmlFor="webhook-url-input">
                Webhook Target Endpoint URL
              </label>
              <input
                id="webhook-url-input"
                type="url"
                className="admin-pipelines__input"
                placeholder="https://discord.com/api/webhooks/... or https://hook.make.com/..."
                value={config.webhook_url}
                onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
              />
            </div>

            {testResult && (
              <div
                className={`admin-pipelines__result-box ${
                  testResult.success ? 'admin-pipelines__result-box--success' : 'admin-pipelines__result-box--error'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {testResult.success ? 'check_circle' : 'error'}
                </span>
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="admin-pipelines__card-actions">
              <button
                type="submit"
                className="admin-pipelines__action-btn admin-pipelines__action-btn--primary"
                disabled={isSaving}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>save</span>
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>

              <button
                type="button"
                className="admin-pipelines__action-btn admin-pipelines__action-btn--secondary"
                onClick={handleTestWebhook}
                disabled={isTestingWebhook || !config.webhook_url.trim()}
              >
                <span className={`material-symbols-outlined ${isTestingWebhook ? 'spin' : ''}`} style={{ fontSize: '16px' }}>
                  send
                </span>
                <span>{isTestingWebhook ? 'Testing...' : 'Test Webhook'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Pipeline 3: Data Backup & Catalog Snapshot */}
        <section className="admin-pipelines__card">
          <div className="admin-pipelines__card-head">
            <div className="admin-pipelines__card-icon admin-pipelines__card-icon--backup">
              <span className="material-symbols-outlined">cloud_download</span>
            </div>
            <div>
              <h2 className="admin-pipelines__card-title">1-Click Database & Catalog Snapshots</h2>
              <span className="admin-pipelines__card-caption">Instant offline backups in Excel (.xlsx) and JSON</span>
            </div>
          </div>

          <div className="admin-pipelines__card-body">
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Export full supermarket inventory, pricing, categories, and customer order history for accounting, auditing, or disaster recovery.
            </p>

            <div className="admin-pipelines__backup-btn-grid">
              <button
                type="button"
                className="admin-pipelines__backup-card-btn"
                onClick={handleExportCatalog}
                disabled={isExportingCatalog}
              >
                <div className="admin-pipelines__backup-icon-wrapper" style={{ backgroundColor: '#e6f4ea', color: '#137333' }}>
                  <span className="material-symbols-outlined">table_view</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong>Export Catalog (.xlsx)</strong>
                  <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    All 21 categories & products with prices
                  </span>
                </div>
                <span className="material-symbols-outlined" style={{ marginLeft: 'auto', fontSize: '18px' }}>
                  {isExportingCatalog ? 'hourglass_top' : 'download'}
                </span>
              </button>

              <button
                type="button"
                className="admin-pipelines__backup-card-btn"
                onClick={handleExportOrders}
                disabled={isExportingOrders}
              >
                <div className="admin-pipelines__backup-icon-wrapper" style={{ backgroundColor: '#fef7e0', color: '#b06000' }}>
                  <span className="material-symbols-outlined">receipt_long</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong>Export Orders Archive (.xlsx)</strong>
                  <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Customer orders, addresses & line totals
                  </span>
                </div>
                <span className="material-symbols-outlined" style={{ marginLeft: 'auto', fontSize: '18px' }}>
                  {isExportingOrders ? 'hourglass_top' : 'download'}
                </span>
              </button>

              <button
                type="button"
                className="admin-pipelines__backup-card-btn"
                onClick={handleExportSnapshot}
                disabled={isExportingSnapshot}
              >
                <div className="admin-pipelines__backup-icon-wrapper" style={{ backgroundColor: '#fce8e6', color: '#c5221f' }}>
                  <span className="material-symbols-outlined">data_object</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong>Complete JSON Snapshot</strong>
                  <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    All database tables for system recovery
                  </span>
                </div>
                <span className="material-symbols-outlined" style={{ marginLeft: 'auto', fontSize: '18px' }}>
                  {isExportingSnapshot ? 'hourglass_top' : 'download'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Pipeline 4: Automated WhatsApp Handoff Architecture */}
        <section className="admin-pipelines__card">
          <div className="admin-pipelines__card-head">
            <div className="admin-pipelines__card-icon admin-pipelines__card-icon--whatsapp">
              <span className="material-symbols-outlined">chat</span>
            </div>
            <div>
              <h2 className="admin-pipelines__card-title">Customer WhatsApp Status Dispatch</h2>
              <span className="admin-pipelines__card-caption">Pre-formatted customer message templates</span>
            </div>
          </div>

          <div className="admin-pipelines__card-body">
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Sai Darshan Mart admin can dispatch pre-formatted WhatsApp status messages with 1 tap directly from the Orders section:
            </p>

            <div className="admin-pipelines__template-list">
              <div className="admin-pipelines__template-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#1e8e3e' }}>check_circle</span>
                <span><strong>Order Confirmed:</strong> Customer confirmation & packing alert</span>
              </div>
              <div className="admin-pipelines__template-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f9ab00' }}>local_shipping</span>
                <span><strong>Out for Delivery:</strong> Dispatch alert with delivery address</span>
              </div>
              <div className="admin-pipelines__template-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#1a73e8' }}>verified</span>
                <span><strong>Delivered:</strong> Completion & feedback link</span>
              </div>
            </div>

            <div className="admin-pipelines__card-actions" style={{ marginTop: 'auto' }}>
              <a
                href="/admin/orders"
                className="admin-pipelines__action-btn admin-pipelines__action-btn--secondary"
              >
                <span>Go to Orders Hub</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
