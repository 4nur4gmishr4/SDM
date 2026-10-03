import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/common';
import { SearchBar } from '../../components/customer/SearchBar';
import { CategoryNav } from '../../components/customer/CategoryNav';
import { ProductGrid } from '../../components/customer/ProductGrid';
import { IOSBannerCarousel } from '../../components/customer/IOSBannerCarousel';
import { DesktopHeroLandingBrief } from '../../components/customer/DesktopHeroLandingBrief';
import { WatermarkBanner } from '../../components/common';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useBanners } from '../../hooks/useBanners';
import './HomePage.css';

export function HomePage() {
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { products: featuredProducts, isLoading: productsLoading } = useProducts({ isFeatured: true });
  const { banners, isLoading: bannersLoading } = useBanners();

  return (
    <div className="layout-container home-page">
      <SeoHead 
        title="Sai Darshan Shopping Mart - Online Grocery Shopping in Jabalpur"
        description="Shop fresh groceries, vegetables, and daily essentials online at Sai Darshan Shopping Mart. Fast delivery in Jabalpur."
        canonicalUrl="/"
      />

      {/* Instant Search Bar */}
      <section className="home-page__search-section">
        <SearchBar />
      </section>

      {/* Symmetrical Hero Split Showcase: Left Store Landing Hero + Right Banner Carousel */}
      <section className="home-page__hero-split-section">
        <DesktopHeroLandingBrief />
        <div className="home-page__hero-banner-wrap">
          <IOSBannerCarousel 
            banners={banners} 
            isLoading={bannersLoading} 
            slideDuration={4800} 
          />
        </div>
      </section>

      {/* Category Navigation */}
      <section className="home-page__section">
        <div className="home-page__section-header">
          <h2 className="home-page__section-title">Shop by Category</h2>
        </div>
        <CategoryNav categories={categories} isLoading={categoriesLoading} />
      </section>

      {/* Featured Products */}
      <section className="home-page__section">
        <div className="home-page__section-header">
          <h2 className="home-page__section-title">Featured Products</h2>
          <Link to="/shop" className="home-page__section-link">
            <span>View All</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </Link>
        </div>
        <ProductGrid products={featuredProducts} isLoading={productsLoading} skeletonCount={8} />
      </section>

      {/* Supermarket Value & Trust Guarantees */}
      <WatermarkBanner />
    </div>
  );
}
