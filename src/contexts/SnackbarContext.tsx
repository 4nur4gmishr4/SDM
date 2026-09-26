import { createContext, useContext, useState, type ReactNode, useCallback, useEffect, useRef } from 'react';
import '../components/common/GoogleSnackbar.css';

export interface SnackbarOptions {
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
  icon?: string;
  iconColor?: string;
}

interface ToastItem {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  iconColor?: string;
  isExiting: boolean;
}

interface SnackbarContextType {
  showSnackbar: (message: string, options?: SnackbarOptions) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

// Helper to deduce authentic Material Design contextual icon based on message content
function getContextualIcon(msg: string): { icon: string; color: string } {
  const lower = msg.toLowerCase();
  if (lower.includes('cart') || lower.includes('added')) {
    return { icon: 'check_circle', color: '#81C995' }; // Google Material Green
  }
  if (lower.includes('restored') || lower.includes('online')) {
    return { icon: 'wifi', color: '#81C995' };
  }
  if (lower.includes('offline') || lower.includes('no internet')) {
    return { icon: 'wifi_off', color: '#FDD663' }; // Google Material Amber
  }
  if (lower.includes('theme')) {
    return { icon: 'palette', color: '#8AB4F8' }; // Google Material Blue
  }
  if (lower.includes('google sign-in') || lower.includes('redirecting')) {
    return { icon: 'account_circle', color: '#8AB4F8' };
  }
  if (lower.includes('signed out') || lower.includes('logout')) {
    return { icon: 'logout', color: '#E8EAED' };
  }
  if (lower.includes('error') || lower.includes('failed') || lower.includes('fail')) {
    return { icon: 'error', color: '#F28B82' }; // Google Material Coral Red
  }
  if (lower.includes('check') || lower.includes('valid') || lower.includes('required') || lower.includes('please')) {
    return { icon: 'info', color: '#FDD663' };
  }
  return { icon: 'info', color: '#8AB4F8' };
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [mobileBottomOffset, setMobileBottomOffset] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure bottom nav height on mobile so toast sits right above it
  const updateBottomOffset = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth <= 640) {
      const bottomNav = document.querySelector('.app-shell__bottom-nav') as HTMLElement | null;
      if (bottomNav && bottomNav.offsetParent !== null) {
        const rect = bottomNav.getBoundingClientRect();
        setMobileBottomOffset(rect.height || 80);
        return;
      }
      const adminNav = document.querySelector('.admin-shell__nav') as HTMLElement | null;
      if (adminNav && adminNav.offsetParent !== null) {
        const rect = adminNav.getBoundingClientRect();
        setMobileBottomOffset(rect.height || 64);
        return;
      }
      setMobileBottomOffset(0);
    } else {
      setMobileBottomOffset(0);
    }
  }, []);

  useEffect(() => {
    updateBottomOffset();
    window.addEventListener('resize', updateBottomOffset);
    return () => window.removeEventListener('resize', updateBottomOffset);
  }, [updateBottomOffset]);

  const hideSnackbar = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    setToast((prev) => (prev ? { ...prev, isExiting: true } : null));

    exitTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 210);
  }, []);

  const showSnackbar = useCallback((msg: string, options?: SnackbarOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    updateBottomOffset();

    const contextual = getContextualIcon(msg);
    const toastId = Date.now();
    const duration = options?.duration || 3500;

    setToast({
      id: toastId,
      message: msg,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
      icon: options?.icon || contextual.icon,
      iconColor: options?.iconColor || contextual.color,
      isExiting: false,
    });

    // Auto-dismiss after duration
    timerRef.current = setTimeout(() => {
      setToast((current) => (current && current.id === toastId ? { ...current, isExiting: true } : current));

      exitTimerRef.current = setTimeout(() => {
        setToast((current) => (current && current.id === toastId ? null : current));
      }, 210);
    }, duration);
  }, [updateBottomOffset]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`google-snackbar-container ${toast.isExiting ? 'google-snackbar--exit' : 'google-snackbar--enter'}`}
          style={{
            bottom: mobileBottomOffset > 0 ? `${mobileBottomOffset}px` : undefined,
          }}
        >
          {/* Left: Contextual Icon + Message */}
          <div className="google-snackbar-content">
            {toast.icon && (
              <span
                className="material-symbols-outlined google-snackbar-icon"
                style={{ color: toast.iconColor || 'inherit' }}
                aria-hidden="true"
              >
                {toast.icon}
              </span>
            )}
            <span className="google-snackbar-text">{toast.message}</span>
          </div>

          {/* Right: Optional Action Button or Close ✕ */}
          <div className="google-snackbar-action">
            {toast.actionLabel ? (
              <button
                type="button"
                className="google-snackbar-action-btn"
                onClick={() => {
                  if (toast.onAction) toast.onAction();
                  hideSnackbar();
                }}
              >
                {toast.actionLabel}
              </button>
            ) : (
              <button
                type="button"
                className="google-snackbar-close-btn"
                onClick={hideSnackbar}
                aria-label="Dismiss notification"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}
