# Stackup Room

Social network verticale per founder indie — daily check-in, leaderboard revenue verificata, digest AI.

Stack: Flutter (Riverpod + Hive) + Supabase (Auth, Postgres, RLS, Edge Functions).

> Branch Giorno 1: `feature/stackuproom-day1-<timestamp>` — nessun push diretto su `main`.

## Quick start (Windows + PowerShell)

```powershell
flutter pub get
# opzionale: configura Supabase
Copy-Item .env.example .env
# edita SUPABASE_URL / ANON_KEY — mai service_role
flutter analyze
flutter test
flutter emulators --launch Pixel_9
flutter run -d Pixel_9
# oppure con dart-define:
flutter run --dart-define=SUPABASE_URL=https://... --dart-define=SUPABASE_ANON_KEY=...
```

## Struttura

```
lib/
  core/{env,supabase,storage,theme,widgets}
  features/{auth,checkin,leaderboard,profile,splash}
  navigation/app_shell.dart
  main.dart
docs/scope.md
```

Vedi `docs/scope.md` per MVP 6 giorni, user journey e modello dati.

## Tema

Dark default (club esclusivo) — `lib/core/theme/app_theme.dart:10`.
