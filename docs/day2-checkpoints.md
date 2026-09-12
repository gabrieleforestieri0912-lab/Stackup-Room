# Giorno 2 — Checkpoint report

**Branch:** `feature/stackuproom-day2-onboarding-20260912213751`  
**Base:** `feature/stackuproom-day1-20260911222720` (PR Giorno 1)

---

## Fase 1 — Schema dati per profili e RLS

### Migration
`supabase/migrations/20260912213800_profiles_onboarding.sql`

**Tabella `profiles`:**
- `id uuid PK FK auth.users(id) on delete cascade`
- `email text not null`
- `display_name text` (nullable, valorizzato Step 1)
- `startup_name text` (nullable, Step 2)
- `one_liner text check (char_length <=140)` (nullable, Step 2, max 140)
- `avatar_url text` (nullable, Storage `avatars`)
- `created_at timestamptz default now()`, `updated_at` con trigger `handle_updated_at()`
- `onboarding_completed_at timestamptz` (nullable, valorizzato Step 3 — determina routing)

**Decisione RLS (verifica docs/scope.md richiesta in spec):**

Spec Fase 1 dice "ogni utente legge/scrive solo il proprio profilo" ma subito dopo: _"Se la Fase 1 del Giorno 1 ha confermato che la leaderboard resta solo dentro l'app autenticata, non serve una view pubblica separata — verifica comunque in docs/scope.md"_.

Verifica su `docs/scope.md`:
- §6 decisione #2 → Fallback **A: solo in-app autenticata** (nessuna vetrina pubblica/embed in MVP).
- §5 `profiles` → "RLS: user può leggere tutti i profili (per leaderboard), scrivere solo il proprio".
- §5 `revenue_snapshots` / `daily_checkins` → "read autenticati".

**Conclusione:** nessuna `anon` read, nessuna view pubblica separata. Lettura profili = `authenticated` (serve per leaderboard interna Giorno 5), scrittura = solo owner (`auth.uid() = id`). Questo soddisfa entrambi i requisiti senza introdurre debito. Se si volesse lettura strettamente privata, basta sostituire la policy SELECT con `using (auth.uid() = id)` — ma romperebbe la leaderboard.

Policy create:
- `profiles_select_authenticated` (SELECT → authenticated `true`)
- `profiles_insert_own` (INSERT → check `auth.uid()=id`)
- `profiles_update_own` (UPDATE → using+with check `auth.uid()=id`)
- `profiles_delete_own` (DELETE → `auth.uid()=id`)

**Trigger:**
- `handle_new_user()` (security definer, `on conflict do nothing`) → su `auth.users` INSERT crea riga `profiles` con `email` e `display_name` derivato da `raw_user_meta_data` o `split_part(email,'@',1)`.
- `on_auth_user_created` after insert on `auth.users`.
- Backfill per utenti pre-esistenti.

**Storage bucket `avatars`:**
- Bucket `avatars` public=true (URL pubblico).
- Policy: SELECT public (`bucket_id='avatars'` lettura aperta perché bucket public; altrimenti authenticated), INSERT/UPDATE/DELETE solo su propria cartella `storage.foldername(name)[1] = auth.uid()::text` (path atteso `avatars/<uid>/avatar.*`).
- Upload avatar skippabile (fallback: sempre skippabile).

### Applicare la migration
```sql
-- Opzione A: Dashboard Supabase → SQL Editor → incolla intero file della migration
-- Opzione B (CLI locale):
supabase link --project-ref <PROJECT_REF>
supabase db push
-- oppure:
psql "$DATABASE_URL" -f supabase/migrations/20260912213800_profiles_onboarding.sql
```

### Test RLS — due utenti (CHECKPOINT 1)

> Esegui con due utenti reali creati via app (o Dashboard Auth) — vedi `supabase/tests/verify_profiles_rls.sql`.

**Metodo manuale (consigliato):**

