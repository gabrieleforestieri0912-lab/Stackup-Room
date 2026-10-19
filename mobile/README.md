# Stackup Room — App Mobile (Flutter)

App Flutter della **sezione Room** di Stackup Room: Oggi (standup, streak, task),
Club (chat live), Coach (AI) e Tu (profilo, startup, GitHub).

Parla con le **stesse API Next.js** del sito web (deploy Vercel), quindi non serve
alcun backend extra: stesso account, stessi dati.

## Requisiti

- Flutter 3.x stabile (`flutter --version`)
- Il sito web deployato (di default usa `https://stackup-room.vercel.app`)

## Setup

Da dentro questa cartella (`mobile/`):

```bash
# 1. Genera le cartelle delle piattaforme (android/, ios/...) — una tantum
flutter create . --project-name stackup_room_mobile --org com.stackuproom

# 2. Dipendenze
flutter pub get

# 3. Avvia
flutter run
```

### Configurazione (opzionale)

Tutto passa da `--dart-define`:

```bash
# API su un altro dominio (es. build di preview)
flutter run --dart-define=API_BASE=https://il-tuo-dominio.vercel.app

# Accesso via codice email (OTP): serve l'URL Supabase del progetto
flutter run --dart-define=SUPABASE_URL=https://xxxx.supabase.co
```

Di default l'accesso è con **email + password** (le stesse credenziali del sito).
L'OTP via email richiede `SUPABASE_URL` perché il codice va scambiato con una
sessione direttamente su Supabase.

## Struttura

```
lib/
├── main.dart                 # Provider + routing (login ↔ room)
├── config.dart               # API_BASE / SUPABASE_URL (dart-define)
├── theme.dart                # Tema scuro Room (teal #4DE0C9)
├── services/
│   ├── api_client.dart       # HTTP + Bearer token + SSE (coach)
│   └── auth_service.dart     # Login password / OTP, sessione salvata
├── state/room_state.dart     # Profilo, startup, streak condivisi
├── models/models.dart        # Startup, ChatMessage, Task, Standup, Streak
├── widgets/common.dart       # SectionCard, righe, formattazione date
└── screens/
    ├── login_screen.dart     # Accesso (password o codice email)
    ├── shell_screen.dart     # Navigazione: Oggi · Club · Coach · Tu
    ├── today_screen.dart     # Saluto, streak, standup, task
    ├── club_screen.dart      # Chat live (polling 5s)
    ├── coach_screen.dart     # Coach AI in streaming (SSE)
    ├── you_screen.dart       # Profilo, numeri, startup, GitHub
    └── settings_screen.dart  # Profilo, consenso IA, supporto, esci
```

## Endpoint usati

| Sezione | Endpoint |
|---|---|
| Login | `POST /api/auth/login`, `POST /api/auth/otp/request`, `POST /api/auth/otp/verify` |
| Oggi | `GET /api/room/streak`, `POST /api/room/streak`, `GET/POST /api/room/standups`, `GET /api/room/tasks`, `PATCH /api/room/tasks/:id` |
| Club | `GET /api/room/chat?since=…`, `POST /api/room/chat` |
| Coach | `POST /api/room/coach` (SSE: `session_id`, `text`, `done`, `error`) |
| Tu | `GET /api/room/profile`, `PATCH /api/room/profile`, `GET /api/room/startups`, `GET /api/room/github` |

## Build release

```bash
# Android (APK)
flutter build apk --release

# iOS (da macOS)
flutter build ios --release
```
