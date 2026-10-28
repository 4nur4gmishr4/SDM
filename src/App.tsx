import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider, AuthProvider, useAuth, ThemeProvider, SnackbarProvider, LocationProvider } from './contexts';
import { HelmetProvider } from 'react-helmet-async';

// Customer pages (Core initial entry points kept immediate)
import { HomePage } from './pages/customer/HomePage';
import { ShopPage } from './pages/customer/ShopPage';

// Lazy-loaded customer pages
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/customer/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const QuickOrderPage = lazy(() => import('./pages/customer/QuickOrderPage').then(m => ({ default: m.QuickOrderPage })));
const OrderConfirmationPage = lazy(() => import('./pages/customer/OrderConfirmationPage').then(m => ({ default: m.OrderConfirmationPage })));
const AboutPage = lazy(() => import('./pages/customer/AboutPage').then(m => ({ default: m.AboutPage })));
const NotFoundPage = lazy(() => import('./pages/customer/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Lazy-loaded admin pages (keeps XLSX and admin tables out of customer initial bundle)
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage').then(m => ({ default: m.OrdersPage })));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage').then(m => ({ default: m.ProductsPage })));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const BannersPage = lazy(() => import('./pages/admin/BannersPage').then(m => ({ default: m.BannersPage })));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage })));

import { useTrafficTracker } from './hooks/useTrafficTracker';

// Layouts
import { AppShell, ScrollToTop, Skeleton, ErrorBoundary, ProductTileSkeleton, AdminTableSkeleton } from './components/common';
import { AdminShell } from './components/admin/AdminShell';

import './styles/global.css';

function PageLoadingFallback() {
  return (
    <div className="layout-container" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <Skeleton width="180px" height={28} variant="rounded" />
        <Skeleton width="100px" height={36} variant="rounded" style={{ borderRadius: '18px' }} />
      </div>
      <div className="product-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductTileSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function AdminLoadingShellSkeleton() {
  return (
    <div className="admin-shell" aria-label="Loading admin portal...">
      <div className="admin-shell__nav" style={{ pointerEvents: 'none' }}>
        <div className="admin-shell__nav-header">
          <Skeleton width={36} height={36} variant="rounded" style={{ borderRadius: '8px' }} />
        </div>
        <div className="admin-shell__nav-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width={44} height={44} variant="rounded" style={{ borderRadius: '12px' }} />
          ))}
        </div>
      </div>
      <main className="admin-shell__main">
        <header className="admin-shell__top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Skeleton width={28} height={28} variant="rounded" />
            <Skeleton width="140px" height={20} variant="rounded" />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Skeleton width="100px" height={34} variant="rounded" style={{ borderRadius: '9999px' }} />
            <Skeleton width="80px" height={34} variant="rounded" style={{ borderRadius: '9999px' }} />
          </div>
        </header>
        <div className="admin-shell__content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Skeleton width="200px" height={32} variant="rounded" />
          <div className="admin-table-container">
            <table className="admin-table">
              <tbody>
                <AdminTableSkeleton rows={5} cols={5} />
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// Simple Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AdminLoadingShellSkeleton />;
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function RawXmlViewer({ file }: { file: string }) {
  useEffect(() => {
    fetch(file)
      .then((r) => r.text())
      .then((text) => {
        document.open();
        document.write(text);
        document.close();
      })
      .catch(() => {
        window.location.reload();
      });
  }, [file]);

  return <div style={{ padding: '24px', fontFamily: 'monospace' }}>Loading {file}...</div>;
}

function AppRoutes() {
  useTrafficTracker();

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* ================================================
            RAW SEO DIRECT ACCESS
            ================================================ */}
        <Route path="/sitemap.xml" element={<RawXmlViewer file="/sitemap.xml" />} />
        <Route path="/robots.txt" element={<RawXmlViewer file="/robots.txt" />} />

        {/* ================================================
            CUSTOMER ROUTES
            ================================================ */}
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:categorySlug" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/quick-order" element={<QuickOrderPage />} />
          <Route path="/order/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ================================================
            ADMIN ROUTES
            ================================================ */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <SnackbarProvider>
              <LocationProvider>
                <CartProvider>
                  <ErrorBoundary>
                    <AppRoutes />
                  </ErrorBoundary>
                </CartProvider>
              </LocationProvider>
            </SnackbarProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}
