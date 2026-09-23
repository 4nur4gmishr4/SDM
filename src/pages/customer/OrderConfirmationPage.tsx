import { useParams, Link } from 'react-router-dom';
import { formatOrderId } from '../../lib/orderUtils';
import './OrderConfirmationPage.css';

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="layout-container">
      <div className="order-confirmation">
        <div className="order-confirmation__icon-wrapper">
          <span className="material-symbols-outlined order-confirmation__icon">check</span>
        </div>
        
        <h1 className="order-confirmation__title">Order Prepared</h1>
        
        <p className="order-confirmation__text">
          If you haven't sent the WhatsApp message yet, please complete the chat to confirm your order. We will review your list and reply with the final bill and delivery time.
        </p>

        <div className="order-confirmation__order-id">
          {formatOrderId(orderId || 'UNKNOWN')}
        </div>

        <div className="order-confirmation__actions">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button type="button" className="sdm-btn sdm-btn--primary">Return to Home</button>
          </Link>
          <Link to="/shop" style={{ textDecoration: 'none' }}>
            <button type="button" className="sdm-btn sdm-btn--outlined">Continue Shopping</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
