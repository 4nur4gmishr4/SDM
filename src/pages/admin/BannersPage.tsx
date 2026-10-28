import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout, SUPABASE_STORE_MEDIA_BASE } from '../../lib/supabase';
import { AdminTableSkeleton } from '../../components/common';
import type { Banner, DefaultLogoBannerConfig } from '../../types/banner';
import { useStoreMedia } from '../../hooks/useStoreMedia';
import { useDefaultLogoBanner } from '../../hooks/useDefaultLogoBanner';
import type { StoreMediaItem } from '../../data/storeMedia';
import { ImageUploadField } from '../../components/admin/ImageUploadField';
import './AdminSharedTable.css';
import './ProductsPage.css';
import './BannersPage.css';

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

  const pageTitle = 'Banners & Store Visuals | Sai Darshan Shopping Mart Admin';

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

  // Helper to map promotional banners to their linked store category
  const getLinkedCategoryInfo = (banner: Partial<Banner>): { slug: string; name: string } | null => {
    const url = (banner.link_url || '').toLowerCase();
    const title = (banner.title || '').toLowerCase();
    if (url.includes('mid-month-offer') || title.includes('mid-month') || title.includes('mid month')) {
      return { slug: 'mid-month-offer', name: 'Mid Month Offer' };
    }
    if (url.includes('buy-1-get-1') || title.includes('buy 1 get 1') || title.includes('bogo')) {
      return { slug: 'buy-1-get-1', name: 'Buy 1 Get 1 Offers' };
    }
    if (url.includes('buy-more-get-more') || title.includes('buy more') || title.includes('bmgm')) {
      return { slug: 'buy-more-get-more', name: 'Buy More Get More' };
    }
    return null;
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

      // Synchronize category visibility: banner on -> category on, banner off -> category off
      const linked = getLinkedCategoryInfo(editingBanner);
      if (linked && editingBanner.is_active !== undefined) {
        await supabase
          .from('categories')
          .update({ is_visible: editingBanner.is_active, updated_at: new Date().toISOString() })
          .eq('slug', linked.slug);
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
        return;
      }

      // Synchronize linked category in Supabase categories table
      const linked = getLinkedCategoryInfo(banner);
      if (linked) {
        await supabase
          .from('categories')
          .update({ is_visible: nextActive, updated_at: new Date().toISOString() })
          .eq('slug', linked.slug);
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
          <p className="admin-products-subtitle">
            Configure home promotional banners and authentic store aisle visuals for the About Store section.
          </p>
        </div>

        {activeTab === 'banners' ? (
          <button type="button" onClick={handleOpenAddBanner} className="sdsm-btn sdsm-btn--primary admin-icon-btn">
            <span className="material-symbols-outlined admin-btn-icon">add</span>
            <span>Add Banner</span>
          </button>
        ) : (
          <div className="admin-products-header__actions">
            <button type="button" onClick={handleResetVisuals} className="sdsm-btn sdsm-btn--outlined admin-icon-btn" title="Restore the 6 permanent authentic store items">
              <span className="material-symbols-outlined admin-btn-icon--small">restart_alt</span>
              <span>Restore 6 Permanent Items</span>
            </button>
            <button type="button" onClick={handleOpenAddVisual} className="sdsm-btn sdsm-btn--primary admin-icon-btn">
              <span className="material-symbols-outlined admin-btn-icon">add_photo_alternate</span>
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
            <span className="material-symbols-outlined admin-btn-icon--small">view_carousel</span>
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
            <span className="material-symbols-outlined admin-btn-icon--small">storefront</span>
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
              <div className="admin-logo-banner-title-group">
                <div className="admin-logo-banner-icon-box">
                  <span className="material-symbols-outlined admin-logo-banner-icon">
                    storefront
                  </span>
                </div>
                <div>
                  <h3 className="admin-logo-banner-title">Default Store Logo Banner (Fallback)</h3>
                  <p className="admin-logo-banner-subtitle">
                    Jab home screen pe koi promotional banner nahi hoga ya sab disabled honge, tab ye logo banner display hoga.
                  </p>
                </div>
              </div>

              <div className="admin-logo-banner-actions">
                <button
                  type="button"
                  onClick={handleToggleLogoBanner}
                  className={`sdsm-btn admin-logo-banner-toggle-btn ${logoBanner.is_enabled ? 'admin-logo-banner-toggle-btn--active' : 'admin-logo-banner-toggle-btn--inactive'}`}
                  title="Toggle Fallback Logo Banner visibility on/off"
                >
                  <span className="material-symbols-outlined admin-btn-icon--small">
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
                  className="sdsm-btn sdsm-btn--outlined admin-icon-btn admin-logo-banner-toggle-btn"
                >
                  <span className="material-symbols-outlined admin-btn-icon--small">
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
                  <div className="admin-logo-banner-meta-title">
                    {logoBanner.title || 'Sai Darshan Shopping Mart'}
                  </div>
                  <div className="admin-logo-banner-meta-subtitle">
                    <span>Text below banner:</span>{' '}
                    {logoBanner.subtitle || 'None'}
                  </div>
                  <div className="admin-logo-banner-meta-link">
                    Destination link: <code>{logoBanner.link_url || '/shop'}</code>
                  </div>
                </div>
              </div>
            )}

            {/* Inline Edit Form */}
            {isEditingLogoBanner && (
              <form onSubmit={handleSaveLogoBanner} className="admin-logo-banner-form">
                <div className="admin-form-group admin-form-group--spaced">
                  <ImageUploadField
                    label="Logo Banner Image"
                    value={logoBannerForm.image_url}
                    onChange={(url) => setLogoBannerForm({ ...logoBannerForm, image_url: url })}
                    helpText="Upload your official store logo banner (16:9 ratio, e.g. 1672x941 or 1920x1080)."
                  />
                </div>

                <div className="admin-modal-row admin-modal-row--grid admin-form-group--spaced">
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

                <div className="admin-form-group admin-form-group--spaced">
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
                  <div className="admin-form-help-text">
                    Ye text home screen pe banner image ke theek neeche dikhega.
                  </div>
                </div>

                <div className="admin-modal-footer admin-modal-footer--right admin-form-group--spaced">
                  <button
                    type="button"
                    onClick={() => setIsEditingLogoBanner(false)}
                    className="sdsm-btn sdsm-btn--outlined"
                    disabled={isSavingLogoBanner}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="sdsm-btn sdsm-btn--primary"
                    disabled={isSavingLogoBanner}
                  >
                    {isSavingLogoBanner ? 'Saving to Database...' : 'Save Logo Banner'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section Divider & Header for Promotional Banners */}
          <div className="admin-promotional-header">
            <div>
              <h3 className="admin-promotional-title">Active Promotional Campaign Banners</h3>
              <p className="admin-promotional-subtitle">
                Jab yaha 1 ya zyada promotional banners active honge, to home screen par unka auto-sliding carousel chalega.
              </p>
            </div>
            <button type="button" onClick={handleOpenAddBanner} className="sdsm-btn sdsm-btn--tonal admin-btn-action">
              <span className="material-symbols-outlined admin-btn-icon--small">add</span>
              <span>Add Promotional Banner</span>
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-table-col-img">Image</th>
                  <th>Title & Text Below Banner</th>
                  <th>Link Destination</th>
                  <th className="admin-table-col-order">Order</th>
                  <th className="admin-table-col-status">Status (Tap to Toggle)</th>
                  <th className="admin-table-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingBanners && banners.length === 0 ? (
                  <AdminTableSkeleton rows={4} cols={6} />
                ) : banners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-products-table-empty">
                      <div className="admin-form-help-text">
                        No banners configured. Currently <strong>no banner is shown on the home screen</strong>.
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddBanner}
                        className="sdsm-btn sdsm-btn--primary admin-form-group--spaced"
                      >
                        <span className="material-symbols-outlined admin-btn-icon--small">add</span>
                        <span>Add Your First Banner</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner.id} className={banner.is_active ? '' : 'admin-table-row--archived'}>
                      <td>
                        {banner.image_url ? (
                          <img
                            src={banner.image_url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="admin-banner-img"
                          />
                        ) : (
                          <div className="admin-banner-img-placeholder">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="admin-banner-title">{banner.title}</div>
                        <div className="admin-banner-text">
                          <span>Text below:</span>{' '}
                          {banner.text || 'None (title only)'}
                        </div>
                        {(() => {
                          const linked = getLinkedCategoryInfo(banner);
                          if (!linked) return null;
                          return (
                            <div className="admin-banner-category-badge">
                              <span className={`admin-badge ${banner.is_active ? 'admin-badge--delivered' : 'admin-badge--cancelled'}`}>
                                <span className="material-symbols-outlined admin-btn-icon--small">sync_alt</span>
                                Category: {linked.name} ({banner.is_active ? 'Visible in store' : 'Hidden in store'})
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <span className="admin-banner-link-text">
                          {banner.link_url || 'Default (/shop)'}
                        </span>
                      </td>
                      <td>
                        <span className="admin-banner-order">{banner.display_order}</span>
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
                          <span className="material-symbols-outlined admin-toggle-switch-btn__icon">
                            {banner.is_active ? 'check_circle' : 'do_not_disturb_on'}
                          </span>
                          <span>{banner.is_active ? 'Enabled' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <md-icon-button onClick={() => handleOpenEditBanner(banner)} title="Edit banner">
                            <md-icon>edit</md-icon>
                          </md-icon-button>
                          <md-icon-button onClick={() => handleDeleteBanner(banner.id)} title="Delete banner">
                            <md-icon className="admin-icon-btn--error">delete</md-icon>
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
                  <th className="admin-table-col-img">Media</th>
                  <th>Title & Department</th>
                  <th>Hinglish Caption & Description</th>
                  <th className="admin-table-col-status">Status (Tap to Toggle)</th>
                  <th className="admin-table-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingVisuals && storeVisuals.length === 0 ? (
                  <AdminTableSkeleton rows={4} cols={5} />
                ) : storeVisuals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-products-table-empty">
                      <div className="admin-form-help-text">
                        No store visuals found. Click below to restore the 6 permanent items.
                      </div>
                      <button
                        type="button"
                        onClick={handleResetVisuals}
                        className="sdsm-btn sdsm-btn--primary admin-form-group--spaced"
                      >
                        <span className="material-symbols-outlined admin-btn-icon--small">restart_alt</span>
                        <span>Restore 6 Permanent Store Visuals</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  storeVisuals.map((item) => (
                    <tr key={item.id} className={item.is_active !== false ? "" : "admin-table-row--archived"}>
                      <td>
                        <div className="admin-store-visual-container">
                          {item.type === 'video' ? (
                            <div className="admin-store-visual-video">
                              <span className="material-symbols-outlined admin-store-visual-video-icon">videocam</span>
                            </div>
                          ) : item.url ? (
                            <img
                              src={item.url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="admin-store-visual-img"
                            />
                          ) : (
                            <div className="admin-store-visual-placeholder">
                              <span className="material-symbols-outlined">image</span>
                            </div>
                          )}
                          {item.type === 'video' && (
                            <span className="admin-store-visual-video-badge">
                              Video
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-store-visual-title">{item.title}</div>
                        <div className="admin-store-visual-tags">
                          <span className="admin-store-visual-tag">
                            {item.department || 'Store Section'}
                          </span>
                          {item.badge && (
                            <span className="admin-store-visual-tag admin-store-visual-tag--highlight">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-store-visual-notes">
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
                          <span className="material-symbols-outlined admin-toggle-switch-btn__icon">
                            {item.is_active !== false ? 'check_circle' : 'do_not_disturb_on'}
                          </span>
                          <span>{item.is_active !== false ? 'Enabled' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <md-icon-button onClick={() => handleOpenEditVisual(item)} title="Edit store visual">
                            <md-icon>edit</md-icon>
                          </md-icon-button>
                          <md-icon-button onClick={() => handleDeleteVisual(item.id)} title="Delete visual">
                            <md-icon className="admin-icon-btn--error">delete</md-icon>
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
                <span className="admin-form-field-hint">
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

              <div className="admin-form-group admin-form-group--spaced">
                <label className="admin-product-checkbox-label">
                  <md-checkbox
                    checked={editingBanner.is_active}
                    onChange={(e: any) =>
                      setEditingBanner({ ...editingBanner, is_active: e.target.checked })
                    }
                  />
                  <span>
                    Enable Banner (Visible on Home Page)
                  </span>
                </label>
                {(() => {
                  const linked = getLinkedCategoryInfo(editingBanner);
                  if (!linked) return null;
                  return (
                    <div className="admin-modal-info-box">
                      <span className="material-symbols-outlined admin-btn-icon--small">sync_alt</span>
                      <span>
                        <strong>Live Category Sync:</strong> This banner controls the <strong>{linked.name}</strong> category. When this banner is enabled, the category appears right after Specials; when disabled, the category is hidden.
                      </span>
                    </div>
                  );
                })()}
              </div>
            </form>

            <div className="admin-modal-footer">
              <button type="button" className="sdsm-btn sdsm-btn--text" onClick={handleCloseBannerModal}>
                Cancel
              </button>
              <button
                type="submit"
                className="sdsm-btn sdsm-btn--primary"
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
                <div className="admin-form-col-flex-1">
                  <label className="admin-form-label-small">
                    Media Type
                  </label>
                  <select
                    value={editingVisual.type || 'image'}
                    onChange={(e) =>
                      setEditingVisual({ ...editingVisual, type: e.target.value as 'image' | 'video' })
                    }
                    className="admin-modal-select"
                  >
                    <option value="image">Image (High-Res Photo)</option>
                    <option value="video">Video (Soundless Tour)</option>
                  </select>
                </div>

                <div className="admin-form-col-flex-2">
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
                <label className="admin-form-label-small">
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
                  className="admin-modal-textarea"
                />
              </div>

              <div className="admin-form-group admin-form-group--spaced">
                <label className="admin-product-checkbox-label">
                  <md-checkbox
                    checked={editingVisual.is_active !== false}
                    onChange={(e: any) =>
                      setEditingVisual({ ...editingVisual, is_active: e.target.checked })
                    }
                  />
                  <span>
                    Enable Visual (Visible on About Store Page)
                  </span>
                </label>
              </div>
            </form>

            <div className="admin-modal-footer">
              <button type="button" className="sdsm-btn sdsm-btn--text" onClick={handleCloseVisualModal}>
                Cancel
              </button>
              <button
                type="submit"
                className="sdsm-btn sdsm-btn--primary"
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
