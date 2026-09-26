import { Link } from 'react-router-dom';
import { openWhatsApp, STORE_WHATSAPP_NUMBER } from '../../lib/orderUtils';
import './DesktopHeroLandingBrief.css';

interface DesktopHeroLandingBriefProps {
  className?: string;
}

export function DesktopHeroLandingBrief({ className = '' }: DesktopHeroLandingBriefProps) {
  const storeWhatsAppNumber = import.meta.env.VITE_STORE_WHATSAPP_NUMBER || STORE_WHATSAPP_NUMBER;

  const handleWhatsAppQuickOrder = () => {
    const defaultMsg = 'Namaste Sai Darshan Mart! I want to order daily essentials from your online store.';
    openWhatsApp(storeWhatsAppNumber, defaultMsg);
  };

  const trendingCategories = [
    { label: 'Specials', slug: 'sai-darshan-specials', icon: 'star' },
    { label: 'Atta & Dals', slug: 'food-grains-atta-dals', icon: 'grain' },
    { label: 'Fresh Dairy', slug: 'dairy-products', icon: 'egg' },
    { label: 'Bakery', slug: 'bakery-products', icon: 'bakery_dining' },
    { label: 'Oils & Ghee', slug: 'cooking-oils-ghee', icon: 'oil_barrel' },
    { label: 'Chocolates', slug: 'chocolates-confectionery', icon: 'cookie' },
  ];

  return (
    <aside className={`desktop-hero-landing ${className}`} aria-label="Store Showcase">
      {/* 1. Top Live Status Bar */}
      <div className="desktop-hero__top-bar">
        <div className="desktop-hero__status-badge">
          <span className="desktop-hero__pulse-dot" />
          <span>STORE OPEN • 8:00 AM – 10:30 PM</span>
        </div>
        <div className="desktop-hero__hub-pill">
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>location_on</span>
          <span>Jabalpur Express Hub</span>
        </div>
      </div>

      {/* 2. Brand Brief & Headings */}
      <div className="desktop-hero__content">
        <h2 className="desktop-hero__title">
          <span className="desktop-hero__title-gradient">Sai Darshan Mart</span>
        </h2>
        <h3 className="desktop-hero__tagline">
          Jabalpur&apos;s Trusted Mega Grocery & Daily Essentials Store
        </h3>
        <p className="desktop-hero__description">
          Over 42,000+ handpicked products across 18 specialized departments — from fresh dairy & staples to plasticware, stationery & electronics at guaranteed wholesale savings.
        </p>
      </div>

      {/* 3. Bento Live Stats Grid (4 interactive tiles) */}
      <div className="desktop-hero__bento-grid">
        <div className="desktop-hero__bento-card">
          <div className="desktop-hero__bento-icon">
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <span className="desktop-hero__bento-val">30-45 Min</span>
          <span className="desktop-hero__bento-lbl">Express Delivery</span>
        </div>

        <div className="desktop-hero__bento-card">
          <div className="desktop-hero__bento-icon">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <span className="desktop-hero__bento-val">42,000+</span>
          <span className="desktop-hero__bento-lbl">Store Items</span>
        </div>

        <div className="desktop-hero__bento-card">
          <div className="desktop-hero__bento-icon">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <span className="desktop-hero__bento-val">₹0 Delivery</span>
          <span className="desktop-hero__bento-lbl">Orders ₹499+</span>
        </div>

        <div className="desktop-hero__bento-card">
          <div className="desktop-hero__bento-icon">
            <span className="material-symbols-outlined">verified</span>
          </div>
          <span className="desktop-hero__bento-val">100% Pure</span>
          <span className="desktop-hero__bento-lbl">Quality Assured</span>
        </div>
      </div>

      {/* 4. Action Row (WhatsApp Quick Order + Shop Catalog) */}
      <div className="desktop-hero__actions">
        <button
          type="button"
          className="desktop-hero__btn-whatsapp"
          onClick={handleWhatsAppQuickOrder}
          title="Send your shopping list directly on WhatsApp"
        >
          <span className="material-symbols-outlined desktop-hero__btn-whatsapp-icon">chat</span>
          <div className="desktop-hero__btn-whatsapp-text">
            <span className="desktop-hero__btn-whatsapp-main">Order via WhatsApp</span>
            <span className="desktop-hero__btn-whatsapp-sub">Send list, we pack & deliver</span>
          </div>
        </button>

        <Link to="/shop" className="desktop-hero__btn-shop">
          <span>Explore Store</span>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
        </Link>
      </div>

      {/* 5. Trending Category Quick-Pills */}
      <div className="desktop-hero__pills-wrapper">
        <span className="desktop-hero__pills-label">Trending:</span>
        {trendingCategories.map((cat) => (
          <Link
            key={cat.slug}
            to={`/shop/${cat.slug}`}
            className="desktop-hero__pill"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{cat.icon}</span>
            <span>{cat.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
