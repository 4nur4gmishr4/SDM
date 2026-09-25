import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  formatOrderId, 
  STORE_NAME,
  STORE_PHONE_NUMBER, 
  STORE_WHATSAPP_NUMBER,
  STORE_WHATSAPP_CLEAN, 
  STORE_ADDRESS,
  STORE_DELIVERY_RADIUS 
} from '../../lib/orderUtils';
import { WhatsAppIcon } from '../../components/common';
import { DynamicUpiPayment } from '../../components/payment/DynamicUpiPayment';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import './OrderConfirmationPage.css';

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const pageTitle = `Order Confirmed | ${STORE_NAME}`;
  const [orderTotal, setOrderTotal] = useState<number>(0);

  useEffect(() => {
    document.title = pageTitle;
    if (orderId && isSupabaseConfigured) {
      void supabase
        .from('orders')
        .select('total_amount')
        .eq('id', orderId)
        .maybeSingle()
        .then(
          ({ data }) => {
            if (data?.total_amount) {
              setOrderTotal(Number(data.total_amount));
            }
          },
          () => {}
        );
    }
  }, [pageTitle, orderId]);

  const handleUpiWhatsAppConfirm = (utr?: string) => {
    let msg = `Hello ${STORE_NAME}, I have completed my UPI payment for Order *#${orderId || ''}*`;
    if (orderTotal > 0) {
      msg += ` (Amount: ₹${orderTotal.toFixed(2)})`;
    }
    if (utr && utr.trim()) {
      msg += `\n*UPI Ref / UTR:* ${utr.trim()}`;
    }
    window.open(`https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="layout-container">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content="Your grocery order with Sai Darshan Shopping Mart Jabalpur is placed." />
      </Helmet>

      <div className="order-confirmation">
        <div className="order-confirmation__icon-wrapper">
          <span className="material-symbols-outlined order-confirmation__icon">check_circle</span>
        </div>
        
        <h1 className="order-confirmation__title">Order Prepared &amp; Registered</h1>
        
        <p className="order-confirmation__text">
          Thank you for choosing Sai Darshan Shopping Mart. If your WhatsApp chat didn&apos;t open automatically, use the button below to confirm with the store team.
        </p>

        <div className="order-confirmation__order-id" title="Your unique order reference">
          {formatOrderId(orderId || 'UNKNOWN')}
        </div>

        {/* WhatsApp & Call Direct Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
          <a
            href={`https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent(`Hello ${STORE_NAME}, following up on my Order ID: ${orderId || ''}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sdm-btn sdm-btn--whatsapp"
            style={{ textDecoration: 'none', padding: '10px 20px', gap: '8px' }}
          >
            <WhatsAppIcon size={20} />
            <span>Open WhatsApp Chat</span>
          </a>

          <a
            href={`tel:${STORE_PHONE_NUMBER}`}
            className="sdm-btn sdm-btn--outlined"
            style={{ textDecoration: 'none', padding: '10px 18px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>call</span>
            <span>Call {STORE_WHATSAPP_NUMBER}</span>
          </a>
        </div>

        {/* Digital Payment / Dynamic UPI Section */}
        <div style={{ width: '100%', maxWidth: '440px', marginBottom: '28px' }}>
          <DynamicUpiPayment
            orderId={orderId || 'UNKNOWN'}
            amount={orderTotal}
            onPaymentConfirmed={handleUpiWhatsAppConfirm}
          />
        </div>

        {/* Store Location & Delivery Info Badge */}
        <div style={{
          width: '100%',
          maxWidth: '500px',
          background: 'var(--md-sys-color-surface-container-low)',
          borderRadius: '12px',
          padding: '14px 18px',
          textAlign: 'left',
          fontSize: '12.5px',
          color: 'var(--md-sys-color-on-surface-variant)',
          lineHeight: 1.5,
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--md-sys-color-primary)' }}>local_shipping</span>
            <span>Delivery Coverage: {STORE_DELIVERY_RADIUS}</span>
          </div>
          <div>Store Address: {STORE_ADDRESS}</div>
        </div>

        <div className="order-confirmation__actions">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button type="button" className="sdm-btn sdm-btn--primary">Return to Storefront</button>
          </Link>
          <Link to="/shop" style={{ textDecoration: 'none' }}>
            <button type="button" className="sdm-btn sdm-btn--outlined">Continue Shopping</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
