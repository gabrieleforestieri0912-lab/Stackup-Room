'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RoomLoader } from '../ui';
import YouDashboard from './YouDashboard';
import ProfileTab from './ProfileTab';
import StatsTab from './StatsTab';
import StartupTab from './StartupTab';
import ActivityTab from './ActivityTab';
import ContributionsTab from './ContributionsTab';

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'profile', label: 'Profilo' },
  { id: 'stats', label: 'Statistiche' },
  { id: 'startup', label: 'Startup' },
  { id: 'activity', label: 'Attività' },
  { id: 'contributions', label: 'Contribuzioni' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function YouInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams?.get('tab');
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : 'home';

  return (
    <div>
      {/* Niente tab in alto: si entra dalle card del dashboard, qui c'è solo il ritorno */}
      {tab !== 'home' && (
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.replace('/room/you', { scroll: false })}
            aria-label="Torna alla panoramica" title="Torna alla panoramica"
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:border-room hover:text-white transition-all">
            ←
          </button>
          <p className="text-sm font-bold text-zinc-400">{TABS.find((t) => t.id === tab)?.label}</p>
        </div>
      )}
      <Suspense fallback={<RoomLoader />}>
        {tab === 'home' && <YouDashboard />}
        {tab === 'profile' && <ProfileTab />}
        {tab === 'stats' && <StatsTab />}
        {tab === 'startup' && <StartupTab />}
        {tab === 'activity' && <ActivityTab />}
        {tab === 'contributions' && <ContributionsTab />}
      </Suspense>
    </div>
  );
}

export default function YouPage() {
  return (
    <Suspense fallback={<RoomLoader />}>
      <YouInner />
    </Suspense>
  );
}
