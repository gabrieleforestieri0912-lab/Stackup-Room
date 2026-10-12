import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase-admin';

export async function requireUser(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const u = token ? await getAuthUser(token) : null;
  if (!u) return { error: NextResponse.json({ message: 'Non autorizzato' }, { status: 401 }) as NextResponse, user: null };
  return { error: null as NextResponse | null, user: u };
}

// Verifica che la startup appartenga all'utente (tutte le risorse planner sono per-startup e private).
export async function ownStartup(userId: string, startupId: string) {
  const { data } = await supabaseAdmin.from('startups').select('id').eq('id', startupId).eq('user_id', userId).maybeSingle();
  return Boolean(data);
}

export async function recordShip(userId: string, source: string, startupId?: string | null) {
  const day = new Date().toISOString().slice(0, 10);
  await supabaseAdmin.from('ship_days').upsert(
    { user_id: userId, day, source, startup_id: startupId || null },
    { onConflict: 'user_id,day' },
  );
}
