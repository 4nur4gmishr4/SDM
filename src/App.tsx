import { lazy, Suspense } from 'react';
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
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Layouts
import { AppShell, ScrollToTop, Skeleton, ErrorBoundary } from './components/common';
import { AdminShell } from './components/admin';

import './styles/global.css';

function PageLoadingFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px' }}>
      <Skeleton variant="circular" width={48} height={48} />
      <Skeleton variant="rounded" width={200} height={20} />
      <Skeleton variant="rounded" width={140} height={14} />
    </div>
  );
}

// Simple Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '16px', background: 'var(--md-sys-color-surface)' }}>
        <Skeleton variant="circular" width={64} height={64} />
        <Skeleton variant="rounded" width={180} height={20} />
        <Skeleton variant="rounded" width={120} height={14} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
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
