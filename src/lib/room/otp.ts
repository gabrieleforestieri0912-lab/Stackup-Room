import { createHash, randomInt } from 'crypto';
import { Resend } from 'resend';

export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

// Pepper per l'hash degli OTP.
//
// Fallback hardcoded rimosso: una stringa finita nel repository rende gli
// hash pre-calcolabili da chiunque. Se la variabile manca il flusso OTP si
// chiude (fail-closed) invece di degradare.
function otpPepper(): string {
  const pepper = process.env.OTP_PEPPER;
  if (!pepper || pepper.length < 16) {
    throw new Error('OTP_PEPPER mancante o troppo corta: imposta una stringa segreta di almeno 16 caratteri.');
  }
  return pepper;
}

export function hashOtp(code: string, email: string): string {
  return createHash('sha256').update(`${otpPepper()}:${email.toLowerCase()}:${code}`).digest('hex');
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL!;
  await resend.emails.send({
    from: `Stackup Room <${from}>`,
    to: email,
    subject: `Il tuo codice di accesso: ${code}`,
    html: `<div style="font-family:monospace;max-width:480px;margin:0 auto;padding:24px;background:#000;color:#fff;border-radius:12px;">
      <h2 style="color:#ea580c;">Stackup Room</h2>
      <p>Il tuo codice di accesso (scade tra 10 minuti):</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;">${code}</p>
      <p style="color:#888;font-size:12px;">Se non l'hai richiesto tu, ignora questa email.</p>
    </div>`,
  });
}
