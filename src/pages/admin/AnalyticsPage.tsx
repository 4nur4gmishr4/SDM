import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { fetchTrafficAnalytics, type TrafficAnalyticsData } from '../../lib/analytics';
import { AdminDashboardSkeleton } from '../../components/common';
import './AnalyticsPage.css';

interface OrderAnalytics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  quickOrdersCount: number;
  cartOrdersCount: number;
}

export function AnalyticsPage() {
  const [traffic, setTraffic] = useState<TrafficAnalyticsData | null>(null);
  const [orderMetrics, setOrderMetrics] = useState<OrderAnalytics>({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    quickOrdersCount: 0,
    cartOrdersCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const pageTitle = 'Store Analytics & Traffic | Sai Darshan Shopping Mart Admin';

  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // 1. Fetch traffic telemetry
      const trafficPromise = fetchTrafficAnalytics();

      // 2. Fetch order counts by status (excluding revenue per PRD #33)
      let ordersPromise: Promise<any>;
      if (isSupabaseConfigured) {
        ordersPromise = Promise.allSettled([
          withTimeout(supabase.from('orders').select('*', { count: 'exact', head: true }), 5000),
          withTimeout(supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'), 5000),
          withTimeout(supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'processing'), 5000),
          withTimeout(supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'), 5000),
          withTimeout(supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'), 5000),
          withTimeout(supabase.from('orders').select('*', { count: 'exact', head: true }).eq('is_quick_order', true), 5000),
        ]);
      } else {
        ordersPromise = Promise.resolve([]);
      }

      const [trafficRes, ordersRes] = await Promise.all([trafficPromise, ordersPromise]);

      setTraffic(trafficRes);

      if (Array.isArray(ordersRes) && ordersRes.length >= 6) {
        const total = ordersRes[0].status === 'fulfilled' ? ordersRes[0].value.count || 0 : 0;
        const pending = ordersRes[1].status === 'fulfilled' ? ordersRes[1].value.count || 0 : 0;
        const processing = ordersRes[2].status === 'fulfilled' ? ordersRes[2].value.count || 0 : 0;
        const delivered = ordersRes[3].status === 'fulfilled' ? ordersRes[3].value.count || 0 : 0;
        const cancelled = ordersRes[4].status === 'fulfilled' ? ordersRes[4].value.count || 0 : 0;
        const quick = ordersRes[5].status === 'fulfilled' ? ordersRes[5].value.count || 0 : 0;

        setOrderMetrics({
          totalOrders: total,
          pendingOrders: pending,
          processingOrders: processing,
          deliveredOrders: delivered,
          cancelledOrders: cancelled,
          quickOrdersCount: quick,
          cartOrdersCount: Math.max(0, total - quick),
        });
      }

      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto refresh every 45 seconds for active admin tab
    const interval = setInterval(() => loadData(true), 45000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !traffic) {
    return (
      <div className="admin-layout-content admin-analytics">
        <div className="admin-analytics__header">
          <h1 className="admin-dashboard-title">Store Analytics</h1>
        </div>
        <AdminDashboardSkeleton />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisitors = traffic?.daily_visitors?.[todayStr] || 0;
  const todayViews = traffic?.daily_views?.[todayStr] || 0;
  const totalViews = traffic?.total_page_views || 0;

  // 7-day visitor data
  const last7Days: { date: string; label: string; visitors: number; views: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    last7Days.push({
      date: dateStr,
      label,
      visitors: traffic?.daily_visitors?.[dateStr] || 0,
      views: traffic?.daily_views?.[dateStr] || 0,
    });
  }

  const maxDailyViews = Math.max(...last7Days.map(d => d.views), 10);

  // Page breakdown sorting
  const pagesList = Object.entries(traffic?.page_breakdown || {}).sort((a, b) => b[1] - a[1]);

  const deviceTotal =
    (traffic?.devices?.mobile || 0) +
    (traffic?.devices?.desktop || 0) +
    (traffic?.devices?.tablet || 0) || 1;

  const mobilePercent = Math.round(((traffic?.devices?.mobile || 0) / deviceTotal) * 100);
  const desktopPercent = Math.round(((traffic?.devices?.desktop || 0) / deviceTotal) * 100);
  const tabletPercent = Math.max(0, 100 - mobilePercent - desktopPercent);

  return (
    <div className="admin-layout-content admin-analytics">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      {/* Header Bar */}
      <div className="admin-analytics__header">
        <div>
          <h1 className="admin-dashboard-title">Website Traffic & Order Analytics</h1>
          <p className="admin-analytics__subtitle">
            Live visitor activity, page impressions, and order lifecycle counts (PRD 4.2 #33 compliant).
          </p>
        </div>

        <div className="admin-analytics__header-actions">
          <span className="admin-analytics__timestamp">
            Updated {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            className="admin-analytics__refresh-btn"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            title="Refresh analytics metrics"
          >
            <span className={`material-symbols-outlined ${isRefreshing ? 'spin' : ''}`}>
              refresh
            </span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: KPI Summary Metric Cards */}
      <div className="admin-dashboard-grid">
        <div className="admin-stat-card">
          <div
            className="admin-stat-card__icon-wrapper"
            style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
            }}
          >
            <span className="material-symbols-outlined admin-stat-card__icon">visibility</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{totalViews.toLocaleString('en-IN')}</span>
            <span className="admin-stat-card__label">Page Views ({todayViews} today)</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div
            className="admin-stat-card__icon-wrapper"
            style={{
              backgroundColor: 'var(--md-sys-color-secondary-container)',
              color: 'var(--md-sys-color-on-secondary-container)',
            }}
          >
            <span className="material-symbols-outlined admin-stat-card__icon">group</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{todayVisitors.toLocaleString('en-IN')}</span>
            <span className="admin-stat-card__label">Today's Visitors</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div
            className="admin-stat-card__icon-wrapper"
            style={{
              backgroundColor: 'var(--md-sys-color-tertiary-container)',
              color: 'var(--md-sys-color-on-tertiary-container)',
            }}
          >
            <span className="material-symbols-outlined admin-stat-card__icon">shopping_bag</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{orderMetrics.totalOrders}</span>
            <span className="admin-stat-card__label">Total Orders</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div
            className="admin-stat-card__icon-wrapper"
            style={{
              backgroundColor: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
            }}
          >
            <span className="material-symbols-outlined admin-stat-card__icon">pending_actions</span>
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__value">{orderMetrics.pendingOrders}</span>
            <span className="admin-stat-card__label">Pending Orders</span>
          </div>
        </div>
      </div>

      {/* Section 2: Traffic Activity & 7-Day Chart */}
      <div className="admin-analytics__row">
        <div className="admin-analytics__card admin-analytics__card--chart">
          <div className="admin-analytics__card-header">
            <div>
              <h2 className="admin-analytics__card-title">7-Day Traffic & Views</h2>
              <span className="admin-analytics__card-caption">Daily page impressions and unique visitor counts</span>
            </div>
            <div className="admin-analytics__legend">
              <span className="admin-analytics__legend-item">
                <span className="admin-analytics__legend-dot admin-analytics__legend-dot--views" /> Views
              </span>
              <span className="admin-analytics__legend-item">
                <span className="admin-analytics__legend-dot admin-analytics__legend-dot--visitors" /> Visitors
              </span>
            </div>
          </div>

          <div className="admin-analytics__chart-bars">
            {last7Days.map((day) => {
              const heightPercent = Math.max(12, Math.round((day.views / maxDailyViews) * 100));
              return (
                <div key={day.date} className="admin-analytics__bar-col">
                  <div className="admin-analytics__bar-tooltip">
                    <strong>{day.label}</strong>
                    <span>{day.views} Views</span>
                    <span>{day.visitors} Visitors</span>
                  </div>
                  <div className="admin-analytics__bar-track">
                    <div
                      className="admin-analytics__bar-fill"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="admin-analytics__bar-label">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Distribution Card */}
        <div className="admin-analytics__card admin-analytics__card--device">
          <div className="admin-analytics__card-header">
            <div>
              <h2 className="admin-analytics__card-title">Visitor Devices</h2>
              <span className="admin-analytics__card-caption">Screen breakdown across shoppers</span>
            </div>
          </div>

          <div className="admin-analytics__device-list">
            <div className="admin-analytics__device-item">
              <div className="admin-analytics__device-meta">
                <span className="material-symbols-outlined">smartphone</span>
                <span className="admin-analytics__device-name">Mobile Phones</span>
                <strong className="admin-analytics__device-pct">{mobilePercent}%</strong>
              </div>
              <div className="admin-analytics__progress-track">
                <div className="admin-analytics__progress-bar admin-analytics__progress-bar--mobile" style={{ width: `${mobilePercent}%` }} />
              </div>
            </div>

            <div className="admin-analytics__device-item">
              <div className="admin-analytics__device-meta">
                <span className="material-symbols-outlined">laptop</span>
                <span className="admin-analytics__device-name">Desktop / Laptops</span>
                <strong className="admin-analytics__device-pct">{desktopPercent}%</strong>
              </div>
              <div className="admin-analytics__progress-track">
                <div className="admin-analytics__progress-bar admin-analytics__progress-bar--desktop" style={{ width: `${desktopPercent}%` }} />
              </div>
            </div>

            <div className="admin-analytics__device-item">
              <div className="admin-analytics__device-meta">
                <span className="material-symbols-outlined">tablet</span>
                <span className="admin-analytics__device-name">Tablets / iPads</span>
                <strong className="admin-analytics__device-pct">{tabletPercent}%</strong>
              </div>
              <div className="admin-analytics__progress-track">
                <div className="admin-analytics__progress-bar admin-analytics__progress-bar--tablet" style={{ width: `${tabletPercent}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Order Status Counts & Channel Breakdown */}
      <div className="admin-analytics__row">
        {/* Order Status Breakdown */}
        <div className="admin-analytics__card">
          <div className="admin-analytics__card-header">
            <div>
              <h2 className="admin-analytics__card-title">Order Status Distribution</h2>
              <span className="admin-analytics__card-caption">Website orders across lifecycle stages</span>
            </div>
          </div>

          <div className="admin-analytics__status-grid">
            <div className="admin-analytics__status-box admin-analytics__status-box--pending">
              <span className="material-symbols-outlined">pending_actions</span>
              <span className="admin-analytics__status-num">{orderMetrics.pendingOrders}</span>
              <span className="admin-analytics__status-name">New / Pending</span>
            </div>

            <div className="admin-analytics__status-box admin-analytics__status-box--processing">
              <span className="material-symbols-outlined">sync</span>
              <span className="admin-analytics__status-num">{orderMetrics.processingOrders}</span>
              <span className="admin-analytics__status-name">Processing</span>
            </div>

            <div className="admin-analytics__status-box admin-analytics__status-box--delivered">
              <span className="material-symbols-outlined">check_circle</span>
              <span className="admin-analytics__status-num">{orderMetrics.deliveredOrders}</span>
              <span className="admin-analytics__status-name">Delivered</span>
            </div>

            <div className="admin-analytics__status-box admin-analytics__status-box--cancelled">
              <span className="material-symbols-outlined">cancel</span>
              <span className="admin-analytics__status-num">{orderMetrics.cancelledOrders}</span>
              <span className="admin-analytics__status-name">Cancelled</span>
            </div>
          </div>

          <div className="admin-analytics__channels">
            <div className="admin-analytics__channel-item">
              <span className="admin-analytics__channel-label">Standard Cart Checkout Orders</span>
              <strong className="admin-analytics__channel-val">{orderMetrics.cartOrdersCount}</strong>
            </div>
            <div className="admin-analytics__channel-item">
              <span className="admin-analytics__channel-label">Quick Order List Submissions</span>
              <strong className="admin-analytics__channel-val">{orderMetrics.quickOrdersCount}</strong>
            </div>
          </div>
        </div>

        {/* Page Views Breakdown Table */}
        <div className="admin-analytics__card">
          <div className="admin-analytics__card-header">
            <div>
              <h2 className="admin-analytics__card-title">Page Impressions Breakdown</h2>
              <span className="admin-analytics__card-caption">Most viewed customer store routes</span>
            </div>
          </div>

          <div className="admin-analytics__table-container">
            <table className="admin-analytics__table">
              <thead>
                <tr>
                  <th>Store Section</th>
                  <th>Path</th>
                  <th className="admin-analytics__table-th-right">Page Views</th>
                  <th className="admin-analytics__table-th-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {pagesList.map(([path, count]) => {
                  const share = totalViews > 0 ? Math.round((count / totalViews) * 100) : 0;
                  let label = 'Other';
                  if (path === '/') label = 'Storefront Home';
                  else if (path.startsWith('/shop')) label = 'Catalog & Shop';
                  else if (path.startsWith('/quick-order')) label = 'Quick Order';
                  else if (path.startsWith('/cart')) label = 'Cart Summary';
                  else if (path.startsWith('/checkout')) label = 'Checkout';
                  else if (path.startsWith('/about')) label = 'About Store';
                  else if (path.startsWith('/order')) label = 'Order Confirmation';

                  return (
                    <tr key={path}>
                      <td>
                        <strong>{label}</strong>
                      </td>
                      <td>
                        <code>{path}</code>
                      </td>
                      <td className="admin-analytics__table-td-count">
                        {count.toLocaleString('en-IN')}
                      </td>
                      <td className="admin-analytics__table-td-share">
                        {share}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
