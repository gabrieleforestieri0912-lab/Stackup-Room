# Checklist di Lancio — Stackup Room (Giorno 5 Fase 5)

> Stato reale verificato al 2026-09-14 su branch `feature/stackuproom-day5-launch-prep-*`.
> Niente push su `main` — PR verso `main` senza merge fino a chiusura giornata.

---

## Build & Firma

- [ ] **Android keystore** — `android/app/keystore` + `android/key.properties` configurati, `flutter build appbundle --release` firma corretta, `keystore` non committato (`.gitignore`), backup cifrato fuori repo. _Stato: DA FARE (non lasciare per l'ultimo minuto)._
- [ ] **iOS certificati/provisioning** — Apple Developer Program attivo, Bundle ID `com.vertex.stackuproom` (o scelto), certificato Distribution + provisioning profile App Store, `flutter build ios --release` senza errori di signing. _Stato: DA FARE — la firma iOS ha spesso intoppi (Xcode > Signing & Capabilities)._
- [ ] **Versioning** — `pubspec.yaml` `version: 1.0.0+1` bumpato per ogni submission, `CFBundleShortVersionString` / `versionCode` coerenti. _Stato: 1.0.0+1 (primo invio)._

## Privacy & Permessi

- [x] **Privacy labels compilate (bozza)** — `docs/store-privacy.md` contiene tabelle Apple Nutrition Label e Google Data Safety pronte da copiare in App Store Connect / Play Console. _Stato: DONE (mappa completa email, avatar, Stripe, RevenueCat, analytics)._
- [x] **Info.plist stringhe verificate** — `NSCameraUsageDescription` e `NSPhotoLibraryUsageDescription` dettagliate (uso solo avatar, skippabile). _Stato: DONE (commit Giorno 5)._
- [x] **AndroidManifest permessi verificati** — `POST_NOTIFICATIONS`, `USE_EXACT_ALARM`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED` presenti; nessun `CAMERA` hard-coded (aggiunto solo da `image_picker` se necessario). _Stato: DONE._
- [x] **Permessi runtime con spiegazione contestuale** — avatar picker e onboarding Step 3 mostrano rationale prima del prompt di sistema; ogni permesso è skippabile/rifiutabile. _Stato: DONE._
- [x] **Nota Stripe per reviewer** — `docs/store-privacy.md` §5 contiene testo da incollare per il reviewer Apple ("Stripe read-only ... non IAP"). _Stato: DONE (da ricopiare in App Store Connect > Notes)._

## Dati & Sicurezza

- [x] **RLS verificata su tutte le tabelle** — `profiles`, `startups`, `revenue_snapshots`, `waitlist`, `analytics_events`, `github_accounts` (zero policy = service_role only), `public_portfolios` view (proiezione sicura). _Stato: DONE (policy in `supabase/migrations/*`). Comando verifica: `supabase/tests/verify_profiles_rls.sql` + query `pg_policies`._
- [ ] **RLS verificata in produzione (DB remoto)** — applica tutte le migration Giorno 5 in SQL Editor prod e ripeti i test RLS con 2 utenti reali + anon. _Stato: DA FARE (richiede progetto Supabase prod configurato)._
- [x] **Service role mai nel bundle** — `Env.assertNoServiceRole()` in `main()`, `.env.example` senza service key, Edge Functions sole con `service_role`. _Stato: DONE._
- [x] **Feature flag launch gating** — `ENABLE_PUBLIC_SIGNUP` (Env + `WaitlistScreen` + `waitlist` table con insert anon / no select). Default `true` = public (coerente con `docs/scope.md` che non prevede beta). _Stato: DONE._

## Pagine legali

- [x] **Pagine `/privacy` e `/terms` create** — `site/privacy.html` + `site/terms.html` + `site/index.html` minimali, stile dark coerente, testi operativi (non consulenza legale). _Stato: DONE._
- [x] **Route in-app + link esterno** — `lib/features/legal/legal_screen.dart` (`PrivacyScreen`/`TermsScreen` + `LegalUrls`) e link da `SettingsScreen` + `ProfileScreen` verso gli URL pubblici. _Stato: DONE._
- [x] **Pagine pubblicate e raggiungibili da URL pubblico** — `site/*` deployato su Vercel (progetto `site`, scope `vertex-9`, SSO protection disattivata), alias pubblici `https://site-vertex-9.vercel.app` + `https://site-delta-rouge-51.vercel.app`. URL per store: `https://site-vertex-9.vercel.app/privacy` e `/terms`. _Stato: DONE — verifica `curl` con 200 OK._
  - Dominio custom `stackuproom.com` non ancora registrato/resolvibile (NXDOMAIN) — quando disponibile, aggiungere su Vercel (Settings > Domains) e aggiornare `LegalUrls` in `lib/features/legal/legal_screen.dart`.

## Beta reale

- [ ] **Submission TestFlight** — build uploadato via `xcodebuild`/`Transporter`, gruppo Internal Testing con almeno 1 tester reale, giro di test completato (signup → onboarding → check-in → portfolio → Stripe optional → chat). _Stato: DA FARE._
- [ ] **Submission Play Internal Testing** — `aab` caricato, tester list configurata, giro di test reale su device fisico. _Stato: DA FARE._
- [ ] **Feedback beta raccolto** — note su onboarding, permessi, paywall, crash. _Stato: DA FARE dopo i due punti precedenti._

## Monitoring & Analytics

- [x] **Tabella analytics_events + RLS** — `supabase/migrations/20260914120000_analytics_events.sql` (eventi `signup_completed`, `onboarding_completed`, `first_checkin_completed`, `revenue_connected`). _Stato: DONE._
- [x] **AnalyticsService integrato** — `lib/core/analytics/analytics_service.dart` + hook in `auth_provider` (signup/onboarding), `onboarding_provider` (Step 3), `checkin_screen` (first check-in), `leaderboard_repository` (revenue). Non bloccante, skip offline. _Stato: DONE._
- [x] **Decisione Sentry documentata** — `docs/monitoring.md`: differito per primo lancio, usa crash nativi Play Console / App Store Connect. _Stato: DONE._
- [ ] **Test end-to-end eventi** — vedi `docs/monitoring.md` § Test: signup → onboarding → check-in → revenue su device reale con Supabase prod, verifica righe in `analytics_events`. _Stato: DA FARE (richiede DB prod + device)._

## Funnel end-to-end su device reale (non solo emulatore)

- [ ] **Funnel completo testato** — su iPhone e Android fisici: `signup → onboarding 3-step (con/senza avatar, con/senza permesso notifiche) → check-in/standup → portfolio CRUD + visibility toggle → leaderboard → AI coach → community (paywall mock) → settings (legal, subscription, sync)`. _Stato: DA FARE._
- [ ] **Offline → online** — verifica coda outbox (Hive → Supabase) su airplane mode → resume. _Stato: DA FARE._
- [ ] **RLS negativa** — utente A non scrive su profilo/startup di B (verifica manuale con 2 account). _Stato: DA FARE in prod._

---

## Rischi noti (per chiusura giornata)

1. **Apple Review — permessi:** se `NSCameraUsageDescription` è troppo generica → rifiuto. Mitigato (stringhe dettagliate Giorno 5) ma va ricontrollato alla submission.
2. **Apple Review — Stripe:** rischio basso (Stripe è fuori IAP per dashboard revenue), ma un reviewer non esperto potrebbe chiedere chiarimento. Mitigato con nota precompilata in `docs/store-privacy.md` §5.
3. **Firma iOS:** spesso blocca il lancio all'ultimo minuto (certificati scaduti, provisioning mismatch). Azione: configurare subito, non a ridosso della submission.
4. **Dominio custom non pronto:** le pagine legali sono live su alias Vercel (`site-vertex-9.vercel.app/privacy`) e quindi raggiungibili dagli store, ma il dominio `stackuproom.com` (NXDOMAIN) non è ancora registrato/configurato. Azione: registrare il dominio e puntare su Vercel (DNS), poi aggiornare `LegalUrls`. Non blocca la submission se gli URL Vercel vengono usati in App Store Connect / Play Console.
5. **RLS non applicata in prod:** se le migration Giorno 5 non sono state eseguite sul DB prod, le policy restano solo locali. Azione: `supabase db push` o SQL Editor con tutti i file `supabase/migrations/20260914*.sql`.

## Cosa manca prima di poter inviare in review

1. Eseguire i `DA FARE` bloccanti: **firma build release (Android keystore + iOS provisioning) + applicazione migration in prod + verifica RLS prod**. Le pagine legali sono già live su Vercel.
2. Un giro completo TestFlight + Play Internal Testing su device reale (almeno 1 tester per store).
3. Test funnel end-to-end + analytics events su prod (vedi `docs/monitoring.md`).
4. Copiare `docs/store-privacy.md` nei form Data Safety / App Privacy degli store.

---

*Template: Giorno 5 Fase 5 — Aggiorna le checkbox a [x] man mano che i DA FARE vengono eseguiti e allega screenshot/log.*
