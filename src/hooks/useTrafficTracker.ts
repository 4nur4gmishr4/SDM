import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

/**
 * Hook that listens to route changes and records customer page views.
 * Excludes admin paths and operates silently without blocking render.
 */
export function useTrafficTracker(): void {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
}
