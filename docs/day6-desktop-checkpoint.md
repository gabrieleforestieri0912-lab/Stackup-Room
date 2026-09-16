# Giorno 6 — Checkpoint Desktop Windows (Flutter)

> **Data:** 2026-09-16
> **Branch:** `feature/stackuproom-day6-redesign-desktop`
> **Target:** Solo progetto mobile Flutter (la landing page redesign è nel progetto Next.js root)

---

## ✅ Cosa è stato fatto

### 1. Abilitazione target Windows
- `flutter config --enable-windows-desktop` → abilitato
- `flutter create --platforms=windows .` → directory `windows/` generata (CMake + runner nativo)
- `analysis_options.yaml` già esclude `windows/` dall'analisi

### 2. Layout responsive — NavigationRail sidebar su desktop
**File:** `lib/navigation/app_shell.dart`

- Aggiunto `Breakpoints` import per rilevare la larghezza schermo
- **Mobile (<900px):** `BottomNavigationBar` invariato (6 tab)
- **Desktop (≥900px):** `NavigationRail` sidebar a sinistra con:
  - Logo "SR" con accent color nell'header
  - Label visibili per ogni tab (`NavigationRailLabelType.all`)
  - Indicatore di selezione con `accentSignal` (arancio momentum)
  - Tema coerente con `AppColors`
- `IndexedStack` mantiene lo stato di ogni tab in entrambi i layout
- Breakpoint: `Breakpoints.desktop = 900px` (definito in `core/theme/breakpoints.dart`)

### 3. Notifiche Windows
**File:** `lib/core/notifications/notification_service.dart`

- Aggiunto `import 'dart:io' show Platform;` per rilevare Windows
- `_isWindows` getter: `!kIsWeb && Platform.isWindows`
- **`initialize()`:** Su Windows, `InitializationSettings()` vuoto (toast nativi, no Android/iOS settings)
- **`requestPermission()`:** Su Windows, ritorna `true` di default (toast non richiedono permessi)
- **`hasPermission()`:** Su Windows, ritorna `true`
- **`openSettings()`:** Su Windows, no-op con log
- **`scheduleDailyReminder()`:** Su Windows, usa `periodicallyShow(RepeatInterval.daily)` invece di `zonedSchedule` (quest'ultimo non supporta `matchDateTimeComponents` su Windows)
- Tutte le chiamate Android/iOS restano invariata nel ramo `else`

### 4. Guard platform-specifici
**File:** `lib/features/onboarding/onboarding_screen.dart`

- Opzione "Scatta foto" nascosta su desktop: `if (!kIsWeb && (Platform.isAndroid || Platform.isIOS))`
- `import 'dart:io' show File, Platform;` per gestire entrambi i casi
- Gallery picker (`ImageSource.gallery`) resta disponibile su Windows

### 5. Documentazione
- `docs/desktop-roadmap.md` — Roadmap completa con:
  - Cosa è stato fatto
  - Cosa NON è ancora fatto (installer, deep link Stripe, push remote, multi-window)
  - Comandi per buildare
  - Prerequisiti Windows (con nota su ATL workload)
  - Analisi dipendenze per Windows
  - Known issues (RevenueCat, audio recording)

---

## 🔍 Analisi statica

```
flutter analyze → No issues found!
```

## ⚠️ Build Windows — Note

Il build Windows è stato testato ma fallisce per **motivi di environment**, non di codice:

1. **`atlbase.h` non trovato** → `flutter_local_notifications_windows` richiede il workload "C++ ATL" in Visual Studio
2. **`record_linux` compilato su Windows** → il package `record` include il plugin Linux che viene erroneamente risolto nel build Windows

Entrambi i problemi sono risolvibili:
- **ATL:** Visual Studio Installer → Modifica → workload "Desktop development with C++" → spuntare "C++ ATL"
- **record_linux:** problema noto del package `record` — da verificare con `flutter clean && flutter pub get` dopo aver installato ATL

---

## 📋 Prossimi passi (Fase 2 futura)

1. **Installer Windows:** NSIS o MSIX firmato per distribuzione
2. **Deep link Stripe Connect:** registrazione protocol handler nel Windows Registry
3. **Notifiche push remote:** WebSocket + toast nativi (FCM/APNS non supportati su Windows)
4. **Export dati:** picker cartella desktop + export CSV/report
5. **Multi-window:** `DesktopMultiWindow` plugin per aprire più finestre

---

## 📊 Riepilogo Giorno 6 (solo mobile)

| Area | Stato |
|------|-------|
| Target Windows abilitato | ✅ |
| Layout responsive (sidebar desktop) | ✅ |
| Notifiche Windows | ✅ |
| Guard platform-specifici | ✅ |
| `flutter analyze` | ✅ Pulito |
| Build Windows | ⚠️ Environment (ATL workload mancante) |
| Documentazione desktop | ✅ |
