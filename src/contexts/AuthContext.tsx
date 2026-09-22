import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_ADMIN_SESSION: any = {
  access_token: 'demo-admin-access-token',
  token_type: 'bearer',
  expires_in: 86400,
  refresh_token: 'demo-admin-refresh-token',
  user: {
    id: 'admin-sdm-001',
    email: 'admin@saidarshanmart.com',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: { role: 'admin' },
    user_metadata: { name: 'Store Admin', role: 'admin' },
    created_at: new Date().toISOString()
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check local storage for persistent demo admin session
    const storedDemo = localStorage.getItem('sdm_admin_session');
    if (storedDemo) {
      try {
        setSession(JSON.parse(storedDemo));
        setIsLoading(false);
      } catch {
        localStorage.removeItem('sdm_admin_session');
      }
    }

    // 2. Check live Supabase session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) {
        setSession(s);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // Default built-in admin credentials for instant preview and access
    if (
      (cleanEmail === 'admin@saidarshanmart.com' || cleanEmail === 'admin') &&
      (cleanPass === 'admin123' || cleanPass === 'admin')
    ) {
      setSession(DEMO_ADMIN_SESSION);
      localStorage.setItem('sdm_admin_session', JSON.stringify(DEMO_ADMIN_SESSION));
      return { error: null };
    }

    // Attempt live Supabase authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass });
      if (error) {
        return { error: error.message };
      }
      if (data?.session) {
        setSession(data.session);
        localStorage.removeItem('sdm_admin_session');
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Invalid email or password' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      return { error: message };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('sdm_admin_session');
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore network errors
    }
    setSession(null);
  };

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
