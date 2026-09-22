import { Link } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="sdm-footer">
      <div className="sdm-footer__container">
        {/* Main Footer Grid */}
        <div className="sdm-footer__grid">
          
          {/* Brand Column */}
          <div className="sdm-footer__col sdm-footer__col--brand">
            <div className="sdm-footer__brand-header">
              <span className="material-symbols-outlined sdm-footer__brand-icon">storefront</span>
              <span className="sdm-footer__brand-name">Sai Darshan Mart</span>
            </div>
            <p className="sdm-footer__tagline">
              &ldquo;There is only one Boss: The Customer&rdquo;
            </p>
            <p className="sdm-footer__description">
              Your neighborhood supermarket in Jabalpur. Daily fresh groceries, dairy, food grains, household essentials, and direct WhatsApp doorstep delivery.
            </p>
            <div className="sdm-footer__whatsapp-pill">
              <a 
                href="https://wa.me/917354155669?text=Hello%20Sai%20Darshan%20Mart,%20I%20have%20an%20inquiry" 
                target="_blank" 
                rel="noopener noreferrer"
                className="sdm-footer__whatsapp-btn"
                aria-label="Order on WhatsApp"
              >
                <span className="material-symbols-outlined sdm-footer__btn-icon">chat</span>
                <span>WhatsApp Order & Help</span>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="sdm-footer__col">
            <h3 className="sdm-footer__heading">Quick Navigation</h3>
            <ul className="sdm-footer__nav-list">
              <li>
                <Link to="/" className="sdm-footer__link">
                  <span className="material-symbols-outlined sdm-footer__link-icon">chevron_right</span>
                  Home Storefront
                </Link>
              </li>
              <li>
                <Link to="/shop" className="sdm-footer__link">
                  <span className="material-symbols-outlined sdm-footer__link-icon">chevron_right</span>
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link to="/quick-order" className="sdm-footer__link">
                  <span className="material-symbols-outlined sdm-footer__link-icon">chevron_right</span>
                  Quick Order (List via WhatsApp)
                </Link>
              </li>
              <li>
                <Link to="/cart" className="sdm-footer__link">
                  <span className="material-symbols-outlined sdm-footer__link-icon">chevron_right</span>
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/about" className="sdm-footer__link">
                  <span className="material-symbols-outlined sdm-footer__link-icon">chevron_right</span>
                  Store Details & Directions
                </Link>
              </li>
            </ul>
          </div>

          {/* Delivery & Ordering Column */}
          <div className="sdm-footer__col">
            <h3 className="sdm-footer__heading">Delivery & Orders</h3>
            <ul className="sdm-footer__service-list">
              <li className="sdm-footer__service-item">
                <span className="material-symbols-outlined sdm-footer__service-icon">local_shipping</span>
                <div>
                  <strong>Store-Managed Local Delivery</strong>
                  <span>Fast delivery across Jabalpur directly from our store</span>
                </div>
              </li>
              <li className="sdm-footer__service-item">
                <span className="material-symbols-outlined sdm-footer__service-icon">no_accounts</span>
                <div>
                  <strong>No Account Needed</strong>
                  <span>Simple account-free ordering with instant WhatsApp verification</span>
                </div>
              </li>
              <li className="sdm-footer__service-item">
                <span className="material-symbols-outlined sdm-footer__service-icon">currency_rupee</span>
                <div>
                  <strong>Pay on Delivery / Direct</strong>
                  <span>Transparent flat delivery fees with zero hidden markups</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Store Location & Timings Column */}
          <div className="sdm-footer__col sdm-footer__col--store">
            <h3 className="sdm-footer__heading">Store Location</h3>
            <div className="sdm-footer__store-info">
              <div className="sdm-footer__info-row">
                <span className="material-symbols-outlined sdm-footer__info-icon">location_on</span>
                <div>
                  <address className="sdm-footer__address">
                    1117 Sanjeevni Nagar Main Road,<br />
                    Jabalpur, Madhya Pradesh 482003
                  </address>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Sai+Darshan+Mart+1117+Sanjeevni+Nagar+Main+Road+Jabalpur+Madhya+Pradesh+482003"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sdm-footer__map-link"
                  >
                    Open in Google Maps &rarr;
                  </a>
                </div>
              </div>

              <div className="sdm-footer__info-row">
                <span className="material-symbols-outlined sdm-footer__info-icon">schedule</span>
                <div>
                  <strong>Store Hours:</strong>
                  <span>8:00 AM – 10:00 PM (Daily)</span>
                </div>
              </div>

              <div className="sdm-footer__info-row">
                <span className="material-symbols-outlined sdm-footer__info-icon">person</span>
                <div>
                  <strong>Proprietor:</strong>
                  <span>Amit Chouksey</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Admin link */}
        <div className="sdm-footer__bottom">
          <div className="sdm-footer__copyright">
            &copy; {currentYear} Sai Darshan Mart. All rights reserved. Jabalpur, MP.
          </div>
          <div className="sdm-footer__meta">
            <span className="sdm-footer__m3-badge">Material 3 Design System</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
