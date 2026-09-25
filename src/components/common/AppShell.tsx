import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Footer } from './Footer';
import { ProfileModal } from './ProfileModal';
import { HeaderLocationPill, GooeyLocationHero, LocationPickerModal } from '../customer';
import './AppShell.css';

export function AppShell() {
  const { itemCount } = useCart();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const handleToggleTheme = () => {
    toggleTheme();
    // compute what the next theme will be
    const nextTheme = theme === 'system' 
      ? (resolvedTheme === 'dark' ? 'Light Theme' : 'Dark Theme')
      : (theme === 'light' ? 'Dark Theme' : 'Auto (System Theme)');
    showSnackbar(`Theme set to ${nextTheme}`);
  };

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
                </Link>
              );
            })}
          </nav>

          {/* Actions (Theme Switcher, Cart, Profile) */}
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
              {itemCount > 0 && <span className="app-shell__cart-badge">{itemCount}</span>}
            </Link>

            {/* Customer Profile / Google Login Button */}
            <button
              type="button"
              className="app-shell__action-btn app-shell__profile-btn"
              onClick={() => setIsProfileOpen(true)}
              aria-label={user ? 'Customer Account' : 'Sign in with Google'}
              title={user ? (user.user_metadata?.full_name || user.email || 'Customer Account') : 'Sign in with Google'}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="app-shell__avatar-img" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className={`material-symbols-outlined ${user ? 'filled' : ''}`}>
                  {user ? 'account_circle' : 'person'}
                </span>
              )}
            </button>
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

      {/* Customer Profile & Google Login Modal */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

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
      {/* Geolocation Modals */}
      <GooeyLocationHero />
      <LocationPickerModal />
    </div>
  );
}
