'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { splitPodium } from '@/lib/room/leaderboard';
import { Coins, Flame, GitBranch, Loader2, Rocket, Trophy } from 'lucide-react';

type Row = {
  rank: number; owner: string; user_id?: string;
  mrr_cents?: number; total_cents?: number; currency?: string; verified?: boolean;
  startups?: string[]; name?: string;
};

type PointRow = {
  rank: number; owner: string; user_id: string;
  streak: number; mrr_cents: number; contributions: number; apps: number;
  streak_points: number; revenue_points: number; contributions_points: number; apps_points: number;
  total: number; mrr_verified: boolean; mrr_shared: boolean; contributions_week: number;
};

// Medaglie del podio: 1 oro, 2 argento, 3 bronzo.
const MEDALS: Record<number, { label: string; color: string; ring: string }> = {
  1: { label: '1º', color: 'text-gold', ring: 'border-gold/50 bg-gold/5' },
  2: { label: '2º', color: 'text-zinc-300', ring: 'border-zinc-500/50 bg-zinc-500/5' },
  3: { label: '3º', color: 'text-[#CD7F32]', ring: 'border-[#CD7F32]/50 bg-[#CD7F32]/5' },
};

const money = (cents: number) => `€${(cents / 100).toLocaleString('it-IT')}`;

// I 4 criteri dei punti: gli stessi numeri della card "Tu" (Streak, ricavi
// mensili, contributi GitHub, app rilasciate).
function StatChips({ r }: { r: PointRow }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
      <span className="inline-flex items-center gap-1" title="Streak attuale">
        <Flame size={12} className="text-ember" /> {r.streak}
        <span className="text-zinc-600">giorni</span>
      </span>
      {r.mrr_shared && (
        <span className="inline-flex items-center gap-1" title="Ricavi mensili">
          <Coins size={12} className="text-yellow-500" /> {money(r.mrr_cents)}
          <span className="text-zinc-600">{r.mrr_verified ? 'verificato' : 'non verificato'}</span>
        </span>
      )}
      <span className="inline-flex items-center gap-1" title="Contributi GitHub · ultimo anno">
        <GitBranch size={12} className="text-emerald-400" /> {r.contributions}
        <span className="text-zinc-600">contributi</span>
        {r.contributions_week > 0 && <span className="text-emerald-400 font-bold">+{r.contributions_week} questa settimana</span>}
      </span>
      <span className="inline-flex items-center gap-1" title="App rilasciate">
        <Rocket size={12} className="text-room" /> {r.apps}
        <span className="text-zinc-600">app</span>
      </span>
    </div>
  );
}

