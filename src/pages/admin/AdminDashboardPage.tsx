import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { fetchTrafficAnalytics } from '../../lib/analytics';
import { useAuth } from '../../contexts/AuthContext';
import { AdminDashboardSkeleton } from '../../components/common';
import './AdminDashboardPage.css';

export function AdminDashboardPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    activeOffers: 0,
    todayVisitors: 0,
    totalPageViews: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const pageTitle = 'Dashboard | Sai Darshan Mart Admin';

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
        const [ordersRes, pendingRes, productsRes, offersRes, trafficData] = await Promise.allSettled([
          withTimeout(supabase.from('orders').select('*', { count: 'exact', head: true }), 5000),
          withTimeout(supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'), 5000),
          withTimeout(supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_archived', false), 5000),
          withTimeout(supabase.from('banners').select('*', { count: 'exact', head: true }).eq('is_active', true), 5000),
          fetchTrafficAnalytics()
        ]);

        const totalOrders = ordersRes.status === 'fulfilled' ? ordersRes.value.count : 0;
        const pendingOrders = pendingRes.status === 'fulfilled' ? pendingRes.value.count : 0;
        const totalProducts = productsRes.status === 'fulfilled' ? productsRes.value.count : 0;
        const activeOffers = offersRes.status === 'fulfilled' ? offersRes.value.count : 0;

        let todayVisitors = 0;
        let totalViews = 0;
        if (trafficData.status === 'fulfilled' && trafficData.value) {
          const todayStr = new Date().toISOString().split('T')[0];
          todayVisitors = trafficData.value.daily_visitors?.[todayStr] || 0;
          totalViews = trafficData.value.total_page_views || 0;
        }
          
        setStats({
          totalOrders: totalOrders || 0,
          pendingOrders: pendingOrders || 0,
          totalProducts: totalProducts || 0,
          activeOffers: activeOffers || 0,
          todayVisitors,
          totalPageViews: totalViews
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
        <h1 className="admin-dashboard-title">Dashboard Overview</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>
          Real-time overview of store orders, product catalog, and promotions.
        </p>
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
          <div className="admin-stat-card__icon-wrapper" style={{ backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
            <span className="material-symbols-outlined admin-stat-card__icon">group</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{stats.todayVisitors}</span>
            <span className="admin-stat-card__label">Today's Visitors</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon-wrapper" style={{ backgroundColor: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }}>
            <span className="material-symbols-outlined admin-stat-card__icon">inventory_2</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{stats.totalProducts}</span>
            <span className="admin-stat-card__label">Total Products</span>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="admin-dashboard-section__title" style={{ margin: 0 }}>Website Activity & Traffic Summary</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
              Real-time impressions, visitor count, and order status counts (PRD 4.2 #33 compliant).
            </p>
          </div>
          <Link
            to="/admin/analytics"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary, #ffffff)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(30, 142, 62, 0.25)'
            }}
          >
            <span>View Full Analytics</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: 'var(--md-sys-color-surface-container-low, #f8faf8)',
          border: '1px solid var(--md-sys-color-outline-variant, #e0e2dc)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              All-Time Page Views
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
              {stats.totalPageViews.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Active Promotional Banners
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>
              {stats.activeOffers}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Store Catalog Departments
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
              21 Categories
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
