import './DeliveryInfo.css';

interface DeliveryInfoProps {
  rulesText?: string;
}

export function DeliveryInfo({ rulesText = 'Free delivery within 5km radius for orders above ₹500.' }: DeliveryInfoProps) {
  return (
    <div className="delivery-info">
      <span className="material-symbols-outlined delivery-info__icon">local_shipping</span>
      <div className="delivery-info__content">
        <h3 className="delivery-info__title">Delivery Information</h3>
        <p className="delivery-info__text">{rulesText}</p>
      </div>
    </div>
  );
}