export default function RanksTab() {
  const { user } = useAuth();
  const [view, setView] = useState<'revenue' | 'points'>('revenue');
  const [rows, setRows] = useState<Row[]>([]);
  const [pointRows, setPointRows] = useState<PointRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [rev, pts] = await Promise.all([
        fetch('/api/room/leaderboard?type=revenue&period=all').then((r) => (r.ok ? r.json() : { rows: [] })).catch(() => ({ rows: [] })),
        fetch('/api/room/leaderboard?type=points&period=all').then((r) => (r.ok ? r.json() : { rows: [] })).catch(() => ({ rows: [] })),
      ]);
      setRows(rev.rows || []);
      setPointRows(pts.rows || []);
      setLoading(false);
    })();
  }, []);

  // Evidenzia la riga dell'utente (match su handle se non anonimo)
  const myHandle = (user as { handle?: string } | null)?.handle;
  const isMine = (o: string) => !!myHandle && o === `@${myHandle}`;

  const amount = (r: Row) => r.total_cents ?? r.mrr_cents ?? 0;

  // Il podio esiste solo con almeno tre fondatori in classifica: i primi 3
  // vanno in cima, sotto resta il resto della classifica (dal 4° posto).
  // Con meno di tre righe non c'è podio e la lista resta quella completa.
  const { podium, rest } = splitPodium(rows);
  const hasPodium = podium.length === 3;
  const points = splitPodium(pointRows);
  const hasPointsPodium = points.podium.length === 3;

  const revenue = (r: Row) => (
    <>
      <p className="text-sm font-extrabold text-white whitespace-nowrap">
        €{(amount(r) / 100).toLocaleString('it-IT')}
      </p>
      {r.verified
        ? <span className="ml-2 text-[11px] text-room-bright bg-room/20 px-2 py-0.5 rounded-lg">✓ verificato</span>
        : <span className="ml-2 text-[11px] text-zinc-500">dichiarato</span>}
    </>
  );

  const subtitle = (r: Row) => (
    (r.startups && r.startups.length > 0 ? r.startups.join(' · ') : r.name) || ''
  );

  return (
    <div className="w-full">
      <h2 className="text-[15px] font-extrabold tracking-tight">
        {view === 'revenue' ? 'Chi ha guadagnato di più.' : 'Chi ha più punti.'}
      </h2>
      <p className="text-sm text-zinc-400 mt-1 mb-4">
        {view === 'revenue'
          ? 'Classifica dei fondatori per guadagno totale — somma di tutte le loro startup.'
          : 'Punti = 10 per ogni giorno di streak · 1 ogni 10€ di ricavi mensili · 1 per ogni contributo GitHub · 50 per ogni app rilasciata.'}
      </p>

      {/* Sotto-sezioni: classifica per ricavi e classifica per punti */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl mb-5" role="tablist" aria-label="Tipo di classifica">
        {([['revenue', 'Ricavi'], ['points', 'Punti']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
            className={`py-2.5 text-[13px] font-bold rounded-xl transition-all ${view === id ? 'bg-zinc-900 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>
      ) : view === 'revenue' ? (
        rows.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
            <p className="font-bold text-white">Nessun dato.</p>
            <p className="text-sm text-zinc-400 mt-1">
              Attiva &quot;Mostra revenue&quot; nel profilo e collega Stripe.
            </p>
          </div>
        ) : (
          <>
            {hasPodium && (
              <section aria-label="Podio" className="mb-8">
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-3">
                  <Trophy size={13} className="text-gold" /> Podio
                </h3>
                <ol className="grid grid-cols-3 items-end gap-2">
                  {/* 2º · 1º · 3º, il primo al centro e più alto */}
                  {[podium[1], podium[0], podium[2]].map((r) => {
                    const m = MEDALS[r.rank];
                    const mine = isMine(r.owner);
                    return (
                      <li key={r.rank} className={`min-w-0 border rounded-2xl p-3 text-center ${m.ring} ${mine ? 'ring-1 ring-room/60' : ''} ${r.rank === 1 ? 'pb-5' : ''}`}>
                        <span className={`block text-2xl font-black ${m.color}`}>{m.label}</span>
                        <p className="mt-1 text-[13px] font-bold text-white truncate">
                          {r.owner} {mine && <span className="text-room">(tu)</span>}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">{subtitle(r)}</p>
                        <p className="mt-2 text-base font-extrabold text-white whitespace-nowrap">
                          €{(amount(r) / 100).toLocaleString('it-IT')}
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          {r.verified ? '✓ verificato' : 'dichiarato'}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {rest.length > 0 && (
              <>
                <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-3">
                  Classifica completa
                </h3>
                <ol className="space-y-2">
                  {rest.map((r) => (
                    <li key={`${r.rank}-${r.owner}`} className={`flex items-center gap-3 border rounded-2xl p-4 ${isMine(r.owner) ? 'border-room/60 bg-room/5' : 'border-zinc-800 bg-black'}`}>
                      <span className="font-mono font-extrabold text-zinc-500 w-8">#{r.rank}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{r.owner} {isMine(r.owner) && <span className="text-room">(tu)</span>}</p>
                        <p className="text-xs text-zinc-500 truncate">
                          {subtitle(r)}
                          {r.startups && r.startups.length > 1 ? ` · ${r.startups.length} startup` : ''}
                        </p>
                      </div>
                      <div className="whitespace-nowrap">{revenue(r)}</div>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </>
        )
      ) : pointRows.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
          <p className="font-bold text-white">Nessun punto ancora.</p>
          <p className="text-sm text-zinc-400 mt-1">
            Completa una task, tieni viva la streak, pubblica su GitHub o aggiungi un&apos;app: i punti arrivano da lì.
          </p>
        </div>
      ) : (
        <>
          {hasPointsPodium && (
            <section aria-label="Podio punti" className="mb-8">
              <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-3">
                <Trophy size={13} className="text-gold" /> Podio
              </h3>
              <ol className="grid grid-cols-3 items-end gap-2">
                {[points.podium[1], points.podium[0], points.podium[2]].map((r) => {
                  const m = MEDALS[r.rank];
                  const mine = isMine(r.owner);
                  return (
                    <li key={r.rank} className={`min-w-0 border rounded-2xl p-3 text-center ${m.ring} ${mine ? 'ring-1 ring-room/60' : ''} ${r.rank === 1 ? 'pb-5' : ''}`}>
                      <span className={`block text-2xl font-black ${m.color}`}>{m.label}</span>
                      <p className="mt-1 text-[13px] font-bold text-white truncate">
                        {r.owner} {mine && <span className="text-room">(tu)</span>}
                      </p>
                      <p className="mt-1 text-lg font-black text-white">{r.total} <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">punti</span></p>
                      <div className="mt-2 flex justify-center"><StatChips r={r} /></div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {points.rest.length > 0 && (
            <>
              <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-3">
                Classifica completa
              </h3>
              <ol className="space-y-2">
                {points.rest.map((r) => (
                  <li key={`${r.rank}-${r.owner}`} className={`flex items-start gap-3 border rounded-2xl p-4 ${isMine(r.owner) ? 'border-room/60 bg-room/5' : 'border-zinc-800 bg-black'}`}>
                    <span className="font-mono font-extrabold text-zinc-500 w-8 shrink-0 pt-0.5">#{r.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{r.owner} {isMine(r.owner) && <span className="text-room">(tu)</span>}</p>
                      <div className="mt-1"><StatChips r={r} /></div>
                    </div>
                    <p className="text-sm font-extrabold text-white whitespace-nowrap shrink-0">
                      {r.total} <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">punti</span>
                    </p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </>
      )}
      <p className="text-[11px] text-zinc-600 mt-6">Solo dati verificati da fonti collegate hanno il badge ✓. Anonymous Mode e scelte di visibilità sempre rispettati.</p>
    </div>
  );
}
