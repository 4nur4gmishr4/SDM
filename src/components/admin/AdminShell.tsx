import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './AdminShell.css';

export function AdminShell() {
  const { signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: 'dashboard' },
    { label: 'Orders', path: '/admin/orders', icon: 'receipt_long' },
    { label: 'Products', path: '/admin/products', icon: 'inventory_2' },
    { label: 'Categories', path: '/admin/categories', icon: 'category' },
    { label: 'Banners', path: '/admin/banners', icon: 'view_carousel' },
    { label: 'Settings', path: '/admin/settings', icon: 'settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Get current page title
  const currentItem = navItems.find((item) => {
    if (item.path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(item.path);
  });
  const pageTitle = currentItem ? currentItem.label : 'Admin';

  return (
    <div className="admin-shell">
      {/* Navigation Rail / Bottom Nav */}
      <nav className="admin-shell__nav">
        <div className="admin-shell__nav-header">
          <span className="material-symbols-outlined admin-shell__brand-icon">store</span>
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

        <div className="admin-shell__nav-footer">
          {/* Theme toggle in rail */}
          <button
            type="button"
            onClick={toggleTheme}
            className="admin-shell__nav-item admin-shell__nav-item--theme"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div className="admin-shell__nav-icon-wrapper">
              <span className="material-symbols-outlined">
                {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </div>
            <span className="admin-shell__nav-label">
              {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          <button
            onClick={handleSignOut}
            className="admin-shell__nav-item"
            title="Sign Out"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div className="admin-shell__nav-icon-wrapper">
              <span className="material-symbols-outlined">logout</span>
            </div>
            <span className="admin-shell__nav-label">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-shell__main">
        <header className="admin-shell__top-bar">
          <h1 className="admin-shell__top-bar-title">{pageTitle}</h1>
          <div className="admin-shell__top-bar-actions">
            {/* Prominent Theme Toggle Button in Admin Top Bar */}
            <button
              type="button"
              onClick={toggleTheme}
              className="admin-shell__theme-btn"
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle dark/light mode"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="sdm-btn sdm-btn--outlined admin-shell__view-store-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>storefront</span>
              <span>View Store</span>
            </a>
          </div>
        </header>

        <div className="admin-shell__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
