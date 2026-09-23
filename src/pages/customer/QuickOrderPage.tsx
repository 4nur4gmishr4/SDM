import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeliverySettings } from '../../hooks/useDeliverySettings';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import { DeliveryInfo } from '../../components/customer/DeliveryInfo';
import { generateOrderId, buildQuickOrderWhatsAppMessage, openWhatsApp, STORE_WHATSAPP_NUMBER } from '../../lib/orderUtils';
import type { QuickOrderFormData } from '../../types/order';
import './CheckoutPage.css'; // Reusing checkout form styles

export function QuickOrderPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<QuickOrderFormData>({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    map_link: '',
    shopping_list: '',
  });

  const { settings } = useDeliverySettings();
  const storeWhatsAppNumber = STORE_WHATSAPP_NUMBER;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderId = generateOrderId();

      // 1. Persist the quick order to Supabase if configured (non-blocking)
      if (isSupabaseConfigured) {
        try {
          await withTimeout(
            supabase.from('orders').insert({
              id: orderId,
              customer_name: formData.customer_name,
              customer_phone: formData.customer_phone,
              delivery_address: formData.delivery_address,
              map_link: formData.map_link || null,
              subtotal_amount: 0,
              delivery_fee: settings?.flat_fee || 0,
              total_amount: settings?.flat_fee || 0,
              status: 'pending',
              is_quick_order: true,
              quick_order_text: formData.shopping_list
            }),
            3000
          );
        } catch (dbErr) {
          console.warn('Database save skipped or timed out, proceeding to WhatsApp:', dbErr);
        }
      }

      // 2. Build WhatsApp message
      const message = buildQuickOrderWhatsAppMessage({
        orderId,
        shoppingList: formData.shopping_list,
        customerName: formData.customer_name,
        customerPhone: formData.customer_phone,
        deliveryAddress: formData.delivery_address,
        mapLink: formData.map_link || null,
      });

      // 3. Open WhatsApp
      openWhatsApp(storeWhatsAppNumber, message);

      // 4. Redirect to confirmation
      navigate(`/order/${orderId}`);

    } catch (error) {
      console.error('Error processing quick order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="layout-container checkout-page">
      <header className="checkout-page__header">
        <h1 className="checkout-page__title">Quick Order</h1>
        <p style={{ marginTop: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
          Don't want to browse? Just type your shopping list below and we'll pack it for you.
        </p>
      </header>

      <div className="checkout-page__content">
        <div className="checkout-page__form-section">
          <form className="checkout-form" id="quick-order-form" onSubmit={handleSubmit}>
            <h2 className="checkout-form__title">Your List</h2>
            
            <div style={{ width: '100%' }}>
              <textarea
                className="checkout-form__field"
                placeholder="E.g., 2kg Sugar, 1 packet Amul Butter, 500g Toor Dal..."
                name="shopping_list"
                required
                value={formData.shopping_list}
                onChange={handleChange}
                style={{
                  minHeight: '150px',
                  padding: '16px',
                  border: '1px solid var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <h2 className="checkout-form__title" style={{ marginTop: '16px' }}>Delivery Details</h2>
            
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
          <DeliveryInfo rulesText={settings?.rules_text} />

          <div style={{ marginTop: '16px', backgroundColor: 'var(--md-sys-color-surface-container-low)', padding: '16px', borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
            <h3 className="typescale-title-medium" style={{ marginBottom: '8px' }}>How it works</h3>
            <ol style={{ paddingLeft: '20px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-medium-size)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Type your grocery list above.</li>
              <li>Submit to send via WhatsApp.</li>
              <li>We will pack your items and confirm the final bill amount on WhatsApp.</li>
              <li>Pay on delivery or via UPI.</li>
            </ol>
          </div>

          <div style={{ marginTop: '24px' }}>
            <md-filled-button 
              className="checkout-page__submit-btn"
              type="submit"
              form="quick-order-form"
              disabled={isSubmitting}
            >
              Send List via WhatsApp
              <span className="material-symbols-outlined" slot="icon">send</span>
            </md-filled-button>
            <p className="checkout-page__whatsapp-notice">
              You will be redirected to WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
