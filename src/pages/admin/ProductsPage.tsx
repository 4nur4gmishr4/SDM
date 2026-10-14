import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  supabase,
  isSupabaseConfigured,
  withTimeout,
} from "../../lib/supabase";
import { formatPrice } from "../../lib/orderUtils";
import { exportCatalogToExcel } from "../../lib/backupPipeline";
import { AdminTableSkeleton } from "../../components/common";
import { ExcelImportWidget } from "../../components/admin/ExcelImportWidget";
import { ImageUploadField } from "../../components/admin/ImageUploadField";
import type { Product, ProductVariant } from "../../types/product";
import type { Category } from "../../types/category";
import { matchesSearchQuery } from "../../lib/searchUtils";
import "./OrdersPage.css"; // Reusing table styles
import "./ProductsPage.css";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "in_stock" | "out_of_stock" | "featured" | "archived"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const pageTitle = "Products Catalog | Sai Darshan Shopping Mart Admin";

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(
    null,
  );
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
        withTimeout(
          supabase
            .from("products")
            .select("*, category:categories(id, name, slug)")
            .order("name"),
          5000,
        ),
        withTimeout(
          supabase.from("categories").select("*").order("name"),
          5000,
        ),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setProducts((productsRes.data as Product[]) || []);
      setCategories((categoriesRes.data as Category[]) || []);
    } catch (error) {
      console.error("Error fetching products in admin:", error);
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
      name: "",
      sku: `SDM-${Date.now().toString().slice(-6)}`,
      price: 0,
      mrp: 0,
      unit_size: "1 unit",
      category_id: categories[0]?.id || "",
      is_available: true,
      is_featured: false,
      is_archived: false,
      description: "",
      image_url: "",
      variants: [
        {
          id: "v-1",
          unit_size: "1 unit",
          price: 0,
          mrp: 0,
          stock_quantity: 50,
          is_available: true,
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    const defaultVariants: ProductVariant[] =
      product.variants && product.variants.length > 0
        ? [...product.variants]
        : [
            {
              id: "v-1",
              unit_size: product.unit_size || "1 unit",
              price: product.price || 0,
              mrp: product.mrp || product.price || 0,
              stock_quantity: 50,
              is_available: product.is_available,
            },
          ];

    setEditingProduct({
      ...product,
      variants: defaultVariants,
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
      unit_size: "",
      price: editingProduct.price || 0,
      mrp: editingProduct.mrp || editingProduct.price || 0,
      stock_quantity: 50,
      is_available: true,
    };
    setEditingProduct({
      ...editingProduct,
      variants: [...currentVariants, newVariant],
    });
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: any,
  ) => {
    if (!editingProduct || !editingProduct.variants) return;
    const updated = [...editingProduct.variants];
    updated[index] = { ...updated[index], [field]: value };

    // If first variant's price or unit size changed, sync base product defaults
    const updates: Partial<Product> = { variants: updated };
    if (index === 0) {
      if (field === "price") updates.price = value;
      if (field === "mrp") updates.mrp = value;
      if (field === "unit_size") updates.unit_size = value;
    }

    setEditingProduct({ ...editingProduct, ...updates });
  };

  const handleRemoveVariant = (index: number) => {
    if (!editingProduct || !editingProduct.variants) return;
    const updated = editingProduct.variants.filter((_, i) => i !== index);
    setEditingProduct({
      ...editingProduct,
      variants: updated,
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
        price: primaryVariant
          ? primaryVariant.price
          : editingProduct.price || 0,
        mrp:
          primaryVariant?.mrp ||
          editingProduct.mrp ||
          editingProduct.price ||
          0,
        unit_size:
          primaryVariant?.unit_size || editingProduct.unit_size || "1 unit",
        description: editingProduct.description || null,
        image_url: editingProduct.image_url || null,
        is_available: editingProduct.is_available ?? true,
        is_featured: editingProduct.is_featured ?? false,
        is_archived: editingProduct.is_archived ?? false,
        variants: variants,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct.id) {
        // Update
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
      }

      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert("Failed to save product: " + (error.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !query ||
        matchesSearchQuery(p.name, p.brand, query) ||
        (p.sku && p.sku.toLowerCase().includes(query));

      const matchesCategory =
        !selectedCategory || p.category_id === selectedCategory;

      let matchesStatus = true;
      if (statusFilter === "in_stock")
        matchesStatus = p.is_available && !p.is_archived;
      else if (statusFilter === "out_of_stock")
        matchesStatus = !p.is_available && !p.is_archived;
      else if (statusFilter === "featured") matchesStatus = !!p.is_featured;
      else if (statusFilter === "archived") matchesStatus = !!p.is_archived;

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
        <div className="admin-products-header__actions">
          <button
            type="button"
            disabled={isExporting || products.length === 0}
            onClick={async () => {
              setIsExporting(true);
              try {
                await exportCatalogToExcel();
              } catch (err) {
                console.error("Export catalog error:", err);
              } finally {
                setIsExporting(false);
              }
            }}
            className="sdm-btn sdm-btn--outlined"
            title="Download full catalog Excel sheet"
          >
            <span className="material-symbols-outlined admin-btn-icon">
              {isExporting ? "hourglass_top" : "download"}
            </span>
            <span>{isExporting ? "Exporting..." : "Export Catalog (.xlsx)"}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="sdm-btn sdm-btn--outlined"
            title="Drag and drop your excel catalog"
          >
            <span className="material-symbols-outlined admin-btn-icon">
              upload_file
            </span>
            <span>Import Excel Catalog</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="sdm-btn sdm-btn--primary"
          >
            <span className="material-symbols-outlined admin-btn-icon">
              add
            </span>
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
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
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
                <td colSpan={6} className="admin-products-table-empty">
                  <div className="admin-products-empty-state">
                    <span className="material-symbols-outlined admin-products-empty-state__icon">
                      inventory_2
                    </span>
                    <h3 className="admin-products-empty-state__title">
                      No products in database yet
                    </h3>
                    <p className="admin-products-empty-state__subtitle">
                      Drag and drop your supermarket Excel price list or add
                      products manually with multiple quantity options (e.g.
                      50g, 100g, 250g tea).
                    </p>
                    <div className="admin-products-empty-state__actions">
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="sdm-btn sdm-btn--primary"
                      >
                        <span className="material-symbols-outlined admin-btn-icon">
                          upload_file
                        </span>
                        <span>Drag & Drop Excel File</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="sdm-btn sdm-btn--outlined"
                      >
                        <span className="material-symbols-outlined admin-btn-icon">
                          add
                        </span>
                        <span>Add Manually</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-products-table-empty">
                  <div className="admin-products-empty-state">
                    <span className="material-symbols-outlined admin-products-empty-state__icon admin-products-empty-state__icon--small">
                      search_off
                    </span>
                    <h4 className="admin-products-empty-state__title">
                      No matching products
                    </h4>
                    <p className="admin-products-empty-state__subtitle">
                      No items matched &ldquo;{searchQuery}&rdquo;. Try clearing
                      filters or searching another keyword.
                    </p>
                    <button
                      type="button"
                      className="sdm-btn sdm-btn--tonal"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("");
                        setStatusFilter("all");
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
                  <tr
                    key={product.id}
                    className={product.is_archived ? "admin-table-row--archived" : ""}
                  >
                    <td>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="admin-product-image"
                        />
                      ) : (
                        <div className="admin-product-image-placeholder">
                          <span className="material-symbols-outlined admin-btn-icon">
                            image
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="admin-product-title">
                        {product.name}
                      </div>
                      <div className="admin-product-meta">
                        <span className="admin-product-meta-text">
                          SKU: {product.sku || "N/A"}
                        </span>
                        {variantsCount > 1 ? (
                          <span className="admin-product-variants-badge">
                            {variantsCount} options (
                            {product.variants
                              ?.map((v) => v.unit_size)
                              .join(", ")}
                            )
                          </span>
                        ) : (
                          <span className="admin-product-meta-text">
                            {product.unit_size || "1 unit"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {categories.find((c) => c.id === product.category_id)
                        ?.name ||
                        (product as any).category?.name ||
                        "General"}
                    </td>
                    <td>
                      <div className="admin-product-price">
                        {formatPrice(product.price)}
                      </div>
                      {product.mrp && product.mrp > product.price && (
                        <div className="admin-product-mrp">
                          MRP {formatPrice(product.mrp)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="admin-product-status-list">
                        {product.is_available ? (
                          <span className="admin-badge admin-badge--delivered">
                            In Stock
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge--pending">
                            Out of Stock
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="admin-badge admin-badge--processing">
                            Featured
                          </span>
                        )}
                        {product.is_archived && (
                          <span className="admin-badge admin-badge--cancelled">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="sdm-btn sdm-btn--outlined admin-icon-btn"
                        onClick={() => handleOpenEdit(product)}
                      >
                        <span className="material-symbols-outlined admin-btn-icon--small">
                          edit
                        </span>
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
              Showing {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filteredProducts.length)} of{" "}
              {filteredProducts.length} products
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-pagination-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous page"
              >
                <span className="material-symbols-outlined admin-btn-icon--small">
                  chevron_left
                </span>
              </button>
              <span>
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                className="admin-pagination-btn"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                title="Next page"
              >
                <span className="material-symbols-outlined admin-btn-icon--small">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Excel Drag & Drop Importer Modal */}
      {isImportModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal--large">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Bulk Import Excel Catalog</h2>
              <button
                type="button"
                className="sdm-btn sdm-btn--text admin-icon-btn"
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
          <div className="admin-modal admin-modal--medium">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingProduct.id ? "Edit Product" : "Add Product"}
              </h2>
              <button
                type="button"
                className="sdm-btn sdm-btn--text admin-icon-btn"
                onClick={handleCloseModal}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              id="product-form"
              onSubmit={handleSave}
              className="admin-modal-content"
            >
              <div className="admin-form-row">
                <md-outlined-text-field
                  label="Product Name (e.g. Wagh Bakri Tea)"
                  className="admin-form-field"
                  required
                  value={editingProduct.name || ""}
                  onInput={(e: any) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                />
                <md-outlined-text-field
                  label="SKU Code"
                  className="admin-form-field"
                  required
                  value={editingProduct.sku || ""}
                  onInput={(e: any) =>
                    setEditingProduct({
                      ...editingProduct,
                      sku: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Category</label>
                <select
                  className="admin-select"
                  value={editingProduct.category_id || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Options / Variants Section */}
              <div className="admin-product-variants-section">
                <div className="admin-product-variants-header">
                  <div>
                    <h3 className="admin-product-variants-title">
                      Quantity & Pack Options (Variants)
                    </h3>
                    <p className="admin-product-variants-subtitle">
                      Add options like 50g, 100g, 250g, 500g, 1kg with their
                      respective selling price and stock.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="sdm-btn sdm-btn--tonal admin-icon-btn"
                  >
                    <span className="material-symbols-outlined admin-btn-icon--small">
                      add
                    </span>
                    <span>Add Pack Option</span>
                  </button>
                </div>

                <div className="admin-product-variants-list">
                  {(editingProduct.variants || []).map((variant, vIdx) => (
                    <div
                      key={variant.id || vIdx}
                      className="admin-product-variant-item"
                    >
                      <div>
                        <label className="admin-product-variant-label">
                          Pack / Weight
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 250g"
                          required
                          value={variant.unit_size}
                          onChange={(e) =>
                            handleUpdateVariant(
                              vIdx,
                              "unit_size",
                              e.target.value,
                            )
                          }
                          className="admin-product-variant-input"
                        />
                      </div>

                      <div>
                        <label className="admin-product-variant-label">
                          Sale Price (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="₹"
                          required
                          step="0.5"
                          value={variant.price.toString()}
                          onChange={(e) =>
                            handleUpdateVariant(
                              vIdx,
                              "price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="admin-product-variant-input"
                        />
                      </div>

                      <div>
                        <label className="admin-product-variant-label">
                          MRP (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="₹"
                          step="0.5"
                          value={variant.mrp?.toString() || ""}
                          onChange={(e) =>
                            handleUpdateVariant(
                              vIdx,
                              "mrp",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="admin-product-variant-input"
                        />
                      </div>

                      <div>
                        <label className="admin-product-variant-label">
                          Stock Units
                        </label>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={variant.stock_quantity?.toString() || "50"}
                          onChange={(e) =>
                            handleUpdateVariant(
                              vIdx,
                              "stock_quantity",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="admin-product-variant-input"
                        />
                      </div>

                      <div className="admin-product-variant-checkbox-container">
                        <label className="admin-product-variant-label">
                          In Stock
                        </label>
                        <input
                          type="checkbox"
                          checked={variant.is_available}
                          onChange={(e) =>
                            handleUpdateVariant(
                              vIdx,
                              "is_available",
                              e.target.checked,
                            )
                          }
                          className="admin-product-variant-checkbox"
                        />
                      </div>

                      <div>
                        <label
                          className="admin-product-variant-label admin-product-variant-label--hidden"
                        >
                          X
                        </label>
                        <button
                          type="button"
                          className="sdm-btn sdm-btn--text admin-icon-btn admin-icon-btn--error"
                          onClick={() => handleRemoveVariant(vIdx)}
                          title="Remove pack option"
                          disabled={(editingProduct.variants?.length || 0) <= 1}
                        >
                          <span className="material-symbols-outlined admin-btn-icon">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-form-group admin-form-group--spaced">
                <ImageUploadField
                  label="Product Image (Upload File or Paste Link)"
                  value={editingProduct.image_url || ""}
                  onChange={(url) =>
                    setEditingProduct({ ...editingProduct, image_url: url })
                  }
                  helpText="Upload product packaging image from your device, or paste a link."
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  Description (Optional)
                </label>
                <textarea
                  className="admin-select"
                  rows={3}
                  value={editingProduct.description || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-form-row admin-form-row--spaced">
                <label className="admin-product-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_available ?? true}
                    onChange={(e: any) =>
                      setEditingProduct({
                        ...editingProduct,
                        is_available: e.target.checked,
                      })
                    }
                    className="admin-product-variant-checkbox"
                  />
                  Overall In Stock
                </label>

                <label className="admin-product-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_featured ?? false}
                    onChange={(e: any) =>
                      setEditingProduct({
                        ...editingProduct,
                        is_featured: e.target.checked,
                      })
                    }
                    className="admin-product-variant-checkbox"
                  />
                  Featured Item
                </label>

                <label className="admin-product-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_archived ?? false}
                    onChange={(e: any) =>
                      setEditingProduct({
                        ...editingProduct,
                        is_archived: e.target.checked,
                      })
                    }
                    className="admin-product-variant-checkbox"
                  />
                  Archived (Hidden from Store)
                </label>
              </div>
            </form>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="sdm-btn sdm-btn--text"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sdm-btn sdm-btn--primary"
                form="product-form"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
