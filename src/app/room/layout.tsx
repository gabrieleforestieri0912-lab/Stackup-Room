import Link from 'next/link';
import RoomSidebar from './RoomSidebar';

const TOP_LINKS = [
  ['Planner', '/room/planner'],
  ['Startup', '/room/startups'],
  ['Community', '/room/community'],
  ['Coach', '/room/coach'],
  ['Tracker', '/room/tracker'],
  ['Classifiche', '/room/leaderboard'],
] as const;

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Barra mobile: scorciatoie + sito */}
      <header className="lg:hidden sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-zinc-800">
        <nav className="flex items-center gap-1 px-4 h-14 overflow-x-auto" aria-label="Room">
          <Link href="/room" className="px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Room</Link>
          {TOP_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">
              {label}
            </Link>
          ))}
          <Link href="/" className="ml-auto px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-orange-400 whitespace-nowrap">← Sito</Link>
        </nav>
      </header>

      <div className="px-4 lg:px-8 py-6 lg:py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] lg:flex lg:gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-6 h-[calc(100vh-3rem)] bg-zinc-950/60 border border-zinc-800/70 rounded-2xl p-3">
            <RoomSidebar />
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
