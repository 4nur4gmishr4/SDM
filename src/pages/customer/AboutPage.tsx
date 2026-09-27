import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { useStoreMedia } from '../../hooks/useStoreMedia';
import { StoreVisualsMasterShowcase } from '../../components/customer/StoreVisualsMasterShowcase';
import { 
  formatPrice, 
  STORE_NAME, 
  STORE_ADDRESS, 
  STORE_EMAIL, 
  STORE_WHATSAPP_CLEAN, 
  STORE_PHONE_NUMBER, 
  STORE_WHATSAPP_NUMBER,
  STORE_TIMINGS,
  STORE_DAYS
} from '../../lib/orderUtils';
import { WatermarkBanner, BeatingHeart, WhatsAppIcon } from '../../components/common';
import { SUPABASE_BANNERS_MEDIA_BASE } from '../../lib/supabase';
import './AboutPage.css';

export function AboutPage() {
  const { settings: deliverySettings } = useDeliverySettings();
  const { activeItems: storeVisuals } = useStoreMedia();

  useEffect(() => {
    document.title = `About Store | ${STORE_NAME} Jabalpur`;
  }, []);

  return (
    <div className="layout-container about-page">
      <Helmet>
        <title>{`About Store | ${STORE_NAME} Jabalpur`}</title>
        <meta
          name="description"
          content={`Visit ${STORE_NAME} at ${STORE_ADDRESS}. Fresh groceries, daily essentials, spices, dry fruits, and fast doorstep delivery in Jabalpur. There is only one Boss: The Customer.`}
        />
      </Helmet>

      {/* Permanent Flagship Store Banner (Home screen banner widget style & 16:9 fit) */}
      <section className="about-permanent-banner" aria-label="Sai Darshan Shopping Mart Store Overview">
        {/* Unobstructed Pure Logo Media Viewport with exact 16:9 ratio and contain fit */}
        <div className="about-permanent-banner__media-viewport">
          <img
            src={`${SUPABASE_BANNERS_MEDIA_BASE}Logo.png`}
            alt="Sai Darshan Shopping Mart Logo"
            className="about-permanent-banner__image"
            loading="eager"
            decoding="async"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.src.includes('SaiDarshanLogoBanner.png')) {
                img.src = `${SUPABASE_BANNERS_MEDIA_BASE}SaiDarshanLogoBanner.png`;
              }
            }}
          />
        </div>

        {/* Clean, Non-Repetitive Store Identity & Motto */}
        <div className="about-permanent-banner__content">
          <div className="about-permanent-banner__badge">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>storefront</span>
            <span>AAPKI APNI SUPERMARKET • JABALPUR</span>
          </div>

          <h1 className="about-permanent-banner__title">Sai Darshan Shopping Mart</h1>

          <p className="about-permanent-banner__motto">
            <span>“There is only one Boss: The Customer”</span>
            <BeatingHeart size={16} />
          </p>

          <p className="about-permanent-banner__lead">
            Jabalpur ke har parivar ke liye saaf-suthri dukan, fresh grocery, pure masale, dry fruits aur seedhe aapke ghar tak fast doorstep delivery.
          </p>
        </div>
      </section>

      {/* Store Aisles & Team Photos Showcase */}
      {storeVisuals && storeVisuals.length > 0 && (
        <section className="about-showcase-section" aria-label="Store Visuals">
          <div className="about-section-header">
            <div className="about-section-header__text">
              <span className="about-section-sub">Hamara Supermarket</span>
              <h2 className="about-section-title">Store Ke Sections Aur Team Views</h2>
            </div>
          </div>

          <StoreVisualsMasterShowcase items={storeVisuals} />
        </section>
      )}

      {/* Simple, Compact Store Details (No Repetitive Buttons) */}
      <section className="about-section">
        <div className="about-compact-details-grid">
          {/* Card 1: Store Location & Timings */}
          <div className="about-compact-card">
            <div className="about-compact-card__head">
              <span className="material-symbols-outlined about-details-icon">location_on</span>
              <div>
                <h3 className="about-compact-card__title">Store Location & Timing</h3>
                <span className="about-compact-card__sub">{STORE_DAYS} • 1117 Sanjeevni Nagar</span>
              </div>
            </div>

            <div className="about-compact-card__body">
              <div className="about-details-group">
                <span className="about-details-label">Address</span>
                <p className="about-details-text">
                  <strong>{STORE_ADDRESS}</strong>
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${STORE_NAME} ${STORE_ADDRESS}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-details-action-btn"
                  title={`Open ${STORE_NAME} location in Google Maps`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>directions</span>
                  <span>Google Maps Par Rasta Dekhein</span>
                </a>
              </div>

              <div className="about-details-group">
                <span className="about-details-label">Store Timing</span>
                <p className="about-details-text">
                  <strong>Somwar se Ravivar:</strong> {STORE_TIMINGS}
                </p>
              </div>

              <div className="about-details-group">
                <span className="about-details-label">Phone & Email</span>
                <p className="about-details-text">
                  <a href={`tel:${STORE_PHONE_NUMBER}`} className="about-details-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--md-sys-color-primary)' }}>phone</span>
                    <span>+91 {STORE_WHATSAPP_NUMBER}</span>
                  </a>
                  <br />
                  <a href={`mailto:${STORE_EMAIL}`} className="about-details-link">
                    {STORE_EMAIL}
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Doorstep Delivery & Direct Ordering */}
          <div className="about-compact-card">
            <div className="about-compact-card__head">
              <span className="material-symbols-outlined about-details-icon">local_shipping</span>
              <div>
                <h3 className="about-compact-card__title">Doorstep Delivery & Ordering</h3>
                <span className="about-compact-card__sub">Bina kisi jhanjhat ke seedha order</span>
              </div>
            </div>

            <div className="about-compact-card__body">
              <div className="about-delivery-stat-box">
                <span className="about-delivery-stat-num">
                  {deliverySettings ? formatPrice(deliverySettings.flat_fee) : '₹30.00'}
                </span>
                <span className="about-delivery-stat-lbl">Store Flat Delivery Charge (Free above ₹500)</span>
              </div>

              <p className="about-details-intro" style={{ margin: '12px 0' }}>
                Apne phone se seedhe order karein. Samaan ki list ya photo WhatsApp par bhejein aur aaram se home delivery paayein!
              </p>

              <div className="about-compact-actions">
                <a
                  href={`https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent(`Hello ${STORE_NAME}, I would like to place an order`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-contact-btn about-contact-btn--whatsapp"
                >
                  <WhatsAppIcon size={20} color="#25D366" />
                  <div className="about-contact-btn__text">
                    <strong>WhatsApp Par Order Karein</strong>
                    <span>Turant confirmation & direct chat</span>
                  </div>
                </a>

                <Link to="/quick-order" className="about-contact-btn about-contact-btn--quick">
                  <span className="material-symbols-outlined">edit_note</span>
                  <div className="about-contact-btn__text">
                    <strong>Quick Shopping List</strong>
                    <span>Direct text list order</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shadowy Big Watermark Display */}
      <WatermarkBanner
        headline={<>Made with <BeatingHeart /> in Jabalpur</>}
      />
    </div>
  );
}
