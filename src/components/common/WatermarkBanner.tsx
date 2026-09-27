import type { ReactNode } from 'react';
import './WatermarkBanner.css';

/**
 * Flat pinkish vector heart with smooth organic heartbeat animation
 * Tuned slightly smaller with vertical clearance so it never overlaps text
 */
export function BeatingHeart({ size = '0.72em', color = '#FF5A79' }: { size?: number | string; color?: string }) {
  return (
    <span 
      className="flat-beating-heart" 
      style={{ width: size, height: size, color }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="flat-beating-heart__svg"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </span>
  );
}

interface WatermarkBannerProps {
  headline?: ReactNode;
  className?: string;
}

export function WatermarkBanner({
  headline,
  className = '',
}: WatermarkBannerProps) {
  const defaultHeadline = (
    <>Made with <BeatingHeart /> in Jabalpur</>
  );

  return (
    <section className={`watermark-banner ${className}`} aria-label="Store dedication">
      <div className="watermark-banner__container">
        <h2 className="watermark-banner__title">
          {headline || defaultHeadline}
        </h2>

        <div className="watermark-banner__developer">
          <span className="watermark-banner__developer-text">
            Crafted &amp; Developed with precision by Anurag Mishra
          </span>
          <div className="watermark-banner__social-icons" aria-label="Connect with Anurag Mishra">
            <a
              href="tel:9302786886"
              className="watermark-banner__social-btn"
              title="Call Anurag Mishra (9302786886)"
              aria-label="Call Anurag Mishra at 9302786886"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </a>
            <a
              href="https://wa.me/919302786886"
              target="_blank"
              rel="noopener noreferrer"
              className="watermark-banner__social-btn"
              title="WhatsApp Anurag Mishra (9302786886)"
              aria-label="Chat with Anurag Mishra on WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.79 14.07c-.24.68-1.4 1.28-1.95 1.36-.5.08-1.15.11-3.35-.8-2.68-1.11-4.41-3.83-4.54-4-.13-.18-1.08-1.44-1.08-2.75 0-1.31.69-1.96.93-2.22.25-.26.54-.33.72-.33.18 0 .36.01.52.02.17.01.4.07.62.53.24.5.8 1.95.87 2.09.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.16-.3.35-.43.47-.14.14-.29.3-.12.59.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.07.17-.19.74-.86.94-1.15.2-.29.4-.24.67-.14.28.1 1.76.83 2.06.98.3.15.5.22.58.34.07.12.07.72-.17 1.4z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com/4nur4gmishr4"
              target="_blank"
              rel="noopener noreferrer"
              className="watermark-banner__social-btn"
              title="Instagram (@4nur4gmishr4)"
              aria-label="Anurag Mishra on Instagram"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
