import { useState, useEffect, useRef, useCallback } from 'react';
import type { StoreMediaItem } from '../../data/storeMedia';
import './StoreVisualsMasterShowcase.css';

interface StoreVisualsMasterShowcaseProps {
  items: StoreMediaItem[];
  onOpenLightbox: (index: number) => void;
  autoSlideInterval?: number; // default 5000ms
}

export function StoreVisualsMasterShowcase({
  items,
  onOpenLightbox,
  autoSlideInterval = 5000,
}: StoreVisualsMasterShowcaseProps) {
  if (!items || items.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const total = items.length;

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (idx: number) => {
    setActiveIndex(idx);
  };

  // Auto-play timer
  useEffect(() => {
    if (isPaused || total <= 1) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, autoSlideInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide, autoSlideInterval, total]);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    touchStartXRef.current = null;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  if (!items || items.length === 0) return null;

  const currentItem = items[activeIndex];

  return (
    <div
      className="store-showcase-master"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Banner Visual Viewport */}
      <div 
        className="store-showcase-viewport" 
        onClick={() => onOpenLightbox(activeIndex)}
        title="Click to view full master resolution in lightbox"
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`store-showcase-slide ${idx === activeIndex ? 'store-showcase-slide--active' : ''}`}
            aria-hidden={idx !== activeIndex}
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.title}
                className="store-showcase-media store-showcase-media--img"
                loading={idx < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
            ) : (
              <div className="store-showcase-video-wrap">
                <video
                  src={item.url}
                  className="store-showcase-media store-showcase-media--video"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
                <div className="store-showcase-play-indicator">
                  <span className="material-symbols-outlined">play_circle</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Floating Top Controls */}
        <div className="store-showcase-top-bar" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="store-showcase-hd-pill"
            onClick={() => onOpenLightbox(activeIndex)}
            title="View Photo in Lightbox"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>zoom_in</span>
            <span>View Full Photo</span>
          </button>
        </div>

        {/* Prev / Next Navigation Arrows */}
        <button
          type="button"
          className="store-showcase-arrow store-showcase-arrow--prev"
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          aria-label="Previous store view"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        <button
          type="button"
          className="store-showcase-arrow store-showcase-arrow--next"
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          aria-label="Next store view"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Dynamic Summary Card (Updates as the banner scrolls) */}
      <div className="store-showcase-summary-card">
        <div className="store-showcase-meta-row">
          <div className="store-showcase-badges">
            <span className="store-showcase-dept-badge">{currentItem.department}</span>
          </div>
        </div>

        <h3 className="store-showcase-title">{currentItem.title}</h3>
        <p className="store-showcase-notes">{currentItem.notes}</p>

        {/* Thumbnail Navigator Strip */}
        <div className="store-showcase-thumbs-strip" role="tablist" aria-label="Select store department">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              className={`store-showcase-thumb-btn ${idx === activeIndex ? 'store-showcase-thumb-btn--active' : ''}`}
              onClick={() => goToSlide(idx)}
              title={item.title}
            >
              <div className="store-showcase-thumb-img-wrap">
                {item.type === 'image' ? (
                  <img src={item.url} alt="" className="store-showcase-thumb-img" />
                ) : (
                  <div className="store-showcase-thumb-video-fallback">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>videocam</span>
                  </div>
                )}
              </div>
              <span className="store-showcase-thumb-label">{item.department}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
