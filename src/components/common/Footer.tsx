import { Link } from 'react-router-dom';
import { STORE_PHONE_NUMBER, STORE_WHATSAPP_CLEAN, STORE_EMAIL } from '../../lib/orderUtils';
import './Footer.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="sdm-footer" role="contentinfo">
      <div className="sdm-footer__container">
        {/* Top compact section: Brand + Quick Contacts */}
        <div className="sdm-footer__top">
          <div className="sdm-footer__brand">
            <div className="sdm-footer__brand-title">
              <span className="material-symbols-outlined sdm-footer__brand-icon">storefront</span>
              <span className="sdm-footer__brand-name">Sai Darshan Mart</span>
            </div>
            <p className="sdm-footer__brand-tagline">
              Jabalpur&apos;s trusted neighborhood supermarket &bull; Daily fresh essentials &amp; doorstep delivery
            </p>
          </div>

          <div className="sdm-footer__contacts">
            <a 
              href={`tel:${STORE_PHONE_NUMBER}`}
              className="sdm-footer__contact-pill"
              aria-label={`Call store at ${STORE_PHONE_NUMBER}`}
            >
              <span className="material-symbols-outlined sdm-footer__pill-icon">call</span>
              <span>+91 79991 57430</span>
            </a>

            <a 
              href={`https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent('Hello Sai Darshan Mart, I have an inquiry')}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="sdm-footer__contact-pill sdm-footer__contact-pill--whatsapp"
              aria-label="Chat on WhatsApp"
            >
              <span className="material-symbols-outlined sdm-footer__pill-icon">chat</span>
              <span>WhatsApp Us</span>
            </a>

            <a 
              href={`mailto:${STORE_EMAIL}`}
              className="sdm-footer__contact-pill"
              aria-label={`Email store at ${STORE_EMAIL}`}
            >
              <span className="material-symbols-outlined sdm-footer__pill-icon">mail</span>
              <span>{STORE_EMAIL}</span>
            </a>
          </div>
        </div>

        {/* Middle compact section: Essential Navigation Links */}
        <div className="sdm-footer__nav-row">
          <nav className="sdm-footer__nav" aria-label="Footer Navigation">
            <Link to="/" className="sdm-footer__link">Home</Link>
            <span className="sdm-footer__nav-dot" aria-hidden="true">&bull;</span>
            <Link to="/shop" className="sdm-footer__link">Shop Groceries</Link>
            <span className="sdm-footer__nav-dot" aria-hidden="true">&bull;</span>
            <Link to="/quick-order" className="sdm-footer__link">Quick List Order</Link>
            <span className="sdm-footer__nav-dot" aria-hidden="true">&bull;</span>
            <Link to="/cart" className="sdm-footer__link">Cart</Link>
            <span className="sdm-footer__nav-dot" aria-hidden="true">&bull;</span>
            <Link to="/about" className="sdm-footer__link">Store Details</Link>
            <span className="sdm-footer__nav-dot" aria-hidden="true">&bull;</span>
            <Link to="/admin/login" className="sdm-footer__link sdm-footer__link--muted">Admin</Link>
          </nav>
        </div>

        {/* Bottom compact section: Copyright & Creator Credit */}
        <div className="sdm-footer__bottom">
          <div className="sdm-footer__copyright">
            &copy; {currentYear} Sai Darshan Mart. All rights reserved.
          </div>

          <div className="sdm-footer__craft">
            <div className="sdm-footer__made-with">
              Made with ❤️ in Jabalpur
            </div>
            <div className="sdm-footer__author">
              BY - <a 
                href="https://instagram.com/4nur4gmishr4" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="sdm-footer__insta-link"
                title="Follow Anurag Mishra on Instagram"
              >
                ANURAG MISHRA
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
