import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, unauthorized } from '@/lib/room/api';
import { normalizeHandle, isValidHandle } from '@/lib/room/validation';

export const runtime = 'nodejs';

// Verifica disponibilità handle in tempo reale (esclude l'utente corrente).
export async function GET(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();

  const h = normalizeHandle(new URL(req.url).searchParams.get('handle'));
  if (!isValidHandle(h)) {
    return NextResponse.json({ available: false, reason: 'invalid' });
  }

  const { data: conflict } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('handle', h)
    .neq('id', user.id)
    .maybeSingle();

  return NextResponse.json({ available: !conflict });
}
