# Store Privacy — Stackup Room (Giorno 5 Fase 2)

> Bozza compilata per **App Store Connect > Privacy Nutrition Label** e **Google Play > Data Safety**.
> Sii preciso — dichiarazioni imprecise sono causa comune di rifiuto in review (Apple in particolare).
> Aggiorna questo file ad ogni nuova raccolta dati e ricopia i valori nei form store prima della submission.

---

## 1) Principio

- **Nessun dato venduto a terze parti, nessun tracking cross-app.**
- Tutti i dati sono funzionali all'app (account, social tra founder, leaderboard verificata).
- Stripe: accesso **read-only** via Edge Function `stripe-verify` (service_role). La app apre eventualmente un browser esterno per Stripe Connect — non è un pagamento per contenuto digitale, quindi **non viola** la guideline Apple 3.1.1 (IAP). Verificato: §3.1.3(b) consente pagamenti esterni per beni/servizi fuori dall'app.
- RevenueCat (IAP): gestisce gli abbonamenti (3/6/12 mesi) con StoreKit / Play Billing — conforme IAP.

---

## 2) Apple App Privacy — Nutrition Label

Compila in App Store Connect > App Privacy. Per ogni **Data Type** indica: *Linked to You* (sì), *Used to Track You* (no), *Purpose*.

| Categoria Apple | Data Type | Raccolto | Collegato a te | Tracciamento | Scopo dichiarato |
|---|---|---|---|---|---|
| **Contact Info** | Email Address | Sì (Supabase Auth) | Sì | No | **App Functionality** — Creazione account e login. |
|  | Name (display_name) | Sì | Sì | No | **App Functionality** — Profilo founder e leaderboard. |
| **Photos or Videos** | Photos or Videos (avatar) | Sì, solo se utente seleziona immagine | Sì | No | **App Functionality** — Avatar profilo. Opzionale, skippabile. Niente accesso background. |
| **Financial Info** | Purchase History (RevenueCat) | Sì, se acquista abbonamento | Sì | No | **App Functionality** — Sblocco feature paywalled (leaderboard comparativa, community, AI unlimited). Gestito via StoreKit, non raccogliamo carta. |
|  | Other Financial Info (Stripe MRR) | Sì, solo se collega Stripe via `stripe-verify` | Sì | No | **App Functionality** — Revenue verificata per ranking leaderboard. Read-only, via Edge Function. Mock se non collegato. |
| **Contacts** | — | No | — | — | Non raccolto. |
| **User Content** | Other User Content (check-in, one-liner, portfolio) | Sì | Sì | No | **App Functionality** — Check-in 280 char, descrizione startup, post community. |
| **Identifiers** | User ID (Supabase `auth.users.id`) | Sì | Sì | No | **App Functionality** — Identificazione account. |
| **Usage Data** | Product Interaction (analytics minimali) | Sì (vedi Fase 4) | Sì | No | **Analytics** + **App Functionality** — Eventi `signup_completed`, `first_checkin_completed`, etc. Tabella Supabase `analytics_events`, no SDK esterno. |
| **Diagnostics** | Crash Data / Performance | No (differito) | — | — | Crash report nativi Play Console / App Store Connect per primo lancio (coerente con "defer infra until demand is proven"). Sentry valutato ma non integrato in MVP. |

**Risposte alle domande Apple:**

- *Do you or your third-party partners collect data from this app?* → **Yes** (sopra).
- *Is any data used to track you?* → **No**. Nessun tracking cross-app, nessun ad network.
- *Data linked to user identity?* → **Yes** per i tipi sopra (account necessario).
- *Do you collect data for tracking purposes?* → **No.**

