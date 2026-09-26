import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { formatPrice } from '../../lib/orderUtils';
import { WatermarkBanner, BeatingHeart, WhatsAppIcon } from '../../components/common';
import { STORE_MEDIA_ITEMS } from '../../data/storeMedia';
import { StoreMediaLightbox } from '../../components/customer/StoreMediaLightbox';
import './AboutPage.css';

export function AboutPage() {
  const { settings: deliverySettings } = useDeliverySettings();

  useEffect(() => {
    document.title = 'About Store — Sai Darshan Mart Jabalpur';
  }, []);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const openLightbox = (mediaIdOrIndex: string | number) => {
    if (typeof mediaIdOrIndex === 'number') {
      setActiveMediaIndex(mediaIdOrIndex);
    } else {
      const idx = STORE_MEDIA_ITEMS.findIndex((item) => item.id === mediaIdOrIndex);
      setActiveMediaIndex(idx >= 0 ? idx : 0);
    }
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <div className="layout-container about-page">
      <Helmet>
        <title>About Store — Sai Darshan Mart Jabalpur</title>
        <meta
          name="description"
          content="Visit Sai Darshan Mart at 1117 Sanjeevni Nagar, Jabalpur. View high-resolution supermarket aisles, daily groceries, dry fruits, personal care, and direct WhatsApp delivery."
        />
      </Helmet>

      {/* Hero Header */}
      <header className="about-hero">
        <div className="about-hero__badge">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            verified
          </span>
          <span>Trusted Neighborhood Supermarket • Sanjeevni Nagar</span>
        </div>

        <h1 className="about-hero__title">Sai Darshan Mart</h1>

        <p className="about-hero__motto">
          &ldquo;There is only one Boss: The Customer&rdquo;
        </p>

        <p className="about-hero__lead">
          Serving Jabalpur families with clean grocery aisles, pure cooking spices, premium dry fruits, daily household staples, and prompt doorstep delivery.
        </p>
      </header>

      {/* Curated Store Departments & Aisles (1000×1000 Square Best-Fit Grid) */}
      <section className="about-section">
        <div className="about-section-header">
          <div className="about-section-header__text">
            <span className="about-section-sub">Inside Sai Darshan Mart</span>
            <h2 className="about-section-title">Department Aisles & Store Visuals</h2>
          </div>
          <span className="about-section-count">
            {STORE_MEDIA_ITEMS.length} Curated Master Views
          </span>
        </div>

        <div className="about-curated-grid">
          {STORE_MEDIA_ITEMS.map((item, idx) => (
            <article
              key={item.id}
              className="about-curated-card"
              onClick={() => openLightbox(idx)}
            >
              {/* Top: Pure, Unobstructed 1000x1000 Square Viewport (NO text or buttons on image) */}
              <div className="about-curated-card__media-viewport">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="about-curated-card__img"
                    loading={idx < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                ) : (
                  <div className="about-curated-card__video-preview">
                    <video
                      src={item.url}
                      className="about-curated-card__video"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                    <div className="about-curated-card__video-play-indicator">
                      <span className="material-symbols-outlined">play_circle</span>
                    </div>
                  </div>
                )}

                {/* Subtle Tap-to-View hover icon */}
                <div className="about-curated-card__view-pill">
                  <span className="material-symbols-outlined">zoom_in</span>
                  <span>Tap to View HD</span>
                </div>
              </div>

              {/* Bottom: Merged Section Below with Blurred Vignette Background */}
              <div className="about-curated-card__merged-section">
                <div className="about-curated-card__header-row">
                  <span className="about-curated-card__dept-badge">{item.department}</span>
                  {item.highlightTag && (
                    <span className="about-curated-card__res-tag">{item.highlightTag}</span>
                  )}
                </div>

                <h3 className="about-curated-card__title">{item.title}</h3>
                <p className="about-curated-card__notes">{item.notes}</p>

                <div className="about-curated-card__footer-row">
                  <span className="about-curated-card__tap-text">
                    <span className="material-symbols-outlined">open_in_full</span>
                    <span>Tap for Master Resolution</span>
                  </span>
                  <span className="about-curated-card__fit-label">1000×1000 Fit</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Store Location, Hours, Contact & Delivery Rules */}
      <section className="about-section">
        <div className="about-section-header">
          <div className="about-section-header__text">
            <span className="about-section-sub">Visit or Order Online</span>
            <h2 className="about-section-title">Store Details & WhatsApp Delivery</h2>
          </div>
        </div>

        <div className="about-info-grid">
          {/* Location & Timings Card */}
          <div className="about-info-card">
            <div className="about-info-card__header">
              <span className="material-symbols-outlined about-info-card__icon">location_on</span>
              <div>
                <h3 className="about-info-card__title">Store Location & Hours</h3>
                <span className="about-info-card__sub">Sanjeevni Nagar, Jabalpur</span>
              </div>
            </div>

            <div className="about-info-card__body">
              <div className="about-data-group">
                <span className="about-data-label">Address</span>
                <address className="about-data-value">
                  <strong>1117 Sanjeevni Nagar Main Road,</strong>
                  <br />
                  Jabalpur, Madhya Pradesh 482003
                </address>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Sai+Darshan+Mart+1117+Sanjeevni+Nagar+Main+Road+Jabalpur+Madhya+Pradesh+482003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-directions-btn"
                >
                  <span className="material-symbols-outlined">directions</span>
                  <span>Get Google Maps Directions</span>
                </a>
              </div>

              <div className="about-data-group">
                <span className="about-data-label">Store Hours</span>
                <p className="about-data-value">
                  <strong>Monday to Sunday:</strong> 8:00 AM &ndash; 10:00 PM
                  <br />
                  <span className="about-status-chip">Open 7 Days a Week</span>
                </p>
              </div>

              <div className="about-data-group">
                <span className="about-data-label">Customer Email</span>
                <p className="about-data-value">
                  <a href="mailto:saidarshanmart@gmail.com" className="about-email-link">
                    saidarshanmart@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Ordering & Direct Contact Card */}
          <div className="about-info-card">
            <div className="about-info-card__header">
              <span className="material-symbols-outlined about-info-card__icon">chat</span>
              <div>
                <h3 className="about-info-card__title">Direct Ordering & Support</h3>
                <span className="about-info-card__sub">No signup or passwords needed</span>
              </div>
            </div>

            <div className="about-info-card__body">
              <p className="about-info-card__intro">
                Order groceries directly from your phone. Send your list, handwritten note, or cart directly to our store WhatsApp!
              </p>

              <div className="about-contact-btns">
                <a
                  href="https://wa.me/917999157430?text=Hello%20Sai%20Darshan%20Mart,%20I%20would%20like%20to%20place%20an%20order"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-contact-btn about-contact-btn--whatsapp"
                >
                  <WhatsAppIcon size={24} color="#25D366" />
                  <div className="about-contact-btn__text">
                    <strong>Order via WhatsApp</strong>
                    <span>Fast confirmation & direct chat</span>
                  </div>
                </a>

                <a href="tel:7999157430" className="about-contact-btn about-contact-btn--call">
                  <span className="material-symbols-outlined">call</span>
                  <div className="about-contact-btn__text">
                    <strong>Call Store Directly</strong>
                    <span>+91 79991 57430</span>
                  </div>
                </a>

                <Link to="/quick-order" className="about-contact-btn about-contact-btn--quick">
                  <span className="material-symbols-outlined">edit_note</span>
                  <div className="about-contact-btn__text">
                    <strong>Use Quick Order Form</strong>
                    <span>Paste raw list and order without searching</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Delivery Policy Card */}
          <div className="about-info-card about-info-card--wide">
            <div className="about-info-card__header">
              <span className="material-symbols-outlined about-info-card__icon">local_shipping</span>
              <div>
                <h3 className="about-info-card__title">Jabalpur Doorstep Delivery</h3>
                <span className="about-info-card__sub">Prompt, safe & transparent</span>
              </div>
            </div>

            <div className="about-info-card__body about-delivery-grid">
              <div className="about-delivery-stat-box">
                <span className="about-delivery-stat-num">
                  {deliverySettings ? formatPrice(deliverySettings.flat_fee) : '₹0'}
                </span>
                <span className="about-delivery-stat-lbl">Store Flat Delivery Fee</span>
              </div>

              <div className="about-delivery-rules-text">
                <p>
                  {deliverySettings?.rules_text ||
                    'We offer prompt local delivery across Jabalpur. Delivery charges are flat, fair and transparent. Orders are carefully handpicked from store shelves and dispatched directly to your home.'}
                </p>
                <ul className="about-check-points">
                  <li>
                    <span className="material-symbols-outlined">done</span>
                    Dispatched straight from 1117 Sanjeevni Nagar supermarket
                  </li>
                  <li>
                    <span className="material-symbols-outlined">done</span>
                    Pay cash or UPI on delivery at your doorstep
                  </li>
                  <li>
                    <span className="material-symbols-outlined">done</span>
                    Real-time status updates and order verification via WhatsApp
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shadowy Big Watermark Display */}
      <WatermarkBanner
        headline={<>Made with <BeatingHeart /> in Jabalpur</>}
        subline="Born in Jabalpur, built for our community with trust & love"
      />

      {/* Full Resolution Tap-to-View Lightbox */}
      <StoreMediaLightbox
        items={STORE_MEDIA_ITEMS}
        initialIndex={activeMediaIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
      />
    </div>
  );
}
