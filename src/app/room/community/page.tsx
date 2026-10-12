'use client';

import { useState } from 'react';
import ChatTab from './ChatTab';
import ForumTab from './ForumTab';
import NetworkTab from './NetworkTab';
import EventsTab from './EventsTab';

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'forum', label: 'Forum' },
  { id: 'network', label: 'Network' },
  { id: 'eventi', label: 'Eventi' },
] as const;

export default function CommunityPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('chat');
  return (
    <div>
      <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">La Room</p>
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Community.</h1>
      <div className="flex gap-2 mb-5 overflow-x-auto" role="tablist" aria-label="Sezioni community">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${tab === t.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
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
