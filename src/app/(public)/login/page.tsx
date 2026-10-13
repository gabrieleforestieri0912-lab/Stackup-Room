'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

 const Login: React.FC = () => {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPw, setShowPw] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [mode, setMode] = useState<'password' | 'otp'>('otp');
 const [otpSent, setOtpSent] = useState(false);
 const [code, setCode] = useState('');
 const [info, setInfo] = useState('');
 const { login, requestOtp, verifyOtp } = useAuth();
 const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      router.push(u?.onboardingCompleted === false ? '/onboarding' : '/room');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email o password errate.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      await requestOtp(email);
      setOtpSent(true);
      setInfo('Codice inviato. Controlla la tua email (scade tra 10 minuti).');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore invio codice.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      const u = await verifyOtp(email, code);
      router.push(u?.onboardingCompleted === false ? '/onboarding' : '/room');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Codice non valido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-6 bg-black relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-orange-500/5 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-orange-500/5 blur-[100px]" />
      </div>

      <Link
        href="/"
        className="absolute top-6 left-6 text-zinc-500 hover:text-orange-400 transition-colors text-xs font-bold font-mono uppercase tracking-widest"
      >
        Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4 rounded-xl">
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-jakarta font-extrabold text-zinc-100">Bentornato.</h1>
          <p className="text-sm text-zinc-400 mt-1 font-medium">Inserisci le tue credenziali.</p>
        </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="flex gap-2 mb-6" role="tablist" aria-label="Metodo di accesso">
            <button
              type="button" role="tab" aria-selected={mode === 'otp'}
              onClick={() => { setMode('otp'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === 'otp' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
            >
              Codice email
            </button>
            <button
              type="button" role="tab" aria-selected={mode === 'password'}
              onClick={() => { setMode('password'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === 'password' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
            >
              Password
            </button>
          </div>

          {info && (
            <div className="mb-5 p-3 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold rounded-xl" role="status">
              {info}
            </div>
          )}

          {mode === 'otp' ? (
            <form onSubmit={otpSent ? handleOtpVerify : handleOtpRequest} className="space-y-5">
              <div>
                <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-400 transition-colors" size={16} />
                  <input
                    type="email" required
                    className="w-full pl-11 pr-4 py-3.5 bg-black border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all font-medium text-zinc-100 text-sm rounded-xl"
                    placeholder="nome@esempio.it" value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              {otpSent && (
                <div>
                  <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">Codice a 6 cifre</label>
                  <input
                    type="text" inputMode="numeric" autoComplete="one-time-code" required
                    maxLength={6} pattern="\d{6}"
                    className="w-full px-4 py-3.5 bg-black border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all font-medium text-zinc-100 text-sm rounded-xl tracking-[0.5em] text-center"
                    placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
              )}
              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-orange-600 text-white font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={16} />}
                {loading ? 'Attendi...' : otpSent ? 'Verifica e accedi' : 'Invia codice'}
              </button>
              {otpSent && (
                <button type="button" onClick={() => { setOtpSent(false); setCode(''); }} className="w-full text-center text-[11px] text-zinc-500 hover:text-orange-400 font-bold">
                  Usa un&apos;altra email o reinvia
                </button>
              )}
            </form>
          ) : null}

          {mode === 'password' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-400 transition-colors" size={16} />
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-black border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all font-medium text-zinc-100 text-sm rounded-xl"
                  placeholder="nome@esempio.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">Password</label>
                <Link href="/forgot-password" className="text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors">
                  Password dimenticata?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-400 transition-colors" size={16} />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  className="w-full pl-11 pr-11 py-3.5 bg-black border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all font-medium text-zinc-100 text-sm rounded-xl"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-orange-600 text-white font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
          ) : null}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-black px-4 text-zinc-500 font-mono font-bold">Oppure</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })}
              className="w-full py-3.5 bg-zinc-900 border border-zinc-700/60 text-zinc-300 font-bold hover:bg-[#4285F4]/10 hover:border-[#4285F4]/30 hover:text-white transition-all flex items-center justify-center gap-3 text-sm rounded-xl"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continua con Google
            </button>

            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } })}
              className="w-full py-3.5 bg-zinc-900 border border-zinc-700/60 text-zinc-300 font-bold hover:bg-zinc-700/30 hover:border-zinc-500/30 hover:text-white transition-all flex items-center justify-center gap-3 text-sm rounded-xl"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Continua con GitHub
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-500 font-medium">
            Non hai un account?{' '}
            <Link href="/register" className="text-orange-400 hover:text-orange-300 font-bold transition-colors">Registrati</Link>
          </p>
      </motion.div>
    </main>
  );
};

export default Login;

