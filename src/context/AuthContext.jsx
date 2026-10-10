import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (activeSession) => {
    if (!activeSession) {
      setProfile(null);
      setComplete(false);
      return;
    }
    try {
      const { profile: p, complete: c } = await api.getMe();
      setProfile(p);
      setComplete(c);
    } catch {
      setProfile(null);
      setComplete(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      await loadProfile(newSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInWithGoogle = useCallback(async (redirectPath = '/') => {
    const redirectTo = `${window.location.origin}${redirectPath}`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setComplete(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadProfile(data.session);
  }, [loadProfile]);

  const value = {
    session,
    user: session?.user || null,
    profile,
    complete,
    isAuthenticated: Boolean(session),
    isAdmin: profile?.role === 'admin',
    loading,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
