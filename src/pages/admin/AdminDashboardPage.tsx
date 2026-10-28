import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AdminDashboardSkeleton } from '../../components/common';
import './AdminDashboardPage.css';

export function AdminDashboardPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    activeOffers: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const pageTitle = 'Dashboard | Sai Darshan Shopping Mart Admin';

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
        const [productsRes, categoriesRes, offersRes] = await Promise.allSettled([
          withTimeout(supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_archived', false), 5000),
          withTimeout(supabase.from('categories').select('*', { count: 'exact', head: true }), 5000),
          withTimeout(supabase.from('banners').select('*', { count: 'exact', head: true }).eq('is_active', true), 5000),
        ]);

        const totalProducts = productsRes.status === 'fulfilled' ? productsRes.value.count : 0;
        const totalCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.count : 0;
        const activeOffers = offersRes.status === 'fulfilled' ? offersRes.value.count : 0;
          
        setStats({
          totalProducts: totalProducts || 0,
          totalCategories: totalCategories || 0,
          activeOffers: activeOffers || 0,
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
        <p className="admin-dashboard-subtitle">
          Real-time catalog management, promotional banners, and store configuration.
        </p>
      </div>

      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon-wrapper admin-stat-card__icon-wrapper--primary">
            <span className="material-symbols-outlined admin-stat-card__icon">inventory_2</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{stats.totalProducts.toLocaleString('en-IN')}</span>
            <span className="admin-stat-card__label">Active Products</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon-wrapper admin-stat-card__icon-wrapper--tertiary">
            <span className="material-symbols-outlined admin-stat-card__icon">category</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{stats.totalCategories}</span>
            <span className="admin-stat-card__label">Categories</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon-wrapper admin-stat-card__icon-wrapper--secondary">
            <span className="material-symbols-outlined admin-stat-card__icon">view_carousel</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{stats.activeOffers}</span>
            <span className="admin-stat-card__label">Active Banners</span>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-section">
        <div className="admin-dashboard-section__header">
          <div>
            <h2 className="admin-dashboard-section__title">Store Management Quick Actions</h2>
            <p className="admin-dashboard-section__subtitle">
              Manage groceries, update categories, configure banners, or change delivery fees.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '14px' }}>
          <Link
            to="/admin/products"
            className="sdsm-btn sdsm-btn--outlined"
            style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', borderRadius: '12px' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>inventory_2</span>
            <span style={{ fontWeight: 600 }}>Manage Products</span>
          </Link>

          <Link
            to="/admin/categories"
            className="sdsm-btn sdsm-btn--outlined"
            style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', borderRadius: '12px' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>category</span>
            <span style={{ fontWeight: 600 }}>Manage Categories</span>
          </Link>

          <Link
            to="/admin/banners"
            className="sdsm-btn sdsm-btn--outlined"
            style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', borderRadius: '12px' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>view_carousel</span>
            <span style={{ fontWeight: 600 }}>Manage Banners</span>
          </Link>

          <Link
            to="/admin/settings"
            className="sdsm-btn sdsm-btn--outlined"
            style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', borderRadius: '12px' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>settings</span>
            <span style={{ fontWeight: 600 }}>Store Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
