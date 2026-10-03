import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, initGA4 } from '../lib/analytics';

/**
 * Hook that listens to route changes and records customer page views.
 * Excludes admin paths and operates silently without blocking render.
 */
export function useTrafficTracker(): void {
  const location = useLocation();

  useEffect(() => {
    initGA4();
    trackPageView(location.pathname);
  }, [location.pathname]);
}
