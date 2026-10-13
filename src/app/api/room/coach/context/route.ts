import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember } from '@/lib/room/community';
import { buildContext, checkUsage } from '@/lib/room/coach';

export const runtime = 'nodejs';

// Riepilogo contesto (dati propri, nessun AI coinvolto): alimenta consenso e fallback offline.
export async function GET(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const { data: profile } = await supabaseAdmin.from('profiles').select('ai_consent,name,onboarding_completed').eq('id', user.id).maybeSingle();
  const { data: startups } = await supabaseAdmin.from('startups').select('id,name').eq('user_id', user.id).eq('archived', false).limit(20);
  const sids = (startups || []).map((s: { id: string }) => s.id);
  let openTasks = 0;
  let todayStandup = false;
  if (sids.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const [t, s] = await Promise.all([
      supabaseAdmin.from('tasks').select('id', { count: 'exact', head: true }).in('startup_id', sids).neq('status', 'done'),
      supabaseAdmin.from('standups').select('id', { count: 'exact', head: true }).in('startup_id', sids).eq('day', today),
    ]);
    openTasks = t.count || 0;
    todayStandup = (s.count || 0) > 0;
  }
  const usage = await checkUsage(user.id);
  const context = await buildContext(user.id);
  return NextResponse.json({
    consent: Boolean(profile?.ai_consent),
    startups: startups || [],
    openTasks,
    todayStandup,
    usage,
    contextPreview: context.split('\n').slice(0, 6).join('\n'),
  });
}
