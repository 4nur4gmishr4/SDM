import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import type { DeliveryLocation } from '../types/location';
import { DEFAULT_JABALPUR_LOCATION, reverseGeocode } from '../lib/geocoding';

const STORAGE_KEY = 'sdm_delivery_location';
const PROMPT_DISMISSED_KEY = 'sdm_location_prompt_seen';

interface LocationContextValue {
  location: DeliveryLocation;
  isLocating: boolean;
  hasLocationBeenSet: boolean;
  isModalOpen: boolean;
  showGooeyPrompt: boolean;
  isGooeyFlying: boolean;
  openModal: () => void;
  closeModal: () => void;
  dismissGooeyPrompt: () => void;
  detectCurrentLocation: () => Promise<boolean>;
  updateLocation: (newLocation: DeliveryLocation) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<DeliveryLocation>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_JABALPUR_LOCATION;
  });

  const [hasLocationBeenSet, setHasLocationBeenSet] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  });

  const [showGooeyPrompt, setShowGooeyPrompt] = useState<boolean>(() => {
    const hasSeen = localStorage.getItem(PROMPT_DISMISSED_KEY);
    const hasLoc = localStorage.getItem(STORAGE_KEY);
    return !hasSeen && !hasLoc;
  });

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGooeyFlying, setIsGooeyFlying] = useState<boolean>(false);

  const updateLocation = useCallback((newLocation: DeliveryLocation) => {
    setLocationState(newLocation);
    setHasLocationBeenSet(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocation));
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
  }, []);

  const openModal = useCallback(() => {
    setShowGooeyPrompt(false);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const dismissGooeyPrompt = useCallback(() => {
    setShowGooeyPrompt(false);
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
  }, []);

  /**
   * Browser HTML5 Geolocation with 0 cost, 0 API key.
   */
  const detectCurrentLocation = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser.');
      return false;
    }

    setIsLocating(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const geocoded = await reverseGeocode(latitude, longitude);
            
            // Trigger gooey fly animation before finalizing
            setIsGooeyFlying(true);
            setTimeout(() => {
              updateLocation(geocoded);
              setIsGooeyFlying(false);
              setShowGooeyPrompt(false);
              setIsLocating(false);
              resolve(true);
            }, 600);
          } catch (err) {
            console.error('Error reverse geocoding current location:', err);
            setIsLocating(false);
            setIsGooeyFlying(false);
            resolve(false);
          }
        },
        (error) => {
          console.warn('Geolocation access denied or timed out:', error.message);
          setIsLocating(false);
          setIsGooeyFlying(false);
          // If denied, prompt to pick on map
          openModal();
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, [openModal, updateLocation]);

  // Optional: Auto-detect once if permission was already granted previously
  useEffect(() => {
    if (!hasLocationBeenSet && 'permissions' in navigator) {
      navigator.permissions
        ?.query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          if (result.state === 'granted') {
            detectCurrentLocation();
          }
        })
        .catch(() => {
          // Permissions API not supported or error
        });
    }
  }, [hasLocationBeenSet, detectCurrentLocation]);

  const value: LocationContextValue = useMemo(() => ({
    location,
    isLocating,
    hasLocationBeenSet,
    isModalOpen,
    showGooeyPrompt,
    isGooeyFlying,
    openModal,
    closeModal,
    dismissGooeyPrompt,
    detectCurrentLocation,
    updateLocation,
  }), [
    location,
    isLocating,
    hasLocationBeenSet,
    isModalOpen,
    showGooeyPrompt,
    isGooeyFlying,
    openModal,
    closeModal,
    dismissGooeyPrompt,
    detectCurrentLocation,
    updateLocation,
  ]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}