**Terze parti dichiarate:** Supabase (hosting), RevenueCat (IAP), Stripe (solo se l'utente collega, via proxy), GitHub OAuth (solo se collega, via `github-sync`).

---

## 3) Google Play — Data Safety

Compila in Play Console > Policy > Data safety (stesso perimetro, mapping Google).

**Data collected and shared:**

| Google Data Type | Raccolto | Condiviso con terze parti | Obbligatorio / Opzionale | Scopo |
|---|---|---|---|---|
| Name | Sì | No | Obbligatorio (profilo) | App functionality |
| Email address | Sì | No | Obbligatorio | Account management |
| Photos (avatar) | Sì | No | Opzionale | App functionality |
| App activity (check-in, interactions) | Sì | No | Obbligatorio | App functionality |
| Purchases (in-app) | Sì | No (RevenueCat proxy a Store) | Opzionale | App functionality |
| Financial info (MRR via Stripe) | Sì | No (read-only proxy) | Opzionale | App functionality |
| Crash logs | No (usa Play Console nativi) | — | — | — |

- **Encryption in transit:** Sì (HTTPS + Supabase TLS).
- **Data deletion:** Utente può richiedere cancellazione (elimina riga `profiles` → cascade + `auth.users` delete; storage avatar rimosso). Da esporre come opzione in Settings/Profilo prima del lancio pubblico.
- **Target audience:** 18+, non bambini.

---

## 4) Permessi runtime e stringhe di spiegazione

Tutti i permessi richiesti hanno **spiegazione contestuale** mostrata prima della richiesta di sistema (pre-permission rationale in-app) + stringa OS.

| Permesso | Piattaforma | Stringa OS | Rationale in-app (mostrata prima del prompt) |
|---|---|---|---|
| **Fotocamera** | iOS `NSCameraUsageDescription` | *"Stackup Room usa la fotocamera solo se scegli di scattare la foto del tuo avatar durante l'onboarding o in Profilo. Nessun altro uso. Puoi sempre saltare questo passaggio."* | Sheet "Scegli avatar" → opzione "Scatta foto" con sottotitolo esplicativo. Skippabile. |
| **Galleria / Photo Library** | iOS `NSPhotoLibraryUsageDescription` / Android `READ_MEDIA_IMAGES` (via `image_picker`) | *"Stackup Room accede alla galleria solo se scegli un'immagine per l'avatar. L'immagine viene caricata sul tuo profilo (bucket avatars) e puoi rimuoverla in qualsiasi momento."* | Stesso sheet + testo hint. |
| **Notifiche** | iOS `UNUserNotificationCenter` / Android `POST_NOTIFICATIONS` (`AndroidManifest`) | Permesso runtime (Android 13+ / iOS) | Onboarding Step 3: *"Ti ricordiamo il check-in ogni giorno alle HH:00. Puoi disattivare in qualsiasi momento dalle impostazioni."* Se negato → fallback "Continua senza promemoria" (non blocca). |
| **Exact Alarm** | Android `USE_EXACT_ALARM` / `SCHEDULE_EXACT_ALARM` | Manifest `flutter_local_notifications` | Usato per promemoria giornaliero locale 9:00 (default). Spiegato in Step 3 + Settings. |
| **Boot Completed** | Android `RECEIVE_BOOT_COMPLETED` | Manifest | Rischedula promemoria dopo riavvio — nessun dato aggiuntivo. |

**Verifica Anti-rifiuto:**
- [x] Ogni permesso ha `NS*UsageDescription` completa e veritiera (non generica).
- [x] Nessun permesso richiesto all'avvio — solo su azione utente (avatar picker / Step 3 reminder).
- [x] Ogni permesso è skippabile/rifiutabile senza bloccare il core loop.
- [x] `UIBackgroundModes: remote-notification` già presente — usato solo per notifiche locali (non push remote) — rimosso se non necessario prima della submission finale (valutare).

---

## 5) Collegamento Stripe — conformità App Store Review Guidelines

- Flusso attuale: `stripe-verify` Edge Function + eventuale apertura browser esterno per Stripe Connect (OAuth). L'app **non vende contenuti digitali** via Stripe.
- **Guideline rilevante:** 3.1.1 (IAP) si applica solo a beni/servizi digitali consumati nell'app. Stripe per verifica revenue (dato esterno, non acquisto in-app) **non richiede IAP** — confermato da §3.1.3(b) e da precedenti approvazioni di app con Stripe Connect per dashboard.
- **Azione prima della submission:** verifica testo esatto della guideline aggiornata (Apple la modifica periodicamente) e includi nota per il reviewer: *"Stripe Connect is used solely to verify external business revenue for leaderboard ranking (read-only). No digital goods are purchased via Stripe. Subscriptions are handled via In-App Purchase (RevenueCat/StoreKit)."*
- Se il reviewer chiede chiarimento, rispondi con questa distinzione + link alla privacy policy che la descrive.

---

## 6) Checklist pre-submission (privacy)

- [ ] Copia questa tabella in App Store Connect > App Privacy (seleziona i Data Types elencati).
- [ ] Copia in Play Console > Data safety (stessi tipi, flag encryption + deletion).
- [ ] Verifica che `Info.plist` contenga le due stringhe `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` esatte (vedi §4).
- [ ] Verifica che `AndroidManifest.xml` non richieda permessi non dichiarati (nessun `CAMERA` se non necessario — `image_picker` lo aggiunge solo se usi camera, altrimenti rimosso dopo `flutter build` check con `aapt dump permissions`).
- [ ] Aggiungi link privacy policy pubblico in entrambi gli store (vedi `docs/legal/*` Fase 3) — obbligatorio, non basta il testo in-app.

---

*Ultimo aggiornamento: 2026-09-14 — Giorno 5 Fase 2. Mantieni sincronizzato con `supabase/migrations/*` e `pubspec.yaml` (nuove integrazioni = riga in tabella).*
