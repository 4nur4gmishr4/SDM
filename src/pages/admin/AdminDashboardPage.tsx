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
    totalProducts: 0,
    totalCategories: 0,
    activeOffers: 0,
    todayVisitors: 0,
    totalPageViews: 0
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
        const [productsRes, categoriesRes, offersRes, trafficData] = await Promise.allSettled([
          withTimeout(supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_archived', false), 5000),
          withTimeout(supabase.from('categories').select('*', { count: 'exact', head: true }), 5000),
          withTimeout(supabase.from('banners').select('*', { count: 'exact', head: true }).eq('is_active', true), 5000),
          fetchTrafficAnalytics()
        ]);

        const totalProducts = productsRes.status === 'fulfilled' ? productsRes.value.count : 0;
        const totalCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.count : 0;
        const activeOffers = offersRes.status === 'fulfilled' ? offersRes.value.count : 0;

        let todayVisitors = 0;
        let totalViews = 0;
        if (trafficData.status === 'fulfilled' && trafficData.value) {
          const todayStr = new Date().toISOString().split('T')[0];
          todayVisitors = trafficData.value.daily_visitors?.[todayStr] || 0;
          totalViews = trafficData.value.total_page_views || 0;
        }
          
        setStats({
          totalProducts: totalProducts || 0,
          totalCategories: totalCategories || 0,
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
        <p className="admin-dashboard-subtitle">
          Real-time catalog management, promotional banners, and WhatsApp order routing.
        </p>
      </div>

      <div className="admin-dashboard-grid">
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

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon-wrapper admin-stat-card__icon-wrapper--error">
            <span className="material-symbols-outlined admin-stat-card__icon">group</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{stats.todayVisitors}</span>
            <span className="admin-stat-card__label">Today's Visitors</span>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-section">
        <div className="admin-dashboard-section__header">
          <div>
            <h2 className="admin-dashboard-section__title">Website Activity & Traffic Summary</h2>
            <p className="admin-dashboard-section__subtitle">
              Real-time impressions, visitor count, and order status counts (PRD 4.2 #33 compliant).
            </p>
          </div>
          <Link
            to="/admin/analytics"
            className="admin-dashboard-analytics-link"
          >
            <span>View Full Analytics</span>
            <span className="material-symbols-outlined admin-dashboard-analytics-icon">arrow_forward</span>
          </Link>
        </div>

        <div className="admin-dashboard-summary-grid">
          <div className="admin-dashboard-summary-item">
            <span className="admin-dashboard-summary-item__label">
              All-Time Page Views
            </span>
            <div className="admin-dashboard-summary-item__value">
              {stats.totalPageViews.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="admin-dashboard-summary-item">
            <span className="admin-dashboard-summary-item__label">
              Active Promotional Banners
            </span>
            <div className="admin-dashboard-summary-item__value admin-dashboard-summary-item__value--primary">
              {stats.activeOffers}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
