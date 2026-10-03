import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { SearchBar } from '../../components/customer/SearchBar';
import { ProductGrid } from '../../components/customer/ProductGrid';
import { WatermarkBanner, Skeleton, SeoHead } from '../../components/common';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import './ShopPage.css';

export function ShopPage() {
  const navigate = useNavigate();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams] = useSearchParams();
  
  // URL sync query
  const urlQuery = searchParams.get('q') || '';
  
  // Local state for immediate filtering
  const [localQuery, setLocalQuery] = useState(urlQuery);
  const [sortBy, setSortBy] = useState('relevance');
  const [inStockOnly, setInStockOnly] = useState(false);

  const { categories, isLoading: categoriesLoading } = useCategories();
  const currentCategory = categories.find(c => c.slug === categorySlug);

  // Fetch all products for the category
  const { products, isLoading } = useProducts({
    categoryId: currentCategory?.id,
    fetchAll: true
  });

  // Keep local query in sync if URL changes externally
  useEffect(() => {
    setLocalQuery(urlQuery);
  }, [urlQuery]);

  // Client-side filtering and sorting
  const displayedProducts = useMemo(() => {
    let filtered = [...products];

    // Exclude archived
    filtered = filtered.filter(p => !p.is_archived);

    // Apply immediate search filter
    if (localQuery.trim()) {
      const q = localQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    // Apply In Stock filter
    if (inStockOnly) {
      filtered = filtered.filter(p => p.is_available);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'relevance' && localQuery.trim()) {
        const q = localQuery.toLowerCase().trim();
        const aExact = a.name.toLowerCase() === q ? 1 : 0;
        const bExact = b.name.toLowerCase() === q ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        
        const aStarts = a.name.toLowerCase().startsWith(q) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        
        return 0;
      }
      
      if (sortBy === 'newest') {
        const dateA = a.created_at || '';
        const dateB = b.created_at || '';
        return dateB.localeCompare(dateA);
      }
      if (sortBy === 'featured') {
        if (a.is_featured === b.is_featured) return 0;
        return a.is_featured ? -1 : 1;
      }
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0;
    });

    return filtered;
  }, [products, localQuery, sortBy, inStockOnly]);

  const pageTitle = currentCategory ? `${currentCategory.name} - Sai Darshan Shopping Mart` : 'All Products - Sai Darshan Shopping Mart';
  const isInitialLoading = isLoading && products.length === 0;

  return (
    <div className="layout-container shop-page">
      <SeoHead
        title={pageTitle}
        description={`Shop ${currentCategory ? currentCategory.name.toLowerCase() : 'all groceries'} at Sai Darshan Shopping Mart. Fast delivery in Jabalpur.`}
        canonicalUrl={categorySlug ? `/shop/${categorySlug}` : '/shop'}
      />

      <header className="shop-page__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h1 className="shop-page__title">{currentCategory ? currentCategory.name : 'All Products'}</h1>
          {currentCategory?.is_offer_category && (
            <span className="shop-page__offer-pill">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>local_offer</span>
              Special Promotional Offer
            </span>
          )}
        </div>
        {currentCategory?.description && (
          <p className="shop-page__category-desc">{currentCategory.description}</p>
        )}
      </header>

      <div className="shop-page__search-container">
        <SearchBar 
          initialQuery={localQuery} 
          onInstantSearch={(q) => setLocalQuery(q)} 
        />
      </div>

      <div className="shop-page__layout">
        {/* Desktop Sidebar */}
        <aside className="shop-page__sidebar">
          <div className="shop-page__sidebar-section">
            <h3 className="shop-page__sidebar-title">Categories</h3>
            <div className="shop-page__category-list">
              <Link 
                to="/shop" 
                className={`shop-page__category-link ${!categorySlug ? 'shop-page__category-link--active' : ''}`}
              >
                All Products
              </Link>
              {categoriesLoading && categories.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    width={`${70 + (i % 3) * 10}%`}
                    height="28px"
                    variant="rounded"
                    style={{ margin: '4px 0', borderRadius: '8px' }}
                  />
                ))
              ) : (
                categories.map(category => (
                  <Link 
                    key={category.id} 
                    to={`/shop/${category.slug}`} 
                    className={`shop-page__category-link ${category.slug === categorySlug ? 'shop-page__category-link--active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>{category.name}</span>
                    {category.is_offer_category && (
                      <span className="shop-category-badge--offer">Offer</span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="shop-page__main">
          {/* Quick Filter & Sort Toolbar */}
          <div className="shop-page__results-header">
            <span className="shop-page__results-count">
              {isInitialLoading ? (
                'Loading fresh products...'
              ) : (
                <>
                  Showing {displayedProducts.length} {displayedProducts.length === 1 ? 'item' : 'items'}
                  {localQuery && <span> for "{localQuery}"</span>}
                </>
              )}
            </span>
            
            <div className="shop-page__filters">
              {/* Category Dropdown for Mobile & Tablet (matches Relevance dropdown style) */}
              <div className="shop-select-wrap shop-category-select-wrap">
                <span className="material-symbols-outlined shop-select-icon">grid_view</span>
                <select 
                  className={`shop-select-input ${categorySlug ? 'shop-select-input--active' : ''}`}
                  value={categorySlug || ''}
                  onChange={(e) => {
                    const slug = e.target.value;
                    navigate(slug ? `/shop/${slug}` : '/shop');
                  }}
                  aria-label="Filter products by category"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}{category.is_offer_category ? ' (Offer)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* In Stock Toggle Chip */}
              <button
                type="button"
                className={`shop-pill-chip ${inStockOnly ? 'shop-pill-chip--active' : ''}`}
                onClick={() => setInStockOnly(!inStockOnly)}
                aria-pressed={inStockOnly}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {inStockOnly ? 'check_circle' : 'inventory_2'}
                </span>
                <span>In Stock Only</span>
              </button>

              {/* Native Google Pill Sort Select */}
              <div className="shop-select-wrap shop-sort-wrap">
                <span className="material-symbols-outlined shop-select-icon">sort</span>
                <select 
                  className="shop-select-input shop-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort products by"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="featured">Featured First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          <ProductGrid products={displayedProducts} isLoading={isInitialLoading} skeletonCount={12} />
        </div>
      </div>

      {/* Supermarket Value & Trust Guarantees */}
      <WatermarkBanner />
    </div>
  );
}
