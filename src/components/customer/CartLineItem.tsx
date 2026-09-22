import { Link } from 'react-router-dom';
import { QuantityControl } from './QuantityControl';
import { formatPrice } from '../../lib/orderUtils';
import type { CartItem } from '../../types/order';
import './CartLineItem.css';

interface CartLineItemProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartLineItem({ item, onUpdateQuantity, onRemove }: CartLineItemProps) {
  return (
    <div className="cart-item">
      <Link to={`/product/${item.product_id}`} className="cart-item__image-container" tabIndex={-1}>
        {item.product_image_url ? (
          <img src={item.product_image_url} alt={item.product_name} className="cart-item__image" />
        ) : (
          <div className="cart-item__placeholder">
            <span className="material-symbols-outlined">image</span>
          </div>
        )}
      </Link>
      
      <div className="cart-item__content">
        <div className="cart-item__header">
          <Link to={`/product/${item.product_id}`} className="cart-item__title">
            {item.product_name}
          </Link>
          <button 
            className="cart-item__remove" 
            onClick={() => onRemove(item.product_id)}
            aria-label="Remove item"
            title="Remove item"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="cart-item__unit">{item.unit_size}</div>
        
        <div className="cart-item__footer">
          <QuantityControl
            quantity={item.quantity}
            onDecrease={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
            onIncrease={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
            min={1}
          />
          <div className="cart-item__price">
            {formatPrice(item.product_price * item.quantity)}
          </div>
        </div>
      </div>
    </div>
  );
}
