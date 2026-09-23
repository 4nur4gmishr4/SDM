import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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

  const pageTitle = 'Shopping Cart — Sai Darshan Mart';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  if (items.length === 0) {
    return (
      <div className="layout-container cart-page">
        <Helmet>
          <title>{pageTitle}</title>
          <meta name="description" content="View items in your shopping cart at Sai Darshan Mart Jabalpur." />
        </Helmet>
        <header className="cart-page__header">
          <h1 className="cart-page__title">Your Cart</h1>
        </header>
        <div className="cart-page__empty">
          <span className="material-symbols-outlined cart-page__empty-icon">shopping_cart</span>
          <h2 className="cart-page__empty-title">Your cart is empty</h2>
          <p style={{ marginBottom: '24px' }}>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/shop" style={{ textDecoration: 'none' }}>
            <button type="button" className="sdm-btn sdm-btn--primary">Start Shopping</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container cart-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content="View items in your shopping cart at Sai Darshan Mart Jabalpur." />
      </Helmet>
      <header className="cart-page__header">
        <h1 className="cart-page__title">Your Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})</h1>
        <button type="button" className="sdm-btn sdm-btn--text" onClick={clearCart}>Clear Cart</button>
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
          
          <button 
            type="button"
            className="sdm-btn sdm-btn--primary cart-page__checkout-btn"
            onClick={() => navigate('/checkout')}
          >
            <span>Proceed to Checkout</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
          </button>

          <DeliveryInfo rulesText={settings?.rules_text} />
        </div>
      </div>
    </div>
  );
}
