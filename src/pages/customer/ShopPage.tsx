import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { SearchBar } from '../../components/customer/SearchBar';
import { VirtualizedProductGrid } from '../../components/customer/VirtualizedProductGrid';
import { WatermarkBanner, Skeleton, SeoHead } from '../../components/common';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { getCategoryMaterialIcon } from '../../components/customer/CategoryNav';
import './ShopPage.css';

import { matchesSearchQuery, scoreProductMatch } from '../../lib/searchUtils';

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
  const [visibleCount, setVisibleCount] = useState(48);
  const loaderRef = useRef<HTMLDivElement>(null);
  const activeSidebarCatRef = useRef<HTMLAnchorElement>(null);

  const { categories, isLoading: categoriesLoading } = useCategories();
  const currentCategory = categories.find(c => c.slug === categorySlug);

  // Fetch all products for the category with server-side search capability
  const { products, isLoading, totalCount } = useProducts({
    categoryId: currentCategory?.id,
    searchQuery: localQuery.trim() || undefined,
    fetchAll: true
  });

  // Keep local query in sync if URL changes externally
  useEffect(() => {
    setLocalQuery(urlQuery);
  }, [urlQuery]);

  // Reset pagination window whenever filters change
  useEffect(() => {
    setVisibleCount(48);
  }, [categorySlug, localQuery, sortBy, inStockOnly]);

  // Auto-scroll active category in desktop sidebar rundown smoothly
  useEffect(() => {
    if (activeSidebarCatRef.current) {
      activeSidebarCatRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [categorySlug]);

  // Client-side filtering and sorting
  const displayedProducts = useMemo(() => {
    let filtered = [...products];

    // Exclude archived
    filtered = filtered.filter(p => !p.is_archived);

    // Apply immediate search filter with multi-token & bilingual synonym matching
    if (localQuery.trim()) {
      filtered = filtered.filter(p => matchesSearchQuery(p.name, p.brand, localQuery));
    }

    // Apply In Stock filter
    if (inStockOnly) {
      filtered = filtered.filter(p => p.is_available);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'relevance') {
        if (localQuery.trim()) {
          const scoreA = scoreProductMatch(a.name, a.brand, localQuery, a.is_featured);
          const scoreB = scoreProductMatch(b.name, b.brand, localQuery, b.is_featured);
          if (scoreA !== scoreB) return scoreB - scoreA;
          return a.name.localeCompare(b.name);
        }

        // When browsing without text search, curated featured products are recommended at the very top
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
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

  // Automatic Infinite Scroll: automatically load next batch of products when scrolling near bottom
  useEffect(() => {
    if (visibleCount >= displayedProducts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 48, displayedProducts.length));
        }
      },
      { rootMargin: '400px' }
    );

    const target = loaderRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
      observer.disconnect();
    };
  }, [visibleCount, displayedProducts.length]);

  const pageTitle = currentCategory ? `${currentCategory.name} Online in Jabalpur | Sai Darshan Shopping Mart` : 'Shop All Groceries in Jabalpur | Sai Darshan Shopping Mart';
  const isInitialLoading = isLoading && products.length === 0;

  return (
    <div className="layout-container shop-page">
      <SeoHead
        title={pageTitle}
        description={currentCategory ? `Buy ${currentCategory.name.toLowerCase()} online at lowest prices from Sai Darshan Shopping Mart Jabalpur. Fast doorstep grocery delivery. "There is only one Boss: The Customer."` : 'Order fresh groceries, daily staples, dairy & essentials online at Sai Darshan Shopping Mart Jabalpur with fast doorstep delivery. "There is only one Boss: The Customer."'}
        canonicalUrl={categorySlug ? `/shop/${categorySlug}` : '/shop'}
      />

      <header className="shop-page__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 className="shop-page__title">{currentCategory ? currentCategory.name : 'All Products'}</h1>
          <span className="shop-page__total-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>inventory_2</span>
            {currentCategory ? `${displayedProducts.length.toLocaleString()} Products in Category` : `Total ${totalCount.toLocaleString()} Products`}
          </span>
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
                ref={!categorySlug ? activeSidebarCatRef : undefined}
                to="/shop" 
                className={`shop-page__category-link ${!categorySlug ? 'shop-page__category-link--active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: !categorySlug ? 'inherit' : 'var(--md-sys-color-primary, #0D652D)' }}>apps</span>
                  <span>All Products</span>
                </div>
                <span className="shop-category-count-badge">{totalCount.toLocaleString()}</span>
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
                categories.map(category => {
                  const icon = getCategoryMaterialIcon(category);
                  return (
                    <Link 
                      key={category.id} 
                      ref={category.slug === categorySlug ? activeSidebarCatRef : undefined}
                      to={`/shop/${category.slug}`} 
                      className={`shop-page__category-link ${category.slug === categorySlug ? 'shop-page__category-link--active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: category.slug === categorySlug ? 'inherit' : 'var(--md-sys-color-primary, #0D652D)' }}>{icon}</span>
                        <span>{category.name}</span>
                      </div>
                      {category.is_offer_category && (
                        <span className="shop-category-badge--offer">Offer</span>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <div className="shop-page__main">
          {/* Quick Filter & Sort Toolbar */}
          <div className="shop-page__results-header">
            <div className="shop-page__results-count-container">
              <span className="shop-page__results-count">
                {isInitialLoading ? (
                  `Loading store catalog (${totalCount.toLocaleString()} products)...`
                ) : (
                  <>
                    Showing <strong>{Math.min(visibleCount, displayedProducts.length).toLocaleString()}</strong> of <strong>{totalCount.toLocaleString()}</strong> Products
                    {localQuery && <span> for "{localQuery}"</span>}
                  </>
                )}
              </span>
              {!isInitialLoading && (
                <span className="shop-page__catalog-total-pill" title="Total active supermarket inventory">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
                  <span>Total Store Catalog: <strong>{totalCount.toLocaleString()}</strong> Products</span>
                </span>
              )}
            </div>
            
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
                  <option value="">All Categories ({totalCount.toLocaleString()} Products)</option>
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

          <VirtualizedProductGrid
            products={displayedProducts.slice(0, visibleCount)}
            isLoading={isInitialLoading}
            skeletonCount={12}
            virtualizeThreshold={24}
          />

          {/* Automatic Infinite Scroll Loader (No Manual Button) */}
          {visibleCount < displayedProducts.length && (
            <div ref={loaderRef} className="shop-page__infinite-loader" aria-live="polite">
              <div className="shop-page__infinite-spinner" />
              <span>Loading more groceries...</span>
            </div>
          )}
        </div>
      </div>

      {/* Supermarket Value & Trust Guarantees */}
      <WatermarkBanner />
    </div>
  );
}
