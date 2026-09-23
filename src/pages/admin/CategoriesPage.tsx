import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { MOCK_CATEGORIES } from '../../lib/mockData';
import { AdminTableSkeleton } from '../../components/common';
import type { Category } from '../../types/category';
import './OrdersPage.css'; // Reusing table styles
import './ProductsPage.css'; // Reusing modal/layout styles

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(() => MOCK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  
  const pageTitle = 'Categories Management — Sai Darshan Mart Admin';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    if (!isSupabaseConfigured) {
      setCategories(MOCK_CATEGORIES);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('categories')
          .select('*')
          .order('display_order'),
        2000
      );

      if (error) throw error;
      setCategories(data && data.length > 0 ? (data as Category[]) : MOCK_CATEGORIES);
    } catch (error) {
      console.warn('Falling back to testing categories in admin:', error);
      setCategories(MOCK_CATEGORIES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory({
      name: '',
      slug: '',
      display_order: categories.length + 1,
      is_visible: true,
      is_offer_category: false,
      description: '',
      thumbnail_url: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory({ ...category });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    setIsSaving(true);
    try {
      if (editingCategory.id) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update({
            ...editingCategory,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        // Insert
        // Generate a slug if empty
        const slug = editingCategory.slug || editingCategory.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const { error } = await supabase
          .from('categories')
          .insert([{ ...editingCategory, slug }]);
        if (error) throw error;
      }
      
      await fetchCategories();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category.');
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
        <h1 className="admin-products-title">Categories</h1>
        <button type="button" onClick={handleOpenAdd} className="sdm-btn sdm-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          <span>Add Category</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name / Slug</th>
              <th>Display Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && categories.length === 0 ? (
              <AdminTableSkeleton rows={5} cols={5} />
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>
                  No categories found. Click "Add Category" to create one.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} style={{ opacity: category.is_visible ? 1 : 0.5 }}>
                  <td>
                    {category.thumbnail_url ? (
                      <img src={category.thumbnail_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--md-sys-color-outline)' }}>category</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{category.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--md-sys-color-outline)' }}>{category.slug}</div>
                  </td>
                  <td>{category.display_order}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-start' }}>
                      {category.is_visible ? (
                        <span className="admin-badge admin-badge--delivered">Visible</span>
                      ) : (
                        <span className="admin-badge admin-badge--cancelled">Hidden</span>
                      )}
                      {category.is_offer_category && (
                        <span className="admin-badge admin-badge--processing">Offer Section</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <md-icon-button onClick={() => handleOpenEdit(category)}>
                      <md-icon>edit</md-icon>
                    </md-icon-button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && editingCategory && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingCategory.id ? 'Edit Category' : 'Add Category'}</h2>
              <md-icon-button onClick={handleCloseModal}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>
            
            <form id="category-form" onSubmit={handleSave} className="admin-modal-content">
              <div className="admin-form-row">
                <md-outlined-text-field
                  label="Category Name"
                  className="admin-form-field"
                  required
                  value={editingCategory.name || ''}
                  onInput={(e: any) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    setEditingCategory({ ...editingCategory, name, slug: editingCategory.id ? editingCategory.slug : slug });
                  }}
                />
                <md-outlined-text-field
                  label="Slug (URL friendly)"
                  className="admin-form-field"
                  required
                  value={editingCategory.slug || ''}
                  onInput={(e: any) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                />
              </div>

              <div className="admin-form-row">
                <md-outlined-text-field
                  label="Display Order (Number)"
                  type="number"
                  className="admin-form-field"
                  required
                  value={editingCategory.display_order?.toString() || ''}
                  onInput={(e: any) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="admin-form-group">
                <md-outlined-text-field
                  label="Thumbnail URL"
                  className="admin-form-field"
                  value={editingCategory.thumbnail_url || ''}
                  onInput={(e: any) => setEditingCategory({ ...editingCategory, thumbnail_url: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Description (Optional)</label>
                <textarea 
                  className="admin-select"
                  rows={3}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                />
              </div>

              <div className="admin-form-row" style={{ gap: '24px', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <md-checkbox 
                    checked={editingCategory.is_visible} 
                    onChange={(e: any) => setEditingCategory({ ...editingCategory, is_visible: e.target.checked })}
                  />
                  Visible to Customers
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <md-checkbox 
                    checked={editingCategory.is_offer_category} 
                    onChange={(e: any) => setEditingCategory({ ...editingCategory, is_offer_category: e.target.checked })}
                  />
                  Is Offer Category (Special highlight)
                </label>
              </div>
            </form>

            <div className="admin-modal-footer">
              <button type="button" className="sdm-btn sdm-btn--text" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" className="sdm-btn sdm-btn--primary" form="category-form" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
