import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SearchBar } from '../../components/customer/SearchBar';
import { CategoryNav } from '../../components/customer/CategoryNav';
import { ProductGrid } from '../../components/customer/ProductGrid';
import { OfferBanner } from '../../components/customer/OfferBanner';
import './HomePage.css';

import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useBanners } from '../../hooks/useBanners';

export function HomePage() {
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { products: featuredProducts, isLoading: productsLoading } = useProducts({ isFeatured: true });
  const { banners, isLoading: bannersLoading } = useBanners();

  const mainBanner = banners.length > 0 ? banners[0] : null;

  if (categoriesLoading || productsLoading || bannersLoading) {
    return (
      <div className="layout-container home-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <md-circular-progress indeterminate></md-circular-progress>
      </div>
    );
  }
  return (
    <div className="layout-container home-page">
      <Helmet>
        <title>Sai Darshan Mart - Online Grocery Shopping in Jabalpur</title>
        <meta name="description" content="Shop fresh groceries, vegetables, and daily essentials online at Sai Darshan Mart. Fast delivery in Jabalpur." />
      </Helmet>

      {/* Search Section */}
      <section className="home-page__section" style={{ marginTop: '24px' }}>
        <SearchBar />
      </section>

      {/* Main Banner / Hero */}
      <section className="home-page__hero">
        <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--md-sys-color-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--md-sys-color-on-primary-container)' }}>storefront</span>
        </div>
        <div className="home-page__hero-content">
          <h2 className="home-page__hero-title">Welcome to Sai Darshan Mart</h2>
          <p>Your local supermarket in Jabalpur.</p>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="home-page__section">
        <div className="home-page__section-header">
          <h2 className="home-page__section-title">Shop by Category</h2>
        </div>
        <CategoryNav categories={categories} />
      </section>

      {mainBanner && (
        <section className="home-page__section">
          <OfferBanner banner={mainBanner} />
        </section>
      )}

      {/* Featured Products */}
      <section className="home-page__section">
        <div className="home-page__section-header">
          <h2 className="home-page__section-title">Featured Products</h2>
          <Link to="/shop" className="home-page__section-link">
            View All <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

    </div>
  );
}
