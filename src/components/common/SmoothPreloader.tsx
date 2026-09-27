import { useState, useEffect, useRef, startTransition } from 'react';
import './SmoothPreloader.css';

interface SmoothPreloaderProps {
  logoSrc?: string;
  duration?: number; // total duration in seconds (default 1.3s)
  onComplete?: () => void;
}

const SUPABASE_LOGO_URL = 'https://otyojqnnwbrteknyqcpi.supabase.co/storage/v1/object/public/store-media/banners/Logo.png';

export function SmoothPreloader({
  logoSrc = SUPABASE_LOGO_URL,
  duration = 1.3,
  onComplete,
}: SmoothPreloaderProps) {
  const [counter, setCounter] = useState(10);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSlidingUp, setIsSlidingUp] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Don't show preloader in admin portal
    if (window.location.pathname.startsWith('/admin')) return false;
    // Check if user already saw the preloader in this session
    return !sessionStorage.getItem('sdm_smooth_preloader_seen');
  });

  const hasExitedRef = useRef(false);

  const [imageError, setImageError] = useState(false);

  // Counter progression from 10% to 100%
  useEffect(() => {
    if (!isVisible) return;

    const totalSteps = (duration * 1000) / 40;
    const increment = 90 / totalSteps;

    const interval = setInterval(() => {
      startTransition(() => {
        setCounter((prev) => {
          const next = prev + increment;
          if (next >= 100) {
            clearInterval(interval);
            setIsLoaded(true);
            return 100;
          }
          return next;
        });
      });
    }, 40);

    return () => clearInterval(interval);
  }, [duration, isVisible]);

  // Slide up exit handler triggered when user taps anywhere after 100%
  const handleDismiss = () => {
    if (!isLoaded || hasExitedRef.current) return;
    hasExitedRef.current = true;
    setIsSlidingUp(true);

    try {
      sessionStorage.setItem('sdm_smooth_preloader_seen', 'true');
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 800);
  };

  // Keyboard navigation (Enter, Space or Escape to dismiss once loaded)
  useEffect(() => {
    if (!isVisible || !isLoaded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isLoaded]);

  if (!isVisible) return null;

  return (
    <div
      className={`sdm-smooth-preloader ${isLoaded ? 'sdm-smooth-preloader--ready' : ''} ${
        isSlidingUp ? 'sdm-smooth-preloader--sliding-up' : ''
      }`}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Sai Darshan Mart Preloader"
      tabIndex={0}
      data-testid="smooth-preloader"
    >
      {/* Ambient background glow */}
      <div className="sdm-smooth-preloader__glow" aria-hidden="true" />

      {/* Center Store Brand Presentation */}
      <div className="sdm-smooth-preloader__center">
        <div className="sdm-smooth-preloader__logo-wrap">
          {!imageError ? (
            <img
              src={logoSrc}
              alt="Sai Darshan Mart"
              className="sdm-smooth-preloader__logo"
              loading="eager"
              decoding="async"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="sdm-smooth-preloader__logo-fallback">
              <span className="material-symbols-outlined sdm-smooth-preloader__fallback-icon">
                storefront
              </span>
            </div>
          )}
        </div>

        <div className="sdm-smooth-preloader__brand-meta">
          <h1 className="sdm-smooth-preloader__title">Sai Darshan Mart</h1>
          <p className="sdm-smooth-preloader__subtitle">
            There is only one Boss: The Customer ❤️
          </p>
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <div className="sdm-smooth-preloader__bottom">
        {/* Left/Center Prompt: Tap to Begin when 100% loaded */}
        <div className="sdm-smooth-preloader__prompt-wrap">
          {isLoaded ? (
            <button
              type="button"
              className="sdm-smooth-preloader__tap-pill"
              onClick={handleDismiss}
              aria-label="Tap to begin shopping"
            >
              <span className="material-symbols-outlined sdm-smooth-preloader__tap-icon">
                touch_app
              </span>
              <span className="sdm-smooth-preloader__tap-text">Tap anywhere to begin</span>
              <span className="material-symbols-outlined sdm-smooth-preloader__arrow-icon">
                arrow_upward
              </span>
            </button>
          ) : (
            <div className="sdm-smooth-preloader__loading-tag">
              <span className="sdm-smooth-preloader__pulse-dot" />
              <span>Preparing fresh groceries...</span>
            </div>
          )}
        </div>

        {/* Right: Counter Number (Exact Framer percentage counter) */}
        <div className="sdm-smooth-preloader__counter">
          <span className="sdm-smooth-preloader__counter-num">
            {Math.round(counter)}
          </span>
          <span className="sdm-smooth-preloader__counter-percent">%</span>
        </div>
      </div>

      {/* Hairline Progress Track */}
      <div className="sdm-smooth-preloader__track">
        <div
          className="sdm-smooth-preloader__bar"
          style={{ width: `${Math.min(100, Math.round(counter))}%` }}
        />
      </div>
    </div>
  );
}
