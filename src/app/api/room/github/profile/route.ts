import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireUser, unauthorized } from '@/lib/room/api';
import { fetchGithubProfile } from '@/lib/room/github';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// Anteprima pubblica profilo GitHub da username (avatar, stats, repo recenti). Solo lettura.
export async function GET(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `gh-profile:${user.id}`), 30, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });

  const username = new URL(req.url).searchParams.get('username')?.trim().replace(/^@/, '');
  if (!username || !/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
    return NextResponse.json({ message: 'Username non valido' }, { status: 400 });
  }
  try {
    return NextResponse.json(await fetchGithubProfile(username));
  } catch (e) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Errore' }, { status: 502 });
  }
}
