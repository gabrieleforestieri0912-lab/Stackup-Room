'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

type Row = {
  rank: number; owner: string;
  mrr_cents?: number; currency?: string; verified?: boolean; name?: string;
  value?: number; todayDone?: boolean;
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [type, setType] = useState<'revenue' | 'streak'>('revenue');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await fetch(`/api/room/leaderboard?type=${type}&period=${period}`);
      if (r.ok) setRows(await r.json().then((d) => d.rows));
      setLoading(false);
    })();
  }, [type, period]);

  // Evidenzia la riga dell'utente (match su handle se non anonimo)
  const myHandle = (user as { handle?: string } | null)?.handle;
  const isMine = (o: string) => !!myHandle && o === `@${myHandle}`;

  const tab = (active: boolean) =>
    `px-4 py-2 text-xs font-bold rounded-xl transition-all ${active ? 'bg-orange-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`;

  return (
    <div>
      <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Classifiche</p>
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Chi shippa.</h1>

      <div className="flex gap-2 mb-3" role="tablist" aria-label="Tipo classifica">
        <button role="tab" aria-selected={type === 'revenue'} className={tab(type === 'revenue')} onClick={() => setType('revenue')}>Revenue</button>
        <button role="tab" aria-selected={type === 'streak'} className={tab(type === 'streak')} onClick={() => setType('streak')}>Streak</button>
      </div>
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Periodo">
        {(['week', 'month', 'all'] as const).map((p) => (
          <button key={p} role="tab" aria-selected={period === p} className={tab(period === p)} onClick={() => setPeriod(p)}>
            {p === 'week' ? 'Settimana' : p === 'month' ? 'Mese' : 'Sempre'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-orange-500" /></div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
          <p className="font-bold text-white">Nessun dato.</p>
          <p className="text-sm text-zinc-400 mt-1">
            {type === 'revenue' ? 'Attiva "Mostra revenue" in Impostazioni e collega Stripe.' : 'Shippa oggi dal Planner per entrare in classifica.'}
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r) => (
            <li key={`${r.rank}-${r.owner}-${type}`} className={`flex items-center gap-3 border rounded-2xl p-4 ${isMine(r.owner) ? 'border-orange-500/60 bg-orange-600/5' : 'border-zinc-800 bg-black'}`}>
              <span className="font-mono font-extrabold text-zinc-500 w-8">#{r.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white truncate">{r.owner} {isMine(r.owner) && <span className="text-orange-400">(tu)</span>}</p>
                {type === 'revenue' && <p className="text-xs text-zinc-500 truncate">{r.name}</p>}
              </div>
              {type === 'revenue' ? (
                <p className="text-sm font-extrabold text-white whitespace-nowrap">
                  €{((r.mrr_cents || 0) / 100).toLocaleString('it-IT')}
                  {r.verified ? <span className="ml-2 text-[11px] text-orange-300 bg-orange-600/20 px-2 py-0.5 rounded-lg">✓ verificato</span>
                    : <span className="ml-2 text-[11px] text-zinc-500">dichiarato</span>}
                </p>
              ) : (
                <p className="text-sm font-extrabold text-white whitespace-nowrap">
                  {r.value} {period === 'all' ? 'gg 🔥' : 'ship'}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
      <p className="text-[11px] text-zinc-600 mt-6">Solo dati verificati da fonti collegate hanno il badge ✓. Anonymous Mode e scelte di visibilità sempre rispettati.</p>
    </div>
  );
}
