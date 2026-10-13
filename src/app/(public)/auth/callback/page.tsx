'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { AuthContextType } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';

const AuthCallbackPage: React.FC = () => {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { completeOAuthLogin } = useAuth() as AuthContextType;
 const [error, setError] = useState<string | null>(null);

  useEffect(() => {
   let cancelled = false;
   const handleCallback = async () => {
    if (!searchParams) return;
    const type = searchParams.get('type');

   if (type === 'recovery') {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
     router.push('/settings?resetPassword=true');
    } else {
     setError('Link di reset non valido o scaduto');
     setTimeout(() => router.push('/login'), 3000);
    }
    return;
   }

   const { data: { session }, error: sessionError } = await supabase.auth.getSession();

   if (sessionError || !session) {
    setError('Sessione non valida');
    setTimeout(() => router.push('/login?error=NoSession'), 3000);
    return;
   }

   const { user: authUser } = session;
   const provider = authUser.app_metadata?.provider || 'google';
   const userMeta = authUser.user_metadata || {};
   const name = userMeta.full_name || userMeta.name || authUser.email?.split('@')[0] || 'Utente';
   const avatar = userMeta.avatar_url || userMeta.picture || null;

    try {
     const accessToken = session.access_token;
     const response = await fetch('/api/auth/supabase-callback', {
      method: 'POST',
      headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
       supabaseId: authUser.id,
       email: authUser.email,
       name,
       avatar,
       provider,
      }),
     });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Errore autenticazione');

    if (cancelled) return;
    completeOAuthLogin(data.user, data.token);
    router.push(data.user?.onboardingCompleted === false ? '/onboarding' : '/room');
   } catch (err) {
    console.error('Auth callback error:', err);
    setError((err as Error).message);
    setTimeout(() => router.push('/login?error=AuthFailed'), 3000);
   }
  };

   handleCallback();
   return () => { cancelled = true; };
  }, [completeOAuthLogin, router, searchParams]);

 if (error) {
  return (
   <div className="min-h-screen flex flex-col items-center justify-center bg-black">
    <motion.div
     initial={{ opacity: 0, scale: 0.9 }}
     animate={{ opacity: 1, scale: 1 }}
     className="text-center"
    >
     <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
     <h1 className="text-2xl font-jakarta font-bold text-zinc-100">Accesso non riuscito</h1>
     <p className="text-zinc-400 mt-2">Reindirizzamento al login...</p>
    </motion.div>
   </div>
  );
 }

 return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-black">
   <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center"
   >
    <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
    <h1 className="text-2xl font-jakarta font-bold text-zinc-100">Autenticazione in corso...</h1>
    <p className="text-zinc-400 mt-2">Stiamo completando il tuo accesso.</p>
   </motion.div>
  </div>
 );
};

const AuthCallback: React.FC = () => (
  <Suspense fallback={
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <div className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4">
        <Loader2 className="w-full h-full" />
      </div>
      <p className="text-zinc-400 mt-2">Autenticazione in corso...</p>
    </div>
  }>
    <AuthCallbackPage />
  </Suspense>
);

export default AuthCallback;

