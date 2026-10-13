import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireMember } from '@/lib/room/community';
import { unauthorized } from '@/lib/room/api';

export const runtime = 'nodejs';

// Proxy ricerca GIF (Tenor). Chiave solo lato server.
export async function GET(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const key = process.env.TENOR_API_KEY;
  if (!key) return NextResponse.json({ message: 'GIF non configurate', gifs: [] }, { status: 501 });
  const q = new URL(req.url).searchParams.get('q') || 'startup';
  const params = new URLSearchParams({ q: q.slice(0, 100), key, limit: '12', media_filter: 'gif' });
  const res = await fetch(`https://tenor.googleapis.com/v2/search?${params.toString()}`);
  if (!res.ok) return NextResponse.json({ message: 'Ricerca GIF fallita' }, { status: 502 });
  const data = await res.json();
  const gifs = ((data.results || []) as Array<{ media_formats?: { gif?: { url?: string }; tinygif?: { url?: string } } }>)
    .map((r) => r.media_formats?.tinygif?.url || r.media_formats?.gif?.url)
    .filter(Boolean)
    .slice(0, 12);
  return NextResponse.json({ gifs });
}
