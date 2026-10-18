import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { siteUrl } from '@/lib/seo';

async function getProfile(handle: string) {
  // Prima prova sull'host corrente della richiesta, poi sul dominio di produzione:
  // così il profilo pubblico non 404 quando NEXT_PUBLIC_APP_URL punta altrove.
  const bases: string[] = [];
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    const proto = h.get('x-forwarded-proto') || 'http';
    if (host) bases.push(`${proto}://${host}`);
  } catch { /* build senza request: usa il fallback */ }
  bases.push(siteUrl());

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/api/room/public/${encodeURIComponent(handle)}`, { next: { revalidate: 60 } });
      if (res.ok) return res.json().then((d) => d.profile);
    } catch { /* prova la base successiva */ }
  }
  return null;
}

type Startup = { id: string; name: string; tagline: string | null; stage: string; url: string | null };
type GhDay = { day: string; count: number };

export default async function PublicProfile({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) notFound();
  const startups: Startup[] = profile.startups || [];
  const gh: GhDay[] = (profile.github_series || []).slice(0, 30).reverse();

  return (
    <main className="min-h-screen bg-black text-zinc-100 px-4 py-10">
      <div className="max-w-xl mx-auto bg-black border border-zinc-800 rounded-2xl p-8">
        <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Founder</p>
        {profile.anonymous ? (
          <>
            <h1 className="text-2xl font-extrabold">@{profile.handle} (anonimo)</h1>
            <p className="text-sm text-zinc-400 mt-2">Questo founder ha attivato l&apos;Anonymous Mode.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold">{profile.name || `@${profile.handle}`}</h1>
            <p className="text-sm text-zinc-500">@{profile.handle}{profile.locality ? ` · ${profile.locality}` : ''}</p>
            {profile.bio && <p className="text-sm text-zinc-300 mt-4">{profile.bio}</p>}
            {profile.github_username && (
              <a className="text-xs text-orange-400 font-bold mt-4 inline-block" href={`https://github.com/${profile.github_username}`} target="_blank" rel="noreferrer">
                GitHub: {profile.github_username}
              </a>
            )}
          </>
        )}
        <p className="text-xs text-zinc-500 mt-6">Streak: <strong className="text-white">{profile.study_streak || 0} giorni</strong></p>

        {!profile.anonymous && profile.show_revenue && profile.verified_total_cents != null && profile.verified_total_cents > 0 && (
          <p className="mt-3 text-sm font-bold text-white">
            <span className="inline-block px-2 py-0.5 bg-orange-600/20 text-orange-300 text-[11px] rounded-lg mr-2">✓ verificata</span>
            €{(profile.verified_total_cents / 100).toLocaleString('it-IT')}/mese
          </p>
        )}

        {!profile.anonymous && startups.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-500 mb-2">Startup</h2>
            <ul className="space-y-2">
              {startups.map((s) => (
                <li key={s.id} className="border border-zinc-800 rounded-xl p-3">
                  <p className="font-bold text-sm text-white">{s.name} <span className="text-[11px] text-zinc-500 font-normal">· {s.stage}</span></p>
                  {s.tagline && <p className="text-xs text-zinc-400">{s.tagline}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!profile.anonymous && gh.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-500 mb-2">Attività GitHub (30gg)</h2>
            <div className="flex items-end gap-1 h-12" aria-label="Contributi GitHub">
              {gh.map((d) => (
                <div key={d.day} title={`${d.day}: ${d.count}`} className="flex-1 rounded-sm bg-orange-600/70" style={{ height: `${Math.min(100, d.count * 25 + 8)}%`, opacity: d.count > 0 ? 1 : 0.2 }} />
              ))}
            </div>
          </div>
        )}

        <Link href="/room" className="inline-block mt-6 text-xs font-bold text-orange-400">← Torna alla Room</Link>
      </div>
    </main>
  );
}
