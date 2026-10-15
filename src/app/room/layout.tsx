'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import RoomSidebar from './RoomSidebar';
import Starfield from './Starfield';

const TOP_LINKS = [
  ['Today', '/room/planner'],
  ['Chat', '/room/community?tab=chat'],
  ['Ranks', '/room/community?tab=ranks'],
  ['Coach', '/room/coach'],
  ['You', '/room/you'],
] as const;

const STORAGE_KEY = 'room-sidebar-open';

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) return saved === '1';
      }
    } catch { /* ignore */ }
    return true;
  });

  const toggle = () => {
    setOpen((v) => {
      try { localStorage.setItem(STORAGE_KEY, v ? '0' : '1'); } catch { /* ignore */ }
      return !v;
    });
  };
  const close = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, '0'); } catch { /* ignore */ }
  };

  return (
    <div className="room-scope min-h-screen bg-[#05070b] text-zinc-100">
      {/* Cielo notturno stellato dietro tutti i contenuti Room */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: '#05070b' }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 500px at 15% -5%, rgba(77,224,201,0.08), transparent 60%), radial-gradient(1000px 600px at 85% 110%, rgba(79,70,229,0.10), transparent 60%), radial-gradient(600px 400px at 80% 0%, rgba(255,138,61,0.05), transparent 60%)',
          }}
        />
        <Starfield />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 90% at 50% 50%, transparent 60%, rgba(0,0,0,0.5) 100%)' }}
        />
      </div>

      {/* Overlay mobile quando aperta */}
      {open && (
        <button
          aria-label="Chiudi menu"
          onClick={close}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar FISSA: ancorata a sinistra, altezza piena, non fluttuante */}
      <aside
        aria-label="Navigazione Room"
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-room-bg border-r border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-3 pt-3">
          <Link href="/room" className="px-2 text-sm font-black tracking-tight text-white">
            STACKUP <span className="text-room">ROOM</span>
          </Link>
          <button
            onClick={close}
            aria-label="Chiudi sidebar"
            title="Chiudi sidebar"
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-room/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 min-h-0 p-3">
          <Suspense>
            <RoomSidebar />
          </Suspense>
        </div>
      </aside>

      {/* Colonna contenuto: lascia spazio alla sidebar fissa su desktop */}
      <div className={`relative z-10 transition-[padding] duration-300 ease-in-out ${open ? 'lg:pl-64' : 'lg:pl-0'}`}>
        {/* Barra mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-room-bg/90 backdrop-blur border-b border-zinc-800">
          <nav className="flex items-center gap-1 px-4 h-14 overflow-x-auto" aria-label="Room">
            <button
              onClick={toggle}
              aria-label={open ? 'Chiudi menu' : 'Apri menu'}
              className="p-2 -ml-2 rounded-lg text-zinc-300 hover:text-white hover:bg-room/10 shrink-0"
            >
              <Menu size={20} />
            </button>
            <Link href="/room" className="px-3 py-1.5 text-xs font-bold text-white hover:bg-room/10 rounded-lg whitespace-nowrap">Room</Link>
            {TOP_LINKS.map(([label, href]) => (
              <Link key={href} href={href} className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-room/10 rounded-lg whitespace-nowrap">
                {label}
              </Link>
            ))}
            <Link href="/" className="ml-auto px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-room whitespace-nowrap">← Sito</Link>
          </nav>
        </header>

        {/* Barra desktop con pulsante apri/chiudi (sempre visibile) */}
        <header className="hidden lg:flex sticky top-0 z-30 items-center gap-2 h-14 px-6 bg-room-bg/80 backdrop-blur border-b border-zinc-800/70">
          <button
            onClick={toggle}
            aria-label={open ? 'Chiudi sidebar' : 'Apri sidebar'}
            title={open ? 'Chiudi sidebar' : 'Apri sidebar'}
            className="p-2 -ml-2 rounded-lg text-zinc-400 hover:text-room hover:bg-room/10 transition-colors"
          >
            {open ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {open ? 'Nascondi menu' : 'Mostra menu'}
          </span>
        </header>

        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 lg:py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </div>
  );
}
