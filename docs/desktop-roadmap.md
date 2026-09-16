# Stackup Room — Desktop Windows Build

> **Stato:** MVP desktop abilitato (Giorno 6).
> **Target:** Windows desktop nativo Flutter — stesso codebase mobile, nessun wrapper esterno.

---

## Cosa è stato fatto (Giorno 6)

### 1. Abilitazione target Windows
- `flutter config --enable-windows-desktop`
- `flutter create --platforms=windows .` → directory `windows/` generata con runner nativo
- Build system: CMake (generato automaticamente da Flutter)

### 2. Layout responsive — sidebar su desktop
- `AppShell` adattato con `LayoutBuilder` + `Breakpoints` (≥900px → `NavigationRail` sidebar)
- Su mobile/tablet (<900px): `BottomNavigationBar` (invariato)
- Su desktop (≥900px): `NavigationRail` con label visibili, indicatore accent, logo "SR" in header
- `IndexedStack` mantiene lo stato di ogni tab in entrambi i layout

### 3. Notifiche Windows
- `NotificationService` adattato per Windows: toast nativi Windows via `flutter_local_notifications`
- Su Windows, `requestPermission()` ritorna `true` di default (toast non richiedono permessi)
- `scheduleDailyReminder` usa `periodicallyShow` con `RepeatInterval.daily` (zonedSchedule non supportato su Windows con matchDateTimeComponents)
- `openSettings()` è no-op su Windows (notifiche toast sempre attive)

### 4. Guard platform-specifici
- **Camera**: opzione "Scatta foto" nascosta su desktop (solo Android/iOS)
- **Image Picker**: `pickImage(source: ImageSource.gallery)` funziona su Windows
- **Audio Recording**: `record` package supporta Windows con encoder AAC-LC
- **Audio Playback**: `audioplayers` supporta Windows nativamente
- **URL Launcher**: `url_launcher` supporta Windows

---

## Cosa NON è ancora fatto (Fase 2 futura)

### Installer Windows
- Oggi: semplice eseguibile/cartella nella build output
- Futuro: installer NSIS o MSIX firmato per distribuzione
- **Non bloccante per il primo test** — un eseguibile `.exe` funzionante è sufficiente

### Deep link Stripe Connect (Giorno 4)
- Il protocol handler custom per Stripe Connect (`com.stackuproom://callback`) va registrato anche per il target Windows
- Su Windows, i protocol handler si registrano nel Windows Registry
- **Da fare**: registrazione protocol handler Windows + test end-to-end Stripe Connect

### Notifiche push remote (Fase 2)
- Le notifiche push remote (FCM/APNS) non sono supportate su Windows desktop
- Alternativa Windows: push tramite WebSocket + toast nativo (come fatto per le notifiche locali)
- **Da valutare**: se il push remoto è critico per desktop, serve un servizio push Windows dedicato

### OneDrive / File system desktop
- Su desktop, gli utenti potrebbero voler esportare dati (CSV leaderboard, report)
- **Da fare**: picker cartella desktop + export funzionale

### Multi-window
- Su desktop, gli utenti potrebbero voler aprire più finestre (es. leaderboard + check-in)
- **Da fare**: `DesktopMultiWindow` plugin o multi-window nativo Flutter

---

## Come buildare

```bash
cd mobile

# Verifica prerequisiti
flutter doctor -v  # deve mostrare "Visual Studio - develop for Windows" ✅

# Build release
flutter build windows --release

# Output
build/windows/x64/runner/Release/
├── stackup_room.exe
├── flutter/
│   └── flutter_windows.dll
└── ... (其他的 DLL)
```

### Prerequisiti Windows
- Flutter ≥ 3.x
- Visual Studio 2022 con workload "Desktop development with C++" **E** "C++ ATL"
- Windows 10 SDK (10.0.17763.0 o superiore)
- CMake 3.14+ (incluso in Visual Studio)

> **Nota build environment:** il workload "C++ ATL" è necessario per `flutter_local_notifications_windows`.
> Se manca, il build fallisce con `atlbase.h: No such file or directory`.
> Aggiungerlo da Visual Studio Installer → Modifica → workload "Desktop development with C++" → spuntare "C++ ATL".

---

## Note architetturali

### Codebase condivisa
- **100% condivisa** con mobile: repository, Riverpod providers, Supabase client, Hive cache
- Nessuna duplicazione logica — il target Windows è solo un "contenitore" diverso
- `main.dart` identico per entrambi i target

### Layout differenziato
- Mobile: bottom nav (6 tab)
- Desktop: sidebar NavigationRail (6 destination, stesse tab)
- `Breakpoints.desktop = 900px` → breakpoint centralizzato in `core/theme/breakpoints.dart`
- `TwoPaneLayout` già presente per layout 2-colonne su desktop (leaderboard + dettaglio, community + canali)

### Dipendenze analizzate per Windows

| Package | Supporto Windows | Note |
|---------|-----------------|------|
| `flutter_riverpod` | ✅ | Puro Dart |
| `supabase_flutter` | ✅ | HTTP client, funziona ovunque |
| `hive` / `hive_flutter` | ✅ | File-based, supporta Windows |
| `flutter_local_notifications` | ✅ | Toast nativi Windows |
| `permission_handler` | ⚠️ | Limitato su Windows (notifiche auto-concesse) |
| `image_picker` | ✅ | Gallery picker funziona |
| `record` | ✅ | Audio recording con AAC-LC |
| `audioplayers` | ✅ | Playback audio nativo |
| `url_launcher` | ✅ | Apre browser di sistema |
| `purchases_flutter` | ⚠️ | RevenueCat: supporto desktop da verificare |
| `timezone` | ✅ | Puro Dart |

### Known issues / Rischi noti
1. **RevenueCat (`purchases_flutter`)**: il supporto Windows desktop non è documentato ufficialmente. Potrebbe non funzionare. Fallback: skip inizializzazione su Windows (già gestito con try/catch in `main.dart`)
2. **`flutter_local_notifications` su Windows**: usa toast nativi Windows 10/11. Non supporta `zonedSchedule` con `matchDateTimeComponents` — usato `periodicallyShow` come alternativa
3. **Audio recording su Windows**: richiede permesso microfono (gestito da Windows itself, non da Flutter)
