import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../../lib/mockData';
import { formatPrice } from '../../lib/orderUtils';
import { AdminTableSkeleton } from '../../components/common';
import type { Product } from '../../types/product';
import type { Category } from '../../types/category';
import './OrdersPage.css'; // Reusing table styles
import './ProductsPage.css';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(() => MOCK_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(() => MOCK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  
  const pageTitle = 'Products Catalog — Sai Darshan Mart Admin';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    if (!isSupabaseConfigured) {
      setProducts(MOCK_PRODUCTS);
      setCategories(MOCK_CATEGORIES);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        withTimeout(supabase.from('products').select('*, category:categories(name)').order('name'), 2000),
        withTimeout(supabase.from('categories').select('*').order('name'), 2000)
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setProducts(productsRes.data && productsRes.data.length > 0 ? (productsRes.data as Product[]) : MOCK_PRODUCTS);
      setCategories(categoriesRes.data && categoriesRes.data.length > 0 ? (categoriesRes.data as Category[]) : MOCK_CATEGORIES);
    } catch (error) {
      console.warn('Falling back to testing products in admin:', error);
      setProducts(MOCK_PRODUCTS);
      setCategories(MOCK_CATEGORIES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct({
      name: '',
      sku: '',
      price: 0,
      unit_size: '',
      category_id: categories[0]?.id || '',
      is_available: true,
      is_featured: false,
      is_archived: false,
      description: '',
      image_url: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSaving(true);
    try {
      if (editingProduct.id) {
        // Update
        const { error } = await supabase
          .from('products')
          .update({
            ...editingProduct,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('products')
          .insert([editingProduct]);
        if (error) throw error;
      }
      
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product.');
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
        <h1 className="admin-products-title">Products</h1>
        <button type="button" onClick={handleOpenAdd} className="sdm-btn sdm-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          <span>Add Product</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && products.length === 0 ? (
              <AdminTableSkeleton rows={6} cols={6} />
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                  No products found. Click "Add Product" to create one.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} style={{ opacity: product.is_archived ? 0.5 : 1 }}>
                  <td>
                    {product.image_url ? (
                      <img src={product.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--md-sys-color-outline)' }}>image</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--md-sys-color-outline)' }}>{product.unit_size} • SKU: {product.sku}</div>
                  </td>
                  <td>{categories.find(c => c.id === product.category_id)?.name || (product as any).category?.name || 'General'}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-start' }}>
                      {product.is_available ? (
                        <span className="admin-badge admin-badge--delivered">In Stock</span>
                      ) : (
                        <span className="admin-badge admin-badge--pending">Out of Stock</span>
                      )}
                      {product.is_featured && <span className="admin-badge admin-badge--processing">Featured</span>}
                      {product.is_archived && <span className="admin-badge admin-badge--cancelled">Archived</span>}
                    </div>
                  </td>
                  <td>
                    <md-icon-button onClick={() => handleOpenEdit(product)}>
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
      {isModalOpen && editingProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingProduct.id ? 'Edit Product' : 'Add Product'}</h2>
              <md-icon-button onClick={handleCloseModal}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>
            
            <form id="product-form" onSubmit={handleSave} className="admin-modal-content">
              <div className="admin-form-row">
                <md-outlined-text-field
                  label="Product Name"
                  className="admin-form-field"
                  required
                  value={editingProduct.name || ''}
                  onInput={(e: any) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
                <md-outlined-text-field
                  label="SKU"
                  className="admin-form-field"
                  required
                  value={editingProduct.sku || ''}
                  onInput={(e: any) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                />
              </div>

              <div className="admin-form-row">
                <md-outlined-text-field
                  label="Price (₹)"
                  type="number"
                  className="admin-form-field"
                  required
                  value={editingProduct.price?.toString() || ''}
                  onInput={(e: any) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                />
                <md-outlined-text-field
                  label="Unit Size (e.g., 500g, 1L)"
                  className="admin-form-field"
                  required
                  value={editingProduct.unit_size || ''}
                  onInput={(e: any) => setEditingProduct({ ...editingProduct, unit_size: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Category</label>
                <select 
                  className="admin-select"
                  value={editingProduct.category_id || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                  required
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <md-outlined-text-field
                  label="Image URL"
                  className="admin-form-field"
                  value={editingProduct.image_url || ''}
                  onInput={(e: any) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Description (Optional)</label>
                <textarea 
                  className="admin-select"
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>

              <div className="admin-form-row" style={{ gap: '24px', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <md-checkbox 
                    checked={editingProduct.is_available} 
                    onChange={(e: any) => setEditingProduct({ ...editingProduct, is_available: e.target.checked })}
                  />
                  In Stock (Available)
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <md-checkbox 
                    checked={editingProduct.is_featured} 
                    onChange={(e: any) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                  />
                  Featured
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <md-checkbox 
                    checked={editingProduct.is_archived} 
                    onChange={(e: any) => setEditingProduct({ ...editingProduct, is_archived: e.target.checked })}
                  />
                  Archived (Hidden)
                </label>
              </div>
            </form>

            <div className="admin-modal-footer">
              <button type="button" className="sdm-btn sdm-btn--text" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" className="sdm-btn sdm-btn--primary" form="product-form" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
