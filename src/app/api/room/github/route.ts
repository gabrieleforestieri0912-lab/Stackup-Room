import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/room/api';
import { fetchPublicCounts } from '@/lib/room/github';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// Ultimi 120 giorni di conteggi pubblici (cache). Solo conteggi, mai codice.
export async function GET(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const { data } = await supabaseAdmin.from('github_cache').select('day,count').eq('user_id', user.id).order('day', { ascending: false }).limit(120);
  return NextResponse.json({ series: data || [] });
}

// Sincronizza dai eventi pubblici GitHub (rate limit 10/h).
export async function POST(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const rl = await rateLimit(rateLimitKey(req, `gh-sync:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('github_username').eq('id', user.id).maybeSingle();
  const username = profile?.github_username as string | null;
  if (!username) return NextResponse.json({ message: 'Imposta prima lo username GitHub nel profilo' }, { status: 400 });

  try {
    const counts = await fetchPublicCounts(username);
    if (counts.size > 0) {
      await supabaseAdmin.from('github_cache').upsert(
        [...counts.entries()].map(([day, count]) => ({ user_id: user.id, day, count })),
        { onConflict: 'user_id,day' },
      );
    }
    await supabaseAdmin.from('leaderboard_audit').insert({
      user_id: user.id, action: 'github.sync', meta: { days: counts.size },
      ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
    });
    return NextResponse.json({ message: 'Sincronizzato', days: counts.size });
  } catch (e) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Errore sync' }, { status: 502 });
  }
}
