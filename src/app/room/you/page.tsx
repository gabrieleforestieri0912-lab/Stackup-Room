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
  { id: 'profile', label: 'Profile' },
  { id: 'stats', label: 'Stats' },
  { id: 'startup', label: 'Startup' },
  { id: 'activity', label: 'Activity' },
  { id: 'contributions', label: 'Contributions' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function YouInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams?.get('tab');
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : 'home';

  const select = (id: TabId) => router.replace(`/room/you?tab=${id}`, { scroll: false });

  return (
    <div>
      {tab !== 'home' && (
        <>
          <p className="text-room text-xs font-semibold uppercase tracking-[0.12em] mb-2">You</p>
          <h1 className="text-2xl font-extrabold tracking-tight mb-4">Il tuo spazio.</h1>
        </>
      )}
      <div className="flex gap-2 mb-5 overflow-x-auto" role="tablist" aria-label="Sezioni You">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => select(t.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${tab === t.id ? 'bg-room text-[#0B0D12] shadow-lg shadow-room/20' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
            {t.label}
          </button>
        ))}
      </div>
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
