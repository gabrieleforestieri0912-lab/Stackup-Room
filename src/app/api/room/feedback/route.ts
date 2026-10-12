import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireMember } from '@/lib/room/community';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';
const MAX_BYTES = 5 * 1024 * 1024;

// Feedback bug/idea con screenshot allegabile. Storage privato, visibile solo all'admin
// (RLS negata al client + notifica email). Nessun pannello admin: gestione via email/SQL.
export async function POST(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error || !user) return error;
  const rl = await rateLimit(rateLimitKey(req, `feedback:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const kind = form?.get('kind') === 'idea' ? 'idea' : form?.get('kind') === 'bug' ? 'bug' : '';
  const body = typeof form?.get('body') === 'string' ? (form.get('body') as string).trim().slice(0, 5000) : '';
  if (!kind || !body) return NextResponse.json({ message: 'Tipo e descrizione richiesti' }, { status: 400 });

  let screenshotPath: string | null = null;
  const shot = form?.get('screenshot');
  if (shot instanceof Blob && shot.size > 0) {
    if (shot.size > MAX_BYTES) return NextResponse.json({ message: 'Screenshot fino a 5MB' }, { status: 400 });
    if (shot.type && !shot.type.startsWith('image/')) return NextResponse.json({ message: 'Solo immagini' }, { status: 400 });
    screenshotPath = `${user.id}/${Date.now()}.png`;
    const { error: up } = await supabaseAdmin.storage.from('feedback-shots').upload(
      screenshotPath, Buffer.from(await shot.arrayBuffer()), { contentType: shot.type || 'image/png', upsert: false },
    );
    if (up) return NextResponse.json({ message: 'Upload screenshot fallito' }, { status: 500 });
  }

  const { data, error: ins } = await supabaseAdmin.from('feedback').insert({
    user_id: user.id, kind, body, screenshot_path: screenshotPath,
  }).select().single();
  if (ins) return NextResponse.json({ message: 'Errore invio feedback' }, { status: 500 });

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (adminEmails.length > 0) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: `StackUp Room <${process.env.RESEND_FROM_EMAIL}>`,
        to: adminEmails,
        subject: `[Room] Nuovo feedback (${kind})`,
        html: `<p><strong>${kind}</strong> da ${user.email}</p><p>${body.replace(/</g, '&lt;').slice(0, 2000)}</p><p>ID: ${data.id}${screenshotPath ? ' · con screenshot' : ''}</p>`,
      });
    } catch (e) {
      console.warn('[feedback] email admin fallita (non bloccante):', e);
    }
  }

  return NextResponse.json({ feedback: data }, { status: 201 });
}

// I propri feedback inviati (mai quelli altrui).
export async function GET(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error || !user) return error;
  const { data } = await supabaseAdmin.from('feedback').select('id,kind,body,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
  return NextResponse.json({ feedback: data || [] });
}
