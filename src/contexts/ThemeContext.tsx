import { createContext, useContext, useEffect, useLayoutEffect, useState, useMemo, useCallback, type ReactNode } from 'react';

export type Theme = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToDOM(resolved: 'light' | 'dark', mode: Theme) {
  if (typeof document !== 'undefined') {
    // Inject temporary transition suppression style so theme switch is 100% instant (0ms delay)
    let css = document.getElementById('sdsm-instant-theme-switch');
    if (!css) {
      css = document.createElement('style');
      css.id = 'sdsm-instant-theme-switch';
      css.textContent = `
        *, *::before, *::after {
          -webkit-transition: none !important;
          -moz-transition: none !important;
          -o-transition: none !important;
          -ms-transition: none !important;
          transition: none !important;
        }
      `;
      document.head.appendChild(css);
    }

    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-mode', mode);

    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', resolved === 'dark' ? '#137333' : '#1E8E3E');

    // Force synchronous style reflow
    void document.documentElement.offsetHeight;

    // Remove suppression after the DOM updates synchronously
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById('sdsm-instant-theme-switch');
        if (el) el.remove();
      });
    });
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const saved = localStorage.getItem('sdsm-theme') as Theme | null;
      return saved === 'light' || saved === 'dark' ? saved : 'system';
    } catch {
      return 'system';
    }
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Track system theme changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme;

  useLayoutEffect(() => {
    applyThemeToDOM(resolvedTheme, theme);
  }, [theme, resolvedTheme]);

  const setTheme = useCallback((t: Theme) => {
    const nextResolved = t === 'system' 
      ? (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    applyThemeToDOM(nextResolved, t);
    setThemeState(t);
    try {
      if (t === 'system') {
        localStorage.removeItem('sdsm-theme');
      } else {
        localStorage.setItem('sdsm-theme', t);
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  }), [theme, resolvedTheme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
