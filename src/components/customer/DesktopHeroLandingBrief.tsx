import { useState } from 'react';
import { Link } from 'react-router-dom';
import { openWhatsApp, STORE_WHATSAPP_NUMBER } from '../../lib/orderUtils';
import './DesktopHeroLandingBrief.css';

interface DesktopHeroLandingBriefProps {
  className?: string;
}

type ActiveTab = 'whatsapp' | 'offers' | 'store';

export function DesktopHeroLandingBrief({ className = '' }: DesktopHeroLandingBriefProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('whatsapp');
  const [orderText, setOrderText] = useState('');

  const storeWhatsAppNumber = import.meta.env.VITE_STORE_WHATSAPP_NUMBER || STORE_WHATSAPP_NUMBER;

  const handleSendWhatsAppOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanList = orderText.trim();
    const message = cleanList
      ? `Namaste Sai Darshan Mart!\n\nI want to order the following grocery items:\n${cleanList}\n\nPlease confirm availability and delivery to my Jabalpur address.`
      : 'Namaste Sai Darshan Mart! I want to order daily groceries from your store. Please share details.';

    openWhatsApp(storeWhatsAppNumber, message);
  };

  return (
    <aside className={`desktop-hero-landing ${className}`} aria-label="Sai Darshan Mart Storefront Desk">
      {/* 1. Header: Authentic Store Title & Local Hub */}
      <div className="desktop-hero__header">
        <div className="desktop-hero__brand-meta">
          <div className="desktop-hero__brand-row">
            <span className="material-symbols-outlined desktop-hero__brand-icon">storefront</span>
            <h2 className="desktop-hero__store-title">Sai Darshan Mart</h2>
          </div>
          <span className="desktop-hero__store-subtitle">1117 Sanjeevni Nagar, Jabalpur</span>
        </div>

        <div className="desktop-hero__timing-badge">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
          <span>Open: 8:00 AM – 10:00 PM</span>
        </div>
      </div>

      {/* 2. Interactive Segmented Navigation Tabs */}
      <nav className="desktop-hero__tabs-bar" aria-label="Store services">
        <button
          type="button"
          className={`desktop-hero__tab-btn ${activeTab === 'whatsapp' ? 'desktop-hero__tab-btn--active' : ''}`}
          onClick={() => setActiveTab('whatsapp')}
        >
          <span className="material-symbols-outlined">chat</span>
          <span>WhatsApp Order</span>
        </button>

        <button
          type="button"
          className={`desktop-hero__tab-btn ${activeTab === 'offers' ? 'desktop-hero__tab-btn--active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          <span className="material-symbols-outlined">local_offer</span>
          <span>Today&apos;s Offers</span>
        </button>

        <button
          type="button"
          className={`desktop-hero__tab-btn ${activeTab === 'store' ? 'desktop-hero__tab-btn--active' : ''}`}
          onClick={() => setActiveTab('store')}
        >
          <span className="material-symbols-outlined">info</span>
          <span>Store & Delivery</span>
        </button>
      </nav>

      {/* 3. Tab Content Panels */}
      <div className="desktop-hero__tab-content">
        {/* --- Tab 1: WhatsApp Fast Order Tool --- */}
        {activeTab === 'whatsapp' && (
          <form className="desktop-hero__whatsapp-panel" onSubmit={handleSendWhatsAppOrder}>
            <p className="desktop-hero__panel-intro">
              Have a handwritten or typed grocery list? Paste your items below — we will pack and deliver them to your doorstep in Jabalpur.
            </p>

            <div className="desktop-hero__input-wrapper">
              <textarea
                className="desktop-hero__order-textarea"
                placeholder="e.g. 5kg Aashirvaad Atta, 1L Amul Milk, 1kg Sugar, 500g Cow Ghee, 1 Vim Bar..."
                value={orderText}
                onChange={(e) => setOrderText(e.target.value)}
                aria-label="Grocery shopping list"
              />

              <button type="submit" className="desktop-hero__whatsapp-cta-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                <span>Send List to Store WhatsApp</span>
              </button>
            </div>
          </form>
        )}

        {/* --- Tab 2: Live Store Offers List --- */}
        {activeTab === 'offers' && (
          <div className="desktop-hero__offers-panel">
            <Link to="/shop?offer=bogo" className="desktop-hero__offer-item">
              <div className="desktop-hero__offer-left">
                <span className="desktop-hero__offer-tag">BOGO</span>
                <div>
                  <div className="desktop-hero__offer-title">Buy 1 Get 1 Free</div>
                  <div className="desktop-hero__offer-sub">Exclusive deals on snacks, namkeen & packaged foods</div>
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </Link>

            <Link to="/shop?offer=multibuy" className="desktop-hero__offer-item">
              <div className="desktop-hero__offer-left">
                <span className="desktop-hero__offer-tag" style={{ backgroundColor: 'rgba(234, 134, 0, 0.1)', color: '#ea8600' }}>SAVE MORE</span>
                <div>
                  <div className="desktop-hero__offer-title">Buy More, Save More</div>
                  <div className="desktop-hero__offer-sub">Bulk discounts on monthly kitchen staples & family packs</div>
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </Link>

            <Link to="/shop?offer=midmonth" className="desktop-hero__offer-item">
              <div className="desktop-hero__offer-left">
                <span className="desktop-hero__offer-tag" style={{ backgroundColor: 'rgba(26, 115, 232, 0.1)', color: '#1a73e8' }}>MID-MONTH</span>
                <div>
                  <div className="desktop-hero__offer-title">Mid-Month Super Savings</div>
                  <div className="desktop-hero__offer-sub">Special discounts on household cleaning & dairy</div>
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </Link>
          </div>
        )}

        {/* --- Tab 3: Store & Delivery Details --- */}
        {activeTab === 'store' && (
          <div className="desktop-hero__info-panel">
            <div className="desktop-hero__info-row">
              <span className="material-symbols-outlined desktop-hero__info-icon">store</span>
              <div className="desktop-hero__info-text">
                <strong>Supermarket Location</strong>
                <span>1117 Sanjeevni Nagar, Jabalpur, Madhya Pradesh 482003</span>
              </div>
            </div>

            <div className="desktop-hero__info-row">
              <span className="material-symbols-outlined desktop-hero__info-icon">local_shipping</span>
              <div className="desktop-hero__info-text">
                <strong>Fast Citywide Home Delivery</strong>
                <span>Free delivery on orders ₹499+. Safe Cash on Delivery & UPI accepted.</span>
              </div>
            </div>

            <div className="desktop-hero__info-row">
              <span className="material-symbols-outlined desktop-hero__info-icon">verified_user</span>
              <div className="desktop-hero__info-text">
                <strong>Our Philosophy</strong>
                <span>&ldquo;There is only one Boss: The Customer.&rdquo; Fresh goods with honest pricing.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Footer Utility Strip (Delivery Promise & Direct Call) */}
      <div className="desktop-hero__footer">
        <div className="desktop-hero__footer-badge">
          <span className="material-symbols-outlined">local_shipping</span>
          <span>Free Delivery Above ₹499</span>
        </div>

        <a href="tel:7999157430" className="desktop-hero__footer-phone" title="Call Sai Darshan Mart">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>call</span>
          <span>+91 79991 57430</span>
        </a>
      </div>
    </aside>
  );
}
