import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { STORE_WHATSAPP_CLEAN } from '../../lib/orderUtils';
import { WhatsAppIcon } from '../../components/common';

export function NotFoundPage() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      fontFamily: 'var(--md-sys-typescale-font-family, sans-serif)',
    }}>
      <Helmet>
        <title>404 | Page Not Found | Sai Darshan Mart Jabalpur</title>
        <meta name="description" content="The requested page could not be found on Sai Darshan Mart." />
      </Helmet>

      <div style={{
        maxWidth: '560px',
        width: '100%',
        textAlign: 'center',
        background: 'var(--md-sys-color-surface-container, #f9fafb)',
        padding: '48px 24px',
        borderRadius: '24px',
        border: '1px solid var(--md-sys-color-outline-variant, rgba(0,0,0,0.08))',
        boxShadow: '0 4px 24px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--md-sys-color-primary-container, #CEEAD6)',
          color: 'var(--md-sys-color-primary, #1E8E3E)',
          marginBottom: '20px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '38px' }}>search_off</span>
        </div>

        <div style={{
          fontSize: '72px',
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-2px',
          color: 'var(--md-sys-color-primary, #1E8E3E)',
          marginBottom: '12px'
        }}>
          404
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--md-sys-color-on-surface, #111827)',
          marginBottom: '12px'
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: '15px',
          color: 'var(--md-sys-color-on-surface-variant, #6b7280)',
          lineHeight: 1.6,
          maxWidth: '420px',
          margin: '0 auto 28px'
        }}>
          The page or product link you clicked does not exist or may have moved. Let&apos;s get you back to your shopping!
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '24px'
        }}>
          <Link to="/" className="sdm-btn sdm-btn--primary" style={{ padding: '10px 20px', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
            <span>Back to Home</span>
          </Link>

          <Link to="/shop" className="sdm-btn sdm-btn--tonal" style={{ padding: '10px 20px', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>storefront</span>
            <span>Shop Groceries</span>
          </Link>

          <Link to="/quick-order" className="sdm-btn sdm-btn--outlined" style={{ padding: '10px 20px', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>list_alt</span>
            <span>Quick Order</span>
          </Link>
        </div>

        <div style={{
          borderTop: '1px solid var(--md-sys-color-outline-variant, rgba(0,0,0,0.08))',
          paddingTop: '20px',
          fontSize: '13px',
          color: 'var(--md-sys-color-on-surface-variant, #6b7280)'
        }}>
          Need help? <a
            href={`https://wa.me/${STORE_WHATSAPP_CLEAN}?text=${encodeURIComponent('Hello Sai Darshan Mart, I encountered a missing page on the website')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#25D366', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <WhatsAppIcon size={16} color="#25D366" />
            <span>Chat with us on WhatsApp &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