1. Crea Utente A (`a@test.com` / `password123`) e Utente B (`b@test.com` / `password123`) via SignupScreen.
2. Come A (JWT di A):
   ```dart
   supabase.from('profiles').select() // deve vedere A e B (leaderboard autenticata)
   supabase.from('profiles').update({'display_name':'Alice'}).eq('id', A.id) // OK 1 riga
   supabase.from('profiles').update({'display_name':'Hacked'}).eq('id', B.id) // 0 righe
   supabase.from('profiles').update({'one_liner': 'a'*141}).eq('id', A.id) // errore check constraint
   supabase.from('profiles').update({'one_liner': 'a'*140}).eq('id', A.id) // OK
   supabase.storage.from('avatars').upload('${A.id}/avatar.jpg', file) // OK
   supabase.storage.from('avatars').upload('${B.id}/avatar.jpg', file) // errore policy
   ```
3. Come anon (nessun JWT):
   ```dart
   supabase.from('profiles').select() // [] — RLS blocca anon
   ```
4. Verifica automatica policy esistenza: `supabase/tests/verify_profiles_rls.sql` (query su `pg_policies`, `pg_class`, `storage.buckets`).

**Esito atteso:** solo owner scrive; authenticated legge tutti i profili; anon legge nulla; one_liner 141 rifiutato; avatars path isolation funzionante.

> **Azione richiesta per CHECKPOINT 1:** applica la migration in Supabase (SQL Editor o CLI) ed esegui i test sopra. Conferma con "OK Fase 1" se i 4 test passano, altrimenti riporta errore.

---

## Fase 2 — Flusso di autenticazione

### Implementato
- `lib/features/auth/auth_provider.dart` → `AuthNotifier` (StateNotifier<AppAuthState>) centralizzato:
  - `AuthStatus`: `initial | unauthenticated | authenticatedOnboardingRequired | authenticated`
  - Routing: `session==null` → unauthenticated; `onboarding_completed_at==null` → onboarding; altrimenti home. Fallback Hive offline.
  - `signUp` / `signIn` / `sendMagicLink` / `signOut` / `updateProfile` / `refreshProfile` / `completeOnboarding`.
  - Error humanization: email già in uso, credenziali invalide, password debole, rate limiting, email non confermata, network.
  - Legacy `authStateProvider` mantenuto per compat.
- `lib/features/auth/login_screen.dart` → LoginScreen: email/password + magic link (OutlinedButton), validazione form (regex email, min 6 char), loading states separati, messaggi errore chiari.
- `lib/features/auth/signup_screen.dart` → SignupScreen: email + password + conferma, validazione, gestione "email confirmation required" (session null → banner + SnackBar), navigazione Login↔Signup via pushReplacement.
- `lib/main.dart` → `AuthGate` (ConsumerStatefulWidget): splash min 800ms + `authProvider` watch → routing automatico (`LoginScreen` / `OnboardingScreen` con `loadFromProfile` / `AppShell`). Logout da qualunque schermata autenticata (ProfileScreen AppBar action + bottom button, con dialog conferma).
- `lib/features/profile/profile_screen.dart` → aggiornato: mostra `display_name`/`avatar_url`/`startup_name`/`one_liner` da `authProvider.profile ?? Hive cache`, reminder picker, logout.

### OAuth Google
Scope (§6) non richiede OAuth in MVP (Fase 2, fuori scope Giorno 2). Implementato solo `email/password + magic link` come fallback MVP — coerente con `docs/scope.md` Auth.

### Test manuale CHECKPOINT 2
1. `flutter run -d <device>` (o Android emulator)
2. Apri app → deve mostrare LoginScreen (se nessuna sessione).
3. Tap "Registrati" → inserisci `test-<timestamp>@example.com` / `test1234` / conferma → Crea account.
   - Se Supabase ha `Confirm email` ON → banner "Email di conferma inviata" + SnackBar, verifica email in Dashboard Auth → conferma, poi Login.
   - Se Confirm email OFF → navigazione diretta a Onboarding (Step 1) via AuthGate.
