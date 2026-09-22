import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Footer } from './Footer';
import { STORE_NAME } from '../../lib/orderUtils';
import { HeaderLocationPill } from '../customer/HeaderLocationPill';
import { LocationPickerModal } from '../customer/LocationPickerModal';
import './AppShell.css';

export function AppShell() {
  const { itemCount, subtotal } = useCart();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { showSnackbar } = useSnackbar();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Reset window scroll to top on route change for native app screen experience
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showSnackbar('Internet connection restored.');
    };
    const handleOffline = () => {
      setIsOffline(true);
      showSnackbar('You are currently offline. Check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showSnackbar]);

  const handleToggleTheme = () => {
    const nextThemeName = resolvedTheme === 'dark' ? 'Light Theme' : 'Dark Theme';
    toggleTheme();
    showSnackbar(`Theme set to ${nextThemeName}`);
  };

  interface NavItem {
    label: string;
    path: string;
    icon: string;
    badge?: boolean;
  }

  const navItems: NavItem[] = [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Shop', path: '/shop', icon: 'storefront' },
    { label: 'Quick Order', path: '/quick-order', icon: 'edit_note' },
    { label: 'Store Info', path: '/about', icon: 'info' },
  ];

  return (
    <div className="app-shell">
      {/* Offline Connectivity Warning Banner */}
      {isOffline && (
        <div 
          role="alert" 
          aria-live="assertive"
          style={{
            backgroundColor: '#b00020',
            color: '#ffffff',
            textAlign: 'center',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            position: 'sticky',
            top: 0,
            zIndex: 9999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>wifi_off</span>
          <span>You are currently offline. Please check your internet connection to place orders.</span>
        </div>
      )}

      {/* Top App Bar (Desktop & Mobile header) */}
      <header className="app-shell__top-bar">
        <div className="app-shell__top-bar-inner">
          <div className="app-shell__brand-group">
            <Link to="/" className="app-shell__brand" aria-label={`${STORE_NAME} Home`}>
              <span className="app-shell__brand-box">{STORE_NAME}</span>
            </Link>
            <HeaderLocationPill />
          </div>

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
                  {item.badge && itemCount > 0 && (
                    <span className="app-shell__cart-badge" style={{ position: 'static', marginLeft: '6px' }}>
                      {itemCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions (Theme Switcher, Cart) */}
          <div className="app-shell__actions">
            {/* Light / Dark Mode Switcher */}
            <button
              type="button"
              className="app-shell__action-btn"
              onClick={handleToggleTheme}
              aria-label={`Current theme: ${resolvedTheme}. Click to switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="material-symbols-outlined">
                {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Shopping Cart Button */}
            <Link 
              to="/cart" 
              className="app-shell__action-btn app-shell__cart-button" 
              aria-label="Shopping Cart"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              {itemCount > 0 && (
                <span className="app-shell__cart-badge" aria-label={`${itemCount} items in cart`}>
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Viewport & Footer */}
      <div className="app-shell__page-viewport">
        <main className="app-shell__main">
          <Outlet />
        </main>

        {/* Customer Footer */}
        <Footer />
      </div>

      {/* Mobile Sticky Floating Cart Bar */}
      {itemCount > 0 &&
        !location.pathname.startsWith('/cart') &&
        !location.pathname.startsWith('/checkout') &&
        !location.pathname.startsWith('/order') && (
          <Link
            to="/cart"
            className="app-shell__floating-cart-bar"
            aria-label={`View Cart with ${itemCount} items totaling ₹${subtotal}`}
          >
            <div className="app-shell__floating-cart-left">
              <div className="app-shell__floating-cart-icon-wrap">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  shopping_cart
                </span>
                <span className="app-shell__floating-cart-badge">{itemCount}</span>
              </div>
              <div className="app-shell__floating-cart-details">
                <span className="app-shell__floating-cart-count">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
                <span className="app-shell__floating-cart-total">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="app-shell__floating-cart-right">
              <span>View Cart</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                arrow_forward
              </span>
            </div>
          </Link>
        )}

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
                {item.badge && itemCount > 0 && (
                  <span className="app-shell__cart-badge" style={{ top: '-4px', right: '-4px' }}>
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <span className="app-shell__bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Geolocation Modal */}
      <LocationPickerModal />
    </div>
  );
}
