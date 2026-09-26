import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { AdminTableSkeleton } from '../../components/common';
import type { Banner, DefaultLogoBannerConfig } from '../../types/banner';
import { useStoreMedia } from '../../hooks/useStoreMedia';
import { useDefaultLogoBanner } from '../../hooks/useDefaultLogoBanner';
import type { StoreMediaItem } from '../../data/storeMedia';
import { ImageUploadField } from '../../components/admin/ImageUploadField';
import './OrdersPage.css';
import './ProductsPage.css';
import './BannersPage.css';

const SUPABASE_STORE_MEDIA_BASE = 'https://otyojqnnwbrteknyqcpi.supabase.co/storage/v1/object/public/store-media/store/';

// Preset Authentic Store Photography to pick with 1 click
const PRESET_STORE_PHOTOS = [
  { label: 'Billing Counter', url: `${SUPABASE_STORE_MEDIA_BASE}img_0604.jpg` },
  { label: 'Snacks & Steel Bartan', url: `${SUPABASE_STORE_MEDIA_BASE}img_0525.jpg` },
  { label: 'Dry Fruits & Masale', url: `${SUPABASE_STORE_MEDIA_BASE}img_9084.jpg` },
  { label: 'Daily Rashan Staples', url: `${SUPABASE_STORE_MEDIA_BASE}img_2552.jpg` },
  { label: 'Personal Care Hygiene', url: `${SUPABASE_STORE_MEDIA_BASE}8f4f810f-f26c-4c1d-84e8-d91f62f37615.jpg` },
];

