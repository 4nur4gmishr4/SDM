import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Banner } from '../../types/banner';
import './IOSBannerCarousel.css';

interface IOSBannerCarouselProps {
  banners: Banner[];
  isLoading?: boolean;
  slideDuration?: number; // in milliseconds (default 5000ms)
}

// Curated high-resolution store banners using authentic store photography (Zero brand-name bloat)
const FALLBACK_BANNERS: Banner[] = [
  {
    id: 'fallback-1',
    title: 'Welcome to Sai Darshan Mart Jabalpur',
    text: 'Your friendly neighborhood supermarket with quick billing, spotless aisles & daily fresh essentials.',
    image_url: '/images/store/img_0604.jpg',
    link_url: '/about',
    is_active: true,
    display_order: 1,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-2',
    title: 'Fresh Snacks, Beverages & Kitchen Essentials',
    text: 'Crispy tea-time namkeens, packaged snacks, cold beverages, and durable stainless steel cookware.',
    image_url: '/images/store/img_0525.jpg',
    link_url: '/shop',
    is_active: true,
    display_order: 2,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-3',
    title: 'Handpicked Dry Fruits, Pulses & Spices',
    text: 'Premium almonds, crunchy cashews, golden raisins, whole spices & unpolished lentils at honest prices.',
    image_url: '/images/store/img_9084.jpg',
    link_url: '/shop',
    is_active: true,
    display_order: 3,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-4',
    title: 'Packaged Staples & Daily Household Rashan',
    text: 'Top branded flours, cooking oils, grains, and pantry provisions with direct WhatsApp doorstep delivery.',
    image_url: '/images/store/img_2552.jpg',
    link_url: 'https://wa.me/917999157430?text=Hello%20Sai%20Darshan%20Mart,%20I%20would%20like%20to%20order%20groceries',
    is_active: true,
    display_order: 4,
    created_at: '',
    updated_at: '',
  },
];

export function IOSBannerCarousel({
  banners,
  isLoading = false,
  slideDuration = 5000,
}: IOSBannerCarouselProps) {
  const activeBanners = banners.length > 0
    ? banners.filter((b) => b.is_active)
    : FALLBACK_BANNERS;

  const displayBanners = activeBanners.length > 0 ? activeBanners : FALLBACK_BANNERS;
  const totalSlides = displayBanners.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isPaused, setIsPaused] = useState(false);

  // High-performance timer using requestAnimationFrame to ensure butter-smooth 60fps filling like Instagram Stories
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedPausedRef = useRef<number>(0);

  // Touch swipe handling
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setProgress(0);
    elapsedPausedRef.current = 0;
    startTimeRef.current = performance.now();
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
    elapsedPausedRef.current = 0;
    startTimeRef.current = performance.now();
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    elapsedPausedRef.current = 0;
    startTimeRef.current = performance.now();
  };

  // Instagram Story Segment Progress Bar Loop (requestAnimationFrame driven)
  useEffect(() => {
    if (totalSlides <= 1) return;

    if (isPaused) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    startTimeRef.current = performance.now() - elapsedPausedRef.current;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      elapsedPausedRef.current = elapsed;
      const pct = Math.min((elapsed / slideDuration) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        goToNext();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentIndex, isPaused, slideDuration, totalSlides, goToNext]);

  // Touch Swipe Handlers (iOS fluid swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null) {
      const deltaX = touchDeltaXRef.current;
      const SWIPE_THRESHOLD = 40;

      if (deltaX < -SWIPE_THRESHOLD) {
        goToNext();
      } else if (deltaX > SWIPE_THRESHOLD) {
        goToPrev();
      }
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    setIsPaused(false);
  };

  if (isLoading && banners.length === 0) {
    return (
      <div className="ios-banner__skeleton-wrapper">
        <div className="ios-banner__skeleton" />
      </div>
    );
  }

  const currentBanner = displayBanners[currentIndex] || displayBanners[0];
  const isExternalLink =
    currentBanner.link_url?.startsWith('http') ||
    currentBanner.link_url?.startsWith('https') ||
    currentBanner.link_url?.startsWith('wa.me');
  const targetUrl = currentBanner.link_url || '/shop';

  return (
    <div
      className="ios-banner-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Promotional store banners"
    >
      <div className="ios-banner-card">
        {/* Top: Pure, Unobstructed Image Viewport (NO text or buttons on top of image) */}
        <div className="ios-banner__media-viewport">
          {/* Instagram Story Progress Segment Bar (Pinned at top with frosted glass pill) */}
          {totalSlides > 1 && (
            <div className="ios-banner__insta-loader-bar" role="tablist" aria-label="Banner slides">
              {displayBanners.map((_, idx) => {
                let fillWidth = 0;
                if (idx < currentIndex) {
                  fillWidth = 100;
                } else if (idx === currentIndex) {
                  fillWidth = progress;
                } else {
                  fillWidth = 0;
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`ios-banner__progress-track ${idx === currentIndex ? 'active' : ''}`}
                    onClick={() => goToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    role="tab"
                    aria-selected={idx === currentIndex}
                  >
                    <div
                      className="ios-banner__progress-bar"
                      style={{ width: `${fillWidth}%` }}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Smooth Sliding Image Track */}
          <div
            className="ios-banner-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {displayBanners.map((banner, idx) => (
              <div key={banner.id} className="ios-banner-slide">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="ios-banner-image"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            ))}
          </div>

          {/* Desktop Navigation Arrows (Glassmorphic) */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                className="ios-banner-nav-btn ios-banner-nav-btn--prev"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToPrev();
                }}
                aria-label="Previous banner"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                type="button"
                className="ios-banner-nav-btn ios-banner-nav-btn--next"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next banner"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </>
          )}
        </div>

        {/* Bottom: Merged Section Below with Blurred Vignette Background (Text & Action Button) */}
        <div className="ios-banner__merged-section">
          <div className="ios-banner__merged-content">
            <div className="ios-banner__meta-row">
              <div className="ios-banner-badge">
                <span className="material-symbols-outlined ios-banner-badge-icon">
                  storefront
                </span>
                <span>Sai Darshan Mart • Sanjeevni Nagar</span>
              </div>
              <span className="ios-banner__counter-pill">
                {currentIndex + 1} of {totalSlides}
              </span>
            </div>

            <h2 className="ios-banner-title">{currentBanner.title}</h2>
            {currentBanner.text && (
              <p className="ios-banner-subtitle">{currentBanner.text}</p>
            )}
          </div>

          <div className="ios-banner-action-area">
            {isExternalLink ? (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ios-banner-btn"
                aria-label={`${currentBanner.title} - Open link`}
              >
                <span>Order on WhatsApp</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </a>
            ) : (
              <Link
                to={targetUrl}
                className="ios-banner-btn"
                aria-label={`${currentBanner.title} - View page`}
              >
                <span>Explore Store</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