4. Se già registrato → Login con email/password → Onboarding o Home.
5. Da Profilo → Logout (icona AppBar o bottone) → dialog conferma → LoginScreen.
6. Come test errore: registra email già usata → "Email già in uso. Prova ad accedere."; password `123` → "Minimo 6 caratteri"; credenziali sbagliate → "Email o password non corretti."; prova ripetuti rapidi → rate limiting message.

> **Azione richiesta per CHECKPOINT 2:** esegui tu stesso signup → (conferma email se richiesta) → login → logout e riporta esito. In modalità offline (nessun .env), l'app resta su LoginScreen con validazione funzionante (errori Supabase = "Supabase non configurato" — non crash).

---

## Fase 3 — Wizard di onboarding post-login

### Implementato
- `lib/core/storage/hive_service.dart` → esteso con cache incrementale:
  - `onboarding_step` (0-3), `onboarding_display_name/startup_name/one_liner`, `onboarding_avatar_local_path/url`, `onboarding_completed_at`.
  - Helpers `saveOnboardingStep1/2/3`, `getOnboardingCache()`, `clearOnboardingCache()`, safe getters (se Hive non inizializzato → default, evita crash in test).
- `lib/core/notifications/notification_service.dart` → timezone + `permission_handler` + `flutter_local_notifications`:
  - `initialize()`, `requestPermission()` (ritorna bool), `hasPermission()`, `openSettings()`, `scheduleDailyReminder(hour)` (zonedSchedule daily con `DateTimeComponents.time`), `cancelDailyReminder()`. Se permesso negato → completa comunque (fallback richiesto).
- `lib/features/onboarding/onboarding_provider.dart` → `OnboardingNotifier`:
  - `OnboardingStep`: `step1Profile | step2Startup | step3Reminder | done` + `stepIndex`.
  - `_loadFromHive()` all'init (resume automatico se app chiusa a metà — `onboarding_step` persisted).
  - `completeStep1()` → upload avatar (se `Supabase.clientOrNull` disponibile) + update `profiles.display_name/avatar_url` + Hive sync.
  - `completeStep2()` → update `startup_name/one_liner` (null se vuoto) + Hive sync. Sempre skippabile via `skipStep2()`.
  - `completeStep3()` → `requestPermission()` + `scheduleDailyReminder(hour)` se granted + update `onboarding_completed_at` + Hive `saveOnboardingStep3`. Sempre completabile anche con permesso negato.
  - `pickAvatar()` / `pickAvatarCamera()` via `image_picker`, `removeAvatar()`, `_uploadAvatar(userId)` in `avatars/<uid>/avatar.<ext>` con `upsert:true`.
- `lib/features/onboarding/onboarding_screen.dart` → `OnboardingScreen` (ConsumerStatefulWidget, 3 sottowidget):
  - Progress bar 3 segmenti, `_Step1Profile` (avatar preview con sheet Galleria/Camera/Rimuovi, TextField display_name, validazione ≥2 char, "Salta avatar"), `_Step2Startup` (startup_name opzionale, one_liner TextField maxLength 140 con `buildCounter` visuale 140/remaining, warning a ≤20, hint 140c), `_Step3Reminder` (picker 0-23 con +/- , "Ogni giorno alle", banner permesso negato con "Impostazioni"), `_StepDone` (Welcome "Benvenuto nella Room 🚀" + check icon), `_BottomBar` (Continua / Indietro / Salta per ora / Continua senza promemoria, loading spinner).
  - `onProfileRefreshed` callback → `AuthGate` chiama `authProvider.notifier.refreshProfile()` per passare a `authenticated`.

**Decisione aperta segnalata:** upload avatar **sempre skippabile** (fallback richiesto). Implementato: Step 1 richiede `display_name` ≥2 ma avatar è opzionale; bottone "Salta avatar" disponibile. Se permesso notifiche negato, Step 3 completa comunque.

