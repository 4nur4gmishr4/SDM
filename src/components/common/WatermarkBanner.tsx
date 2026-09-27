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
  subline?: ReactNode;
  className?: string;
}

export function WatermarkBanner({
  headline,
  subline,
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
        {subline && (
          <p className="watermark-banner__subline">
            {subline}
          </p>
        )}
        <div className="watermark-banner__developer">
          <span className="watermark-banner__developer-text">Crafted &amp; Developed with precision by</span>
          <a
            href="https://instagram.com/4nur4gmishr4"
            target="_blank"
            rel="noopener noreferrer"
            className="watermark-banner__developer-link"
            title="Connect with Anurag Mishra on Instagram"
          >
            <span>Anurag Mishra</span>
            <span className="watermark-banner__developer-handle">(@4nur4gmishr4)</span>
          </a>
        </div>
      </div>
    </section>
  );
}


