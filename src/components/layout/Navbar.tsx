/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Menu, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initials, avatarGradient } from '../../lib/avatar';


interface NavLink {
 name: string;
 path: string;
}

const Navbar = () => {
 const { user, logout, loading } = useAuth();
 const pathname = usePathname();
 const [scrolled, setScrolled] = useState(false);
 const [isOpen, setIsOpen] = useState(false);
 const [isProfileOpen, setIsProfileOpen] = useState(false);
 const [desktopAvatarError, setDesktopAvatarError] = useState(false);
 const [mobileAvatarError, setMobileAvatarError] = useState(false);

 useEffect(() => {
  setDesktopAvatarError(false);
  setMobileAvatarError(false);
 }, [user?.avatar]);

 useEffect(() => {
  const handleScroll = () => {
   setScrolled(window.scrollY > 20);
  };
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 useEffect(() => {
  setIsOpen(false);
  setIsProfileOpen(false);
 }, [pathname]);

  useEffect(() => {
   if (!isProfileOpen) return;
   const handleClick = () => setIsProfileOpen(false);
   window.addEventListener('click', handleClick);
   return () => window.removeEventListener('click', handleClick);
  }, [isProfileOpen]);

   useEffect(() => {
    if (isOpen) {
     document.body.style.overflow = 'hidden';
    } else {
     document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
   }, [isOpen]);

   useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
     if (e.key === 'Escape') {
      setIsOpen(false);
      setIsProfileOpen(false);
     }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen]);

   const links: NavLink[] = [
    { name: 'Corsi', path: '/courses' },
    { name: 'Percorsi', path: '/paths' },
    { name: 'Guide', path: '/guide' },
    ...(user ? [{ name: 'Room', path: '/room' }] : []),
    { name: 'Prezzi', path: '/#prezzi' },
   ];

  return (
    <div
     className={`
       fixed top-0 left-0 w-full z-[2000] pointer-events-none
       transition-all duration-500 ease-out
        ${scrolled || isOpen ? 'p-2' : 'p-0'}
     `}
    >
    <nav
     className={`
       pointer-events-auto
       flex items-center justify-between h-[72px]
        px-3
        transition-all duration-500 ease-out
      ${scrolled || isOpen
         ? 'py-1.5 mx-auto w-[95%] max-w-[1000px] bg-black/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
         : 'py-1.5 mx-auto w-full max-w-[1200px] bg-black/80'
       }
    `}
   >
    {/* Logo */}
    <Link href="/" className="flex items-center gap-2 sm:gap-3 group no-underline z-50">
     <div className="relative flex items-center justify-center">
      <Image
       src="/stackup.png"
        alt="StackUp Room Logo"
       width={40}
       height={40}
        priority
       className="relative w-7 h-7 sm:w-9 sm:h-9 object-contain drop-shadow-sm"
      />
     </div>
      <span className="font-extrabold text-base text-white tracking-tight">
        StackUp Room
      </span>
    </Link>

    {/* Navigation Links - Desktop */}
    <div className="hidden lg:flex items-center gap-1">
     {links.map((link) => {
      const isActive = pathname === link.path;
      return (
       <Link
        key={link.path}
        href={link.path}
          className={`
           relative px-3 py-1 text-sm font-medium transition-all duration-300
           ${isActive
             ? 'text-white'
             : 'text-white/70 hover:text-white'
           }
           hover:bg-[#111]
          `}
        >
         {isActive && (
          <motion.div
           layoutId="nav-bg"
            className="absolute inset-0 bg-[#111] z-[-1]"
          />
        )}
        {link.name}
        {link.path === '/room' && (
          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-orange-600 text-white rounded">
            Nuovo
          </span>
        )}
       </Link>
      );
     })}
    </div>

      {/* Action Button - Desktop */}
      <div className="hidden md:flex items-center gap-3">
        <Link
         href="/resources"
          className="px-4 py-1.5 rounded-md border border-zinc-700 hover:border-orange-500 text-white text-sm font-bold transition-all"
        >
         Risorse
        </Link>
       {user ? (
        <div className="relative">
         <button
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileOpen(!isProfileOpen);
           }}
           aria-label="Menu profilo"
           aria-haspopup="menu"
           aria-expanded={isProfileOpen}
           className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-orange-400/40 transition-all group"
        >
         {user.avatar && !desktopAvatarError ? (
          <Image
           src={user.avatar}
           alt={user.name}
           width={28}
           height={28}
           onError={() => setDesktopAvatarError(true)}
            className="w-7 h-7 border border-orange-400/30 shadow-sm object-cover rounded-full"
          />
          ) : (
           <div
            className="w-7 h-7 flex items-center justify-center text-white text-[11px] font-black shadow-lg rounded-full"
            style={{ background: avatarGradient(user.handle || user.name) }}
           >
            {initials(user.name)}
           </div>
          )}
          </button>

        <AnimatePresence>
         {isProfileOpen && (
           <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-52 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-xl z-[2100] overflow-hidden"
              role="menu"
           >
            <div className="px-3.5 py-2.5 border-b border-zinc-800">
             <p className="text-[12px] font-bold text-white">{user.name}</p>
             <p className="text-[11px] text-zinc-500 truncate mt-0.5">{user.email}</p>
            </div>

            <div className="p-1">
             <Link href="/room" role="menuitem" className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] font-semibold text-orange-300 hover:text-orange-200 hover:bg-zinc-800 transition-all rounded-lg">
              <BookOpen size={14} className="text-orange-400" />
              La Room
             </Link>
             {(user as { handle?: string | null }).handle && (
               <Link href={`/u/${(user as { handle?: string }).handle}`} role="menuitem" className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all rounded-lg">
                <UserIcon size={14} className="text-zinc-500" />
                Il mio profilo pubblico
               </Link>
             )}
             <Link href="/room/you?tab=profile" role="menuitem" className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all rounded-lg">
              <UserIcon size={14} className="text-zinc-500" />
              Profilo e impostazioni
             </Link>
             <Link href="/room" role="menuitem" className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all rounded-lg">
            <BookOpen size={14} className="text-zinc-500" />
            Dashboard
           </Link>
           </div>

           <div className="border-t border-zinc-800 p-1">
           <button
             onClick={logout}
             role="menuitem"
             className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all rounded-lg"
           >
            <LogOut size={14} />
            Esci
           </button>
           </div>
          </motion.div>
        )}
       </AnimatePresence>
      </div>
     ) : loading ? (
         <span className="w-20 h-8 rounded-md bg-zinc-800 animate-pulse" aria-hidden />
     ) : (
         <Link
          href="/login"
           className="px-4 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-all shadow-lg shadow-orange-600/20"
         >
          Accedi
         </Link>
     )}
    </div>

    {/* Mobile Actions */}
    <div className="flex lg:hidden items-center gap-2 z-50 pointer-events-auto">
     {user ? (
      <div className="flex items-center">
       {user.avatar && !mobileAvatarError ? (
        <Image
         src={user.avatar}
         alt={user.name}
         width={28}
         height={28}
         onError={() => setMobileAvatarError(true)}
         className="w-7 h-7 border border-orange-400/30 shadow-sm object-cover rounded-full"
        />
        ) : (
         <div
          className="w-7 h-7 flex items-center justify-center text-white text-[11px] font-black shadow-lg rounded-full"
          style={{ background: avatarGradient(user.handle || user.name) }}
         >
          {initials(user.name)}
         </div>
        )}
       </div>
     ) : loading ? (
      <span className="w-7 h-7 rounded-full bg-zinc-800 animate-pulse" aria-hidden />
     ) : (
      <Link
       href="/login"
       className="px-3 py-1 rounded-md bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-lg shadow-orange-600/20"
      >
       Accedi
      </Link>
     )}
      <button
       className="p-1.5 rounded-md text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
       onClick={() => setIsOpen(!isOpen)}
       aria-label={isOpen ? 'Chiudi menù' : 'Apri menù'}
       aria-expanded={isOpen}
       aria-controls="mobile-menu"
      >
       {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>

    {/* Mobile Menu Backdrop */}
    <AnimatePresence>
     {isOpen && (
      <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       transition={{ duration: 0.25 }}
       className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden"
       onClick={() => setIsOpen(false)}
      />
     )}
    </AnimatePresence>

    {/* Mobile Menu Panel */}
    <AnimatePresence>
     {isOpen && (
      <motion.div
       initial={{ opacity: 0, y: -20 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -20 }}
       transition={{ duration: 0.3 }}
       id="mobile-menu"
       role="dialog"
       aria-modal="true"
       aria-label="Menù di navigazione"
        className="absolute top-[110%] left-0 w-full bg-black/95 backdrop-blur-2xl shadow-2xl p-6 rounded-2xl flex flex-col gap-5 lg:hidden pointer-events-auto"
      >
       <motion.div
        initial="closed"
        animate="open"
        exit="closed"
        variants={{
         open: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
         closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
        }}
        className="flex flex-col gap-3"
       >
        {links.map((link) => (
         <motion.div
          key={link.path}
          variants={{
           open: { opacity: 1, x: 0 },
           closed: { opacity: 0, x: -20 },
          }}
         >
          <Link
           href={link.path}
           className={`text-sm font-bold ${pathname === link.path ? 'text-white' : 'text-white/70 hover:text-white'} transition-colors`}
          >
           {link.name}
         {link.path === '/room' && (
           <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-orange-600 text-white rounded">
             Nuovo
           </span>
         )}
          </Link>
         </motion.div>
        ))}
       </motion.div>

        <Link
          href="/resources"
          className="w-full py-2.5 rounded-md border border-zinc-700 text-center text-xs font-bold text-white hover:border-orange-500 transition-all"
         >
          Risorse
         </Link>
         {user && (
           <>
             <Link
               href="/room"
               className="w-full py-2.5 rounded-md bg-orange-600 text-center text-xs font-bold text-white hover:bg-orange-500 transition-all"
             >
               La Room
             </Link>
             <Link
               href="/room/you?tab=profile"
               className="w-full py-2.5 rounded-md border border-zinc-700 text-center text-xs font-bold text-white hover:border-orange-500 transition-all"
             >
               Profilo e impostazioni
             </Link>
             <button
               onClick={logout}
               className="w-full py-2.5 rounded-md border border-red-500/40 text-center text-xs font-bold text-red-400 transition-all"
             >
               Esci
             </button>
           </>
         )}
      </motion.div>
     )}
    </AnimatePresence>
   </nav>
  </div>
 );
};

export default Navbar;

