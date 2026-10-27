import { Suspense } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Skeleton, AdminTableSkeleton } from '../common';
import { STORE_NAME } from '../../lib/orderUtils';
import './AdminShell.css';

export function AdminShell() {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: 'dashboard' },
    { label: 'Products', path: '/admin/products', icon: 'inventory_2' },
    { label: 'Categories', path: '/admin/categories', icon: 'category' },
    { label: 'Banners', path: '/admin/banners', icon: 'view_carousel' },
    { label: 'Analytics', path: '/admin/analytics', icon: 'monitoring' },
    { label: 'Settings', path: '/admin/settings', icon: 'settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      {/* Navigation Rail (Desktop) / Bottom Nav (Mobile) */}
      <nav className="admin-shell__nav">
        <div className="admin-shell__nav-header">
          <span className="material-symbols-outlined admin-shell__brand-icon">storefront</span>
        </div>

        <div className="admin-shell__nav-list">
          {navItems.map((item) => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-shell__nav-item ${
                  isActive ? 'admin-shell__nav-item--active' : ''
                }`}
                title={item.label}
              >
                <div className="admin-shell__nav-icon-wrapper">
                  <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
                    {item.icon}
                  </span>
                </div>
                <span className="admin-shell__nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="admin-shell__main">
        {/* Top Header Bar */}
        <header className="admin-shell__top-bar">
          {/* Store Branding (Left) */}
          <div className="admin-shell__top-bar-brand">
            <span className="material-symbols-outlined admin-shell__brand-icon-mini">
              storefront
            </span>
            <div className="admin-shell__brand-info">
              <span className="admin-shell__brand-title">{STORE_NAME}</span>
              <span className="admin-shell__brand-subtitle">Admin Panel</span>
            </div>
          </div>

          {/* Actions (Right): 3-Way Theme Switcher, View Store, Logout */}
          <div className="admin-shell__top-bar-actions">
            {/* 3-Option Instant Theme Switcher */}
            <div className="admin-theme-segmented" role="radiogroup" aria-label="Select theme mode">
              <button
                type="button"
                className={`admin-theme-segment-btn ${theme === 'system' ? 'active' : ''}`}
                onClick={() => setTheme('system')}
                title="System Mode (Matches device theme)"
                aria-label="System theme"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>desktop_windows</span>
                <span>System</span>
              </button>

              <button
                type="button"
                className={`admin-theme-segment-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
                title="Light Mode (1-tap switch)"
                aria-label="Light mode"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>light_mode</span>
                <span>Light</span>
              </button>

              <button
                type="button"
                className={`admin-theme-segment-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
                title="Dark Mode (1-tap switch)"
                aria-label="Dark mode"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>dark_mode</span>
                <span>Dark</span>
              </button>
            </div>

            {/* View Store Button */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-shell__action-pill admin-shell__action-pill--store"
              title="Open customer storefront in a new tab"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
              <span>View Store</span>
            </a>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="admin-shell__action-pill admin-shell__action-pill--logout"
              title="Sign Out of Admin"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content Outlet with tailored admin skeleton fallback */}
        <div className="admin-shell__content">
          <Suspense
            fallback={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton width="220px" height={32} variant="rounded" />
                  <Skeleton width="120px" height={40} variant="rounded" />
                </div>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <tbody>
                      <AdminTableSkeleton rows={6} cols={5} />
                    </tbody>
                  </table>
                </div>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
