import { useLocationContext } from '../../contexts/LocationContext';
import './GooeyLocationHero.css';

export function GooeyLocationHero() {
  const {
    showGooeyPrompt,
    isLocating,
    isGooeyFlying,
    detectCurrentLocation,
    openModal,
    dismissGooeyPrompt,
  } = useLocationContext();

  if (!showGooeyPrompt) return null;

  return (
    <aside
      aria-label="Location Setup"
      className={`gooey-location-hero ${isGooeyFlying ? 'gooey-location-hero--flying' : ''}`}
    >
      {/* SVG Gooey Filter Definition */}
      <svg className="gooey-svg-filter" width="0" height="0">
        <defs>
          <filter id="sdm-goo-effect">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="gooey-location-hero__backdrop" onClick={dismissGooeyPrompt} />

      <div className="gooey-location-hero__card">
        {/* Close Button */}
        <button
          type="button"
          className="gooey-location-hero__close"
          onClick={dismissGooeyPrompt}
          aria-label="Dismiss location prompt"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Gooey Animation Blob Stage */}
        <div className="gooey-stage-container">
          <div className="gooey-radar-ring ring-1" />
          <div className="gooey-radar-ring ring-2" />
          <div className="gooey-radar-ring ring-3" />

          {/* Liquid Gooey Morphing Blobs */}
          <div className="gooey-blobs-wrapper">
            <div className="gooey-blob blob-main" />
            <div className="gooey-blob blob-sub-1" />
            <div className="gooey-blob blob-sub-2" />
            <div className="gooey-blob blob-sub-3" />
          </div>

          {/* Center Floating Pin Icon */}
          <div className={`gooey-pin-badge ${isLocating ? 'gooey-pin-badge--pulse' : ''}`}>
            <span className="material-symbols-outlined gooey-pin-icon">
              {isLocating ? 'radar' : 'location_on'}
            </span>
          </div>
        </div>

        {/* Text Details */}
        <div className="gooey-location-hero__text">
          <h2 className="gooey-location-hero__title">
            {isLocating ? 'Detecting Your Location...' : 'Where should we deliver?'}
          </h2>
          <p className="gooey-location-hero__subtitle">
            {isLocating
              ? 'Connecting to GPS to find your nearest groceries and delivery route...'
              : 'Set your exact location in Jabalpur to see instant item availability & delivery times.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="gooey-location-hero__actions">
          <button
            type="button"
            className="sdm-btn sdm-btn--primary gooey-btn-detect"
            onClick={() => detectCurrentLocation()}
            disabled={isLocating}
          >
            <span className={`material-symbols-outlined ${isLocating ? 'spin-anim' : ''}`}>
              {isLocating ? 'progress_activity' : 'my_location'}
            </span>
            <span>{isLocating ? 'Locating via GPS...' : 'Auto-Detect My Location'}</span>
          </button>

          <button
            type="button"
            className="sdm-btn sdm-btn--outlined gooey-btn-manual"
            onClick={openModal}
            disabled={isLocating}
          >
            <span className="material-symbols-outlined">map</span>
            <span>Select on Map / Type Area</span>
          </button>

          <button
            type="button"
            className="gooey-btn-skip"
            onClick={dismissGooeyPrompt}
          >
            Continue with Civil Lines, Jabalpur
          </button>
        </div>
      </div>
    </aside>
  );
}
