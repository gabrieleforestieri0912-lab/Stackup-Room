import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

async function auth(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const u = token ? await getAuthUser(token) : null;
  return { token, u };
}

// Export dati (JSON con profilo + tabelle room M1).
export async function GET(req: NextRequest) {
  const { u } = await auth(req);
  if (!u) return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', u.id).maybeSingle();
  const { data: consent } = await supabaseAdmin.from('ai_consents').select('*').eq('user_id', u.id).maybeSingle();
  return NextResponse.json({ exported_at: new Date().toISOString(), profile, ai_consents: consent || null });
}

// Cancellazione immediata e completa: profilo + auth.user (cascade sul resto).
export async function DELETE(req: NextRequest) {
  const { u } = await auth(req);
  if (!u) return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.confirm !== 'DELETE') {
    return NextResponse.json({ message: 'Conferma mancante (confirm: DELETE)' }, { status: 400 });
  }
  await supabaseAdmin.from('profiles').delete().eq('id', u.id);
  const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
  if (error) return NextResponse.json({ message: 'Errore cancellazione account' }, { status: 500 });
  return NextResponse.json({ message: 'Account eliminato' });
}
