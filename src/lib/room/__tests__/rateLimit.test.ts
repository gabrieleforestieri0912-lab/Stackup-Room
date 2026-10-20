import { describe, it, expect } from 'vitest';
import { clientIp, rateLimitKey } from '@/lib/rateLimit';

const headers = (obj: Record<string, string>) => new Headers(obj);

describe('clientIp (identità per il rate limiter)', () => {
  it('usa l\'ultimo elemento di x-forwarded-for (quello del proxy più vicino)', () => {
    // Il client può scegliere il primo elemento: non deve contare.
    expect(clientIp({ headers: headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }) })).toBe('5.6.7.8');
  });

  it('accetta una catena di più proxy', () => {
    expect(clientIp({ headers: headers({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' }) })).toBe('3.3.3.3');
  });

  it('usa x-real-ip come fallback', () => {
    expect(clientIp({ headers: headers({ 'x-real-ip': '9.9.9.9' }) })).toBe('9.9.9.9');
  });

  it('senza header torna unknown (tutti condividono il bucket, ma resta limitato)', () => {
    expect(clientIp({ headers: headers({}) })).toBe('unknown');
  });

  it('ignora elementi vuoti nella catena', () => {
    expect(clientIp({ headers: headers({ 'x-forwarded-for': '1.2.3.4, , ' }) })).toBe('1.2.3.4');
  });
});

describe('rateLimitKey', () => {
  it('includo IP, path e suffisso', () => {
    const key = rateLimitKey({ headers: headers({ 'x-forwarded-for': '5.6.7.8' }), url: 'https://x.it/api/auth/login' }, 'login');
    expect(key).toBe('5.6.7.8:/api/auth/login:login');
  });
});
