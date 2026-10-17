'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatTab from './ChatTab';
import ForumTab from './ForumTab';
import RanksTab from './RanksTab';
import NetworkTab from './NetworkTab';
import EventsTab from './EventsTab';
import { MessageCircle, Headphones, Trophy, Globe, CalendarDays } from 'lucide-react';

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'forum', label: 'Rooms', icon: Headphones },
  { id: 'ranks', label: 'Ranks', icon: Trophy },
  { id: 'network', label: 'Network', icon: Globe },
  { id: 'eventi', label: 'Events', icon: CalendarDays },
] as const;

type TabId = (typeof TABS)[number]['id'];

function CommunityInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams?.get('tab');
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : 'chat';
  const sub = searchParams?.get('sub') === 'forum' ? 'forum' : 'live';
  const [presence, setPresence] = useState<{ online: number; typing: number }>({ online: 0, typing: 0 });

  const select = (id: TabId) => router.replace(`/room/community?tab=${id}`, { scroll: false });
  const selectSub = (s: 'live' | 'forum') => router.replace(`/room/community?tab=chat&sub=${s}`, { scroll: false });

  const shown = tab === 'chat' ? presence : { online: 0, typing: 0 };

  return (
    <div>
      {/* Header "THE CLUB" + presenza */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-extrabold tracking-[0.16em] text-white">THE CLUB</h1>
        <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-zinc-900 border border-zinc-700 text-zinc-400 flex items-center gap-1.5">
          <MessageCircle size={11} className="text-room" /> Community
        </span>
        <span className="ml-auto flex items-center gap-2 text-[13px] text-zinc-400" role="status">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
          {shown.online > 0 ? `${shown.online} online` : 'community'}{shown.typing > 0 ? ' · qualcuno scrive…' : ''}
        </span>
      </div>

      {/* Nav principale */}
      <div className="border-b border-zinc-900 mb-5" role="tablist" aria-label="Sezioni Club">
        <div className="flex justify-between max-w-3xl mx-auto">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} role="tab" aria-selected={active} onClick={() => select(t.id)}
                className={`flex flex-col items-center gap-1.5 px-5 pt-2 pb-3 min-w-[80px] transition-colors ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <t.icon size={20} className={active ? 'text-room' : ''} />
                <span className="text-[13px] font-bold">{t.label}</span>
                <span className={`h-0.5 w-full rounded-full transition-all ${active ? 'bg-room' : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sotto-sezioni per Chat: Live Chat | Forum */}
      {tab === 'chat' && (
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl mb-5" role="tablist" aria-label="Tipo chat">
          {(['live', 'forum'] as const).map((s) => (
            <button key={s} role="tab" aria-selected={sub === s} onClick={() => selectSub(s)}
              className={`py-3 text-sm font-bold rounded-xl transition-all ${sub === s ? 'bg-zinc-900 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>
              {s === 'live' ? 'Live Chat' : 'Forum'}
            </button>
          ))}
        </div>
      )}

      {tab === 'chat' && (sub === 'live' ? <ChatTab onPresence={setPresence} /> : <ForumTab />)}
      {tab === 'forum' && <ForumTab />}
      {tab === 'ranks' && <RanksTab />}
      {tab === 'network' && <NetworkTab />}
      {tab === 'eventi' && <EventsTab />}
      <p className="text-[11px] text-zinc-600 mt-6">La chat conserva gli ultimi 7 giorni. Segnala contenuti scorretti, blocca membri molesti: la moderazione revisiona entro 24h.</p>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityInner />
    </Suspense>
  );
}