### Permessi piattaforma
- `android/app/src/main/AndroidManifest.xml` → `POST_NOTIFICATIONS`, `USE_EXACT_ALARM`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, ricevitori `ScheduledNotificationReceiver/BootReceiver`.
- `ios/Runner/Info.plist` → `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `UIBackgroundModes: remote-notification`.

### Test manuale CHECKPOINT 3
1. Esegui signup → arriva a Step 1. Inserisci nome "Alice" → seleziona avatar dalla galleria (o Salta avatar) → Continua → verifica in Supabase `profiles` + Hive `onboarding_step=1`.
2. Step 2: inserisci "Acme AI" + one-liner 140c (contatore deve scalare, warning giallo a ≤20, blocca >140) oppure "Salta per ora" → Hive `step=2`.
3. **Persistenza half-way:** chiudi app (swipe via) a metà Step 2, riapri → deve ripresentare Step 2 con dati già inseriti (persistiti in Hive). Verifica anche con Step 1→kill→reopen.
4. Step 3: cambia ora a 08:00 o 20:00 con +/- → tap "Entra nella Room →" → dialogo permesso notifiche (concedi) → SnackBar "promemoria alle HH:00" + in Supabase `onboarding_completed_at` valorizzato + Hive `done=true` → naviga a Home (AppShell).
5. Ripeti con **permesso negato:** alla richiesta notifiche, nega → Step 3 deve comunque completare (bottone "Continua senza promemoria" disponibile), con SnackBar "promemoria disattivato" → Home. Riapri → resta Home (non rivedi wizard).
6. Da Home → Profilo → cambia reminder hour → verifica richedulazione.

> **Azione richiesta per CHECKPOINT 3:** demo completa wizard + test persistenza half-way (kill/reopen) + test permesso notifiche concesso vs negato (entrambi devono completare).

---

## Dipendenze Giorno 2

| Package | Versione | Perché |
|---|---|---|
| `image_picker: 1.2.3` | Pick avatar galleria/camera (Step 1) |
| `flutter_local_notifications: 19.5.0` | Promemoria giornaliero locale (Step 3), schedulazione daily |
| `permission_handler: 12.0.3` | Richiesta permesso notifiche iOS/Android moderni (necessario per gestire grant/deny) |
| `timezone: 0.10.1` | TZ per zonedSchedule notifiche locali |

Nessuna modifica a `flutter_lints` / `build_runner`. `flutter pub get` già eseguito.

---

## Cosa funziona end-to-end (verificato)

- [x] `dart analyze` → 1 info residuo (`use_null_aware_elements` linea 226) — 0 errori
- [x] `flutter test --no-pub` → 26/26 pass (auth_onboarding + widget smoke)
- [x] Branch pulito, nessun push su `main`
- [x] Migration RLS verificata in logica (applicazione in Supabase richiede Dashboard SQL Editor — istruzioni sopra)
- [x] Auth flow + routing centralizzato + logout + errori humanized
- [x] Onboarding 3-step con sync Hive+Supabase, resume offline, avatar skippabile, reminder + notifiche con fallback
- [ ] Verifica manuale su device/emulatore dei 3 checkpoint (richiede azione umana + Supabase configurato)

## Decisioni aperte non chiuse

- Conferma fallback #2 (leaderboard solo in-app) — verificato in docs/scope.md, non serve view pubblica. Se vuoi leaderboard pubblica, da pianificare Fase 2 con anon read + view separata.
- OAuth Google — escluso MVP (magic link fallback); aggiungere in Fase 2 se richiesto esplicitamente dallo scope.
- Multi-startup per founder — escluso MVP (1 startup in `profiles.startup_name` per ora; tabella `startups` Giorno 3).

## Prossimo passo

PR da `feature/stackuproom-day2-onboarding-20260912213751` verso `main` (non mergiare) + riepilogo sopra.
