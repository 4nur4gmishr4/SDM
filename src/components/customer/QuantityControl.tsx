import './CartLineItem.css';

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
}

export function QuantityControl({ quantity, onIncrease, onDecrease, min = 1 }: QuantityControlProps) {
  return (
    <div className="quantity-control">
      <button 
        className="quantity-control__btn" 
        onClick={onDecrease}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>remove</span>
      </button>
      <span className="quantity-control__value">{quantity}</span>
      <button 
        className="quantity-control__btn" 
        onClick={onIncrease}
        aria-label="Increase quantity"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
      </button>
    </div>
  );
}
