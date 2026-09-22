import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SearchBar } from '../../components/customer/SearchBar';
import { ProductGrid } from '../../components/customer/ProductGrid';
import './ShopPage.css';

import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';

export function ShopPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams] = useSearchParams();
  
  // URL sync query
  const urlQuery = searchParams.get('q') || '';
  
  // Local state for immediate filtering
  const [localQuery, setLocalQuery] = useState(urlQuery);
  const [sortBy, setSortBy] = useState('relevance');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { categories } = useCategories();
  const currentCategory = categories.find(c => c.slug === categorySlug);

  // Fetch all products for the category (no search query sent to hook)
  // This allows lightning fast client-side filtering.
  const { products, isLoading } = useProducts({
    categoryId: currentCategory?.id,
    fetchAll: true // Let's fetch all (or all active) and filter locally
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
        // Simple relevance: exact match in name first, then starts with, then includes
        const q = localQuery.toLowerCase().trim();
        const aExact = a.name.toLowerCase() === q ? 1 : 0;
        const bExact = b.name.toLowerCase() === q ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        
        const aStarts = a.name.toLowerCase().startsWith(q) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        
        return 0; // fallback to default order
      }
      
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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

  const pageTitle = currentCategory ? `${currentCategory.name} - Sai Darshan Mart` : 'All Products - Sai Darshan Mart';
  const isInitialLoading = isLoading && products.length === 0;

  return (
    <div className="layout-container shop-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Shop ${currentCategory ? currentCategory.name.toLowerCase() : 'all groceries'} at Sai Darshan Mart. Fast delivery in Jabalpur.`} />
      </Helmet>

      <header className="shop-page__header">
        <h1 className="shop-page__title">{currentCategory ? currentCategory.name : 'All Products'}</h1>
      </header>

      <div className="shop-page__search-container">
        <SearchBar 
          initialQuery={localQuery} 
          onInstantSearch={(q) => setLocalQuery(q)} 
        />
      </div>

      <div className="shop-page__layout">
        {/* Mobile Filters FAB */}
        <div className="shop-page__mobile-fab">
          <md-fab 
            variant="tertiary" 
            aria-label="Filters" 
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <md-icon slot="icon">filter_list</md-icon>
          </md-fab>
        </div>

        {/* Sidebar Backdrop for Mobile */}
        {isMobileFiltersOpen && (
          <div 
            className="shop-page__sidebar-backdrop"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
        )}

        <aside className={`shop-page__sidebar ${isMobileFiltersOpen ? 'shop-page__sidebar--open' : ''}`}>
          <div className="shop-page__sidebar-header-mobile">
            <h2 className="shop-page__sidebar-mobile-title">Filters</h2>
            <md-icon-button onClick={() => setIsMobileFiltersOpen(false)}>
              <md-icon>close</md-icon>
            </md-icon-button>
          </div>

          <div className="shop-page__sidebar-section">
            <h3 className="shop-page__sidebar-title">Categories</h3>
            <div className="shop-page__category-list">
              <Link 
                to="/shop" 
                className={`shop-page__category-link ${!categorySlug ? 'shop-page__category-link--active' : ''}`}
              >
                All Products
              </Link>
              {categories.map(category => (
                <Link 
                  key={category.id} 
                  to={`/shop/${category.slug}`} 
                  className={`shop-page__category-link ${category.slug === categorySlug ? 'shop-page__category-link--active' : ''}`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="shop-page__sidebar-section">
            <h3 className="shop-page__sidebar-title">Filters</h3>
            <label className="shop-page__filter-row">
              <md-checkbox 
                checked={inStockOnly || undefined} 
                onInput={(e: any) => setInStockOnly(e.target.checked)}
              ></md-checkbox>
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        <div className="shop-page__main">
          <div className="shop-page__results-header">
            <span className="shop-page__results-count">
              {isInitialLoading ? (
                'Loading fresh products...'
              ) : (
                <>
                  Showing {displayedProducts.length} {displayedProducts.length === 1 ? 'result' : 'results'}
                  {localQuery && <span> for "{localQuery}"</span>}
                </>
              )}
            </span>
            
            <div className="shop-page__filters">
              <md-outlined-select 
                label="Sort by" 
                onInput={(e: any) => setSortBy(e.target.value)}
              >
                <md-select-option value="relevance" selected={sortBy === 'relevance'}>Relevance</md-select-option>
                <md-select-option value="newest" selected={sortBy === 'newest'}>Newest Arrivals</md-select-option>
                <md-select-option value="featured" selected={sortBy === 'featured'}>Featured First</md-select-option>
                <md-select-option value="price_asc" selected={sortBy === 'price_asc'}>Price (Low to High)</md-select-option>
                <md-select-option value="price_desc" selected={sortBy === 'price_desc'}>Price (High to Low)</md-select-option>
                <md-select-option value="name" selected={sortBy === 'name'}>Name (A-Z)</md-select-option>
              </md-outlined-select>
            </div>
          </div>

          <ProductGrid products={displayedProducts} isLoading={isInitialLoading} skeletonCount={12} />
        </div>
      </div>
    </div>
  );
}
