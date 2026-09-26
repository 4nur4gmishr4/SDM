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

  // Map view layer modes: street, satellite, terrain
  type MapViewMode = 'street' | 'satellite' | 'terrain';
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('street');
  const tileLayersRef = useRef<{
    street: L.TileLayer | null;
    satelliteGroup: L.LayerGroup | null;
    terrain: L.TileLayer | null;
  }>({
    street: null,
    satelliteGroup: null,
    terrain: null,
  });

  // Address detail fields
  const [houseNo, setHouseNo] = useState(location.houseNo || '');
  const [landmark, setLandmark] = useState(location.landmark || '');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debounceTimerRef = useRef<any>(null);

  // Switch between Street, Satellite, and Terrain view
  const handleSwitchViewMode = (mode: MapViewMode) => {
    setMapViewMode(mode);
    const map = mapInstanceRef.current;
    const layers = tileLayersRef.current;
    if (!map || !layers.street || !layers.satelliteGroup || !layers.terrain) return;

    if (map.hasLayer(layers.street)) map.removeLayer(layers.street);
    if (map.hasLayer(layers.satelliteGroup)) map.removeLayer(layers.satelliteGroup);
    if (map.hasLayer(layers.terrain)) map.removeLayer(layers.terrain);

    if (mode === 'satellite') {
      layers.satelliteGroup.addTo(map);
    } else if (mode === 'terrain') {
      layers.terrain.addTo(map);
    } else {
      layers.street.addTo(map);
    }

    map.invalidateSize();
  };

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
        // Create Leaflet map instance without attribution bar
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false,
        });

        // 1. Street View Layer (High-contrast colorful roads, buildings, parks, and landmarks)
        const streetLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        );

        // 2. Satellite View Layer (Real Earth aerial photography + hybrid street/locality labels)
        const satImagery = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        );
        const satLabels = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        );
        const satelliteGroup = L.layerGroup([satImagery, satLabels]);

        // 3. Terrain View Layer (Topographical elevation & contours)
        const terrainLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        );

        tileLayersRef.current = {
          street: streetLayer,
          satelliteGroup,
          terrain: terrainLayer,
        };

        // Add the currently active layer
        if (mapViewMode === 'satellite') {
          satelliteGroup.addTo(map);
        } else if (mapViewMode === 'terrain') {
          terrainLayer.addTo(map);
        } else {
          streetLayer.addTo(map);
        }

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

  // Keep map container dimensions in sync with throttled ResizeObserver
  useEffect(() => {
    if (!isModalOpen || !mapContainerRef.current) return;
    let rafId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
    });
    observer.observe(mapContainerRef.current);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
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
    }, 150);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: GeocodingSearchResult) => {
    setSearchQuery('');
    setShowDropdown(false);
    setCurrentCoords({ lat: result.lat, lng: result.lng });
    fetchAddressForCoords(result.lat, result.lng);
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

          {/* Map View Mode Switcher (Street / Satellite / Terrain) */}
          <div className="location-map-view-switcher" role="group" aria-label="Map view mode">
            <button
              type="button"
              className={`location-map-view-btn ${mapViewMode === 'street' ? 'location-map-view-btn--active' : ''}`}
              onClick={() => handleSwitchViewMode('street')}
              title="Street View (Detailed roads and landmarks)"
            >
              <span className="material-symbols-outlined">map</span>
              <span>Streets</span>
            </button>
            <button
              type="button"
              className={`location-map-view-btn ${mapViewMode === 'satellite' ? 'location-map-view-btn--active' : ''}`}
              onClick={() => handleSwitchViewMode('satellite')}
              title="Satellite View (Real Earth imagery with roads)"
            >
              <span className="material-symbols-outlined">satellite_alt</span>
              <span>Satellite</span>
            </button>
            <button
              type="button"
              className={`location-map-view-btn ${mapViewMode === 'terrain' ? 'location-map-view-btn--active' : ''}`}
              onClick={() => handleSwitchViewMode('terrain')}
              title="Terrain View (Elevation and topography)"
            >
              <span className="material-symbols-outlined">terrain</span>
              <span>Terrain</span>
            </button>
          </div>

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
