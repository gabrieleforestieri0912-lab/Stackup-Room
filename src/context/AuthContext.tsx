'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';


export interface User {
 _id: string;
 id: string;
 name: string;
 email: string;
 avatar?: string;
 handle?: string | null;
 onboardingCompleted?: boolean;
 authMethod: 'local' | 'google' | 'github' | 'otp';
 createdAt: string;
 enrolledCourses: string[];
 certificates: { courseId: string; completedAt: string; certificateId: string }[];
  studyStreak: number;
  studyHours: number;
  exp: number;
}

export interface AuthContextType {
 user: User | null;
 loading: boolean;
 login: (email: string, password: string) => Promise<User>;
 register: (name: string, email: string, password: string) => Promise<User>;
 requestOtp: (email: string) => Promise<void>;
 verifyOtp: (email: string, code: string) => Promise<User>;
 logout: () => void;
 completeOAuthLogin: (userData: User, token: string) => void;
 completeGoogleLogin: (userData: User, token: string) => void;
 refreshUser: () => Promise<void>;
}

const TOKEN_KEY = 'token';

/** Persiste (o rimuove) il token di sessione in localStorage. */
function persistToken(token?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // localStorage non disponibile: ignora
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);

 const fetchUser = async (token: string) => {
  try {
   const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
   });
   const data = await res.json();
   if (res.ok && data.user) {
    setUser(data.user);
   }
  } catch {
   console.error('Failed to fetch user');
  }
 };

 useEffect(() => {
  const init = async () => {
   const { data: { session } } = await supabase.auth.getSession();
   if (session?.access_token) {
    persistToken(session.access_token);
    const su = session.user;
    if (su) {
     setUser({ _id: su.id, id: su.id, name: (su.user_metadata?.name || su.user_metadata?.full_name || su.email || 'Utente') as string, email: su.email || '', avatar: (su.user_metadata?.avatar_url || su.user_metadata?.picture) as string | undefined, authMethod: 'otp', createdAt: su.created_at || new Date().toISOString(), enrolledCourses: [], certificates: [], studyStreak: 0, studyHours: 0, exp: 0 });
    }
    await fetchUser(session.access_token);
   } else {
    persistToken();
   }
   setLoading(false);
  };

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
   if (event === 'SIGNED_IN' && session?.access_token) {
    persistToken(session.access_token);
    await fetchUser(session.access_token);
   } else if (event === 'SIGNED_OUT') {
    persistToken();
    setUser(null);
   }
  });

  init();
  return () => subscription.unsubscribe();
 }, []);
  /** Stabilisce la sessione Supabase nel browser e persiste il token. */
 const establishSession = useCallback(async (accessToken: string, refreshToken?: string) => {
  persistToken(accessToken);
  if (refreshToken) {
   try {
    await supabase.auth.setSession({
     access_token: accessToken,
     refresh_token: refreshToken,
    });
   } catch (err) {
    console.error('setSession failed (token comunque persistito):', err);
   }
  }
 }, []);

 const login = useCallback(async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login fallito');

  if (data.token) {
   await establishSession(data.token, data.refreshToken);
  }
  setUser(data.user);
  toast.success(`Bentornato, ${data.user.name}!`);
  return data.user as User;
 }, [establishSession]);

 const register = useCallback(async (name: string, email: string, password: string) => {
  const response = await fetch('/api/auth/register', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Errore durante la registrazione');

  if (data.token) {
   await establishSession(data.token, data.refreshToken);
  }
  setUser(data.user);
  toast.success(`Account creato! Benvenuto ${name}`);
  return data.user as User;
 }, [establishSession]);

  const completeOAuthLogin = useCallback(async (userData: User, _token: string) => {
  // Dopo il redirect OAuth la sessione è già nel client Supabase
  try {
   const { data: { session } } = await supabase.auth.getSession();
   persistToken(session?.access_token);
  } catch {
   // ignora: il token verrà ripristinato dal primo evento SIGNED_IN
  }
  setUser(userData);
  toast.success(`Bentornato, ${userData.name}!`);
 }, []);

 const refreshUser = useCallback(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return;
  await fetchUser(session.access_token);
 }, []);

 const requestOtp = useCallback(async (email: string) => {
  const res = await fetch('/api/auth/otp/request', {
   method: 'POST', headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Errore invio codice');
 }, []);

 const verifyOtp = useCallback(async (email: string, code: string) => {
  const res = await fetch('/api/auth/otp/verify', {
   method: 'POST', headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ email, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Codice non valido');
  if (data.emailOtpToken) {
   const { error } = await supabase.auth.verifyOtp({ email, token: data.emailOtpToken, type: 'email' });
   if (error) throw new Error(error.message);
   const { data: { session } } = await supabase.auth.getSession();
   if (session?.access_token) persistToken(session.access_token);
  } else if (data.actionLink) {
   window.location.href = data.actionLink;
   throw new Error('Completa il login dal link inviato via email.');
  }
  if (data.user) setUser(data.user as User);
  else await refreshUser();
  toast.success('Accesso effettuato');
  return data.user as User;
 }, [refreshUser]);

 const logout = useCallback(async () => {
  setUser(null);
  persistToken();
  await supabase.auth.signOut();
  toast.success('Sessione chiusa');
  window.location.href = '/login';
 }, []);

  return (
   <AuthContext.Provider value={{ user, login, register, logout, completeOAuthLogin, completeGoogleLogin: completeOAuthLogin, refreshUser, requestOtp, verifyOtp, loading }}>
    {children}
   </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
 const context = useContext(AuthContext);
 if (!context) throw new Error('useAuth must be used within an AuthProvider');
 return context;
};
