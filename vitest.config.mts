import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    include: ['src/lib/room/__tests__/**/*.test.ts', 'src/app/**/__tests__/**/*.test.{ts,tsx}'],
    // Dummy: i test puri non toccano la rete, ma l'import chain richiede le env.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      // L'hash OTP fallisce (fail-closed) senza un pepper valido.
      OTP_PEPPER: 'test-pepper-value-0123456789',
    },
  },
});
