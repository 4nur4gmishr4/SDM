import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { HelmetProvider } from 'react-helmet-async';

// Customer pages
import { HomePage } from './pages/customer/HomePage';
import { ShopPage } from './pages/customer/ShopPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { QuickOrderPage } from './pages/customer/QuickOrderPage';
import { OrderConfirmationPage } from './pages/customer/OrderConfirmationPage';
import { AboutPage } from './pages/customer/AboutPage';

// Admin pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { BannersPage } from './pages/admin/BannersPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Layouts
import { AppShell, ScrollToTop, Skeleton } from './components/common';
import { AdminShell } from './components/admin';

import './styles/global.css';

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
        {/* We will add other admin routes here in subsequent tasks */}
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
              <CartProvider>
                <AppRoutes />
              </CartProvider>
            </SnackbarProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}
