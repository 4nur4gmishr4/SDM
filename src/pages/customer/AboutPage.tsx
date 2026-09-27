import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { formatPrice } from '../../lib/orderUtils';
import { WatermarkBanner, BeatingHeart, WhatsAppIcon } from '../../components/common';
import { useStoreMedia } from '../../hooks/useStoreMedia';
import { StoreMediaLightbox } from '../../components/customer/StoreMediaLightbox';
import { StoreVisualsMasterShowcase } from '../../components/customer/StoreVisualsMasterShowcase';
import './AboutPage.css';

export function AboutPage() {
  const { settings: deliverySettings } = useDeliverySettings();
  const { activeItems: storeVisuals } = useStoreMedia();

  useEffect(() => {
    document.title = 'About Store | Sai Darshan Mart Jabalpur';
  }, []);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const openLightbox = (mediaIdOrIndex: string | number) => {
    if (typeof mediaIdOrIndex === 'number') {
      setActiveMediaIndex(mediaIdOrIndex);
    } else {
      const idx = storeVisuals.findIndex((item) => item.id === mediaIdOrIndex);
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
        <title>About Store | Sai Darshan Mart Jabalpur</title>
        <meta
          name="description"
          content="Visit Sai Darshan Mart at 1117 Sanjeevni Nagar, Jabalpur. View high-resolution supermarket aisles, daily groceries, dry fruits, personal care, and direct WhatsApp delivery."
        />
      </Helmet>

      {/* Hero Header */}
      <header className="about-hero">
        <h1 className="about-hero__title">Sai Darshan Mart</h1>

        <p className="about-hero__motto">
          &ldquo;There is only one Boss: The Customer&rdquo;
        </p>

        <p className="about-hero__lead">
          Jabalpur ke har parivar ke liye saaf-suthri dukan, fresh grocery, pure masale, dry fruits aur seedhe aapke ghar tak fast doorstep delivery.
        </p>
      </header>

      {/* Curated Store Departments & Aisles - Master Banner Showcase */}
      <section className="about-section">
        <div className="about-section-header">
          <div className="about-section-header__text">
            <span className="about-section-sub">Hamara Supermarket</span>
            <h2 className="about-section-title">Store Ke Sections Aur Aisle Views</h2>
          </div>
        </div>

        {/* Master Showcase Banner Carousel */}
        {storeVisuals.length > 0 && (
          <StoreVisualsMasterShowcase
            items={storeVisuals}
            onOpenLightbox={openLightbox}
          />
        )}
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
                <strong>1117 Sanjeevni Nagar Main Road,</strong>
                <br />
                Jabalpur, Madhya Pradesh 482003
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Sai+Darshan+Mart+1117+Sanjeevni+Nagar+Main+Road+Jabalpur+Madhya+Pradesh+482003"
                target="_blank"
                rel="noopener noreferrer"
                className="about-details-action-btn"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>directions</span>
                <span>Google Maps Par Rasta Dekhein</span>
              </a>
            </div>

            <div className="about-details-group">
              <span className="about-details-label">Store Khulne Ka Samay</span>
              <p className="about-details-text">
                <strong>Somwar se Ravivar:</strong> 8:00 AM se 10:00 PM
              </p>
              <span className="about-status-chip">Saaton Din Khula</span>
            </div>

            <div className="about-details-group">
              <span className="about-details-label">Customer Email</span>
              <a href="mailto:saidarshanmart@gmail.com" className="about-details-link">
                saidarshanmart@gmail.com
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
                href="https://wa.me/917999157430?text=Hello%20Sai%20Darshan%20Mart,%20I%20would%20like%20to%20place%20an%20order"
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

              <a href="tel:7999157430" className="about-contact-btn about-contact-btn--call">
                <span className="material-symbols-outlined">call</span>
                <div className="about-contact-btn__text">
                  <strong>Dukan Par Phone Karein</strong>
                  <span>+91 79991 57430</span>
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
        subline="Born in Jabalpur, built for our community with trust & love"
      />

      {/* Full Resolution Tap-to-View Lightbox */}
      {storeVisuals.length > 0 && (
        <StoreMediaLightbox
          items={storeVisuals}
          initialIndex={activeMediaIndex}
          isOpen={lightboxOpen}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
