import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  formatOrderId, 
  STORE_NAME,
  STORE_PHONE_NUMBER, 
  STORE_WHATSAPP_NUMBER,
  STORE_WHATSAPP_CLEAN, 
  STORE_UPI_ID,
  STORE_ADDRESS,
  STORE_DELIVERY_RADIUS,
  getUpiPaymentUrl 
} from '../../lib/orderUtils';
import { WhatsAppIcon } from '../../components/common';
import './OrderConfirmationPage.css';

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [copiedUpi, setCopiedUpi] = useState(false);

  const pageTitle = `Order Confirmed | ${STORE_NAME}`;

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(STORE_UPI_ID).then(() => {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    });
  };

  const upiLink = getUpiPaymentUrl({ orderId: orderId || 'UNKNOWN' });

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

        {/* Digital Payment / UPI Section */}
        <div style={{
          width: '100%',
          maxWidth: '500px',
          background: 'var(--md-sys-color-surface-container, #f9fafb)',
          border: '1px solid var(--md-sys-color-outline-variant, rgba(0,0,0,0.1))',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'left',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary, #1E8E3E)', fontSize: '24px' }}>
              account_balance_wallet
            </span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--md-sys-color-on-surface, #1f2937)' }}>
              Direct UPI / Online Payment Option
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant, #6b7280)', margin: '0 0 14px', lineHeight: 1.5 }}>
            You can pay via Cash on Delivery or prepay directly to the store via any UPI app (GPay, PhonePe, Paytm, BHIM):
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--md-sys-color-surface, #ffffff)',
            border: '1px solid var(--md-sys-color-outline-variant, #e5e7eb)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '14px'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant, #6b7280)', display: 'block' }}>Store UPI ID</span>
              <strong style={{ fontSize: '14px', color: 'var(--md-sys-color-primary, #1E8E3E)' }}>{STORE_UPI_ID}</strong>
            </div>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="sdm-btn sdm-btn--tonal"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {copiedUpi ? 'Copied!' : 'Copy UPI'}
            </button>
          </div>

          <a
            href={upiLink}
            className="sdm-btn sdm-btn--primary"
            style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', padding: '10px 16px', display: 'flex' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>payments</span>
            <span>1-Tap Pay via UPI App</span>
          </a>
        </div>

        {/* Store Location & Delivery Info Badge */}
        <div style={{
          width: '100%',
          maxWidth: '500px',
          background: 'var(--md-sys-color-surface-container-low, #f3f4f6)',
          borderRadius: '12px',
          padding: '14px 18px',
          textAlign: 'left',
          fontSize: '12.5px',
          color: 'var(--md-sys-color-on-surface-variant, #4b5563)',
          lineHeight: 1.5,
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--md-sys-color-on-surface, #111827)', marginBottom: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--md-sys-color-primary, #1E8E3E)' }}>local_shipping</span>
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
