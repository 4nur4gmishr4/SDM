import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { CartLineItem } from '../../components/customer/CartLineItem';
import { OrderSummary } from '../../components/customer/OrderSummary';
import { DeliveryInfo } from '../../components/customer/DeliveryInfo';
import './CartPage.css';

export function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const { settings } = useDeliverySettings();
  
  // Use settings or fallback to 0
  const deliveryFee = settings?.flat_fee || 0;

  if (items.length === 0) {
    return (
      <div className="layout-container cart-page">
        <header className="cart-page__header">
          <h1 className="cart-page__title">Your Cart</h1>
        </header>
        <div className="cart-page__empty">
          <span className="material-symbols-outlined cart-page__empty-icon">shopping_cart</span>
          <h2 className="cart-page__empty-title">Your cart is empty</h2>
          <p style={{ marginBottom: '24px' }}>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/shop">
            <md-filled-button>Start Shopping</md-filled-button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container cart-page">
      <header className="cart-page__header">
        <h1 className="cart-page__title">Your Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})</h1>
        <md-text-button onClick={clearCart}>Clear Cart</md-text-button>
      </header>

      <div className="cart-page__content">
        <div className="cart-page__list">
          {items.map(item => (
            <CartLineItem
              key={item.product_id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>

        <div className="cart-page__sidebar">
          <OrderSummary subtotal={subtotal} deliveryFee={deliveryFee} />
          
          <md-filled-button 
            className="cart-page__checkout-btn"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
            <span className="material-symbols-outlined" slot="icon">arrow_forward</span>
          </md-filled-button>

          <DeliveryInfo rulesText={settings?.rules_text} />
        </div>
      </div>
    </div>
  );
}
