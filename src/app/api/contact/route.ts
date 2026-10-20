import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripCrlf(input: string): string {
  return input.replace(/[\r\n\t\0]/g, ' ').trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const rawName = typeof body.name === 'string' ? body.name : '';
  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const rawSubject = typeof body.subject === 'string' ? body.subject : '';
  const rawMessage = typeof body.message === 'string' ? body.message : '';

  if (!rawName || !rawEmail || !rawMessage) {
    return NextResponse.json({ message: 'Nome, email e messaggio sono obbligatori' }, { status: 400 });
  }
  if (!EMAIL_RE.test(rawEmail)) {
    return NextResponse.json({ message: 'Email non valida' }, { status: 400 });
  }
  if (rawName.length > 200 || rawEmail.length > 320 || rawMessage.length > 5000) {
    return NextResponse.json({ message: 'Input troppo lungo' }, { status: 400 });
  }

  const name = stripCrlf(rawName);
  const email = stripCrlf(rawEmail);
  const subject = stripCrlf(rawSubject).slice(0, 200);
  const message = rawMessage.trim();

  try {
    await supabaseAdmin.from('messages').insert({
      name,
      email,
      subject: subject || null,
      message,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || '—');
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

    await resend.emails.send({
      from: `Stackup <${process.env.RESEND_FROM_EMAIL}>`,
      replyTo: email,
      to: 'gabriele.forestieri0912@gmail.com',
      subject: `[Stackup] ${subject || 'Nuovo messaggio'} — da ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#9333ea;">Nuovo messaggio da Stackup</h2>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:bold;border:1px solid #e2e8f0;">Nome</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${safeName}</td></tr>
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:bold;border:1px solid #e2e8f0;">Email</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${safeEmail}</td></tr>
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:bold;border:1px solid #e2e8f0;">Oggetto</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${safeSubject}</td></tr>
          </table>
          <div style="padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
            <p style="margin:0;color:#475569;line-height:1.6;">${safeMessage}</p>
          </div>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="font-size:12px;color:#94a3b8;">Stackup Academy</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Messaggio ricevuto! Ti risponderemo entro 24 ore.',
    });
  } catch (error) {
    console.error('[Contact] Error:', error);
    return NextResponse.json({ message: 'Errore del server. Riprova più tardi.' }, { status: 500 });
  }
}
