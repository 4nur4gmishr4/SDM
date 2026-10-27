import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { STORE_LEGAL_NAME, STORE_UPI_ID, STORE_UPI_NUMBER, STORE_UPI_TERMINAL, getUpiPaymentUrl } from '../../lib/orderUtils';
import { WhatsAppIcon } from '../common';
import './DynamicUpiPayment.css';

interface DynamicUpiPaymentProps {
  orderId: string;
  amount: number;
  customerName?: string;
  onPaymentConfirmed?: (utr: string) => void;
  showCardStyle?: boolean;
}

export const DynamicUpiPayment: React.FC<DynamicUpiPaymentProps> = ({
  orderId,
  amount,
  onPaymentConfirmed,
  showCardStyle = true,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile device
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|iphone|ipad|ipod|windows phone/i.test(ua) || window.innerWidth < 768;
    setIsMobile(isMobileDevice);
  }, []);

  // Standard UPI URI with exact amount and order reference
  const upiPayload = getUpiPaymentUrl({
    amount,
    orderId,
    note: `Order ${orderId}`,
  });

  // Generate dynamic QR code whenever amount or orderId changes
  useEffect(() => {
    let isSubscribed = true;
    QRCode.toDataURL(upiPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 480,
      color: {
        dark: '#0D652D', // Deep supermarket green for fast, reliable scanning
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (isSubscribed) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate dynamic UPI QR:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [upiPayload]);

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(STORE_UPI_ID).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2200);
    });
  };

  const handleCopyUpiNumber = () => {
    navigator.clipboard.writeText(STORE_UPI_NUMBER).then(() => {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2200);
    });
  };

  const handleTriggerUpi = () => {
    window.location.href = upiPayload;
  };

  return (
    <div className={`dynamic-upi ${showCardStyle ? 'dynamic-upi--card' : ''}`}>
      {/* Header Badge */}
      <div className="dynamic-upi__header">
        <div className="dynamic-upi__brand-pill">
          <span className="material-symbols-outlined dynamic-upi__shield-icon">verified_user</span>
          <span>ICICI Bank POS Verified Merchant</span>
        </div>
        <h3 className="dynamic-upi__title">{STORE_LEGAL_NAME}</h3>
        <p className="dynamic-upi__subtitle">Scan and Pay • Zero Surcharge Instant Settlement</p>
      </div>

      {/* Amount Display */}
      <div className="dynamic-upi__amount-banner">
        <span className="dynamic-upi__amount-label">Payable Order Amount</span>
        <div className="dynamic-upi__amount-val">₹{amount.toFixed(2)}</div>
        <div className="dynamic-upi__ref-pill">Ref: {orderId}</div>
      </div>

      {/* QR Code Container */}
      <div className="dynamic-upi__qr-wrapper">
        {qrDataUrl ? (
          <div className="dynamic-upi__qr-box">
            <img
              src={qrDataUrl}
              alt={`UPI Payment QR for ₹${amount.toFixed(2)}`}
              className="dynamic-upi__qr-img"
            />
            {/* Center Brand Badge overlay */}
            <div className="dynamic-upi__center-badge">
              <span className="material-symbols-outlined">storefront</span>
            </div>
          </div>
        ) : (
          <div className="dynamic-upi__qr-skeleton">
            <div className="dynamic-upi__spinner" />
            <span>Generating Dynamic Payment QR...</span>
          </div>
        )}
        <div className="dynamic-upi__qr-hint">
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>qr_code_scanner</span>
          <span>POS-linked Static QR / {STORE_UPI_TERMINAL}</span>
        </div>
      </div>

      {/* Mobile 1-Tap Payment Trigger */}
      {isMobile && (
        <div className="dynamic-upi__mobile-trigger">
          <button
            type="button"
            className="dynamic-upi__tap-btn"
            onClick={handleTriggerUpi}
          >
            <span className="material-symbols-outlined">payments</span>
            <span>Pay ₹{amount.toFixed(2)} via UPI App</span>
          </button>
          <span className="dynamic-upi__tap-sub">Opens installed GPay, PhonePe, or Paytm automatically</span>
        </div>
      )}

      {/* Copy UPI ID & UPI Number Details */}
      <div className="dynamic-upi__credentials">
        <div className="dynamic-upi__cred-row">
          <div className="dynamic-upi__cred-info">
            <span className="dynamic-upi__cred-label">Merchant UPI ID (VPA)</span>
            <span className="dynamic-upi__cred-val">{STORE_UPI_ID}</span>
          </div>
          <button
            type="button"
            className={`dynamic-upi__copy-btn ${copiedId ? 'dynamic-upi__copy-btn--copied' : ''}`}
            onClick={handleCopyUpiId}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              {copiedId ? 'check' : 'content_copy'}
            </span>
            <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
          </button>
        </div>

        <div className="dynamic-upi__cred-row">
          <div className="dynamic-upi__cred-info">
            <span className="dynamic-upi__cred-label">UPI Number / Phone</span>
            <span className="dynamic-upi__cred-val">+91 {STORE_UPI_NUMBER}</span>
          </div>
          <button
            type="button"
            className={`dynamic-upi__copy-btn ${copiedNumber ? 'dynamic-upi__copy-btn--copied' : ''}`}
            onClick={handleCopyUpiNumber}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              {copiedNumber ? 'check' : 'content_copy'}
            </span>
            <span>{copiedNumber ? 'Copied!' : 'Copy No.'}</span>
          </button>
        </div>
      </div>

      {/* Supported UPI Apps Badges */}
      <div className="dynamic-upi__app-strip">
        <span className="dynamic-upi__app-badge">BHIM UPI</span>
        <span className="dynamic-upi__app-badge">G Pay</span>
        <span className="dynamic-upi__app-badge">PhonePe</span>
        <span className="dynamic-upi__app-badge">Paytm</span>
        <span className="dynamic-upi__app-badge">CRED</span>
        <span className="dynamic-upi__app-badge">iMobile</span>
      </div>

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <a
          href="/sai-darshan-upi-qr-card.svg"
          download="sai-darshan-upi-qr-standee.svg"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--md-sys-color-primary, #1E8E3E)',
            fontWeight: 600,
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'var(--md-sys-color-surface-container-high, #edf3ee)'
          }}
          title="Download Official Standee QR Card"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>file_download</span>
          <span>Download Official Standee (SVG)</span>
        </a>
      </div>

      {/* Optional UTR / Reference ID Field */}
      <div className="dynamic-upi__utr-box">
        <label htmlFor="upi-utr-input" className="dynamic-upi__utr-label">
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>receipt_long</span>
          <span>12-Digit UPI Ref / UTR No. (Optional)</span>
        </label>
        <input
          id="upi-utr-input"
          type="text"
          className="dynamic-upi__utr-input"
          placeholder="e.g. 429817298371 (Received in your UPI SMS)"
          value={utrNumber}
          onChange={(e) => setUtrNumber(e.target.value.trim())}
          maxLength={24}
        />
      </div>

      {/* Confirmation WhatsApp trigger */}
      {onPaymentConfirmed && (
        <button
          type="button"
          className="sdsm-btn sdsm-btn--whatsapp dynamic-upi__confirm-btn"
          onClick={() => onPaymentConfirmed(utrNumber)}
        >
          <WhatsAppIcon size={20} />
          <span>I Have Paid ₹{amount.toFixed(2)} — Confirm on WhatsApp</span>
        </button>
      )}
    </div>
  );
};
