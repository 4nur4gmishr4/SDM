import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationContext } from '../../contexts/LocationContext';
import { reverseGeocode, searchPlaces, DEFAULT_JABALPUR_LOCATION } from '../../lib/geocoding';
import type { DeliveryLocation, GeocodingSearchResult } from '../../types/location';
import './LocationPickerModal.css';

// Popular 1-tap quick localities in Jabalpur
const QUICK_LOCALITIES = [
  { name: 'Civil Lines', lat: 23.1646, lng: 79.9554 },
  { name: 'Wright Town', lat: 23.1669, lng: 79.9255 },
  { name: 'Napier Town', lat: 23.1685, lng: 79.9550 },
  { name: 'Vijay Nagar', lat: 23.1892, lng: 79.9040 },
  { name: 'Madan Mahal', lat: 23.1520, lng: 79.9140 },
  { name: 'Sadar Bazar', lat: 23.1535, lng: 79.9494 },
  { name: 'Gorakhpur', lat: 23.1538, lng: 79.9319 },
  { name: 'Adhartal', lat: 23.2080, lng: 79.9450 },
  { name: 'Tilhari', lat: 23.1290, lng: 79.9720 },
];

export function LocationPickerModal() {
  const { location, isModalOpen, closeModal, updateLocation } = useLocationContext();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Selected Pin coordinates & geocoded address
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: location.lat || DEFAULT_JABALPUR_LOCATION.lat,
    lng: location.lng || DEFAULT_JABALPUR_LOCATION.lng,
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

      const initialLat = location.lat || 23.1685;
      const initialLng = location.lng || 79.9550;

      if (!mapInstanceRef.current) {
        // Create Leaflet map instance without attribution bar
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 16,
          zoomControl: false,
          attributionControl: false,
        });

        // 1. Street View Layer (ArcGIS World Street Map - crisp, high-res, Google-like roads)
        const streetLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        );

        // 2. Satellite View Layer (Real Earth aerial imagery + hybrid street/locality labels)
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
          }, 350);
        });

        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView([initialLat, initialLng], 16);
      }

      // Force recalculate tiles
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [isModalOpen, location.lat, location.lng, fetchAddressForCoords, mapViewMode]);

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
      mapInstanceRef.current.flyTo([result.lat, result.lng], 16.5, {
        duration: 1.0,
      });
    }
  };

  const handleQuickLocalityTap = (loc: { name: string; lat: number; lng: number }) => {
    setShowDropdown(false);
    setSearchQuery('');
    setCurrentCoords({ lat: loc.lat, lng: loc.lng });
    fetchAddressForCoords(loc.lat, loc.lng);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 16.5, {
        duration: 1.0,
      });
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGeocoding(true);
    setShowDropdown(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        fetchAddressForCoords(latitude, longitude);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, {
            duration: 1.2,
          });
        }
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setIsGeocoding(false);
        alert('Could not retrieve GPS location. Please choose your area on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirmLocation = () => {
    const finalLocation: DeliveryLocation = {
      ...geocodedLocation,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
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
            <span className="material-symbols-outlined location-modal-icon">near_me</span>
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
              type="search"
              className="location-search-input"
              placeholder="Search area, landmark or street in Jabalpur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
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
          {showDropdown && (
            <ul className="location-search-dropdown">
              {/* GPS Quick Action */}
              <li className="location-search-item location-search-item--gps" onClick={handleLocateMe}>
                <span className="material-symbols-outlined location-item-icon location-item-icon--gps">my_location</span>
                <div className="location-item-info">
                  <span className="location-item-primary" style={{ color: 'var(--md-sys-color-primary, #1E8E3E)', fontWeight: 600 }}>
                    Use Current Location
                  </span>
                  <span className="location-item-secondary">Using device GPS sensor (exact location)</span>
                </div>
              </li>

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

          {/* Quick Locality Carousel Pills */}
          <div className="location-quick-chips">
            <button
              type="button"
              className="location-quick-chip location-quick-chip--gps"
              onClick={handleLocateMe}
              title="Use current GPS location"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>my_location</span>
              <span>Locate Me</span>
            </button>
            {QUICK_LOCALITIES.map((loc) => (
              <button
                key={loc.name}
                type="button"
                className={`location-quick-chip ${
                  geocodedLocation.area === loc.name ? 'location-quick-chip--active' : ''
                }`}
                onClick={() => handleQuickLocalityTap(loc)}
              >
                {loc.name}
              </button>
            ))}
          </div>
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

          {/* Floating Center Pin with Drop Animation & Shadow */}
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

        {/* Address Confirmation Details (Google Bottom Sheet) */}
        <div className="location-bottom-sheet">
          <div className="location-detected-pill">
            <div className="location-detected-icon-wrap">
              <span className="material-symbols-outlined location-pill-icon">location_on</span>
            </div>
            <div className="location-pill-text">
              <div className="location-pill-area">
                {isGeocoding ? 'Finding area details...' : geocodedLocation.area || 'Jabalpur'}
              </div>
              <div className="location-pill-address" title={geocodedLocation.formattedAddress}>
                {isGeocoding ? 'Reverse geocoding...' : geocodedLocation.formattedAddress}
              </div>
              <div className="location-pill-status">
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#1E8E3E' }}>check_circle</span>
                <span>Delivery available in this area</span>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            className="sdsm-btn sdsm-btn--primary location-confirm-btn"
            onClick={handleConfirmLocation}
            disabled={isGeocoding}
          >
            <span className="material-symbols-outlined">check</span>
            <span>Confirm Delivery Location</span>
          </button>
        </div>
      </div>
    </div>
  );
}
