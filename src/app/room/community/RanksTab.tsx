'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

type Row = {
  rank: number; owner: string; user_id?: string;
  mrr_cents?: number; total_cents?: number; currency?: string; verified?: boolean;
  startups?: string[]; name?: string;
};

export default function RanksTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await fetch(`/api/room/leaderboard?type=revenue&period=all`);
      if (r.ok) setRows(await r.json().then((d) => d.rows));
      setLoading(false);
    })();
  }, []);

  // Evidenzia la riga dell'utente (match su handle se non anonimo)
  const myHandle = (user as { handle?: string } | null)?.handle;
  const isMine = (o: string) => !!myHandle && o === `@${myHandle}`;

  const amount = (r: Row) => r.total_cents ?? r.mrr_cents ?? 0;

  return (
    <div className="w-full">
      <h2 className="text-lg font-extrabold tracking-tight">Chi ha guadagnato di più.</h2>
      <p className="text-sm text-zinc-400 mt-1 mb-6">
        Classifica dei fondatori per guadagno totale — somma di tutte le loro startup.
      </p>

      {loading ? (
        <div className="flex justify-center py-16" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
          <p className="font-bold text-white">Nessun dato.</p>
          <p className="text-sm text-zinc-400 mt-1">
            Attiva &quot;Mostra revenue&quot; nel profilo e collega Stripe.
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r) => (
            <li key={`${r.rank}-${r.owner}`} className={`flex items-center gap-3 border rounded-2xl p-4 ${isMine(r.owner) ? 'border-room/60 bg-room/5' : 'border-zinc-800 bg-black'}`}>
              <span className="font-mono font-extrabold text-zinc-500 w-8">#{r.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white truncate">{r.owner} {isMine(r.owner) && <span className="text-room">(tu)</span>}</p>
                <p className="text-xs text-zinc-500 truncate">
                  {(r.startups && r.startups.length > 0 ? r.startups.join(' · ') : r.name) || ''}
                  {r.startups && r.startups.length > 1 ? ` · ${r.startups.length} startup` : ''}
                </p>
              </div>
              <p className="text-sm font-extrabold text-white whitespace-nowrap">
                €{(amount(r) / 100).toLocaleString('it-IT')}
                {r.verified ? <span className="ml-2 text-[11px] text-room-bright bg-room/20 px-2 py-0.5 rounded-lg">✓ verificato</span>
                  : <span className="ml-2 text-[11px] text-zinc-500">dichiarato</span>}
              </p>
            </li>
          ))}
        </ol>
      )}
      <p className="text-[11px] text-zinc-600 mt-6">Solo dati verificati da fonti collegate hanno il badge ✓. Anonymous Mode e scelte di visibilità sempre rispettati.</p>
    </div>
  );
}
