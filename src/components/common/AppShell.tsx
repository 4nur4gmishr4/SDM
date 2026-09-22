import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
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
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`app-shell__nav-link ${
                  location.pathname === item.path ? 'app-shell__nav-link--active' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
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

      {/* Main Content Area */}
      <main className="app-shell__main">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="app-shell__bottom-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
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
