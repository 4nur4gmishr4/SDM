import { Link } from 'react-router-dom';
import { STORE_NAME, STORE_PHONE_NUMBER, STORE_WHATSAPP_NUMBER, STORE_WHATSAPP_CLEAN, STORE_EMAIL, STORE_ADDRESS } from '../../lib/orderUtils';
import { WhatsAppIcon } from './WhatsAppIcon';
import './Footer.css';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${STORE_NAME} ${STORE_ADDRESS}`)}`;

  return (
    <footer className="sdsm-footer" role="contentinfo">
      <div className="sdsm-footer__container">
        {/* Main Content: Brand info, Crawlable SEO Sitelinks, Address & Contacts */}
        <div className="sdsm-footer__row">
          {/* Brand Info with Official Tagline and Crawlable Paragraph */}
          <div className="sdsm-footer__brand">
            <span className="sdsm-footer__brand-name">{STORE_NAME}</span>
            <p className="sdsm-footer__brand-motto">&ldquo;There is only one Boss: The Customer.&rdquo;</p>
            <p className="sdsm-footer__brand-desc">
              Jabalpur&apos;s premier neighborhood supermarket. Order daily fresh groceries, staples, pure spices, dairy, dry fruits, and household essentials with fast doorstep delivery across Jabalpur.
            </p>
          </div>

          {/* Crawlable Sitelinks for Google Search Bot & Users */}
          <nav className="sdsm-footer__sitelinks" aria-label="Sitelinks Navigation">
            <span className="sdsm-footer__sitelinks-heading">Quick Navigation</span>
            <div className="sdsm-footer__sitelinks-grid">
              <Link to="/shop" className="sdsm-footer__sitelink">Shop All Groceries</Link>
              <Link to="/quick-order" className="sdsm-footer__sitelink">Quick Order via List</Link>
              <Link to="/about" className="sdsm-footer__sitelink">Store Location &amp; Hours</Link>
              <Link to="/shop/grocery-staples" className="sdsm-footer__sitelink">Grocery Staples &amp; Grains</Link>
              <Link to="/shop/cooking-oils-ghee" className="sdsm-footer__sitelink">Cooking Oils &amp; Ghee</Link>
              <Link to="/shop/spices-seasonings" className="sdsm-footer__sitelink">Pure Spices &amp; Masalas</Link>
            </div>
          </nav>

          {/* Action Row: Clickable Store Address Pill & 3 Contact Icons */}
          <div className="sdsm-footer__actions">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sdsm-footer__address"
              title={`Open ${STORE_NAME} location in Google Maps`}
            >
              <span className="material-symbols-outlined sdsm-footer__address-icon">location_on</span>
              <span className="sdsm-footer__address-text">{STORE_ADDRESS}</span>
              <span className="material-symbols-outlined sdsm-footer__address-arrow">open_in_new</span>
            </a>

            <div className="sdsm-footer__contact-icons" role="group" aria-label="Store contact options">
              <a
                href={`tel:${STORE_PHONE_NUMBER}`}
                className="sdsm-footer__icon-btn"
                title={`Call ${STORE_WHATSAPP_NUMBER}`}
                aria-label={`Call ${STORE_NAME}`}
              >
                <span className="material-symbols-outlined">call</span>
              </a>

              <a
                href={`https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent(`Hello ${STORE_NAME}, I would like to place an order`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sdsm-footer__icon-btn"
                title="Chat on WhatsApp"
                aria-label={`WhatsApp ${STORE_NAME}`}
              >
                <WhatsAppIcon size={18} />
              </a>

              <a
                href={`mailto:${STORE_EMAIL}`}
                className="sdsm-footer__icon-btn"
                title={`Email ${STORE_EMAIL}`}
                aria-label={`Email ${STORE_NAME}`}
              >
                <span className="material-symbols-outlined">mail</span>
              </a>
            </div>
          </div>
        </div>

        {/* Minimal Compact Copyright Strip */}
        <div className="sdsm-footer__bottom">
          <span className="sdsm-footer__copyright">
            &copy; {currentYear} {STORE_NAME} &bull; 1117 Sanjeevni Nagar, Garha, Jabalpur &bull; All Rights Reserved
          </span>
          <span className="sdsm-footer__slogan-badge">
            Customer First Supermarket
          </span>
        </div>
      </div>
    </footer>
  );
}
