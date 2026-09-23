import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { formatPrice } from '../../lib/orderUtils';
import './AboutPage.css';

export function AboutPage() {
  const { settings: deliverySettings } = useDeliverySettings();

  useEffect(() => {
    document.title = 'Store Info & Contact | Sai Darshan Mart Jabalpur';
  }, []);

  return (
    <div className="layout-container about-page">
      <Helmet>
        <title>Store Info & Contact | Sai Darshan Mart Jabalpur</title>
        <meta 
          name="description" 
          content="Visit Sai Darshan Mart at 1117 Sanjeevni Nagar Main Road, Jabalpur. Open daily 8 AM - 10 PM. Direct WhatsApp ordering and doorstep delivery." 
        />
      </Helmet>

      {/* Header Banner */}
      <header className="about-header">
        <div className="about-header__badge">
          <span className="material-symbols-outlined">storefront</span>
          <span>Local Supermarket</span>
        </div>
        <h1 className="about-header__title">Sai Darshan Mart</h1>
        <p className="about-header__tagline">
          &ldquo;There is only one Boss: The Customer&rdquo;
        </p>
        <p className="about-header__lead">
          Serving Jabalpur with premium quality groceries, daily staples, fresh produce, and prompt doorstep delivery.
        </p>
      </header>

      {/* Contact & Location Grid */}
      <div className="about-grid">
        
        {/* Store Location & Timings Card */}
        <div className="about-card">
          <div className="about-card__header">
            <span className="material-symbols-outlined about-card__icon">location_on</span>
            <h2 className="about-card__title">Store Location & Timing</h2>
          </div>
          
          <div className="about-card__content">
            <div className="about-info-block">
              <span className="about-info-label">Address</span>
              <address className="about-info-value">
                <strong>1117 Sanjeevni Nagar Main Road,</strong><br />
                Jabalpur, Madhya Pradesh 482003
              </address>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Sai+Darshan+Mart+1117+Sanjeevni+Nagar+Main+Road+Jabalpur+Madhya+Pradesh+482003"
                target="_blank"
                rel="noopener noreferrer"
                className="about-map-btn"
              >
                <span className="material-symbols-outlined">directions</span>
                Get Google Maps Directions
              </a>
            </div>

            <div className="about-info-block">
              <span className="about-info-label">Store Hours</span>
              <p className="about-info-value">
                <strong>Monday to Sunday:</strong> 8:00 AM &ndash; 10:00 PM<br />
                <span className="about-status-pill">Open 7 Days a Week</span>
              </p>
            </div>

            <div className="about-info-block">
              <span className="about-info-label">Proprietor</span>
              <p className="about-info-value">
                <strong>Amit Chouksey</strong>
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp & Call Direct Ordering */}
        <div className="about-card">
          <div className="about-card__header">
            <span className="material-symbols-outlined about-card__icon">chat</span>
            <h2 className="about-card__title">Order Direct & Support</h2>
          </div>

          <div className="about-card__content">
            <p className="about-card__text">
              We make grocery ordering simple. You don't need to register an account or remember passwords. Send your shopping list or cart directly to our store WhatsApp!
            </p>

            <div className="about-actions-list">
              <a 
                href="https://wa.me/917354155669?text=Hello%20Sai%20Darshan%20Mart,%20I%20would%20like%20to%20place%20an%20order"
                target="_blank"
                rel="noopener noreferrer"
                className="about-whatsapp-action"
              >
                <span className="material-symbols-outlined">chat</span>
                <div>
                  <strong>Chat on WhatsApp</strong>
                  <span>Fast reply & order status confirmation</span>
                </div>
              </a>

              <a 
                href="tel:+917354155669"
                className="about-phone-action"
              >
                <span className="material-symbols-outlined">call</span>
                <div>
                  <strong>Call Store Directly</strong>
                  <span>+91 73541 55669</span>
                </div>
              </a>

              <Link to="/quick-order" className="about-quick-action">
                <span className="material-symbols-outlined">edit_note</span>
                <div>
                  <strong>Use Quick Order Form</strong>
                  <span>Paste raw list and order without browsing</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Delivery Policy Card */}
        <div className="about-card about-card--full">
          <div className="about-card__header">
            <span className="material-symbols-outlined about-card__icon">local_shipping</span>
            <h2 className="about-card__title">Delivery Rules & Area</h2>
          </div>

          <div className="about-card__content">
            <div className="about-delivery-summary">
              <div className="about-delivery-stat">
                <span className="about-delivery-stat__num">
                  {deliverySettings ? formatPrice(deliverySettings.flat_fee) : '₹0'}
                </span>
                <span className="about-delivery-stat__label">Store Flat Delivery Fee</span>
              </div>

              <div className="about-delivery-rules">
                <p>
                  {deliverySettings?.rules_text || 
                    'We offer prompt local delivery across Jabalpur. Delivery charges are flat and transparent. Your order is carefully packaged by store staff and dispatched quickly.'
                  }
                </p>
                <ul className="about-check-list">
                  <li>Doorstep delivery direct from our 1117 Sanjeevni Nagar store</li>
                  <li>Pay cash or UPI on delivery</li>
                  <li>Order status verified and confirmed via WhatsApp</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
