import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_PRODUCTS, MOCK_BANNERS } from '../../lib/mockData';
import { AdminDashboardSkeleton } from '../../components/common';
import './AdminDashboardPage.css';

export function AdminDashboardPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState(() => ({
    totalOrders: 12,
    pendingOrders: 3,
    totalProducts: MOCK_PRODUCTS.length,
    activeOffers: MOCK_BANNERS.length
  }));
  const [isLoading, setIsLoading] = useState(false);

  const pageTitle = 'Dashboard — Sai Darshan Mart Admin';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useEffect(() => {
    async function fetchDashboardStats() {
      if (!session) return;
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const [ordersRes, pendingRes, productsRes, offersRes] = await Promise.allSettled([
          withTimeout(supabase.from('orders').select('*', { count: 'exact', head: true }), 2000),
          withTimeout(supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'), 2000),
          withTimeout(supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_archived', false), 2000),
          withTimeout(supabase.from('offers').select('*', { count: 'exact', head: true }).eq('is_active', true), 2000),
        ]);

        const totalOrders = ordersRes.status === 'fulfilled' ? ordersRes.value.count : 12;
        const pendingOrders = pendingRes.status === 'fulfilled' ? pendingRes.value.count : 3;
        const totalProducts = productsRes.status === 'fulfilled' ? productsRes.value.count : MOCK_PRODUCTS.length;
        const activeOffers = offersRes.status === 'fulfilled' ? offersRes.value.count : MOCK_BANNERS.length;
          
        setStats({
          totalOrders: totalOrders || 0,
          pendingOrders: pendingOrders || 0,
          totalProducts: totalProducts || 0,
          activeOffers: activeOffers || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardStats();
  }, [session]);

  if (isLoading) {
    return (
      <div className="admin-layout-content admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">Dashboard</h1>
        </div>
        <AdminDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="admin-layout-content admin-dashboard">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <div className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">Dashboard</h1>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon-wrapper" style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
            <span className="material-symbols-outlined admin-stat-card__icon">shopping_bag</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{stats.totalOrders}</span>
            <span className="admin-stat-card__label">Total Orders</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon-wrapper" style={{ backgroundColor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }}>
            <span className="material-symbols-outlined admin-stat-card__icon">pending_actions</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{stats.pendingOrders}</span>
            <span className="admin-stat-card__label">Pending Orders</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon-wrapper" style={{ backgroundColor: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }}>
            <span className="material-symbols-outlined admin-stat-card__icon">inventory_2</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{stats.totalProducts}</span>
            <span className="admin-stat-card__label">Products</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon-wrapper" style={{ backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
            <span className="material-symbols-outlined admin-stat-card__icon">local_offer</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{stats.activeOffers}</span>
            <span className="admin-stat-card__label">Active Offers</span>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-section">
        <h2 className="admin-dashboard-section__title">Recent Activity</h2>
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          System overview and recent order activity will appear here.
        </p>
      </div>
    </div>
  );
}
