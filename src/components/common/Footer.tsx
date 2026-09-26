import { STORE_PHONE_NUMBER, STORE_WHATSAPP_CLEAN, STORE_EMAIL, STORE_ADDRESS } from '../../lib/orderUtils';
import { WhatsAppIcon } from './WhatsAppIcon';
import './Footer.css';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Sai Darshan Mart ${STORE_ADDRESS}`)}`;

  return (
    <footer className="sdm-footer" role="contentinfo">
      <div className="sdm-footer__container">
        {/* Brand Header */}
        <div className="sdm-footer__brand">
          <div className="sdm-footer__brand-title">
            <span className="material-symbols-outlined sdm-footer__brand-icon">storefront</span>
            <span className="sdm-footer__brand-name">Sai Darshan Mart</span>
          </div>
          <p className="sdm-footer__brand-tagline">
            Jabalpur&apos;s trusted neighborhood supermarket &bull; Daily fresh groceries &amp; doorstep delivery
          </p>
        </div>

        {/* Exact Clickable Store Address */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sdm-footer__address"
          title="Open Sai Darshan Mart location in Google Maps"
        >
          <span className="material-symbols-outlined sdm-footer__address-icon">location_on</span>
          <span className="sdm-footer__address-text">{STORE_ADDRESS}</span>
          <span className="material-symbols-outlined sdm-footer__address-arrow">open_in_new</span>
        </a>

        {/* 3 Unified Contact Icon Buttons: Call, WhatsApp, Email */}
        <div className="sdm-footer__contact-icons" role="group" aria-label="Store contact options">
          <a
            href={`tel:${STORE_PHONE_NUMBER}`}
            className="sdm-footer__icon-btn"
            title="Call +91 79991 57430"
            aria-label="Call Sai Darshan Mart"
          >
            <span className="material-symbols-outlined">call</span>
          </a>

          <a
            href={`https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent('Hello Sai Darshan Mart, I would like to place an order')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sdm-footer__icon-btn"
            title="Chat on WhatsApp"
            aria-label="WhatsApp Sai Darshan Mart"
          >
            <WhatsAppIcon size={20} />
          </a>

          <a
            href={`mailto:${STORE_EMAIL}`}
            className="sdm-footer__icon-btn"
            title={`Email ${STORE_EMAIL}`}
            aria-label="Email Sai Darshan Mart"
          >
            <span className="material-symbols-outlined">mail</span>
          </a>
        </div>

        {/* Minimal Copyright */}
        <div className="sdm-footer__bottom">
          <span className="sdm-footer__copyright">
            &copy; {currentYear} Sai Darshan Mart &bull; Sanjeevni Nagar, Jabalpur
          </span>
        </div>
      </div>
    </footer>
  );
}

