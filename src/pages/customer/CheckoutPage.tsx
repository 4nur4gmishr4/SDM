import { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart, useLocationContext, useSnackbar } from '../../contexts';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { OrderSummary } from '../../components/customer/OrderSummary';
import { DeliveryInfo } from '../../components/customer/DeliveryInfo';
import { generateOrderId, buildCartWhatsAppMessage, openWhatsApp, STORE_WHATSAPP_NUMBER } from '../../lib/orderUtils';
import { getGoogleMapsNavigationUrl } from '../../lib/geocoding';
import { validateOrderInput } from '../../lib/validation';
import type { CheckoutFormData } from '../../types/order';
import './CheckoutPage.css';

export function CheckoutPage() {
  const { items, itemCount, subtotal, clearCart } = useCart();
  const { location, openModal } = useLocationContext();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageTitle = 'Checkout & WhatsApp Order — Sai Darshan Mart';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer_name: '',
    customer_phone: '',
    delivery_address: location.formattedAddress || '',
    map_link: getGoogleMapsNavigationUrl(location.lat, location.lng),
  });

  // Keep delivery address and map link in sync when location updates
  useEffect(() => {
    if (location.formattedAddress) {
      setFormData(prev => ({
        ...prev,
        delivery_address: location.formattedAddress,
        map_link: getGoogleMapsNavigationUrl(location.lat, location.lng),
      }));
    }
  }, [location]);

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

    if (!navigator.onLine) {
      showSnackbar('You are currently offline. Please reconnect to the internet to place your order.');
      return;
    }

    const validation = validateOrderInput({
      customerName: formData.customer_name,
      customerPhone: formData.customer_phone,
      deliveryAddress: formData.delivery_address,
    });

    if (!validation.isValid) {
      showSnackbar(validation.error || 'Please check your inputs.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = generateOrderId();
      const total = subtotal + deliveryFee;
      const finalCustomerName = validation.cleanedName!;
      const finalCustomerPhone = validation.cleanedPhone!;
      const finalDeliveryAddress = validation.cleanedAddress!;

      // 1. Persist the order to Supabase if configured (non-blocking)
      if (isSupabaseConfigured) {
        try {
          await withTimeout(
            supabase.from('orders').insert({
              id: orderId,
              customer_name: finalCustomerName,
              customer_phone: finalCustomerPhone,
              delivery_address: finalDeliveryAddress,
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
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        deliveryAddress: finalDeliveryAddress,
        mapLink: formData.map_link || null,
      });

      // 3. Open WhatsApp
      openWhatsApp(storeWhatsAppNumber, message);

      // 4. Clear cart and redirect to confirmation
      clearCart();
      navigate(`/order/${orderId}`);

    } catch (error) {
      console.error('Error processing order:', error);
      showSnackbar('There was an error processing your order. Please try again.');
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

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-primary-container, #CEEAD6)',
              color: 'var(--md-sys-color-on-primary-container, #0D652D)',
              border: '1px solid rgba(30, 142, 62, 0.2)',
              width: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', flexShrink: 0 }}>location_on</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    GPS Pinned: {location.area || 'Jabalpur'}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {location.formattedAddress}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="sdm-btn sdm-btn--outlined"
                style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0, background: 'var(--md-sys-color-surface, #fff)' }}
                onClick={openModal}
              >
                Change on Map
              </button>
            </div>

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
