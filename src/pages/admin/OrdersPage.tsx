import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/orderUtils';
import type { Order } from '../../types/order';
import './OrdersPage.css';

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Failed to load orders.');
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

  return (
    <div className="admin-layout-content admin-orders-page">
      <div className="admin-orders-header">
        <h1 className="admin-orders-title">Orders</h1>
        <md-filled-icon-button onClick={fetchOrders} aria-label="Refresh orders">
          <md-icon>refresh</md-icon>
        </md-filled-icon-button>
      </div>

      <div className="admin-table-container">
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <md-circular-progress indeterminate></md-circular-progress>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
            No orders found.
          </div>
        ) : (
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
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace' }}>{order.id}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <div>{order.customer_name}</div>
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
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--md-sys-color-outline)',
                          backgroundColor: 'var(--md-sys-color-surface)'
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
