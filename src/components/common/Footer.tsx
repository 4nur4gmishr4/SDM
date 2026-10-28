import { STORE_NAME, STORE_PHONE_NUMBER, STORE_WHATSAPP_NUMBER, STORE_WHATSAPP_CLEAN, STORE_EMAIL, STORE_ADDRESS } from '../../lib/orderUtils';
import { WhatsAppIcon } from './WhatsAppIcon';
import './Footer.css';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${STORE_NAME} ${STORE_ADDRESS}`)}`;

  return (
    <footer className="sdsm-footer" role="contentinfo">
      <div className="sdsm-footer__container">
        {/* Main Content: Brand info, Address & Contacts */}
        <div className="sdsm-footer__row">
          {/* Brand Info with Official Tagline and Crawlable Paragraph */}
          <div className="sdsm-footer__brand">
            <span className="sdsm-footer__brand-name">{STORE_NAME}</span>
            <p className="sdsm-footer__brand-motto">&ldquo;There is only one Boss: The Customer.&rdquo;</p>
            <p className="sdsm-footer__brand-desc">
              Jabalpur&apos;s premier neighborhood supermarket. Order daily fresh groceries, staples, pure spices, dairy, dry fruits, and household essentials with fast doorstep delivery across Jabalpur.
            </p>
          </div>

          {/* Action Row: 3 Contact Icons */}
          <div className="sdsm-footer__actions">
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

        {/* Minimal Compact Copyright Strip with Direct Google Maps Arrow */}
        <div className="sdsm-footer__bottom">
          <div className="sdsm-footer__copyright">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sdsm-footer__location-link"
              title={`Open ${STORE_NAME} Jabalpur location in Google Maps`}
            >
              <span>&copy; {currentYear} {STORE_NAME} &bull; {STORE_ADDRESS}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
            </a>
            <span>&bull;</span>
            <span>All Rights Reserved</span>
          </div>
          <span className="sdsm-footer__slogan-badge">
            Customer First Supermarket
          </span>
        </div>
      </div>
    </footer>
  );
}
