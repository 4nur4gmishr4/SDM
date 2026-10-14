import { useMemo } from 'react';
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

  // Curate a vibrant, multi-brand showcase: ensure maximum diversity across top supermarket categories
  const displayedFeaturedProducts = useMemo(() => {
    if (!featuredProducts || featuredProducts.length === 0) return [];
    const seenIds = new Set<string>();
    const diverse: typeof featuredProducts = [];

    // Prioritize top FMCG household hero brands
    const heroPriority = [
      'amul', 'maggi', 'cadbury', 'colgate', 'surf excel', 'fortune',
      'britannia', "lay's", 'lays', 'dettol', 'nescafe', 'parle',
      'good knight', 'dove', 'tata', 'vim', 'himalaya', 'kurkure',
      'haldiram', 'aashirvaad', 'whisper', 'head & shoulders', 'sunsilk'
    ];

    // First pass: Pick 1 best product from each hero brand
    for (const hero of heroPriority) {
      const match = featuredProducts.find(p => {
        const pBrand = (p.brand || p.name.split(' ')[0]).toLowerCase();
        const pName = p.name.toLowerCase();
        return (pBrand.includes(hero) || pName.includes(hero)) && p.image_url;
      });
      if (match && !seenIds.has(match.id)) {
        seenIds.add(match.id);
        diverse.push(match);
        if (diverse.length >= 16) break;
      }
    }

    // Second pass: Fill remaining slots with distinct brands
    if (diverse.length < 16) {
      const brandCounts = new Map<string, number>();
      diverse.forEach(d => {
        const b = (d.brand || d.name.split(' ')[0]).toLowerCase();
        brandCounts.set(b, (brandCounts.get(b) || 0) + 1);
      });

      for (const p of featuredProducts) {
        if (!p.image_url || seenIds.has(p.id)) continue;
        const b = (p.brand || p.name.split(' ')[0]).toLowerCase();
        if ((brandCounts.get(b) || 0) === 0) {
          seenIds.add(p.id);
          brandCounts.set(b, 1);
          diverse.push(p);
          if (diverse.length >= 16) break;
        }
      }
    }

    return diverse.length > 0 ? diverse : featuredProducts.slice(0, 16);
  }, [featuredProducts]);

  return (
    <div className="layout-container home-page">
      <SeoHead 
        title="Supermarket Near Me | Sai Darshan Shopping Mart Jabalpur"
        description="Looking for a supermarket near me in Jabalpur? Order fresh groceries, vegetables, and daily essentials online at Sai Darshan Shopping Mart with fast doorstep delivery."
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
            <span>View All {featuredProducts.length > 0 ? `(${featuredProducts.length})` : ''}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </Link>
        </div>
        <ProductGrid products={displayedFeaturedProducts} isLoading={productsLoading} skeletonCount={8} />
      </section>

      {/* Supermarket Value & Trust Guarantees */}
      <WatermarkBanner />
    </div>
  );
}
