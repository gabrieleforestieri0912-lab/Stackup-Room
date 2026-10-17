'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { PanelLeftOpen, X } from 'lucide-react';
import RoomSidebar from './RoomSidebar';
import Starfield from './Starfield';

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
        {/* Bottone flottante per riaprire la sidebar quando chiusa */}
        {!open && (
          <button
            onClick={toggle}
            aria-label="Apri sidebar"
            title="Apri sidebar"
            className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-room-bg border border-zinc-800 text-zinc-400 hover:text-room hover:bg-room/10 transition-colors"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}

        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 lg:py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </div>
  );
}
