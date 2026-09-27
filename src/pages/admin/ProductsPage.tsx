import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { formatPrice } from '../../lib/orderUtils';
import { AdminTableSkeleton } from '../../components/common';
import { ExcelImportWidget } from '../../components/admin/ExcelImportWidget';
import { ImageUploadField } from '../../components/admin/ImageUploadField';
import type { Product, ProductVariant } from '../../types/product';
import type { Category } from '../../types/category';
import './OrdersPage.css'; // Reusing table styles
import './ProductsPage.css';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'featured' | 'archived'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  
  const pageTitle = 'Products Catalog | Sai Darshan Mart Admin';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    if (!isSupabaseConfigured) {
      setProducts([]);
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        withTimeout(supabase.from('products').select('*, category:categories(id, name, slug)').order('name'), 5000),
        withTimeout(supabase.from('categories').select('*').order('name'), 5000)
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setProducts((productsRes.data as Product[]) || []);
      setCategories((categoriesRes.data as Category[]) || []);
    } catch (error) {
      console.error('Error fetching products in admin:', error);
      setProducts([]);
      setCategories([]);
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
      sku: `SDM-${Date.now().toString().slice(-6)}`,
      price: 0,
      mrp: 0,
      unit_size: '1 unit',
      category_id: categories[0]?.id || '',
      is_available: true,
      is_featured: false,
      is_archived: false,
      description: '',
      image_url: '',
      variants: [
        {
          id: 'v-1',
          unit_size: '1 unit',
          price: 0,
          mrp: 0,
          stock_quantity: 50,
          is_available: true
        }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    const defaultVariants: ProductVariant[] = (product.variants && product.variants.length > 0)
      ? [...product.variants]
      : [
          {
            id: 'v-1',
            unit_size: product.unit_size || '1 unit',
            price: product.price || 0,
            mrp: product.mrp || product.price || 0,
            stock_quantity: 50,
            is_available: product.is_available
          }
        ];

    setEditingProduct({
      ...product,
      variants: defaultVariants
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Quantity options (variants) handlers
  const handleAddVariant = () => {
    if (!editingProduct) return;
    const currentVariants = editingProduct.variants || [];
    const newVariant: ProductVariant = {
      id: `v-${Date.now().toString().slice(-4)}`,
      unit_size: '',
      price: editingProduct.price || 0,
      mrp: editingProduct.mrp || editingProduct.price || 0,
      stock_quantity: 50,
      is_available: true
    };
    setEditingProduct({
      ...editingProduct,
      variants: [...currentVariants, newVariant]
    });
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    if (!editingProduct || !editingProduct.variants) return;
    const updated = [...editingProduct.variants];
    updated[index] = { ...updated[index], [field]: value };

    // If first variant's price or unit size changed, sync base product defaults
    const updates: Partial<Product> = { variants: updated };
    if (index === 0) {
      if (field === 'price') updates.price = value;
      if (field === 'mrp') updates.mrp = value;
      if (field === 'unit_size') updates.unit_size = value;
    }

    setEditingProduct({ ...editingProduct, ...updates });
  };

  const handleRemoveVariant = (index: number) => {
    if (!editingProduct || !editingProduct.variants) return;
    const updated = editingProduct.variants.filter((_, i) => i !== index);
    setEditingProduct({
      ...editingProduct,
      variants: updated
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSaving(true);
    try {
      const variants = editingProduct.variants || [];
      const primaryVariant = variants[0];

      const payload = {
        name: editingProduct.name,
        sku: editingProduct.sku,
        category_id: editingProduct.category_id || categories[0]?.id || null,
        price: primaryVariant ? primaryVariant.price : (editingProduct.price || 0),
        mrp: primaryVariant?.mrp || editingProduct.mrp || editingProduct.price || 0,
        unit_size: primaryVariant?.unit_size || editingProduct.unit_size || '1 unit',
        description: editingProduct.description || null,
        image_url: editingProduct.image_url || null,
        is_available: editingProduct.is_available ?? true,
        is_featured: editingProduct.is_featured ?? false,
        is_archived: editingProduct.is_archived ?? false,
        variants: variants,
        updated_at: new Date().toISOString()
      };

      if (editingProduct.id) {
        // Update
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('products')
          .insert([payload]);
        if (error) throw error;
      }
      
      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert('Failed to save product: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !query ||
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query));

      const matchesCategory = !selectedCategory || p.category_id === selectedCategory;

      let matchesStatus = true;
      if (statusFilter === 'in_stock') matchesStatus = p.is_available && !p.is_archived;
      else if (statusFilter === 'out_of_stock') matchesStatus = !p.is_available && !p.is_archived;
      else if (statusFilter === 'featured') matchesStatus = !!p.is_featured;
      else if (statusFilter === 'archived') matchesStatus = !!p.is_archived;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safePage, pageSize]);

  return (
    <div className="admin-layout-content admin-products-page">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <div className="admin-products-header">
        <h1 className="admin-products-title">Products ({products.length})</h1>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="sdm-btn sdm-btn--outlined"
            title="Drag and drop your excel catalog"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
            <span>Import Excel Catalog</span>
          </button>
          <button type="button" onClick={handleOpenAdd} className="sdm-btn sdm-btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="admin-toolbar-row">
        <div className="admin-search-box">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select
          className="admin-filter-select"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className="admin-filter-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="featured">Featured</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name & Options</th>
              <th>Category</th>
              <th>Price & Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <AdminTableSkeleton rows={6} cols={6} />
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--md-sys-color-outline)' }}>
                      inventory_2
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>No products in database yet</h3>
                    <p style={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: '420px', fontSize: '14px' }}>
                      Drag and drop your supermarket Excel price list or add products manually with multiple quantity options (e.g. 50g, 100g, 250g tea).
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button type="button" onClick={() => setIsImportModalOpen(true)} className="sdm-btn sdm-btn--primary">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
                        <span>Drag & Drop Excel File</span>
                      </button>
                      <button type="button" onClick={handleOpenAdd} className="sdm-btn sdm-btn--outlined">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                        <span>Add Manually</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--md-sys-color-outline)' }}>
                      search_off
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: 600 }}>No matching products</h4>
                    <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '13px' }}>
                      No items matched &ldquo;{searchQuery}&rdquo;. Try clearing filters or searching another keyword.
                    </p>
                    <button
                      type="button"
                      className="sdm-btn sdm-btn--tonal"
                      style={{ marginTop: '8px' }}
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('');
                        setStatusFilter('all');
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => {
                const variantsCount = product.variants?.length || 0;
                return (
                  <tr key={product.id} style={{ opacity: product.is_archived ? 0.5 : 1 }}>
                    <td>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                      ) : (
                        <div style={{ width: '44px', height: '44px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--md-sys-color-outline)' }}>image</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{product.name}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: 'var(--md-sys-color-outline)' }}>
                          SKU: {product.sku || 'N/A'}
                        </span>
                        {variantsCount > 1 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'var(--md-sys-color-primary-container)',
                            color: 'var(--md-sys-color-on-primary-container)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {variantsCount} options ({product.variants?.map(v => v.unit_size).join(', ')})
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--md-sys-color-outline)' }}>
                            {product.unit_size || '1 unit'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {categories.find(c => c.id === product.category_id)?.name || (product as any).category?.name || 'General'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatPrice(product.price)}</div>
                      {product.mrp && product.mrp > product.price && (
                        <div style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--md-sys-color-outline)' }}>
                          MRP {formatPrice(product.mrp)}
                        </div>
                      )}
                    </td>
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
                      <button
                        type="button"
                        className="sdm-btn sdm-btn--outlined"
                        style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}
                        onClick={() => handleOpenEdit(product)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {filteredProducts.length > pageSize && (
          <div className="admin-pagination-container">
            <span>
              Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-pagination-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Previous page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
              </button>
              <span>Page {safePage} of {totalPages}</span>
              <button
                type="button"
                className="admin-pagination-btn"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Next page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Excel Drag & Drop Importer Modal */}
      {isImportModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '780px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Bulk Import Excel Catalog</h2>
              <button
                type="button"
                className="sdm-btn sdm-btn--text"
                style={{ padding: '0 8px', height: '36px' }}
                onClick={() => setIsImportModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="admin-modal-content">
              <ExcelImportWidget
                categories={categories}
                onImportComplete={fetchData}
                onClose={() => setIsImportModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Product Edit / Add Modal */}
      {isModalOpen && editingProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '720px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingProduct.id ? 'Edit Product' : 'Add Product'}</h2>
              <button
                type="button"
                className="sdm-btn sdm-btn--text"
                style={{ padding: '0 8px', height: '36px' }}
                onClick={handleCloseModal}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form id="product-form" onSubmit={handleSave} className="admin-modal-content">
              <div className="admin-form-row">
                <md-outlined-text-field
                  label="Product Name (e.g. Wagh Bakri Tea)"
                  className="admin-form-field"
                  required
                  value={editingProduct.name || ''}
                  onInput={(e: any) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
                <md-outlined-text-field
                  label="SKU Code"
                  className="admin-form-field"
                  required
                  value={editingProduct.sku || ''}
                  onInput={(e: any) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
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

              {/* Quantity Options / Variants Section */}
              <div style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                border: '1px solid var(--md-sys-color-outline-variant)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
                      Quantity & Pack Options (Variants)
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>
                      Add options like 50g, 100g, 250g, 500g, 1kg with their respective selling price and stock.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="sdm-btn sdm-btn--tonal"
                    style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    <span>Add Pack Option</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(editingProduct.variants || []).map((variant, vIdx) => (
                    <div
                      key={variant.id || vIdx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto auto',
                        gap: '8px',
                        alignItems: 'center',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--md-sys-color-outline-variant)'
                      }}
                    >
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>Pack / Weight</label>
                        <input
                          type="text"
                          placeholder="e.g. 250g"
                          required
                          value={variant.unit_size}
                          onChange={(e) => handleUpdateVariant(vIdx, 'unit_size', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--md-sys-color-outline)',
                            fontSize: '13px',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>Sale Price (₹)</label>
                        <input
                          type="number"
                          placeholder="₹"
                          required
                          step="0.5"
                          value={variant.price.toString()}
                          onChange={(e) => handleUpdateVariant(vIdx, 'price', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--md-sys-color-outline)',
                            fontSize: '13px',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>MRP (₹)</label>
                        <input
                          type="number"
                          placeholder="₹"
                          step="0.5"
                          value={variant.mrp?.toString() || ''}
                          onChange={(e) => handleUpdateVariant(vIdx, 'mrp', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--md-sys-color-outline)',
                            fontSize: '13px',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>Stock Units</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={variant.stock_quantity?.toString() || '50'}
                          onChange={(e) => handleUpdateVariant(vIdx, 'stock_quantity', parseInt(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--md-sys-color-outline)',
                            fontSize: '13px',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-sys-color-outline)', display: 'block' }}>In Stock</label>
                        <input
                          type="checkbox"
                          checked={variant.is_available}
                          onChange={(e) => handleUpdateVariant(vIdx, 'is_available', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', visibility: 'hidden', display: 'block' }}>X</label>
                        <button
                          type="button"
                          className="sdm-btn sdm-btn--text"
                          style={{ padding: '0 6px', height: '32px', color: 'var(--md-sys-color-error)' }}
                          onClick={() => handleRemoveVariant(vIdx)}
                          title="Remove pack option"
                          disabled={(editingProduct.variants?.length || 0) <= 1}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-form-group" style={{ marginTop: '16px' }}>
                <ImageUploadField
                  label="Product Image (Upload File or Paste Link)"
                  value={editingProduct.image_url || ''}
                  onChange={(url) => setEditingProduct({ ...editingProduct, image_url: url })}
                  helpText="Upload product packaging image from your device, or paste a link."
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
                  <input 
                    type="checkbox"
                    checked={editingProduct.is_available ?? true} 
                    onChange={(e: any) => setEditingProduct({ ...editingProduct, is_available: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Overall In Stock
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox"
                    checked={editingProduct.is_featured ?? false} 
                    onChange={(e: any) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Featured Item
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox"
                    checked={editingProduct.is_archived ?? false} 
                    onChange={(e: any) => setEditingProduct({ ...editingProduct, is_archived: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Archived (Hidden from Store)
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
