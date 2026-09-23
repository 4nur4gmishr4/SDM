import { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../../contexts/CartContext';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { OrderSummary } from '../../components/customer/OrderSummary';
import { DeliveryInfo } from '../../components/customer/DeliveryInfo';
import { generateOrderId, buildCartWhatsAppMessage, openWhatsApp, STORE_WHATSAPP_NUMBER } from '../../lib/orderUtils';
import type { CheckoutFormData } from '../../types/order';
import './CheckoutPage.css';

export function CheckoutPage() {
  const { items, itemCount, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageTitle = 'Checkout & WhatsApp Order — Sai Darshan Mart';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    map_link: '',
  });

  const { settings } = useDeliverySettings();
  const deliveryFee = settings?.flat_fee || 0;
  const storeWhatsAppNumber = STORE_WHATSAPP_NUMBER;

  // If cart is empty, redirect back to cart
  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderId = generateOrderId();
      const total = subtotal + deliveryFee;

      // 1. Persist the order to Supabase if configured (non-blocking)
      if (isSupabaseConfigured) {
        try {
          await withTimeout(
            supabase.from('orders').insert({
              id: orderId,
              customer_name: formData.customer_name,
              customer_phone: formData.customer_phone,
              delivery_address: formData.delivery_address,
              map_link: formData.map_link || null,
              subtotal_amount: subtotal,
              delivery_fee: deliveryFee,
              total_amount: total,
              status: 'pending'
            }),
            3000
          );

          const orderItems = items.map(item => ({
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_time: item.product_price
          }));

          await withTimeout(supabase.from('order_items').insert(orderItems), 3000);
        } catch (dbErr) {
          console.warn('Database save skipped or timed out, proceeding to WhatsApp:', dbErr);
        }
      }

      // 2. Build WhatsApp message
      const message = buildCartWhatsAppMessage({
        orderId,
        items,
        subtotal,
        deliveryFee,
        total,
        customerName: formData.customer_name,
        customerPhone: formData.customer_phone,
        deliveryAddress: formData.delivery_address,
        mapLink: formData.map_link || null,
      });

      // 3. Open WhatsApp
      openWhatsApp(storeWhatsAppNumber, message);

      // 4. Clear cart and redirect to confirmation
      clearCart();
      navigate(`/order/${orderId}`);

    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="layout-container checkout-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content="Complete your grocery order via WhatsApp from Sai Darshan Mart Jabalpur." />
      </Helmet>
      <header className="checkout-page__header">
        <h1 className="checkout-page__title">Checkout</h1>
      </header>

      <div className="checkout-page__content">
        <div className="checkout-page__form-section">
          <form className="checkout-form" id="checkout-form" onSubmit={handleSubmit}>
            <h2 className="checkout-form__title">Delivery Details</h2>
            
            <md-outlined-text-field
              className="checkout-form__field"
              label="Full Name"
              name="customer_name"
              required
              value={formData.customer_name}
              onInput={handleChange}
            >
              <md-icon slot="leading-icon">person</md-icon>
            </md-outlined-text-field>

            <md-outlined-text-field
              className="checkout-form__field"
              label="Phone Number (WhatsApp)"
              name="customer_phone"
              type="tel"
              required
              value={formData.customer_phone}
              onInput={handleChange}
            >
              <md-icon slot="leading-icon">phone</md-icon>
            </md-outlined-text-field>

            <div style={{ width: '100%' }}>
              <textarea
                className="checkout-form__field"
                placeholder="Complete Delivery Address *"
                name="delivery_address"
                required
                value={formData.delivery_address}
                onChange={handleChange}
                style={{
                  minHeight: '100px',
                  padding: '16px',
                  border: '1px solid var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ width: '100%' }}>
              <md-outlined-text-field
                className="checkout-form__field"
                label="Google Maps Link (Optional)"
                name="map_link"
                type="url"
                value={formData.map_link || ''}
                onInput={handleChange}
              >
                <md-icon slot="leading-icon">location_on</md-icon>
              </md-outlined-text-field>
              <p className="checkout-form__helper-text">
                Pasting a Google Maps link helps us deliver faster.
              </p>
            </div>
          </form>
        </div>

        <div className="checkout-page__sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="typescale-title-medium">Items ({itemCount})</h3>
            <Link to="/cart">Edit Cart</Link>
          </div>
          
          <OrderSummary subtotal={subtotal} deliveryFee={deliveryFee} />
          
          <DeliveryInfo rulesText={settings?.rules_text} />

          <div style={{ marginTop: '16px' }}>
            <button 
              className="sdm-btn sdm-btn--whatsapp checkout-page__submit-btn"
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Preparing Order...' : 'Send Order via WhatsApp'}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
            </button>
            <p className="checkout-page__whatsapp-notice">
              You will be redirected to WhatsApp to send your order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
