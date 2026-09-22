import { formatPrice } from '../../lib/orderUtils';
import './OrderSummary.css';

interface OrderSummaryProps {
  subtotal: number;
  deliveryFee?: number;
  total?: number;
}

export function OrderSummary({ subtotal, deliveryFee = 0, total }: OrderSummaryProps) {
  const finalTotal = total ?? (subtotal + deliveryFee);

  return (
    <div className="order-summary">
      <h2 className="order-summary__title">Order Summary</h2>
      
      <div className="order-summary__row">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      
      <div className="order-summary__row">
        <span>Delivery Fee</span>
        <span>
          {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
        </span>
      </div>
      
      <div className="order-summary__row order-summary__row--total">
        <span>Total</span>
        <span>{formatPrice(finalTotal)}</span>
      </div>
    </div>
  );
}
