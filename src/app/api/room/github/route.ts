import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, unauthorized } from '@/lib/room/api';
import { fetchPublicCounts } from '@/lib/room/github';
import { rateLimit, rateLimitKey, clientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// Cooldown in-memory per l'auto-sync (niente hammering di GitHub a ogni caricamento).
const lastAutoSync = new Map<string, number>();
const AUTO_SYNC_COOLDOWN = 60 * 60_000; // 1 ora

async function syncAndStore(userId: string, username: string): Promise<number> {
  const counts = await fetchPublicCounts(username);
  if (counts.size > 0) {
    await supabaseAdmin.from('github_cache').upsert(
      [...counts.entries()].map(([day, count]) => ({ user_id: userId, day, count })),
      { onConflict: 'user_id,day' },
    );
  }
  return counts.size;
}

// Serie dei conteggi (cache). Se la cache è vuota o vecchia di più di un giorno,
// rifà la sync reale da GitHub al volo, così la heatmap mostra dati veri.
export async function GET(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const { data } = await supabaseAdmin.from('github_cache').select('day,count').eq('user_id', user.id).order('day', { ascending: false }).limit(371);

  const todayIso = new Date().toISOString().slice(0, 10);
  const newest = data?.[0]?.day || '';
  const stale = newest < todayIso;
  const cooldownOk = (lastAutoSync.get(user.id) || 0) + AUTO_SYNC_COOLDOWN < Date.now();

  if (stale && cooldownOk) {
    lastAutoSync.set(user.id, Date.now());
    const { data: profile } = await supabaseAdmin.from('profiles').select('github_username').eq('id', user.id).maybeSingle();
    const username = profile?.github_username as string | null;
    if (username) {
      try {
        await syncAndStore(user.id, username);
        const fresh = await supabaseAdmin.from('github_cache').select('day,count').eq('user_id', user.id).order('day', { ascending: false }).limit(371);
        return NextResponse.json({ series: fresh.data || [], synced: true });
      } catch { /* resta sulla cache vecchia */ }
    }
  }
  return NextResponse.json({ series: data || [] });
}

// Sincronizzazione manuale (rate limit 10/h).
export async function POST(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `gh-sync:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('github_username').eq('id', user.id).maybeSingle();
  const username = profile?.github_username as string | null;
  if (!username) return NextResponse.json({ message: 'Imposta prima lo username GitHub nel profilo' }, { status: 400 });

  try {
    const days = await syncAndStore(user.id, username);
    lastAutoSync.set(user.id, Date.now());
    await supabaseAdmin.from('leaderboard_audit').insert({
      user_id: user.id, action: 'github.sync', meta: { days },
      ip: clientIp(req),
    });
    return NextResponse.json({ message: 'Sincronizzato', days });
  } catch (e) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Errore sync' }, { status: 502 });
  }
}
