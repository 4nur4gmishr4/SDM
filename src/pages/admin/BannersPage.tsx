import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { AdminTableSkeleton } from '../../components/common';
import type { Banner } from '../../types/banner';
import './OrdersPage.css'; 
import './ProductsPage.css';

export function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pageTitle = 'Banners Management — Sai Darshan Mart Admin';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBanners = async () => {
    if (!isSupabaseConfigured) {
      setBanners([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenAdd = () => {
    setEditingBanner({
      title: '',
      text: '',
      image_url: '',
      link_url: '',
      display_order: banners.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner({ ...banner });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    
    setIsSaving(true);
    try {
      if (editingBanner.id) {
        const { error } = await supabase
          .from('banners')
          .update({
            ...editingBanner,
            updated_at: new Date().toISOString()
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
      handleCloseModal();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const nextActive = !banner.is_active;
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: nextActive } : b));
      
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

  const handleDelete = async (bannerId: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      setBanners(prev => prev.filter(b => b.id !== bannerId));
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

  return (
    <div className="admin-layout-content admin-products-page">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <div className="admin-products-header">
        <div>
          <h1 className="admin-products-title">Banners</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Control which banners appear on the home page iOS carousel and their sliding order.
          </p>
        </div>
        <button type="button" onClick={handleOpenAdd} className="sdm-btn sdm-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          <span>Add Banner</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title & Text</th>
              <th>Link</th>
              <th>Order</th>
              <th>Status (Tap to Toggle)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && banners.length === 0 ? (
              <AdminTableSkeleton rows={4} cols={6} />
            ) : banners.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                  No custom banners found. Currently displaying fallback store banners on home page. Click "Add Banner" to create your first store banner.
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner.id} style={{ opacity: banner.is_active ? 1 : 0.55 }}>
                  <td>
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style={{ width: '80px', height: '42px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    ) : (
                      <div style={{ width: '80px', height: '42px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--md-sys-color-outline)' }}>image</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{banner.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--md-sys-color-outline)' }}>{banner.text}</div>
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
                      onClick={() => handleToggleActive(banner)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title="Click to toggle banner visibility on home page"
                    >
                      {banner.is_active ? (
                        <span className="admin-badge admin-badge--delivered">Active</span>
                      ) : (
                        <span className="admin-badge admin-badge--cancelled">Inactive</span>
                      )}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <md-icon-button onClick={() => handleOpenEdit(banner)} title="Edit banner">
                        <md-icon>edit</md-icon>
                      </md-icon-button>
                      <md-icon-button onClick={() => handleDelete(banner.id)} title="Delete banner">
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

      {isModalOpen && editingBanner && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingBanner.id ? 'Edit Banner' : 'Add Banner'}</h2>
              <md-icon-button onClick={handleCloseModal}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>
            
            <form id="banner-form" onSubmit={handleSave} className="admin-modal-content">
              <div className="admin-form-group">
                <md-outlined-text-field
                  label="Title"
                  className="admin-form-field"
                  required
                  value={editingBanner.title || ''}
                  onInput={(e: any) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <md-outlined-text-field
                  label="Subtitle / Text (Optional)"
                  className="admin-form-field"
                  value={editingBanner.text || ''}
                  onInput={(e: any) => setEditingBanner({ ...editingBanner, text: e.target.value })}
                />
              </div>

              <div className="admin-form-row">
                <md-outlined-text-field
                  label="Image URL"
                  className="admin-form-field"
                  value={editingBanner.image_url || ''}
                  onInput={(e: any) => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                />
                <md-outlined-text-field
                  label="Link URL (e.g. /shop?category=diwali)"
                  className="admin-form-field"
                  value={editingBanner.link_url || ''}
                  onInput={(e: any) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                />
              </div>

              <div className="admin-form-row">
                <md-outlined-text-field
                  label="Display Order"
                  type="number"
                  className="admin-form-field"
                  required
                  value={editingBanner.display_order?.toString() || ''}
                  onInput={(e: any) => setEditingBanner({ ...editingBanner, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="admin-form-row" style={{ marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <md-checkbox 
                    checked={editingBanner.is_active} 
                    onChange={(e: any) => setEditingBanner({ ...editingBanner, is_active: e.target.checked })}
                  />
                  Active (Visible on HomePage)
                </label>
              </div>
            </form>

            <div className="admin-modal-footer">
              <button type="button" className="sdm-btn sdm-btn--text" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" className="sdm-btn sdm-btn--primary" form="banner-form" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
