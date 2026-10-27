import { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart, useLocationContext, useSnackbar } from '../../contexts';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { OrderSummary } from '../../components/customer/OrderSummary';
import { DeliveryInfo } from '../../components/customer/DeliveryInfo';
import { WhatsAppIcon } from '../../components/common';
import { generateOrderId, buildCartWhatsAppMessage, openWhatsApp, STORE_WHATSAPP_NUMBER, getUpiPaymentUrl } from '../../lib/orderUtils';
import { DynamicUpiPayment } from '../../components/payment/DynamicUpiPayment';
import { getGoogleMapsNavigationUrl } from '../../lib/geocoding';
import { validateOrderInput } from '../../lib/validation';
import { dispatchOrderWebhook } from '../../lib/webhookPipeline';
import { stageOrderInOutbox, markOrderSynced } from '../../lib/orderOutbox';
import { haptics } from '../../lib/haptics';
import type { CheckoutFormData } from '../../types/order';
import './CheckoutPage.css';

export function CheckoutPage() {
  const { items, itemCount, subtotal, clearCart } = useCart();
  const { location, openModal, detectCurrentLocation, hasLocationBeenSet } = useLocationContext();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');
  const [showDesktopQrModal, setShowDesktopQrModal] = useState(false);
  const [pendingOrderDetails, setPendingOrderDetails] = useState<{
    orderId: string;
    total: number;
    message: string;
  } | null>(null);

  const isMobileDevice = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

  const pageTitle = 'Checkout & WhatsApp Order | Sai Darshan Shopping Mart';

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
          showSnackbar('Delivery location detected automatically!');
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

  const handleChromeAutofill = async () => {
    haptics.tap();
    try {
      if ('PaymentRequest' in window) {
        const supportedInstruments = [{
          supportedMethods: 'basic-card'
        }];
        const details = {
          total: {
            label: 'Sai Darshan Order',
            amount: { currency: 'INR', value: String((subtotal + deliveryFee).toFixed(2)) }
          }
        };
        const options = {
          requestPayerName: true,
          requestPayerPhone: true,
        };
        const request = new (window as any).PaymentRequest(supportedInstruments, details, options);
        const response = await request.show();
        if (response.payerName) {
          setFormData(prev => ({ ...prev, customer_name: response.payerName }));
        }
        if (response.payerPhone) {
          setFormData(prev => ({ ...prev, customer_phone: response.payerPhone }));
        }
        await response.complete('success');
        showSnackbar('Details autofilled from Chrome profile!');
        return;
      }
    } catch {
      // User cancelled or autofill closed
    }

    // Fallback to Contacts API if supported
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
        if (contacts && contacts[0]) {
          const c = contacts[0];
          setFormData(prev => ({
            ...prev,
            customer_name: c.name?.[0] || prev.customer_name,
            customer_phone: c.tel?.[0]?.replace(/\s+/g, '') || prev.customer_phone,
          }));
          showSnackbar('Contact autofilled!');
          return;
        }
      } catch {
        // Cancelled
      }
    }

    showSnackbar('Profile autofill not available on this browser. You can type directly.');
  };


  const handleConfirmDesktopQrOrder = (utr?: string) => {
    if (!pendingOrderDetails) return;
    haptics.success();
    let finalMsg = pendingOrderDetails.message;
    if (utr && utr.trim()) {
      finalMsg += `\n*UPI Ref / UTR:* ${utr.trim()}`;
    }
    openWhatsApp(storeWhatsAppNumber, finalMsg);
    clearCart();
    setShowDesktopQrModal(false);
    navigate(`/order/${pendingOrderDetails.orderId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      // 1. Google SRE Outbox: Stage order in local IndexedDB offline vault immediately
      await stageOrderInOutbox({
        id: orderId,
        type: 'cart',
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
        delivery_address: finalDeliveryAddress,
        map_link: formData.map_link || null,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        items: items.map(item => ({
          product_id: item.product_id,
          name: item.product_name,
          sku: item.product_sku,
          quantity: item.quantity,
          price: item.product_price,
          unit: item.unit_size,
        })),
        created_at: new Date().toISOString(),
      });

      // 2. Persist order to Supabase if configured (non-blocking)
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
              status: 'pending',
              items: items.map(item => ({
                product_id: item.product_id,
                name: item.product_name,
                sku: item.product_sku,
                quantity: item.quantity,
                price: item.product_price,
                unit: item.unit_size
              })),
              is_quick_order: false
            }),
            3000
          );

          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          const orderItems = items
            .filter(item => item.product_id && uuidRegex.test(item.product_id))
            .map(item => ({
              order_id: orderId,
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_time: item.product_price
            }));

          if (orderItems.length > 0) {
            await withTimeout(supabase.from('order_items').insert(orderItems), 3000);
          }

          // Mark order synced in outbox
          await markOrderSynced(orderId);
        } catch (dbErr) {
          console.warn('Database save skipped or timed out, order preserved in Outbox vault:', dbErr);
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

      // 3. Build WhatsApp message with paymentMethod
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
        paymentMethod: paymentMethod === 'upi'
          ? 'Instant UPI Payment (Google Pay / PhonePe / QR)'
          : 'Pay on Delivery (Cash / UPI on Arrival)',
      });

      // 4. Smart UPI Routing vs COD
      if (paymentMethod === 'upi') {
        const upiUri = getUpiPaymentUrl({ amount: total, orderId, note: `Order ${orderId}` });

        if (isMobileDevice) {
          // Mobile: Native UPI Intent routing
          haptics.success();
          window.location.href = upiUri;
          setTimeout(() => {
            openWhatsApp(storeWhatsAppNumber, message);
            clearCart();
            navigate(`/order/${orderId}`);
          }, 1500);
        } else {
          // Desktop: Open Desktop Themed Standee QR Modal
          haptics.tap();
          setPendingOrderDetails({
            orderId,
            total,
            message,
          });
          setShowDesktopQrModal(true);
        }
      } else {
        // Pay on Delivery (COD)
        haptics.success();
        openWhatsApp(storeWhatsAppNumber, message);
        clearCart();
        navigate(`/order/${orderId}`);
      }
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
        <meta name="description" content="Complete your grocery order via WhatsApp from Sai Darshan Shopping Mart Jabalpur." />
      </Helmet>
      <header className="checkout-page__header">
        <h1 className="checkout-page__title">Checkout</h1>
      </header>

      <div className="checkout-page__content">
        <div className="checkout-page__form-section">
          <form className="checkout-form" id="checkout-form" onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 className="checkout-form__title" style={{ margin: 0 }}>Delivery Details</h2>
            </div>
            
            {/* Chrome 1-Tap Autofill via PaymentRequest / Contacts */}
            <button
              type="button"
              className="checkout-chrome-autofill-btn"
              onClick={handleChromeAutofill}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
              <span>1-Tap Autofill via Chrome Profile</span>
            </button>

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
              gap: '10px',
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-primary-container, #CEEAD6)',
              color: 'var(--md-sys-color-on-primary-container, #0D652D)',
              border: '1.5px solid rgba(30, 142, 62, 0.3)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: '24px',
                    color: '#1E8E3E',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    verified
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>GPS Delivery Pin</span>
                      <span style={{ fontSize: '11px', background: '#1E8E3E', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                        CONFIRMED
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', marginTop: '2px', fontWeight: 600 }}>
                      {location.area || 'Jabalpur'}
                    </div>
                    <div style={{ fontSize: '11.5px', opacity: 0.9, marginTop: '2px', lineHeight: 1.35 }}>
                      {location.formattedAddress}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="sdsm-btn sdsm-btn--outlined"
                  style={{
                    padding: '4px 12px',
                    fontSize: '11.5px',
                    background: 'var(--md-sys-color-surface, #fff)',
                    flexShrink: 0,
                    height: '30px'
                  }}
                  onClick={openModal}
                >
                  Change Pin
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

          {/* Payment Method Selector */}
          <div className="checkout-payment-selector">
            <label className="typescale-label-medium" style={{ fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
              Select Payment Method
            </label>
            <div
              className={`checkout-payment-option ${paymentMethod === 'cod' ? 'checkout-payment-option--selected' : ''}`}
              onClick={() => {
                haptics.selection();
                setPaymentMethod('cod');
              }}
            >
              <input
                type="radio"
                name="payment_method"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                className="checkout-payment-option__radio"
              />
              <div className="checkout-payment-option__info">
                <span className="checkout-payment-option__title">Pay on Delivery</span>
                <span className="checkout-payment-option__sub">Pay with Cash or UPI when items arrive</span>
              </div>
            </div>

            <div
              className={`checkout-payment-option ${paymentMethod === 'upi' ? 'checkout-payment-option--selected' : ''}`}
              onClick={() => {
                haptics.selection();
                setPaymentMethod('upi');
              }}
            >
              <input
                type="radio"
                name="payment_method"
                value="upi"
                checked={paymentMethod === 'upi'}
                onChange={() => setPaymentMethod('upi')}
                className="checkout-payment-option__radio"
              />
              <div className="checkout-payment-option__info">
                <span className="checkout-payment-option__title">Instant UPI Payment</span>
                <span className="checkout-payment-option__sub">Google Pay, PhonePe, Paytm, or Standee QR</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button 
              className="sdsm-btn sdsm-btn--whatsapp checkout-page__submit-btn"
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
            >
              <WhatsAppIcon size={20} />
              <span>
                {isSubmitting
                  ? 'Preparing Order...'
                  : paymentMethod === 'upi'
                  ? (isMobileDevice ? 'Pay via UPI App & Confirm' : 'View QR & Confirm on WhatsApp')
                  : 'Send Order via WhatsApp'}
              </span>
            </button>
            <p className="checkout-page__whatsapp-notice">
              {paymentMethod === 'upi' && isMobileDevice
                ? 'Launches your installed UPI app, then opens WhatsApp with order details.'
                : 'You will be redirected to WhatsApp to send your order.'}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Dynamic Themed UPI QR Modal */}
      {showDesktopQrModal && pendingOrderDetails && (
        <div className="checkout-qr-modal-backdrop" onClick={() => setShowDesktopQrModal(false)}>
          <div className="checkout-qr-modal-card" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="checkout-qr-modal-close"
              onClick={() => setShowDesktopQrModal(false)}
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <DynamicUpiPayment
              orderId={pendingOrderDetails.orderId}
              amount={pendingOrderDetails.total}
              showCardStyle={false}
              onPaymentConfirmed={(utr) => handleConfirmDesktopQrOrder(utr)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
