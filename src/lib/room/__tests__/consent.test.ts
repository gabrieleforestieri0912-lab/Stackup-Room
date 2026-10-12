import { describe, it, expect } from 'vitest';
import { aiAllowed } from '../coach';
import { isValidHandle, normalizeHandle, isAdult16, isValidUrlOrEmpty } from '../validation';

describe('aiAllowed (consenso AI)', () => {
  it('nega senza profilo o senza consenso', () => {
    expect(aiAllowed(null)).toBe(false);
    expect(aiAllowed(undefined)).toBe(false);
    expect(aiAllowed({})).toBe(false);
    expect(aiAllowed({ ai_consent: false })).toBe(false);
  });
  it('permette solo con consenso esplicito true', () => {
    expect(aiAllowed({ ai_consent: true })).toBe(true);
    // truthy non booleano non basta
    expect(aiAllowed({ ai_consent: 1 as unknown as boolean })).toBe(false);
  });
});

describe('validazione profilo', () => {
  it('handle: 3-24 minuscole/numeri/underscore', () => {
    expect(isValidHandle('adalov_99')).toBe(true);
    expect(isValidHandle('Ab')).toBe(false);
    expect(isValidHandle('ha-trattino')).toBe(false);
    expect(isValidHandle('x'.repeat(25))).toBe(false);
    expect(normalizeHandle('  AdaLov ')).toBe('adalov');
  });
  it('età minima 16 anni', () => {
    expect(isAdult16('2000-01-01')).toBe(true);
    expect(isAdult16(new Date().toISOString().slice(0, 10))).toBe(false);
    expect(isAdult16('non-una-data')).toBe(false);
  });
  it('URL: solo http/https o vuoto', () => {
    expect(isValidUrlOrEmpty('')).toBe(true);
    expect(isValidUrlOrEmpty('https://esempio.it')).toBe(true);
    expect(isValidUrlOrEmpty('javascript:alert(1)')).toBe(false);
    expect(isValidUrlOrEmpty('nota')).toBe(false);
  });
});
