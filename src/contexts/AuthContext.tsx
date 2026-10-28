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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check live Supabase session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
      } else {
        const saved = localStorage.getItem('sdsm_admin_session');
        if (saved) {
          try {
            setSession(JSON.parse(saved));
          } catch {
            localStorage.removeItem('sdsm_admin_session');
          }
        }
      }
      setIsLoading(false);
    }).catch(() => {
      const saved = localStorage.getItem('sdsm_admin_session');
      if (saved) {
        try {
          setSession(JSON.parse(saved));
        } catch {
          localStorage.removeItem('sdsm_admin_session');
        }
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const envEmail = (import.meta.env.VITE_ADMIN_EMAIL as string)?.trim().toLowerCase();
    const envPass = (import.meta.env.VITE_ADMIN_PASSWORD as string)?.trim();

    // Authenticate with Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass });
      if (data?.session) {
        setSession(data.session);
        return { error: null };
      }

      // Fallback check against env admin credentials
      if (envEmail && envPass && cleanEmail === envEmail && cleanPass === envPass) {
        const adminSession: any = {
          access_token: 'sdsm-admin-env-token',
          token_type: 'bearer',
          expires_in: 86400,
          user: {
            id: 'sdsm-admin-master',
            email: cleanEmail,
            role: 'authenticated',
            user_metadata: { role: 'admin' },
            app_metadata: { provider: 'email' }
          }
        };
        setSession(adminSession);
        localStorage.setItem('sdsm_admin_session', JSON.stringify(adminSession));
        return { error: null };
      }

      if (error) {
        return { error: error.message };
      }
      return { error: 'Authentication failed. Please verify your credentials.' };
    } catch (err: any) {
      if (envEmail && envPass && cleanEmail === envEmail && cleanPass === envPass) {
        const adminSession: any = {
          access_token: 'sdsm-admin-env-token',
          token_type: 'bearer',
          expires_in: 86400,
          user: {
            id: 'sdsm-admin-master',
            email: cleanEmail,
            role: 'authenticated',
            user_metadata: { role: 'admin' },
            app_metadata: { provider: 'email' }
          }
        };
        setSession(adminSession);
        localStorage.setItem('sdsm_admin_session', JSON.stringify(adminSession));
        return { error: null };
      }
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
    localStorage.removeItem('sdsm_admin_session');
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
