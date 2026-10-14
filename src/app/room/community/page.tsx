'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatTab from './ChatTab';
import ForumTab from './ForumTab';
import NetworkTab from './NetworkTab';
import EventsTab from './EventsTab';

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'forum', label: 'Rooms' },
  { id: 'network', label: 'Network' },
  { id: 'eventi', label: 'Eventi' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function CommunityInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams?.get('tab');
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : 'chat';

  const select = (id: TabId) => router.replace(`/room/community?tab=${id}`, { scroll: false });

  return (
    <div>
      <p className="text-room-bright text-xs font-semibold uppercase tracking-[0.12em] mb-2">La Room</p>
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Community.</h1>
      <div className="flex gap-2 mb-5 overflow-x-auto" role="tablist" aria-label="Sezioni community">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => select(t.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${tab === t.id ? 'bg-room text-[#0B0D12] shadow-lg shadow-room/20' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'chat' && <ChatTab />}
      {tab === 'forum' && <ForumTab />}
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
