import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';

export type Theme = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('sdm-theme') as Theme | null;
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const isDark = theme === 'system' ? mediaQuery.matches : theme === 'dark';
      const resolved = isDark ? 'dark' : 'light';
      setResolvedTheme(resolved);

      if (theme === 'system') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }

      // Dynamically set mobile browser status bar / theme color
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', resolved === 'dark' ? '#137333' : '#1E8E3E');
    };

    updateTheme();

    const handler = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('sdm-theme', t);
  }, []);

  const toggleTheme = useCallback(() => {
    // Cycle: system -> light -> dark -> system
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  }, [theme, resolvedTheme, setTheme]);

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
