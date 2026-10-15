import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAccessToken } from '../lib/auth-token';
import { useRouter } from 'next/router';
import SEO from '../components/ui/SEO';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
 Layout,
 Trophy,
 Settings,
 LogOut,
 User,
 Mail,
 Lock,
 Save,
 ArrowLeft,
 Eye,
 EyeOff,
 Github,
 Shield,
} from 'lucide-react';

interface User {
 _id?: string;
 name: string;
 email: string;
 authMethod?: string;
 createdAt?: string;
 enrolledCourses?: any[];
 studyHours?: number;
 [key: string]: any;
}

interface AuthContextType {
 user: User | null;
 logout: () => void;
 refreshUser: () => Promise<void>;
 loading: boolean;
}

const SettingsPage: React.FC = () => {
 const { user, logout, refreshUser, loading: authLoading } = useAuth() as AuthContextType;
 const router = useRouter();
 const [name, setName] = useState<string>('');
 const [email, setEmail] = useState<string>('');
 const [currentPassword, setCurrentPassword] = useState<string>('');
 const [newPassword, setNewPassword] = useState<string>('');
 const [showCurrent, setShowCurrent] = useState<boolean>(false);
 const [showNew, setShowNew] = useState<boolean>(false);
 const [savingProfile, setSavingProfile] = useState<boolean>(false);
 const [savingPassword, setSavingPassword] = useState<boolean>(false);

 useEffect(() => {
 if (!authLoading && !user) {
 router.push('/login?redirect=/settings');
 }
 }, [user, authLoading, router]);

 useEffect(() => {
 if (user) {
 setName(user.name || '');
 setEmail(user.email || '');
 }
 }, [user]);

 const handleUpdateProfile = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
 e.preventDefault();
 setSavingProfile(true);
 try {
 const token = await getAccessToken();
 const res = await fetch('/api/auth/update-profile', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({ name, email }),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.message);
 await refreshUser();
 toast.success(data.message || 'Profilo aggiornato');
 } catch (err: any) {
 toast.error(err.message);
 } finally {
 setSavingProfile(false);
 }
 };

 const handleChangePassword = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
 e.preventDefault();
 setSavingPassword(true);
 try {
 const token = await getAccessToken();
 const res = await fetch('/api/auth/change-password', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({ currentPassword, newPassword }),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.message);
 toast.success(data.message || 'Password aggiornata');
 setCurrentPassword('');
 setNewPassword('');
 } catch (err: any) {
 toast.error(err.message);
 } finally {
 setSavingPassword(false);
 }
 };

  if (authLoading || !user) {
  return (
  <>
  <SEO title="Impostazioni" description="Gestisci le tue impostazioni su StackUp." />
  <div className="min-h-screen bg-black flex">
  <aside className="hidden lg:flex w-72 bg-zinc-900/30 border-r border-zinc-800 flex-col sticky top-0 h-screen pt-20">
  <div className="px-6 py-8 space-y-6">
  <div className="flex items-center gap-4">
  <div className="w-12 h-12 skeleton rounded-full" />
  <div className="space-y-2 flex-1">
  <div className="h-4 w-24 skeleton rounded-md" />
  <div className="h-3 w-32 skeleton rounded-md" />
  </div>
  </div>
  <div className="space-y-2">
  {[1,2,3].map(i => <div key={i} className="h-11 w-full skeleton rounded-xl" />)}
  </div>
  </div>
  </aside>
  <main className="flex-1 pt-24 pb-20 px-6 sm:px-10 lg:px-16">
  <div className="max-w-3xl mx-auto space-y-8">
  <div className="h-10 w-48 skeleton rounded-lg" />
  <div className="h-64 w-full skeleton rounded-2xl" />
  </div>
  </main>
  </div>
  </>
  );
  }

 const isLocal = user.authMethod === 'local';
 const isOAuth = user.authMethod === 'google' || user.authMethod === 'github';

  return (
  <div className="min-h-screen bg-black flex">
  <SEO title="Impostazioni" description="Gestisci le tue impostazioni su StackUp." />

  <aside className="hidden lg:flex w-72 bg-zinc-900/30 border-r border-zinc-800 flex-col sticky top-0 h-screen pt-20">
  <div className="px-6 py-8">
  <div className="flex items-center gap-3 mb-8">
  <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/20">
  {user.name.charAt(0)}
  </div>
  <div>
  <h2 className="font-jakarta font-bold text-zinc-100 text-sm leading-tight">{user.name}</h2>
  <p className="text-xs text-zinc-500 font-medium truncate max-w-[140px]">{user.email}</p>
  </div>
  </div>

  <nav className="space-y-1">
   <Link href="/room" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-white font-semibold text-sm transition-all">
  <Layout size={17} />
  <span>I miei corsi</span>
  </Link>
   <Link href="/room/you?tab=profile" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-white font-semibold text-sm transition-all">
  <Trophy size={17} />
  <span>Profilo e certificati</span>
  </Link>
   <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-orange-500/10 text-orange-400 font-semibold text-sm transition-all">
  <Settings size={17} />
  <span>Impostazioni</span>
  </Link>
  </nav>
  </div>

  <div className="mt-auto px-6 py-8 border-t border-zinc-800">
  <button
  onClick={logout}
   className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 font-semibold text-sm transition-all w-full"
  >
  <LogOut size={17} />
  <span>Esci</span>
  </button>
  </div>
  </aside>

  <main className="flex-1 pt-24 pb-20 px-6 sm:px-10 lg:px-16 overflow-y-auto">
  <div className="max-w-3xl mx-auto">
  <div className="mb-8">
  <Link href="/room" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
  <ArrowLeft size={15} />
  <span>Torna alla dashboard</span>
  </Link>
  <h1 className="text-2xl sm:text-3xl font-jakarta font-black text-white tracking-tight">Impostazioni</h1>
  <p className="text-zinc-500 font-medium mt-1">Gestisci il tuo profilo e le tue preferenze.</p>
  </div>

  <div className="space-y-6">
  <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 sm:p-8">
  <div className="flex items-center gap-4 mb-8">
  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-500/20">
  {user.name.charAt(0)}
  </div>
  <div>
  <h2 className="text-xl font-jakarta font-bold text-white">{user.name}</h2>
  <p className="text-sm text-zinc-500">
  {isLocal && 'Account con email e password'}
  {user.authMethod === 'google' && 'Account collegato a Google'}
  {user.authMethod === 'github' && 'Account collegato a GitHub'}
  </p>
  </div>
  </div>

  <form onSubmit={handleUpdateProfile} className="space-y-5">
  <div>
  <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500 mb-1.5">Nome Completo</label>
  <div className="relative">
  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
  <input
  type="text"
  required
  className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all font-medium text-zinc-100 text-sm rounded-xl"
  value={name}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
  />
  </div>
  </div>

  <div>
  <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500 mb-1.5">Email</label>
  <div className="relative">
  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
  <input
  type="email"
  required
  className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all font-medium text-zinc-100 text-sm rounded-xl"
  value={email}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
  />
  </div>
  </div>

  <button
  type="submit"
  disabled={savingProfile}
  className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 rounded-xl"
  >
  <Save size={15} />
  <span>{savingProfile ? 'Salvataggio...' : 'Salva modifiche'}</span>
  </button>
  </form>
  </div>

  {isLocal && (
  <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 sm:p-8">
  <div className="flex items-center gap-3 mb-8">
  <Lock size={19} className="text-zinc-400" />
  <h2 className="text-xl font-jakarta font-bold text-white">Cambia Password</h2>
  </div>

  <form onSubmit={handleChangePassword} className="space-y-5">
  <div>
  <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500 mb-1.5">Password Attuale</label>
  <div className="relative">
  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
  <input
  type={showCurrent ? 'text' : 'password'}
  required
  className="w-full pl-11 pr-12 py-3 bg-zinc-900/60 border border-zinc-800 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all font-medium text-zinc-100 text-sm rounded-xl"
  placeholder="••••••••"
  value={currentPassword}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
  />
  <button
  type="button"
  onClick={() => setShowCurrent(!showCurrent)}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
  >
  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
  </button>
  </div>
  </div>

  <div>
  <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500 mb-1.5">Nuova Password</label>
  <div className="relative">
  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
  <input
  type={showNew ? 'text' : 'password'}
  required
  minLength={6}
  className="w-full pl-11 pr-12 py-3 bg-zinc-900/60 border border-zinc-800 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all font-medium text-zinc-100 text-sm rounded-xl"
  placeholder="•••••••• (min. 6 caratteri)"
  value={newPassword}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
  />
  <button
  type="button"
  onClick={() => setShowNew(!showNew)}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
  >
  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
  </button>
  </div>
  </div>

  <button
  type="submit"
  disabled={savingPassword}
  className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 rounded-xl"
  >
  <Save size={15} />
  <span>{savingPassword ? 'Salvataggio...' : 'Aggiorna password'}</span>
  </button>
  </form>
  </div>
  )}

  <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 sm:p-8">
  <div className="flex items-center gap-3 mb-8">
  <Shield size={19} className="text-zinc-400" />
  <h2 className="text-xl font-jakarta font-bold text-white">Informazioni Account</h2>
  </div>

  <div className="space-y-3">
  <div className="flex items-center justify-between py-3 px-4 bg-zinc-900/40 rounded-xl">
  <span className="text-sm font-medium text-zinc-500">Metodo di accesso</span>
  <span className="text-sm font-semibold text-zinc-100 capitalize">
  {user.authMethod === 'local' && 'Email e Password'}
  {user.authMethod === 'google' && 'Google'}
  {user.authMethod === 'github' && 'GitHub'}
  </span>
  </div>
  <div className="flex items-center justify-between py-3 px-4 bg-zinc-900/40 rounded-xl">
  <span className="text-sm font-medium text-zinc-500">Membro dal</span>
  <span className="text-sm font-semibold text-zinc-100">
  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
  </span>
  </div>
  <div className="flex items-center justify-between py-3 px-4 bg-zinc-900/40 rounded-xl">
  <span className="text-sm font-medium text-zinc-500">Corsi acquistati</span>
  <span className="text-sm font-semibold text-zinc-100">{user.enrolledCourses?.length || 0}</span>
  </div>
  <div className="flex items-center justify-between py-3 px-4 bg-zinc-900/40 rounded-xl">
  <span className="text-sm font-medium text-zinc-500">Ore di studio</span>
  <span className="text-sm font-semibold text-zinc-100">{user.studyHours || 0}</span>
  </div>
  </div>
  </div>
 </div>
 </div>
 </main>
 </div>
 );
};

export default SettingsPage;

