import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
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

      {/* Permanent Flagship Store Banner (Side by Side Logo & Official Store Presentation) */}
      <section className="about-permanent-banner" aria-label="Sai Darshan Shopping Mart Store Overview">
        {/* Left: Unobstructed Pure Logo Media Viewport (Permanent, NO tap-to-view) */}
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

        {/* Right: Store Identity & Narrative (Side by Side) */}
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

          <div className="about-permanent-banner__highlights">
            <span className="about-permanent-banner__chip">
              <span className="material-symbols-outlined">schedule</span>
              <span>Open All Days (8:00 AM – 10:30 PM)</span>
            </span>
            <span className="about-permanent-banner__chip">
              <span className="material-symbols-outlined">local_shipping</span>
              <span>Fast Doorstep Delivery</span>
            </span>
            <span className="about-permanent-banner__chip">
              <span className="material-symbols-outlined">verified</span>
              <span>100% Pure & Fresh</span>
            </span>
          </div>

          <div className="about-permanent-banner__actions">
            <Link to="/shop" className="about-permanent-banner__btn about-permanent-banner__btn--primary">
              <span>Shop All Groceries</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </Link>
            <a
              href={`https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent('Namaste Sai Darshan Shopping Mart! Mujhe grocery order karni hai.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="about-permanent-banner__btn about-permanent-banner__btn--whatsapp"
            >
              <WhatsAppIcon size={18} />
              <span>Order on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Store Location, Hours, Contact & Delivery Rules - Combined Master Widget */}
      <section className="about-section">
        <div className="about-section-header">
          <div className="about-section-header__text">
            <span className="about-section-sub">Store Aayein Ya Online Order Karein</span>
            <h2 className="about-section-title">Store Details & WhatsApp Delivery</h2>
          </div>
        </div>

        <div className="about-master-details-widget">
          {/* Section 1: Store Location & Hours */}
          <div className="about-details-section">
            <div className="about-details-section__head">
              <span className="material-symbols-outlined about-details-icon">location_on</span>
              <div>
                <h3 className="about-details-title">Store Location & Timing</h3>
                <span className="about-details-sub">Sanjeevni Nagar, Jabalpur</span>
              </div>
            </div>

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
              <span className="about-details-label">Store Khulne Ka Samay</span>
              <p className="about-details-text">
                <strong>Somwar se Ravivar:</strong> {STORE_TIMINGS}
              </p>
              <span className="about-status-chip">{STORE_DAYS}</span>
            </div>

            <div className="about-details-group">
              <span className="about-details-label">Customer Email</span>
              <a href={`mailto:${STORE_EMAIL}`} className="about-details-link">
                {STORE_EMAIL}
              </a>
            </div>

            <div className="about-details-group">
              <span className="about-details-label">Mobile Number (Call & WhatsApp)</span>
              <a href={`tel:${STORE_PHONE_NUMBER}`} className="about-details-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginTop: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--md-sys-color-primary)' }}>phone_iphone</span>
                <span><strong>{STORE_WHATSAPP_NUMBER}</strong></span>
              </a>
            </div>
          </div>

          <div className="about-details-divider" aria-hidden="true" />

          {/* Section 2: Direct Ordering & Support */}
          <div className="about-details-section">
            <div className="about-details-section__head">
              <span className="material-symbols-outlined about-details-icon">chat</span>
              <div>
                <h3 className="about-details-title">Direct Order & Support</h3>
                <span className="about-details-sub">Bina login ya password ke seedhe order</span>
              </div>
            </div>

            <p className="about-details-intro">
              Apne phone se seedhe order karein. Samaan ki list ya photo hamare store WhatsApp par bhejein aur aaram se delivery paayein!
            </p>

            <div className="about-details-cta-col">
              <a
                href={`https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent(`Hello ${STORE_NAME}, I would like to place an order`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="about-contact-btn about-contact-btn--whatsapp"
              >
                <WhatsAppIcon size={22} color="#25D366" />
                <div className="about-contact-btn__text">
                  <strong>WhatsApp Par Order Karein</strong>
                  <span>Turant confirmation & direct chat</span>
                </div>
              </a>

              <a href={`tel:${STORE_PHONE_NUMBER}`} className="about-contact-btn about-contact-btn--call">
                <span className="material-symbols-outlined">call</span>
                <div className="about-contact-btn__text">
                  <strong>Dukan Par Phone Karein</strong>
                  <span>{STORE_WHATSAPP_NUMBER}</span>
                </div>
              </a>

              <Link to="/quick-order" className="about-contact-btn about-contact-btn--quick">
                <span className="material-symbols-outlined">edit_note</span>
                <div className="about-contact-btn__text">
                  <strong>Quick Order Form Kholein</strong>
                  <span>List paste karein aur bina search kiye order karein</span>
                </div>
              </Link>
            </div>
          </div>

          <div className="about-details-divider" aria-hidden="true" />

          {/* Section 3: Jabalpur Doorstep Delivery */}
          <div className="about-details-section">
            <div className="about-details-section__head">
              <span className="material-symbols-outlined about-details-icon">local_shipping</span>
              <div>
                <h3 className="about-details-title">Jabalpur Doorstep Delivery</h3>
                <span className="about-details-sub">Fast, safe aur transparent</span>
              </div>
            </div>

            <div className="about-delivery-stat-box">
              <span className="about-delivery-stat-num">
                {deliverySettings ? formatPrice(deliverySettings.flat_fee) : '₹30.00'}
              </span>
              <span className="about-delivery-stat-lbl">Store Flat Delivery Charge</span>
            </div>

            <p className="about-details-delivery-sub">
              Jabalpur me doorstep grocery delivery. ₹500 se upar ke order par Free Home Delivery.
            </p>

            <ul className="about-check-points">
              <li>
                <span className="material-symbols-outlined">done</span>
                <span>1117 Sanjeevni Nagar supermarket se seedhe dispatch</span>
              </li>
              <li>
                <span className="material-symbols-outlined">done</span>
                <span>Ghar baithe Cash ya UPI se payment karein</span>
              </li>
              <li>
                <span className="material-symbols-outlined">done</span>
                <span>WhatsApp par order confirmation aur real-time updates</span>
              </li>
            </ul>
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
