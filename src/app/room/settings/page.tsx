'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/auth-token';
import ProfileTab from '../you/ProfileTab';
import { ExternalLink, Loader2 } from 'lucide-react';

// Impostazioni Room: profilo, privacy, consenso AI, certificati, export e cancellazione.
export default function RoomSettingsPage() {
  const { user, loading } = useAuth();
  const [handle, setHandle] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) { setReady(true); return; }
      const p = await fetch('/api/room/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => ({}));
      setHandle((p.profile?.handle as string) || null);
      setReady(true);
    })();
  }, []);

  if (loading || !ready) {
    return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;
  }
  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-zinc-400 mb-3">Accedi per gestire le impostazioni.</p>
        <Link href="/login" className="px-4 py-2.5 bg-room text-[#0B0D12] text-sm font-bold rounded-xl">Accedi</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex-1">Impostazioni</h1>
        {handle && (
          <Link href={`/u/${handle}`} target="_blank" rel="noreferrer"
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 hover:border-room transition-all flex items-center gap-1.5">
            <ExternalLink size={13} /> Profilo pubblico
          </Link>
        )}
      </div>
      <p className="text-sm text-zinc-400 mb-6">Profilo, account, privacy, consenso AI, certificati e dati.</p>
      <ProfileTab />
    </div>
  );
}
