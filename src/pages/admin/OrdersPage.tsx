import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { formatPrice } from '../../lib/orderUtils';
import { AdminTableSkeleton } from '../../components/common';
import type { Order } from '../../types/order';
import './OrdersPage.css';

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const pageTitle = 'Orders Management — Sai Darshan Mart Admin';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const fetchOrders = async () => {
    if (!isSupabaseConfigured) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await withTimeout(
        supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false }),
        5000
      );

      const { data, error } = response as any;
      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error('Orders fetch error:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status.');
    }
  };

  const getBadgeClass = (status: string) => {
    return `admin-badge admin-badge--${status.toLowerCase()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch = !query ||
        o.id.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_phone.includes(query);

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, safePage, pageSize]);

  return (
    <div className="admin-layout-content admin-orders-page">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <div className="admin-orders-header">
        <h1 className="admin-orders-title">Orders ({orders.length})</h1>
        <button
          type="button"
          onClick={fetchOrders}
          className="sdm-btn sdm-btn--outlined"
          title="Refresh orders list"
          style={{ height: '38px', padding: '0 16px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
          <span>Refresh</span>
        </button>
      </div>

      <div className="admin-toolbar-row">
        <div className="admin-search-box">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search orders by ID, name, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select
          className="admin-filter-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && orders.length === 0 ? (
              <AdminTableSkeleton rows={6} cols={6} />
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--md-sys-color-outline)' }}>
                      inbox
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: 600 }}>No orders recorded yet</h4>
                    <p style={{ fontSize: '13px', margin: 0 }}>Orders placed by customers will appear here automatically.</p>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--md-sys-color-outline)' }}>
                      search_off
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: 600 }}>No matching orders found</h4>
                    <p style={{ fontSize: '13px', margin: 0 }}>Try clearing filters or changing search terms.</p>
                    <button
                      type="button"
                      className="sdm-btn sdm-btn--tonal"
                      style={{ marginTop: '8px' }}
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}>{order.id.slice(0, 8)}...</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                    <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {order.customer_phone}
                    </div>
                  </td>
                  <td>{formatPrice(order.total_amount)}</td>
                  <td>
                    <span className={getBadgeClass(order.status)}>
                      {order.status}
                    </span>
                    {order.is_quick_order && (
                      <span className="admin-badge admin-badge--processing" style={{ marginLeft: '4px' }}>Quick</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <select 
                        value={order.status} 
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filteredOrders.length > pageSize && (
          <div className="admin-pagination-container">
            <span>
              Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-pagination-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Previous page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
              </button>
              <span>Page {safePage} of {totalPages}</span>
              <button
                type="button"
                className="admin-pagination-btn"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Next page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
