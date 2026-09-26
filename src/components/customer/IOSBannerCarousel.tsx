import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Banner } from '../../types/banner';
import { useDefaultLogoBanner } from '../../hooks/useDefaultLogoBanner';
import './IOSBannerCarousel.css';

interface IOSBannerCarouselProps {
  banners: Banner[];
  isLoading?: boolean;
  slideDuration?: number; // in milliseconds (default 5000ms)
}

export function IOSBannerCarousel({
  banners,
  isLoading = false,
  slideDuration = 5000,
}: IOSBannerCarouselProps) {
  const { logoBanner } = useDefaultLogoBanner();

  // Only display banners that are explicitly active
  const activeBanners = banners.filter((b) => b.is_active);
  const displayBanners = activeBanners;
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
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setProgress(0);
    elapsedPausedRef.current = 0;
    startTimeRef.current = performance.now();
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    if (totalSlides <= 1) return;
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

  // 1. Loading state
  if (isLoading && banners.length === 0) {
    return (
      <div className="ios-banner__skeleton-wrapper">
        <div className="ios-banner__skeleton" />
      </div>
    );
  }

  // 2. If no active promotional banners configured by admin:
  // Render the default store logo banner configured from Admin Panel
  if (activeBanners.length === 0) {
    if (!logoBanner?.is_enabled || !logoBanner?.image_url) {
      return null;
    }

    return (
      <section className="ios-banner-carousel" aria-label="Store Welcome Banner">
        <div className="ios-banner-card">
          <Link
            to={logoBanner.link_url || '/shop'}
            className="ios-banner__media-viewport"
            style={{ display: 'block', textDecoration: 'none' }}
          >
            <img
              src={logoBanner.image_url}
              alt={logoBanner.title || 'Sai Darshan Shopping Mart'}
              className="ios-banner-image"
              loading="eager"
              decoding="async"
              onError={(e) => {
                if (logoBanner.local_url && (e.target as HTMLImageElement).src !== logoBanner.local_url) {
                  (e.target as HTMLImageElement).src = logoBanner.local_url;
                }
              }}
            />
          </Link>

          <div className="ios-banner__merged-section">
            <div className="ios-banner__merged-content">
              <h2 className="ios-banner-title">{logoBanner.title || 'Sai Darshan Shopping Mart'}</h2>
              {logoBanner.subtitle && (
                <p className="ios-banner-subtitle">{logoBanner.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = displayBanners[currentIndex] || displayBanners[0];

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
          {/* Smooth Sliding Image Track */}
          <div
            className="ios-banner-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {displayBanners.map((banner, idx) => (
              <div key={banner.id} className="ios-banner-slide">
                <Link
                  to={banner.link_url || '/shop'}
                  style={{ display: 'block', width: '100%', height: '100%' }}
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="ios-banner-image"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={(e) => {
                      const filename = banner.image_url.split('/').pop()?.split('?')[0];
                      if (filename && !(e.target as HTMLImageElement).src.includes('/images/banners/' + filename)) {
                        (e.target as HTMLImageElement).src = '/images/banners/' + filename;
                      }
                    }}
                  />
                </Link>
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

        {/* Bottom: Clean Title & Subtitle */}
        <Link
          to={currentBanner.link_url || '/shop'}
          className="ios-banner__merged-section"
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <div className="ios-banner__merged-content">
            <h2 className="ios-banner-title">{currentBanner.title}</h2>
            {currentBanner.text && (
              <p className="ios-banner-subtitle">{currentBanner.text}</p>
            )}
          </div>
        </Link>
      </div>

      {/* Progress Loader Segment Bar - Positioned Below Banner */}
      {totalSlides > 1 && (
        <div className="ios-banner__insta-loader-bar ios-banner__insta-loader-bar--below" role="tablist" aria-label="Banner slides">
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
    </div>
  );
}
