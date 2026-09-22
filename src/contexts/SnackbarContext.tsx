import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';

interface SnackbarContextType {
  showSnackbar: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showSnackbar = useCallback((msg: string) => {
    setMessage(msg);
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setMessage((currentMessage) => {
        // Only clear if the message hasn't changed (in case a new one was just fired)
        if (currentMessage === msg) return null;
        return currentMessage;
      });
    }, 3000);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      
      {message && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--md-sys-color-inverse-surface)',
            color: 'var(--md-sys-color-inverse-on-surface)',
            padding: '14px 16px',
            borderRadius: 'var(--md-sys-shape-corner-extra-small)',
            fontFamily: 'var(--md-sys-typescale-body-medium-font-family)',
            fontSize: 'var(--md-sys-typescale-body-medium-size)',
            boxShadow: '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            minWidth: '300px',
            maxWidth: '90vw',
            animation: 'snackbar-fade-in 0.2s cubic-bezier(0.2, 0, 0, 1)'
          }}
        >
          {message}
        </div>
      )}
      
      <style>{`
        @keyframes snackbar-fade-in {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
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
