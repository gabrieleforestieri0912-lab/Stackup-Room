# Monitoring & Analytics — Stackup Room (Giorno 5 Fase 4)

## Decisione: Sentry differito

**Scelta:** per il primo lancio (TestFlight / Play Internal Testing + public soft-launch < 1k utenti) **non integriamo Sentry**.

**Motivazione — "defer infrastructure until demand is proven" (docs/scope.md):**
- Crash report nativi di **Play Console (Android Vitals)** e **App Store Connect / Xcode Organizer** bastano per i primi crash reali.
- Evita un SDK aggiuntivo, una chiave DSN da gestire e costi/ruido prima di avere volume.
- L'app ha già error handling offline-first (Hive + Outbox + AppErrorView) e logging `debugPrint` categorizzato (`[Auth]`, `[Hive]`, `[Sync]`...).

**Quando attivare Sentry:**
- > 500 DAU, o > 5 crash unici non riproducibili dai log nativi, o richiesta di performance tracing.
- Setup futuro (1 comando): `flutter pub add sentry_flutter` + `SentryFlutter.init(dsn: String.fromEnvironment('SENTRY_DSN'))` in `main()` prima di `runApp`, wrapper `Sentry.captureException`.

**Cosa fare ora:**
- [ ] Abilitare notifiche email per Android Vitals e per i crash di TestFlight (App Store Connect > Users and Access > Notifications).
- [ ] Testare un crash intenzionale in Internal Testing per verificare che i report arrivino.

---

## Analytics minimale (implementato)

**Tabella Supabase:** `analytics_events` (`supabase/migrations/20260914120000_analytics_events.sql`)

| event_name | Quando | RLS |
|---|---|---|
| `signup_completed` | `AuthNotifier.signUp()` con sessione | insert own (`auth.uid()=user_id`) |
| `onboarding_completed` | `completeOnboarding()` o `OnboardingNotifier.completeStep3()` | idem |
| `first_checkin_completed` | Primo standup con streak 0→1 (`checkin_screen.dart`) | idem |
| `revenue_connected` | `stripe-verify` success (Edge Function proxy) | idem |

**Altri eventi opzionali (non ancora tracciati ma supportati dal check constraint):**
`github_connected`, `paywall_viewed`, `subscription_purchased` — aggiungi una riga `AnalyticsService.track(...)` quando implementi la UI corrispondente.

**Servizio Dart:** `lib/core/analytics/analytics_service.dart`
```dart
await AnalyticsService.track(AnalyticsService.signupCompleted, properties: {'method': 'email'});
```
- Safe offline: skip silenzioso se `SupabaseService.clientOrNull == null` o anon.
- Mai bloccante: try/catch + `debugPrint` su errore (RLS, rete).
- Nessun SDK esterno (PostHog/Mixpanel differiti).

**Query utili (SQL Editor, service_role):**
```sql
-- Funnel ultimi 7 giorni
select event_name, count(*) from analytics_events
where created_at > now() - interval '7 days'
group by event_name order by event_name;

-- Conversione signup → onboarding
with s as (select user_id from analytics_events where event_name='signup_completed'),
     o as (select user_id from analytics_events where event_name='onboarding_completed')
select (select count(*) from o)::float / nullif((select count(*) from s),0) as conversion;
```

**Privacy:** eventi collegati a `user_id` (per coerenza con leaderboard), ma senza PII nel payload `properties` (solo `method`, `startup_id`, `source`). Dichiarati in `docs/store-privacy.md` come "Usage Data / Product Interaction — Analytics".

---

## Test end-to-end (CHECKPOINT 4)

1. `flutter run -d <device>` con Supabase configurato (`.env` o `--dart-define`).
2. Signup con email nuova → verifica in Supabase SQL Editor:
   ```sql
   select event_name, created_at from analytics_events where user_id = '<tuo-uid>' order by created_at;
   -- atteso: signup_completed
   ```
3. Completa onboarding 3-step → atteso: `onboarding_completed` (1 riga).
4. Salva standup (Today) con streak 0→1 → atteso: `first_checkin_completed` (solo al primo passaggio a streak 1).
5. Collega Stripe (Portfolio → Verify) → atteso: `revenue_connected`.
6. Offline: disattiva rete, rifai operazione, verifica che l'app non crashi e che il tracking sia skippato (log `[Analytics] skip ...`).

> Tutti gli eventi sono non bloccanti: anche se la tabella non è migrata o RLS rifiuta, l'app prosegue (log `debugPrint`).

---

*Ultimo aggiornamento: 2026-09-14 — Giorno 5 Fase 4.*
