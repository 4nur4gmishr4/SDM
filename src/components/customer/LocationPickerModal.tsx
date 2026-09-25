import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationContext } from '../../contexts/LocationContext';
import { reverseGeocode, searchPlaces } from '../../lib/geocoding';
import type { DeliveryLocation, GeocodingSearchResult } from '../../types/location';
import './LocationPickerModal.css';

export function LocationPickerModal() {
  const { location, isModalOpen, closeModal, updateLocation } = useLocationContext();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Selected Pin coordinates & geocoded address
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: location.lat || 23.1815,
    lng: location.lng || 79.9864,
  });
  const [geocodedLocation, setGeocodedLocation] = useState<DeliveryLocation>(location);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isMapDragging, setIsMapDragging] = useState(false);

  // Address detail fields
  const [houseNo, setHouseNo] = useState(location.houseNo || '');
  const [landmark, setLandmark] = useState(location.landmark || '');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debounceTimerRef = useRef<any>(null);

  // Reverse geocode whenever pin coordinates change (debounced)
  const fetchAddressForCoords = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const result = await reverseGeocode(lat, lng);
      setGeocodedLocation(result);
    } catch (err) {
      console.error('Failed to geocode coordinates:', err);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Initialize or re-center Leaflet Map when modal opens
  useEffect(() => {
    if (!isModalOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const initialLat = location.lat || 23.1815;
      const initialLng = location.lng || 79.9864;

      if (!mapInstanceRef.current) {
        // Create Leaflet map instance
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 15,
          zoomControl: false,
        });

        // Add clean OpenStreetMap tiles with full Indian & Jabalpur street coverage
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          subdomains: 'abc',
        }).addTo(map);

        // Add Zoom Control to bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Event listeners for dragging map & updating center pin
        map.on('movestart', () => {
          setIsMapDragging(true);
        });

        map.on('moveend', () => {
          setIsMapDragging(false);
          const center = map.getCenter();
          setCurrentCoords({ lat: center.lat, lng: center.lng });

          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            fetchAddressForCoords(center.lat, center.lng);
          }, 400);
        });

        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView([initialLat, initialLng], 15);
      }

      // Force recalculate tiles
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [isModalOpen, location.lat, location.lng, fetchAddressForCoords]);

  // Keep map container dimensions in sync with ResizeObserver
  useEffect(() => {
    if (!isModalOpen || !mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [isModalOpen]);

  // Clean up map when component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Auto-search locality when query changes
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const searchTimer = setTimeout(async () => {
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
      setShowDropdown(true);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: GeocodingSearchResult) => {
    setSearchQuery('');
    setShowDropdown(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([result.lat, result.lng], 17, {
        duration: 1.2,
      });
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, {
            duration: 1.2,
          });
        }
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setIsGeocoding(false);
        alert('Could not retrieve current GPS position. Please select manually on the map.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirmLocation = () => {
    const finalFormatted = [
      houseNo.trim(),
      landmark ? `Near ${landmark.trim()}` : '',
      geocodedLocation.address,
      geocodedLocation.city,
      geocodedLocation.pincode,
    ]
      .filter(Boolean)
      .join(', ');

    const finalLocation: DeliveryLocation = {
      ...geocodedLocation,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      houseNo: houseNo.trim(),
      landmark: landmark.trim(),
      formattedAddress: finalFormatted,
      isCustom: true,
    };

    updateLocation(finalLocation);
    closeModal();
  };

  if (!isModalOpen) return null;

  return (
    <div className="location-modal-overlay" role="dialog" aria-modal="true">
      <div className="location-modal-backdrop" onClick={closeModal} />

      <div className="location-modal-card">
        {/* Modal Header */}
        <div className="location-modal-header">
          <div className="location-modal-title-group">
            <span className="material-symbols-outlined location-modal-icon">location_on</span>
            <h2 className="location-modal-title">Select Delivery Location</h2>
          </div>
          <button
            type="button"
            className="location-modal-close-btn"
            onClick={closeModal}
            aria-label="Close location picker"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search Bar with Autocomplete Dropdown */}
        <div className="location-search-wrapper">
          <div className="location-search-bar">
            <span className="material-symbols-outlined location-search-icon">search</span>
            <input
              type="text"
              className="location-search-input"
              placeholder="Search area, landmark or street in Jabalpur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            />
            {isSearching && (
              <span className="material-symbols-outlined spin-anim location-search-spinner">
                progress_activity
              </span>
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                className="location-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <ul className="location-search-dropdown">
              {searchResults.map((item, idx) => (
                <li
                  key={`${item.lat}_${item.lng}_${idx}`}
                  className="location-search-item"
                  onClick={() => handleSelectSearchResult(item)}
                >
                  <span className="material-symbols-outlined location-item-icon">pin_drop</span>
                  <div className="location-item-info">
                    <span className="location-item-primary">{item.area || item.label}</span>
                    <span className="location-item-secondary">{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Interactive Map Area */}
        <div className="location-map-container">
          <div ref={mapContainerRef} className="location-leaflet-map" />

          {/* Floating Center Pin (Swiggy / Blinkit style) */}
          <div className={`location-center-pin ${isMapDragging ? 'location-center-pin--dragging' : ''}`}>
            <div className="location-pin-marker">
              <span className="material-symbols-outlined location-pin-svg">location_on</span>
            </div>
            <div className="location-pin-shadow" />
          </div>

          {/* Recenter / GPS Button */}
          <button
            type="button"
            className="location-gps-btn"
            onClick={handleLocateMe}
            title="Locate me via GPS"
            disabled={isGeocoding}
          >
            <span className={`material-symbols-outlined ${isGeocoding ? 'spin-anim' : ''}`}>
              my_location
            </span>
            <span className="location-gps-text">Locate Me</span>
          </button>
        </div>

        {/* Address Confirmation Details */}
        <div className="location-bottom-sheet">
          <div className="location-detected-pill">
            <span className="material-symbols-outlined location-pill-icon">home_pin</span>
            <div className="location-pill-text">
              <div className="location-pill-area">
                {isGeocoding ? 'Finding area details...' : geocodedLocation.area || 'Jabalpur'}
              </div>
              <div className="location-pill-address" title={geocodedLocation.formattedAddress}>
                {isGeocoding ? 'Reverse geocoding...' : geocodedLocation.formattedAddress}
              </div>
            </div>
          </div>

          {/* Additional details input (House No & Landmark) */}
          <div className="location-inputs-grid">
            <div className="location-input-field">
              <label htmlFor="houseNo">House / Flat / Floor No.</label>
              <input
                id="houseNo"
                type="text"
                placeholder="e.g. Flat 302, Sai Residency"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
              />
            </div>

            <div className="location-input-field">
              <label htmlFor="landmark">Nearby Landmark</label>
              <input
                id="landmark"
                type="text"
                placeholder="e.g. Near Golbazar / Temple"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            className="sdm-btn sdm-btn--primary location-confirm-btn"
            onClick={handleConfirmLocation}
            disabled={isGeocoding}
          >
            <span className="material-symbols-outlined">check_circle</span>
            <span>Confirm Delivery Location</span>
          </button>
        </div>
      </div>
    </div>
  );
}
