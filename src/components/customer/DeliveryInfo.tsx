import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import './DeliveryInfo.css';

interface DeliveryInfoProps {
  rulesText?: string;
}

export function DeliveryInfo({ rulesText }: DeliveryInfoProps) {
  const { settings } = useDeliverySettings();
  const displayText = rulesText || settings?.rules_text || 'Doorstep grocery delivery across Jabalpur. Free delivery on orders above ₹500.';

  return (
    <div className="delivery-info">
      <span className="material-symbols-outlined delivery-info__icon">local_shipping</span>
      <div className="delivery-info__content">
        <h3 className="delivery-info__title">Delivery Information</h3>
        <p className="delivery-info__text">{displayText}</p>
      </div>
    </div>
  );
}
