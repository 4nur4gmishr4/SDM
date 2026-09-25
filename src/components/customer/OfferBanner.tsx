import { Link } from 'react-router-dom';
import type { Banner } from '../../types/banner';
import './OfferBanner.css';

interface OfferBannerProps {
  banner: Banner;
}

export function OfferBanner({ banner }: OfferBannerProps) {
  return (
    <div className="offer-banner">
      <div className="offer-banner__image-container">
        {banner.image_url ? (
          <img src={banner.image_url} alt="" className="offer-banner__image" loading="lazy" decoding="async" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--md-sys-color-surface-container)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--md-sys-color-outline-variant)' }}>image</span>
          </div>
        )}
      </div>
      <div className="offer-banner__content">
        <h2 className="offer-banner__title">{banner.title}</h2>
        {banner.text && <p className="offer-banner__text">{banner.text}</p>}
        
        {banner.link_url && (
          <div className="offer-banner__actions">
            <Link to={banner.link_url}>
              <md-filled-tonal-button>Shop Now</md-filled-tonal-button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
