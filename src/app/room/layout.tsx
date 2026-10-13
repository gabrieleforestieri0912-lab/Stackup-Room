import Link from 'next/link';

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-zinc-800">
        <nav className="max-w-2xl mx-auto flex items-center gap-1 px-4 h-14 overflow-x-auto" aria-label="Room">
          <Link href="/room" className="px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Room</Link>
          <Link href="/room/planner" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Planner</Link>
          <Link href="/room/startups" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Startup</Link>
          <Link href="/room/corsi" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Corsi</Link>
          <Link href="/room/certificati" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Certificati</Link>
          <Link href="/room/community" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Community</Link>
          <Link href="/room/coach" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Coach</Link>
          <Link href="/room/notifiche" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Notifiche</Link>
          <Link href="/room/tracker" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Tracker</Link>
          <Link href="/room/leaderboard" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Classifiche</Link>
          <Link href="/room/verifiche" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Verifiche</Link>
          <Link href="/room/feedback" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Feedback</Link>
          <Link href="/room/settings" className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg whitespace-nowrap">Impostazioni</Link>
          <Link href="/" className="ml-auto px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-orange-400 whitespace-nowrap">← Sito</Link>
        </nav>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">{children}</main>
    </div>
  );
}
