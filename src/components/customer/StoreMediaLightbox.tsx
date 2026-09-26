import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { StoreMediaItem } from '../../data/storeMedia';
import './StoreMediaLightbox.css';

interface StoreMediaLightboxProps {
  items: StoreMediaItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function StoreMediaLightbox({
  items,
  initialIndex,
  isOpen,
  onClose,
}: StoreMediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.5 | 2>(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Sync index when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoomLevel(1);
      setIsLoaded(false);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  if (!isOpen || !items || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];
  if (!currentItem) return null;

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setZoomLevel(1);
    setIsLoaded(false);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setZoomLevel(1);
    setIsLoaded(false);
  }, [items.length]);

  const toggleZoom = () => {
    setZoomLevel((prev) => {
      if (prev === 1) return 1.5;
      if (prev === 1.5) return 2;
      return 1;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (Math.abs(diff) > 48) {
      if (diff < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  if (!isOpen || !currentItem) return null;

  return createPortal(
    <div
      className="sdm-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Store Photo Lightbox"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dimmed Backdrop */}
      <div className="sdm-lightbox__backdrop" onClick={onClose} />

      {/* Top Header Toolbar */}
      <header className="sdm-lightbox__header">
        <div className="sdm-lightbox__badge-group">
          <span className="sdm-lightbox__tag">{currentItem.department}</span>
        </div>

        <div className="sdm-lightbox__actions">
          {currentItem.type === 'image' && (
            <button
              type="button"
              className="sdm-lightbox__btn"
              onClick={toggleZoom}
              title={`Zoom (${zoomLevel}x)`}
              aria-label="Toggle Zoom"
            >
              <span className="material-symbols-outlined">
                {zoomLevel === 1 ? 'zoom_in' : 'zoom_out'}
              </span>
              <span className="sdm-lightbox__btn-text">{zoomLevel}x</span>
            </button>
          )}

          <a
            href={currentItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="sdm-lightbox__btn"
            title="Open Raw Master Media in New Tab"
            aria-label="Open Full Resolution"
          >
            <span className="material-symbols-outlined">open_in_new</span>
          </a>

          <button
            type="button"
            className="sdm-lightbox__btn sdm-lightbox__btn--close"
            onClick={onClose}
            title="Close Lightbox (Esc)"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      {/* Main Media Viewport */}
      <div className="sdm-lightbox__viewport">
        {items.length > 1 && (
          <button
            type="button"
            className="sdm-lightbox__nav sdm-lightbox__nav--prev"
            onClick={handlePrev}
            title="Previous (Left Arrow)"
            aria-label="Previous Media"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        )}

        <div
          className={`sdm-lightbox__media-container ${zoomLevel > 1 ? 'is-zoomed' : ''}`}
          onClick={currentItem.type === 'image' ? toggleZoom : undefined}
          style={{ cursor: currentItem.type === 'image' ? 'zoom-in' : 'default' }}
        >
          {currentItem.type === 'image' ? (
            <img
              src={currentItem.url}
              alt={currentItem.title}
              className={`sdm-lightbox__image ${isLoaded ? 'is-loaded' : ''}`}
              style={{ transform: `scale(${zoomLevel})` }}
              onLoad={() => setIsLoaded(true)}
              decoding="sync"
            />
          ) : (
            <video
              src={currentItem.url}
              className="sdm-lightbox__video"
              muted
              autoPlay
              loop
              playsInline
              controls={false}
              onLoadedData={() => setIsLoaded(true)}
            >
              Your browser does not support HTML5 video.
            </video>
          )}

          {!isLoaded && (
            <div className="sdm-lightbox__loader">
              <div className="sdm-lightbox__spinner" />
              <span>Loading high-res master...</span>
            </div>
          )}
        </div>

        {items.length > 1 && (
          <button
            type="button"
            className="sdm-lightbox__nav sdm-lightbox__nav--next"
            onClick={handleNext}
            title="Next (Right Arrow)"
            aria-label="Next Media"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}
      </div>

      {/* Bottom Info Sheet */}
      <footer className="sdm-lightbox__footer">
        <div className="sdm-lightbox__footer-inner">
          <div className="sdm-lightbox__title-row">
            <h3 className="sdm-lightbox__title">{currentItem.title}</h3>
            <span className="sdm-lightbox__department-badge">{currentItem.badge}</span>
          </div>
          <p className="sdm-lightbox__notes">{currentItem.notes}</p>
        </div>
      </footer>
    </div>,
    document.body
  );
}
