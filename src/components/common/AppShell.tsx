import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigationType } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Footer } from './Footer';
import { HeaderLocationPill, LocationPickerModal } from '../customer';
import './AppShell.css';

export function AppShell() {
  const { itemCount } = useCart();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { showSnackbar } = useSnackbar();
  const location = useLocation();
  const navType = useNavigationType();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Track history index to differentiate forward and backward (predictive back) transitions
  const prevIdxRef = useRef<number>(
    typeof window !== 'undefined' && window.history.state?.idx != null
      ? window.history.state.idx
      : 0
  );
  const [transitionClass, setTransitionClass] = useState<'android-transition--forward' | 'android-transition--back'>(
    'android-transition--forward'
  );

  useEffect(() => {
    const currentIdx = typeof window !== 'undefined' && window.history.state?.idx != null
      ? window.history.state.idx
      : 0;

    if (navType === 'POP') {
      if (currentIdx < prevIdxRef.current) {
        setTransitionClass('android-transition--back');
      } else {
        setTransitionClass('android-transition--forward');
      }
    } else {
      setTransitionClass('android-transition--forward');
    }
    prevIdxRef.current = currentIdx;

    // Reset window scroll to top on route change for native app screen experience
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [location.key, location.pathname, navType]);

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
    toggleTheme();
    const nextTheme = theme === 'system' 
      ? (resolvedTheme === 'dark' ? 'Light Theme' : 'Dark Theme')
      : (theme === 'light' ? 'Dark Theme' : 'Auto (System Theme)');
    showSnackbar(`Theme set to ${nextTheme}`);
  };

  const navItems = [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Shop', path: '/shop', icon: 'storefront' },
    { label: 'Cart', path: '/cart', icon: 'shopping_cart', badge: true },
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
            <Link to="/" className="app-shell__brand">
              <span className="app-shell__brand-name">Sai Darshan Mart</span>
              <span className="app-shell__brand-tagline">There is only one Boss: The Customer</span>
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
              aria-label={`Current theme: ${theme}. Click to switch theme`}
              title={`Theme: ${theme === 'system' ? `Auto (System: ${resolvedTheme})` : theme}`}
            >
              <span className="material-symbols-outlined">
                {theme === 'system' ? 'brightness_auto' : resolvedTheme === 'dark' ? 'dark_mode' : 'light_mode'}
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

      {/* Full Page Viewport with Google/Android predictive back & forward page transitions (Mobile only) */}
      <div 
        key={location.key || location.pathname} 
        className={`android-page-viewport app-shell__page-viewport ${transitionClass}`}
      >
        <main className="app-shell__main">
          <Outlet />
        </main>

        {/* Customer Footer */}
        <Footer />
      </div>

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
