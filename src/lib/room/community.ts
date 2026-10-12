import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser } from './api';
import { requiresMembershipEnabled } from './flags';

export type Author = { handle: string | null; anonymous: boolean };

// Solo membri (handle impostato) quando il flag requiresMembership è attivo.
export async function requireMember(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return { error, user: null as null, profile: null as null };
  const { data: profile } = await supabaseAdmin.from('profiles').select('id,handle,anonymous_mode').eq('id', user.id).maybeSingle();
  if ((await requiresMembershipEnabled()) && !profile?.handle) {
    return { error: NextResponse.json({ message: 'Solo i membri possono accedere alla community' }, { status: 403 }) as NextResponse, user: null, profile: null };
  }
  return { error: null as NextResponse | null, user, profile };
}

export async function authorsFor(ids: string[]): Promise<Record<string, Author>> {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (uniq.length === 0) return {};
  const { data } = await supabaseAdmin.from('profiles').select('id,handle,anonymous_mode').in('id', uniq);
  const map: Record<string, Author> = {};
  for (const p of data || []) map[p.id] = { handle: p.handle, anonymous: Boolean(p.anonymous_mode) };
  return map;
}

export function displayName(a: Author | undefined): string {
  if (!a || a.anonymous || !a.handle) return 'Anonimo';
  return `@${a.handle}`;
}

// ID degli utenti bloccati dal viewer (i loro contenuti vengono nascosti).
export async function blockedIds(viewerId: string): Promise<Set<string>> {
  const { data } = await supabaseAdmin.from('blocks').select('blocked_id').eq('blocker_id', viewerId);
  return new Set((data || []).map((b: { blocked_id: string }) => b.blocked_id));
}

export async function notify(userId: string, kind: string, text: string, ref?: { type: string; id: string }) {
  if (!userId) return;
  await supabaseAdmin.from('notifications').insert({
    user_id: userId, kind, text: text.slice(0, 300),
    ref_type: ref?.type || null, ref_id: ref?.id || null,
  });
}

export const REASONS = ['spam', 'odio', 'nsfw', 'altro'] as const;
export const EMOJI = ['🔥', '🚀', '💡', '🙌'] as const;
