import { useLocationContext } from '../../contexts/LocationContext';
import './HeaderLocationPill.css';

export function HeaderLocationPill() {
  const { location, isLocating, openModal } = useLocationContext();

  return (
    <button
      type="button"
      className="header-location-pill"
      onClick={openModal}
      title="Click to change your delivery location"
      aria-label={`Delivery to: ${location.area}, ${location.city}. Click to change.`}
    >
      <div className="header-location-pill__icon-wrap">
        <span className="material-symbols-outlined header-location-pill__pin-icon">
          location_on
        </span>
        <span className={`header-location-pill__pulse ${isLocating ? 'header-location-pill__pulse--active' : ''}`} />
      </div>

      <div className="header-location-pill__content">
        <div className="header-location-pill__top">
          <span className="header-location-pill__label">Deliver to</span>
          <span className="header-location-pill__area">
            {isLocating ? 'Locating...' : location.area || 'Jabalpur'}
          </span>
          <span className="material-symbols-outlined header-location-pill__chevron">
            expand_more
          </span>
        </div>

        <div className="header-location-pill__address" title={location.formattedAddress}>
          {isLocating ? 'Fetching GPS...' : location.address || location.city || 'Civil Lines, Jabalpur'}
        </div>
      </div>
    </button>
  );
}
