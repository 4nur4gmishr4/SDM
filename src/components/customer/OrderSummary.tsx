import { formatPrice } from '../../lib/orderUtils';
import './OrderSummary.css';

interface OrderSummaryProps {
  subtotal: number;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  total?: number;
}

export function OrderSummary({
  subtotal,
  deliveryFee = 0,
  freeDeliveryThreshold,
  total,
}: OrderSummaryProps) {
  const finalTotal = total ?? (subtotal + deliveryFee);

  // Free delivery threshold calculations
  const threshold = freeDeliveryThreshold ?? 0;
  const isFreeDeliveryEligible = threshold > 0 && subtotal >= threshold;
  const amountNeededForFree = threshold > 0 ? Math.max(0, threshold - subtotal) : 0;
  const progressPercent = threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 100;

  return (
    <div className="order-summary">
      <h2 className="order-summary__title">Order Summary</h2>

      {/* Dynamic Free Delivery Tracker Banner */}
      {threshold > 0 && (
        <div className={`order-summary__free-delivery-card ${isFreeDeliveryEligible ? 'order-summary__free-delivery-card--unlocked' : ''}`}>
          <div className="order-summary__free-delivery-header">
            <span className="material-symbols-outlined order-summary__free-delivery-icon">
              {isFreeDeliveryEligible ? 'verified' : 'local_shipping'}
            </span>
            <span className="order-summary__free-delivery-text">
              {isFreeDeliveryEligible ? (
                <strong>You unlocked FREE Delivery!</strong>
              ) : (
                <>Add <strong>{formatPrice(amountNeededForFree)}</strong> more for <strong>FREE Delivery</strong></>
              )}
            </span>
          </div>
          <div className="order-summary__progress-track">
            <div
              className="order-summary__progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Selling Price / Subtotal */}
      <div className="order-summary__row">
        <span>Selling Price</span>
        <span className="order-summary__selling-price">{formatPrice(subtotal)}</span>
      </div>
      
      {/* Delivery Fee */}
      <div className="order-summary__row">
        <span>Delivery Fee</span>
        <span>
          {deliveryFee === 0 ? (
            <span className="order-summary__free-badge">FREE</span>
          ) : (
            formatPrice(deliveryFee)
          )}
        </span>
      </div>
      
      {/* Final Total */}
      <div className="order-summary__row order-summary__row--total">
        <span>Total Amount</span>
        <span>{formatPrice(finalTotal)}</span>
      </div>
    </div>
  );
}
