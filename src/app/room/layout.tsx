'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import RoomSidebar, { LINKS } from './RoomSidebar';
import Starfield from './Starfield';

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  // Riduci animazioni: scelta salvata in impostazioni, applicata all'intera Room
  useEffect(() => {
    try {
      if (localStorage.getItem('room.reduceMotion') === '1') {
        document.documentElement.classList.add('reduced-motion');
      }
    } catch { /* localStorage non disponibile */ }
  }, []);

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

      {/* Sidebar FISSA e sempre visibile su desktop (non apribibile/chiudibile) */}
      <aside
        aria-label="Navigazione Room"
        className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-room-bg border-r border-zinc-800 flex-col"
      >
        <div className="flex-1 min-h-0 p-3 overflow-y-auto">
          <Suspense>
            <RoomSidebar />
          </Suspense>
        </div>
      </aside>

      {/* Colonna contenuto: spazio fisso per la sidebar su desktop */}
      <div className="relative z-10 lg:pl-64">
        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 lg:py-8 pb-28 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Navigazione mobile: barra fissa in basso (la sidebar non si apre/chiude) */}
      <nav aria-label="Navigazione Room mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-room-bg border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {LINKS.map((n) => {
            const active = pathname === n.match || pathname.startsWith(`${n.match}/`);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${active ? 'text-room-bright' : 'text-zinc-500'}`}>
                <n.icon size={18} className={active ? 'text-room' : ''} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