export function BannersPage() {
  const [activeTab, setActiveTab] = useState<'banners' | 'store_visuals'>('banners');

  // ----------------------------------------------------
  // Home Promotional Banners State
  // ----------------------------------------------------
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  // ----------------------------------------------------
  // Default Store Logo Banner (Fallback) State
  // ----------------------------------------------------
  const {
    logoBanner,
    updateLogoBanner,
  } = useDefaultLogoBanner();

  const [isEditingLogoBanner, setIsEditingLogoBanner] = useState(false);
  const [logoBannerForm, setLogoBannerForm] = useState<DefaultLogoBannerConfig>(logoBanner);
  const [isSavingLogoBanner, setIsSavingLogoBanner] = useState(false);

  useEffect(() => {
    setLogoBannerForm(logoBanner);
  }, [logoBanner]);

  const handleToggleLogoBanner = async () => {
    try {
      await updateLogoBanner({
        ...logoBanner,
        is_enabled: !logoBanner.is_enabled,
      });
    } catch (e: any) {
      alert('Failed to update logo banner status: ' + e.message);
    }
  };

  const handleSaveLogoBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLogoBanner(true);
    try {
      await updateLogoBanner(logoBannerForm);
      setIsEditingLogoBanner(false);
      alert('Default Logo Banner updated successfully in database!');
    } catch (e: any) {
      alert('Failed to save logo banner: ' + e.message);
    } finally {
      setIsSavingLogoBanner(false);
    }
  };

  // ----------------------------------------------------
  // About Store Visuals Hook & State
  // ----------------------------------------------------
  const {
    items: storeVisuals,
    isLoading: isLoadingVisuals,
    toggleActive: toggleVisualActive,
    updateItem: updateVisualItem,
    addItem: addVisualItem,
    deleteItem: deleteVisualItem,
    resetToDefaults: resetVisualsToDefaults,
  } = useStoreMedia();

  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);
  const [editingVisual, setEditingVisual] = useState<Partial<StoreMediaItem> | null>(null);
  const [isSavingVisual, setIsSavingVisual] = useState(false);

  const pageTitle = 'Banners & Store Visuals — Sai Darshan Mart Admin';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const fetchBanners = async () => {
    if (!isSupabaseConfigured) {
      setBanners([]);
      setIsLoadingBanners(false);
      return;
    }

    setIsLoadingBanners(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('banners')
          .select('*')
          .order('display_order'),
        5000
      );

      if (error) throw error;
      setBanners((data as Banner[]) || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
    } finally {
      setIsLoadingBanners(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // ----------------------------------------------------
  // Banner Handlers
  // ----------------------------------------------------
  const handleOpenAddBanner = () => {
    setEditingBanner({
      title: '',
      text: '',
      image_url: `${SUPABASE_STORE_MEDIA_BASE}img_0604.jpg`,
      link_url: '/shop',
      display_order: banners.length + 1,
      is_active: true,
    });
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (banner: Banner) => {
    setEditingBanner({ ...banner });
    setIsBannerModalOpen(true);
  };

  const handleCloseBannerModal = () => {
    setIsBannerModalOpen(false);
    setEditingBanner(null);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    setIsSavingBanner(true);
    try {
      if (editingBanner.id) {
        const { error } = await supabase
          .from('banners')
          .update({
            ...editingBanner,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([editingBanner]);
        if (error) throw error;
      }

      await fetchBanners();
      handleCloseBannerModal();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner.');
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleToggleBannerActive = async (banner: Banner) => {
    try {
      const nextActive = !banner.is_active;
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: nextActive } : b))
      );

      const { error } = await supabase
        .from('banners')
        .update({ is_active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', banner.id);

      if (error) {
        console.error('Error toggling banner status:', error);
        await fetchBanners();
      }
    } catch (err) {
      console.error('Error toggling banner status:', err);
      await fetchBanners();
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      setBanners((prev) => prev.filter((b) => b.id !== bannerId));
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', bannerId);

      if (error) {
        console.error('Error deleting banner:', error);
        await fetchBanners();
      }
    } catch (err) {
      console.error('Error deleting banner:', err);
      await fetchBanners();
    }
  };

  // ----------------------------------------------------
  // About Store Visuals Handlers
  // ----------------------------------------------------
  const handleOpenAddVisual = () => {
    setEditingVisual({
      id: `visual-${Date.now()}`,
      type: 'image',
      url: `${SUPABASE_STORE_MEDIA_BASE}img_0604.jpg`,
      title: '',
      department: 'Store Aisle',
      badge: 'Store Feature',
      notes: '',
      is_active: true,
    });
    setIsVisualModalOpen(true);
  };

  const handleOpenEditVisual = (item: StoreMediaItem) => {
    setEditingVisual({ ...item });
    setIsVisualModalOpen(true);
  };

  const handleCloseVisualModal = () => {
    setIsVisualModalOpen(false);
    setEditingVisual(null);
  };

  const handleSaveVisual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisual || !editingVisual.title) return;

    setIsSavingVisual(true);
    try {
      const existing = storeVisuals.find((i) => i.id === editingVisual.id);
      if (existing) {
        await updateVisualItem(editingVisual.id!, editingVisual);
      } else {
        await addVisualItem(editingVisual as StoreMediaItem);
      }
      handleCloseVisualModal();
    } catch (err) {
      console.error('Error saving store visual:', err);
      alert('Failed to save store visual.');
    } finally {
      setIsSavingVisual(false);
    }
  };

  const handleDeleteVisual = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this visual? You can restore default permanent visuals anytime.')) {
      return;
    }
    await deleteVisualItem(id);
  };

  const handleResetVisuals = async () => {
    if (window.confirm('Reset all About Store visuals to the default 6 permanent items (5 authentic store photos + 1 soundless video tour)?')) {
      await resetVisualsToDefaults();
    }
  };

  const activeBannersCount = banners.filter((b) => b.is_active).length;
  const activeVisualsCount = storeVisuals.filter((v) => v.is_active !== false).length;

  return (
    <div className="admin-layout-content admin-products-page">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      {/* Page Header */}
      <div className="admin-products-header">
        <div>
          <h1 className="admin-products-title">Banners & Store Visuals</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Configure home promotional banners and authentic store aisle visuals for the About Store section.
          </p>
        </div>

        {activeTab === 'banners' ? (
          <button type="button" onClick={handleOpenAddBanner} className="sdm-btn sdm-btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            <span>Add Banner</span>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={handleResetVisuals} className="sdm-btn sdm-btn--outlined" title="Restore the 6 permanent authentic store items">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>restart_alt</span>
              <span>Restore 6 Permanent Items</span>
            </button>
            <button type="button" onClick={handleOpenAddVisual} className="sdm-btn sdm-btn--primary">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_photo_alternate</span>
              <span>Add Store Visual</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="admin-banners-tabs-container">
        <div className="admin-banners-tabs" role="tablist">
          <button
            type="button"
            className={`admin-banners-tab-btn ${activeTab === 'banners' ? 'active' : ''}`}
            onClick={() => setActiveTab('banners')}
            role="tab"
            aria-selected={activeTab === 'banners'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>view_carousel</span>
            <span>Home Screen Banners</span>
            <span className="admin-banners-tab-count">
              {activeBannersCount} / {banners.length} Active
            </span>
          </button>

          <button
            type="button"
            className={`admin-banners-tab-btn ${activeTab === 'store_visuals' ? 'active' : ''}`}
            onClick={() => setActiveTab('store_visuals')}
            role="tab"
            aria-selected={activeTab === 'store_visuals'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>storefront</span>
            <span>About Store Visuals & Aisles</span>
            <span className="admin-banners-tab-count">
              {activeVisualsCount} / {storeVisuals.length} Active
            </span>
          </button>
        </div>
      </div>

      {/* ==========================================================
          TAB 1: HOME SCREEN BANNERS
          ========================================================== */}
      {activeTab === 'banners' && (
        <>
          {/* Default Store Logo Banner (Fallback Widget) */}
          <div className="admin-logo-banner-widget">
            <div className="admin-logo-banner-widget__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(30, 142, 62, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--md-sys-color-primary)',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    storefront
                  </span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Default Store Logo Banner (Fallback)</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Jab home screen pe koi promotional banner nahi hoga ya sab disabled honge, tab ye logo banner display hoga.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleToggleLogoBanner}
                  className={`sdm-btn ${logoBanner.is_enabled ? 'sdm-btn--tonal' : 'sdm-btn--outlined'}`}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    fontSize: '12px',
                    borderColor: logoBanner.is_enabled ? 'transparent' : 'var(--md-sys-color-outline)',
                    color: logoBanner.is_enabled ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                  }}
                  title="Toggle Fallback Logo Banner visibility on/off"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {logoBanner.is_enabled ? 'check_circle' : 'do_not_disturb_on'}
                  </span>
                  <span>{logoBanner.is_enabled ? 'Logo Banner Active' : 'Logo Banner Disabled'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLogoBannerForm(logoBanner);
                    setIsEditingLogoBanner(!isEditingLogoBanner);
                  }}
                  className="sdm-btn sdm-btn--outlined"
                  style={{ height: '34px', padding: '0 14px', fontSize: '12px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {isEditingLogoBanner ? 'close' : 'edit'}
                  </span>
                  <span>{isEditingLogoBanner ? 'Cancel Edit' : 'Edit Logo Banner'}</span>
                </button>
              </div>
            </div>

            {/* Preview Strip */}
            {!isEditingLogoBanner && (
              <div className="admin-logo-banner-preview">
                <div className="admin-logo-banner-thumb">
                  <img
                    src={logoBanner.image_url}
                    alt={logoBanner.title}
                    onError={(e) => {
                      if (logoBanner.local_url && (e.target as HTMLImageElement).src !== logoBanner.local_url) {
                        (e.target as HTMLImageElement).src = logoBanner.local_url;
                      }
                    }}
                  />
                </div>
                <div className="admin-logo-banner-meta">
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--md-sys-color-on-surface)' }}>
                    {logoBanner.title || 'Sai Darshan Shopping Mart'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '3px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--md-sys-color-primary)' }}>Text below banner:</span>{' '}
                    {logoBanner.subtitle || 'None'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--md-sys-color-outline)', marginTop: '4px' }}>
                    Destination link: <code>{logoBanner.link_url || '/shop'}</code>
                  </div>
                </div>
              </div>
            )}

            {/* Inline Edit Form */}
            {isEditingLogoBanner && (
              <form onSubmit={handleSaveLogoBanner} className="admin-logo-banner-form">
                <div style={{ marginBottom: '16px' }}>
                  <ImageUploadField
                    label="Logo Banner Image"
                    value={logoBannerForm.image_url}
                    onChange={(url) => setLogoBannerForm({ ...logoBannerForm, image_url: url })}
                    helpText="Upload your official store logo banner (16:9 ratio, e.g. 1672x941 or 1920x1080)."
                  />
                </div>

                <div className="admin-modal-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Banner Title</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={logoBannerForm.title}
                      onChange={(e) => setLogoBannerForm({ ...logoBannerForm, title: e.target.value })}
                      placeholder="Sai Darshan Shopping Mart"
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Destination Link URL</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={logoBannerForm.link_url}
                      onChange={(e) => setLogoBannerForm({ ...logoBannerForm, link_url: e.target.value })}
                      placeholder="/shop"
                    />
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                  <label className="admin-label">
                    Text To Show Below Banner (Subtitle / Tagline)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={logoBannerForm.subtitle}
                    onChange={(e) => setLogoBannerForm({ ...logoBannerForm, subtitle: e.target.value })}
                    placeholder="Aapki Apni Supermarket • Sanjeevni Nagar Main Road, Jabalpur"
                  />
                  <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
                    Ye text home screen pe banner image ke theek neeche dikhega.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditingLogoBanner(false)}
                    className="sdm-btn sdm-btn--outlined"
                    disabled={isSavingLogoBanner}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="sdm-btn sdm-btn--primary"
                    disabled={isSavingLogoBanner}
                  >
                    {isSavingLogoBanner ? 'Saving to Database...' : 'Save Logo Banner'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section Divider & Header for Promotional Banners */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '28px 0 14px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Active Promotional Campaign Banners</h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Jab yaha 1 ya zyada promotional banners active honge, to home screen par unka auto-sliding carousel chalega.
              </p>
            </div>
            <button type="button" onClick={handleOpenAddBanner} className="sdm-btn sdm-btn--tonal" style={{ height: '36px', fontSize: '13px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              <span>Add Promotional Banner</span>
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Image</th>
                  <th>Title & Text Below Banner</th>
                  <th>Link Destination</th>
                  <th style={{ width: '80px' }}>Order</th>
                  <th style={{ width: '150px' }}>Status (Tap to Toggle)</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingBanners && banners.length === 0 ? (
                  <AdminTableSkeleton rows={4} cols={6} />
                ) : banners.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <div style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '14px' }}>
                        No banners configured. Currently <strong>no banner is shown on the home screen</strong>.
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddBanner}
                        className="sdm-btn sdm-btn--primary"
                        style={{ marginTop: '12px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        <span>Add Your First Banner</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner.id} style={{ opacity: banner.is_active ? 1 : 0.6 }}>
                      <td>
                        {banner.image_url ? (
                          <img
                            src={banner.image_url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: '90px',
                              height: '48px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid var(--md-sys-color-outline-variant, rgba(0,0,0,0.1))',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '90px',
                              height: '48px',
                              backgroundColor: 'var(--md-sys-color-surface-container-high)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--md-sys-color-outline)' }}>image</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{banner.title}</div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--md-sys-color-on-surface-variant)',
                            marginTop: '2px',
                          }}
                        >
                          <span style={{ fontWeight: 500, color: 'var(--md-sys-color-primary)' }}>Text below:</span>{' '}
                          {banner.text || 'None (title only)'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', fontFamily: 'monospace' }}>
                          {banner.link_url || 'Default (/shop)'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{banner.display_order}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleBannerActive(banner)}
                          className={`admin-toggle-switch-btn ${
                            banner.is_active
                              ? 'admin-toggle-switch-btn--active'
                              : 'admin-toggle-switch-btn--inactive'
                          }`}
                          title="Click to toggle banner visibility on home page"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            {banner.is_active ? 'check_circle' : 'do_not_disturb_on'}
                          </span>
                          <span>{banner.is_active ? 'Enabled' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <md-icon-button onClick={() => handleOpenEditBanner(banner)} title="Edit banner">
                            <md-icon>edit</md-icon>
                          </md-icon-button>
                          <md-icon-button onClick={() => handleDeleteBanner(banner.id)} title="Delete banner">
                            <md-icon style={{ color: 'var(--md-sys-color-error, #ba1a1a)' }}>delete</md-icon>
                          </md-icon-button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ==========================================================
          TAB 2: ABOUT STORE VISUALS & GALLERY
          ========================================================== */}
      {activeTab === 'store_visuals' && (
        <>
          <div className="admin-banners-callout">
            <span className="material-symbols-outlined">storefront</span>
            <div>
              <strong>About Store Visuals:</strong> All 6 permanent items (5 authentic store photos + 1 soundless video tour)
              are displayed here. You can edit images, titles, and warm Hinglish descriptions, or turn them ON/OFF occasionally.
              The video tour stays soundless.
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Media</th>
                  <th>Title & Department</th>
                  <th>Hinglish Caption & Description</th>
                  <th style={{ width: '150px' }}>Status (Tap to Toggle)</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingVisuals && storeVisuals.length === 0 ? (
                  <AdminTableSkeleton rows={4} cols={5} />
                ) : storeVisuals.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <div style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '14px' }}>
                        No store visuals found. Click below to restore the 6 permanent items.
                      </div>
                      <button
                        type="button"
                        onClick={handleResetVisuals}
                        className="sdm-btn sdm-btn--primary"
                        style={{ marginTop: '12px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>restart_alt</span>
                        <span>Restore 6 Permanent Store Visuals</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  storeVisuals.map((item) => (
                    <tr key={item.id} style={{ opacity: item.is_active !== false ? 1 : 0.6 }}>
                      <td>
                        <div style={{ position: 'relative', width: '90px', height: '52px' }}>
                          {item.type === 'video' ? (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#1e293b',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>videocam</span>
                            </div>
                          ) : item.url ? (
                            <img
                              src={item.url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid var(--md-sys-color-outline-variant, rgba(0,0,0,0.1))',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span className="material-symbols-outlined">image</span>
                            </div>
                          )}
                          {item.type === 'video' && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '2px',
                                right: '2px',
                                background: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                fontSize: '9px',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                textTransform: 'uppercase',
                              }}
                            >
                              Video
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.title}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'var(--md-sys-color-surface-container-high)',
                              color: 'var(--md-sys-color-on-surface-variant)',
                            }}
                          >
                            {item.department || 'Store Section'}
                          </span>
                          {item.badge && (
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(30, 142, 62, 0.1)',
                                color: '#1e8e3e',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.4 }}>
                          {item.notes}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleVisualActive(item.id)}
                          className={`admin-toggle-switch-btn ${
                            item.is_active !== false
                              ? 'admin-toggle-switch-btn--active'
                              : 'admin-toggle-switch-btn--inactive'
                          }`}
                          title="Click to toggle visibility on About Store page"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            {item.is_active !== false ? 'check_circle' : 'do_not_disturb_on'}
                          </span>
                          <span>{item.is_active !== false ? 'Enabled' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <md-icon-button onClick={() => handleOpenEditVisual(item)} title="Edit store visual">
                            <md-icon>edit</md-icon>
                          </md-icon-button>
                          <md-icon-button onClick={() => handleDeleteVisual(item.id)} title="Delete visual">
                            <md-icon style={{ color: 'var(--md-sys-color-error, #ba1a1a)' }}>delete</md-icon>
                          </md-icon-button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ==========================================================
          MODAL: ADD / EDIT HOME BANNER
          ========================================================== */}
      {isBannerModalOpen && editingBanner && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingBanner.id ? 'Edit Home Banner' : 'Add New Home Banner'}
              </h2>
              <md-icon-button onClick={handleCloseBannerModal}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>

            <form id="banner-form" onSubmit={handleSaveBanner} className="admin-modal-content">
              <div className="admin-form-group">
                <md-outlined-text-field
                  label="Banner Title / Main Headline *"
                  className="admin-form-field"
                  required
                  value={editingBanner.title || ''}
                  onInput={(e: any) =>
                    setEditingBanner({ ...editingBanner, title: e.target.value })
                  }
                />
              </div>

              <div className="admin-form-group">
                <md-outlined-text-field
                  label="Text Below Banner (Subtitle / Offer Details)"
                  className="admin-form-field"
                  value={editingBanner.text || ''}
                  onInput={(e: any) =>
                    setEditingBanner({ ...editingBanner, text: e.target.value })
                  }
                />
                <span style={{ fontSize: '11.5px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', display: 'block' }}>
                  This text will display right below the banner card on the home page.
                </span>
              </div>

              <div className="admin-form-group">
                <ImageUploadField
                  label="Banner Image"
                  required
                  value={editingBanner.image_url || ''}
                  onChange={(url) => setEditingBanner({ ...editingBanner, image_url: url })}
                  presets={PRESET_STORE_PHOTOS}
                  helpText="Upload an image from your computer/phone, or select from authentic store photos."
                />
              </div>

              <div className="admin-form-row">
                <md-outlined-text-field
                  label="Click Link Destination (e.g. /shop or WhatsApp link)"
                  className="admin-form-field"
                  value={editingBanner.link_url || ''}
                  onInput={(e: any) =>
                    setEditingBanner({ ...editingBanner, link_url: e.target.value })
                  }
                />

                <md-outlined-text-field
                  label="Display Order"
                  type="number"
                  className="admin-form-field"
                  required
                  value={editingBanner.display_order?.toString() || '1'}
                  onInput={(e: any) =>
                    setEditingBanner({
                      ...editingBanner,
                      display_order: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="admin-form-row" style={{ marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <md-checkbox
                    checked={editingBanner.is_active}
                    onChange={(e: any) =>
                      setEditingBanner({ ...editingBanner, is_active: e.target.checked })
                    }
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>
                    Enable Banner (Visible on Home Page)
                  </span>
                </label>
              </div>
            </form>

            <div className="admin-modal-footer">
              <button type="button" className="sdm-btn sdm-btn--text" onClick={handleCloseBannerModal}>
                Cancel
              </button>
              <button
                type="submit"
                className="sdm-btn sdm-btn--primary"
                form="banner-form"
                disabled={isSavingBanner}
              >
                {isSavingBanner ? 'Saving...' : 'Save Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: ADD / EDIT ABOUT STORE VISUAL
          ========================================================== */}
      {isVisualModalOpen && editingVisual && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {storeVisuals.some((i) => i.id === editingVisual.id)
                  ? 'Edit About Store Visual'
                  : 'Add New About Store Visual'}
              </h2>
              <md-icon-button onClick={handleCloseVisualModal}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>

            <form id="visual-form" onSubmit={handleSaveVisual} className="admin-modal-content">
              <div className="admin-form-group">
                <md-outlined-text-field
                  label="Title *"
                  className="admin-form-field"
                  required
                  value={editingVisual.title || ''}
                  onInput={(e: any) =>
                    setEditingVisual({ ...editingVisual, title: e.target.value })
                  }
                />
              </div>

              <div className="admin-form-row">
                <md-outlined-text-field
                  label="Department (e.g. Snacks & Kitchen, Billing Counter)"
                  className="admin-form-field"
                  value={editingVisual.department || ''}
                  onInput={(e: any) =>
                    setEditingVisual({ ...editingVisual, department: e.target.value })
                  }
                />

                <md-outlined-text-field
                  label="Badge Tag (e.g. Top Grade Quality, Zero Wait Time)"
                  className="admin-form-field"
                  value={editingVisual.badge || ''}
                  onInput={(e: any) =>
                    setEditingVisual({ ...editingVisual, badge: e.target.value })
                  }
                />
              </div>

              <div className="admin-form-row">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Media Type
                  </label>
                  <select
                    value={editingVisual.type || 'image'}
                    onChange={(e) =>
                      setEditingVisual({ ...editingVisual, type: e.target.value as 'image' | 'video' })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--md-sys-color-outline-variant, rgba(0,0,0,0.2))',
                      background: 'var(--md-sys-color-surface)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '14px',
                    }}
                  >
                    <option value="image">Image (High-Res Photo)</option>
                    <option value="video">Video (Soundless Tour)</option>
                  </select>
                </div>

                <div style={{ flex: 2 }}>
                  <ImageUploadField
                    label={editingVisual.type === 'video' ? 'Video File / URL' : 'Photo File / URL'}
                    required
                    value={editingVisual.url || ''}
                    onChange={(url) => setEditingVisual({ ...editingVisual, url })}
                    presets={PRESET_STORE_PHOTOS}
                    isVideo={editingVisual.type === 'video'}
                    accept={editingVisual.type === 'video' ? 'video/*,image/*' : 'image/*'}
                    helpText="Upload a photo or soundless video from your device, or select from authentic store photos."
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Description / Caption (in Natural Friendly Hinglish) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingVisual.notes || ''}
                  onChange={(e) =>
                    setEditingVisual({ ...editingVisual, notes: e.target.value })
                  }
                  placeholder="e.g. California badam, kaju, kismis aur asli masale hamesha fresh stock me available..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--md-sys-color-outline-variant, rgba(0,0,0,0.2))',
                    background: 'var(--md-sys-color-surface)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '13.5px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div className="admin-form-row" style={{ marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <md-checkbox
                    checked={editingVisual.is_active !== false}
                    onChange={(e: any) =>
                      setEditingVisual({ ...editingVisual, is_active: e.target.checked })
                    }
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>
                    Enable Visual (Visible on About Store Page)
                  </span>
                </label>
              </div>
            </form>

            <div className="admin-modal-footer">
              <button type="button" className="sdm-btn sdm-btn--text" onClick={handleCloseVisualModal}>
                Cancel
              </button>
              <button
                type="submit"
                className="sdm-btn sdm-btn--primary"
                form="visual-form"
                disabled={isSavingVisual}
              >
                {isSavingVisual ? 'Saving...' : 'Save Visual'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
