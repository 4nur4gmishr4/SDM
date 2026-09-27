import { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart, useLocationContext, useSnackbar } from '../../contexts';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { OrderSummary } from '../../components/customer/OrderSummary';
import { DeliveryInfo } from '../../components/customer/DeliveryInfo';
import { WhatsAppIcon } from '../../components/common';
import { generateOrderId, buildCartWhatsAppMessage, openWhatsApp, STORE_WHATSAPP_NUMBER } from '../../lib/orderUtils';
import { getGoogleMapsNavigationUrl } from '../../lib/geocoding';
import { validateOrderInput } from '../../lib/validation';
import { dispatchOrderWebhook } from '../../lib/webhookPipeline';
import type { CheckoutFormData } from '../../types/order';
import './CheckoutPage.css';

export function CheckoutPage() {
  const { items, itemCount, subtotal, clearCart } = useCart();
  const { location, openModal, detectCurrentLocation, hasLocationBeenSet, isLocating } = useLocationContext();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState<boolean>(() => {
    // If the user already set their location previously, consider it primed but confirmable
    return hasLocationBeenSet;
  });

  const pageTitle = 'Checkout & WhatsApp Order | Sai Darshan Mart';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    map_link: getGoogleMapsNavigationUrl(location.lat, location.lng),
  });

  // Keep map link in sync when location updates
  useEffect(() => {
    if (location.lat && location.lng) {
      setFormData(prev => ({
        ...prev,
        map_link: getGoogleMapsNavigationUrl(location.lat, location.lng),
      }));
    }
  }, [location]);

  // Attempt automatic locate on checkout mount if not yet detected
  useEffect(() => {
    if (!hasLocationBeenSet && navigator.geolocation) {
      detectCurrentLocation().then((success) => {
        if (success) {
          showSnackbar('Delivery location detected! Please click "OK, Confirm Location".');
        }
      });
    }
  }, [hasLocationBeenSet, detectCurrentLocation, showSnackbar]);

  const { settings } = useDeliverySettings();
  const flatFee = settings?.flat_fee ?? 50;
  const freeThreshold = settings?.free_delivery_threshold ?? 500;
  const isFreeDelivery = freeThreshold > 0 && subtotal >= freeThreshold;
  const deliveryFee = isFreeDelivery ? 0 : flatFee;
  const storeWhatsAppNumber = STORE_WHATSAPP_NUMBER;

  // If cart is empty, redirect back to cart
  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocateMe = async () => {
    const success = await detectCurrentLocation();
    if (success) {
      setIsLocationConfirmed(true);
      showSnackbar('Location detected and confirmed!');
    } else {
      openModal();
    }
  };

  const handleConfirmLocationOk = () => {
    setIsLocationConfirmed(true);
    showSnackbar('Delivery location confirmed!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLocationConfirmed) {
      showSnackbar('Please verify and click "OK, Confirm Location" before proceeding.');
      return;
    }

    if (!navigator.onLine) {
      showSnackbar('You are currently offline. Please reconnect to the internet to place your order.');
      return;
    }

    // Construct full delivery address combining optional house/landmark with GPS address
    const combinedAddress = formData.delivery_address?.trim()
      ? `${formData.delivery_address.trim()}, ${location.formattedAddress || 'Jabalpur'}`
      : (location.formattedAddress || 'Jabalpur (As per GPS Pin)');

    const validation = validateOrderInput({
      customerName: formData.customer_name,
      customerPhone: formData.customer_phone,
      deliveryAddress: combinedAddress,
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

      // Non-blocking outbound order webhook pipeline
      dispatchOrderWebhook({
        id: orderId,
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
        delivery_address: finalDeliveryAddress,
        map_link: formData.map_link || null,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        items: items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.product_price,
          unit_size: item.unit_size
        })),
        is_quick_order: false
      }).catch(() => {});

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

            {/* Delivery Location Confirmation Card */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              borderRadius: '14px',
              backgroundColor: isLocationConfirmed
                ? 'var(--md-sys-color-primary-container, #CEEAD6)'
                : 'var(--md-sys-color-surface-container, #f2f5f2)',
              color: isLocationConfirmed
                ? 'var(--md-sys-color-on-primary-container, #0D652D)'
                : 'var(--md-sys-color-on-surface, #1b1c1b)',
              border: isLocationConfirmed
                ? '1.5px solid rgba(30, 142, 62, 0.4)'
                : '1.5px solid var(--md-sys-color-primary, #1E8E3E)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: '26px',
                    color: isLocationConfirmed ? '#1E8E3E' : 'var(--md-sys-color-primary)',
                    flexShrink: 0
                  }}>
                    {isLocationConfirmed ? 'verified' : 'location_on'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>GPS Delivery Location</span>
                      {isLocationConfirmed ? (
                        <span style={{ fontSize: '11px', background: '#1E8E3E', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                          CONFIRMED ✓
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', background: '#D93025', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                          CLICK OK TO CONFIRM
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12.5px', marginTop: '2px', fontWeight: 600 }}>
                      {location.area || 'Jabalpur'}
                    </div>
                    <div style={{ fontSize: '11.5px', opacity: 0.85, marginTop: '2px', lineHeight: 1.35 }}>
                      {location.formattedAddress}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {!isLocationConfirmed ? (
                  <button
                    type="button"
                    className="sdm-btn sdm-btn--primary"
                    style={{ padding: '8px 18px', fontSize: '13px' }}
                    onClick={handleConfirmLocationOk}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                    <span>OK, Confirm Location</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#1E8E3E' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>done_all</span>
                    <span>Location Verified for Delivery</span>
                  </div>
                )}

                <button
                  type="button"
                  className="sdm-btn sdm-btn--outlined"
                  style={{ padding: '6px 14px', fontSize: '12px', background: 'var(--md-sys-color-surface, #fff)' }}
                  onClick={openModal}
                >
                  Change on Map
                </button>

                <button
                  type="button"
                  className="sdm-btn sdm-btn--outlined"
                  style={{ padding: '6px 14px', fontSize: '12px', background: 'var(--md-sys-color-surface, #fff)' }}
                  onClick={handleLocateMe}
                  disabled={isLocating}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>my_location</span>
                  <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
                </button>
              </div>
            </div>

            {/* Optional Specific Delivery Address (Flat / House No / Landmark) */}
            <div style={{ width: '100%' }}>
              <textarea
                className="checkout-form__field"
                placeholder="House / Flat No., Landmark, Building Name (Optional)"
                name="delivery_address"
                value={formData.delivery_address}
                onChange={handleChange}
                style={{
                  minHeight: '80px',
                  padding: '14px',
                  border: '1px solid var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  resize: 'vertical',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <p className="checkout-form__helper-text" style={{ fontSize: '11.5px', color: 'var(--md-sys-color-on-surface-variant)', margin: '4px 0 0 0' }}>
                Optional. Leave blank if your GPS location above is exact.
              </p>
            </div>

            {/* Fixed Unclickable Google Maps Navigation Link */}
            <div style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-surface-container, #f2f4f2)',
              border: '1px solid var(--md-sys-color-outline-variant, #e0e2dc)',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--md-sys-color-primary, #1E8E3E)' }}>
                    location_on
                  </span>
                  <span>Google Maps GPS Navigation (Fixed Link)</span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  lock
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  wordBreak: 'break-all',
                  userSelect: 'text',
                  pointerEvents: 'none',
                  cursor: 'default',
                  opacity: 0.85
                }}
              >
                {formData.map_link}
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Locked to your confirmed coordinates. Sent automatically on WhatsApp to direct the delivery partner to your doorstep.
              </p>
            </div>
          </form>
        </div>

        <div className="checkout-page__sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="typescale-title-medium">Items ({itemCount})</h3>
            <Link to="/cart">Edit Cart</Link>
          </div>
          
          <OrderSummary
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            freeDeliveryThreshold={freeThreshold}
          />
          
          <DeliveryInfo rulesText={settings?.rules_text} />

          <div style={{ marginTop: '16px' }}>
            <button 
              className="sdm-btn sdm-btn--whatsapp checkout-page__submit-btn"
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
            >
              <WhatsAppIcon size={20} />
              <span>{isSubmitting ? 'Preparing Order...' : 'Send Order via WhatsApp'}</span>
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
