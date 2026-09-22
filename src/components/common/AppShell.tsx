import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { Footer } from './Footer';
import './AppShell.css';

export function AppShell() {
  const { itemCount } = useCart();
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Shop', path: '/shop', icon: 'storefront' },
    { label: 'Quick Order', path: '/quick-order', icon: 'list_alt' },
    { label: 'Store Info', path: '/about', icon: 'info' },
  ];

  return (
    <div className="app-shell">
      {/* Top App Bar (Desktop & Mobile header) */}
      <header className="app-shell__top-bar">
        <div className="app-shell__top-bar-inner">
          <Link to="/" className="app-shell__brand">
            <span className="app-shell__brand-name">Sai Darshan Mart</span>
            <span className="app-shell__brand-tagline">There is only one Boss: The Customer</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="app-shell__nav">
            {navItems.map((item) => {
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`app-shell__nav-link ${
                    isActive ? 'app-shell__nav-link--active' : ''
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions (Cart) */}
          <div className="app-shell__actions">
            <Link to="/cart" className="app-shell__cart-button" aria-label="Shopping Cart">
              <span className="material-symbols-outlined">shopping_cart</span>
              {itemCount > 0 && <span className="app-shell__cart-badge">{itemCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area with M3 page transition */}
      <main className="app-shell__main">
        <div key={location.pathname} className="m3-page-transition app-shell__page-content">
          <Outlet />
        </div>
      </main>

      {/* Customer Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <nav className="app-shell__bottom-nav" aria-label="Mobile Navigation">
        {navItems.map((item) => {
          const isActive = item.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`app-shell__bottom-nav-item ${
                isActive ? 'app-shell__bottom-nav-item--active' : ''
              }`}
            >
              <div className="app-shell__bottom-nav-icon-wrapper">
                <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
                  {item.icon}
                </span>
              </div>
              <span className="app-shell__bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
