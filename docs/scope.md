# Stackup Room — Scope Giorno 1

> **Branch:** `feature/stackuproom-day1-<timestamp>`  
> **Piattaforma MVP:** iOS + Android (Flutter). Windows desktop = Giorno 6 (disabilitato fino ad allora).  
> **Stack:** Flutter (Riverpod + Hive) + Supabase (Auth, Postgres, RLS, Edge Functions)  
> **Regola:** nessun push diretto su `main`. Ogni fase = checkpoint umano esplicito. Ambiguo → STOP + domanda.

---

## 1) Conferma naming

**Deciso e non negoziabile:** `Stackup Room`.

### Legame con "Stackup" esistente in portfolio Vertex — verifica

Ricerca effettuata in `Vertex/App/*`, `Vertex/Tech/*`, `Vertex/Web/*` (taskly, vertex, agentcloud):

- **Nessun progetto denominato "Stackup" rilevato** nel portfolio ispezionabile localmente al 2026-09-11.
- In assenza di asset di brand pre-esistenti (logo, palette, design system Stackup), **Stackup Room è trattato come prodotto indipendente dal Giorno 1**.

**Implicazione brand per MVP:**

- Non ereditiamo palette/tono da altri prodotti Vertex per evitare accoppiamento involontario.
- Proposta tono MVP: **"club esclusivo per founder seri"** → dark theme di default, tipografia essenziale, accenti viola profondi su nero/blu notte (coerente con l'estetica già usata in Taskly `0xFF7B39FC / 0xFF0F0F1A` ma declinata come identità autonoma di Stackup Room).
- Se in realtà esiste un progetto "Stackup" non presente in repo locale (es. Figma privato, altro repo non clonato, naming interno diverso), **domanda aperta per te al Checkpoint 1:**

> **Q1 — Vuoi che Stackup Room mantenga coerenza visiva/verbale con un progetto Stackup esistente fuori da questo workspace? Se sì, condividi palette, logo, font e tono di voce, altrimenti confermiamo indipendenza totale e procediamo con identità autonoma proposta qui.**

**Raccomandazione fallback:** in assenza di risposta, **indipendenza totale** + palette dark proprietaria documentata in `lib/core/theme` (Fase 3).

---

## 2) Differenziazione vs competitor

Posizionamento centrale confermato: **daily momentum + accountability**, non leaderboard statica.

| # | Cosa fanno loro | Cosa NON copiamo | Cosa aggiungiamo noi (differenziatore) |
|---|---|---|---|
| 1 | **StartuPage: leaderboard-first** (classifica come home, engagement passivo) | Non mettiamo la leaderboard come unico core loop né come metrica vanity. Non incentiviamo "posizionamento" senza attività giornaliera. | **Daily momentum come metrica primaria:** streak, check-in completati, coerenza settimanale. La leaderboard è *derivata* dal momentum + revenue verificata, non fine a sé stessa. |
| 2 | **Unicorns Club: investor-discovery-first** (matching founder ↔ investor) | Non costruiamo discovery/marketplace investitori in MVP. Niente pitch deck, niente filtri investitore. | **Accountability tra pari:** cerchia ristretta (Room) di founder che si vedono ogni giorno. Pressione sociale orizzontale, non verticale verso VC. |
| 3 | Entrambi: revenue auto-dichiarata o non verificata | Non permettiamo numeri digitati a mano come fonte di ranking. | **Revenue verificata** via integrazione (Stripe/proxy Edge Function) → `revenue_snapshots`. Se non collegata, il founder partecipa al momentum ma non scala la leaderboard revenue (disaccoppiamento esplicito). |
| 4 | Entrambi: feed passivo / directory statica | Non copiamo feed sociale generico, like/commenti infiniti, o directory sfogliabile senza contesto. | **AI coaching digest:** Edge Function che sintetizza i check-in della settimana (pattern, blocchi ricorrenti, suggerimenti). Valore tangibile settimanale, non rumore quotidiano. |
| 5 | Entrambi: onboarding leggero, bassa retention | Non puntiamo su iscrizione rapida senza impegno. | **Rituale giornaliero progettato per retention:** promemoria locale 9:00 (configurabile), testo libero 280 char, stato offline-first (Hive), attrito minimo ma cadenza obbligata. Chi non fa check-in scende — incentivo comportamentale, non cosmetico. |

**Sintesi posizionamento in una frase:** *StartuPage ti mostra dove sei. Unicorns Club ti mostra a chi presentarti. Stackup Room ti fa muovere ogni giorno — e lo prova con numeri veri.*

---

## 3) Feature set MVP realistico — 6 giorni (spietato)

### Core loop MVP (unico flusso che deve funzionare perfetto)

```
onboarding → collegamento startup (opzionale, skippabile) → daily check-in → leaderboard → digest AI settimanale
```

### In scope — Giorni 1-6

| Area | Dettaglio MVP | Note |
|---|---|---|
| **Auth** | Supabase Auth (email+password + magic link come fallback). `profiles` creato via trigger su `auth.users`. | RLS attiva da subito su ogni tabella. Anon key lato client OK; service_role mai nel bundle. |
| **Onboarding** | 3 step: 1) profilo (nome, handle, avatar opzionale) 2) startup opzionale (nome + URL) 3) orario promemoria check-in (default 9:00). Stato salvato in Hive per resume offline. | Skippabile al punto 2 senza bloccare l'accesso. |
| **Startup (1 per founder in MVP)** | CRUD minimale: nome, website, descrizione breve. Collegamento revenue = placeholder UI + Edge Function stub (ritorna mock se Stripe non collegato). | Multi-startup per founder = Fase 2. |
| **Daily check-in** | Testo libero max 280 caratteri, 1 al giorno (unique index su `user_id + date`). Lista storico personale + stato oggi (fatto/mancante). Hive cache ultimo check-in. | Nessuna checklist in MVP (vedi decisioni). |
| **Leaderboard** | Vista `leaderboard` (Postgres VIEW) ordinata su revenue verificata + streak. Solo dentro app autenticata. Filtri: globale + ultimi 7/30 giorni. | Nessuna vetrina pubblica/embed in MVP. |
| **Digest AI settimanale** | Edge Function `ai-digest` (stub LLM, proxata, mai chiave client). Input: check-in ultimi 7gg. Output: 3 bullet coaching + 1 suggerimento azione. Cache in tabella o Hive. | Se LLM non configurato → placeholder deterministico, non blocco. |
| **Navigazione** | Bottom nav: Home/Check-in, Leaderboard, Profilo. Splash minimale + shell. | Adattabile se scope evolve, ma non aggiungere tab in MVP. |
| **Tema** | Dark di default, light opzionale (toggle). Palette esclusiva documentata. | Evita rebuild costosi su liste lunghe (`ListView.builder`, `const` widget, `AnimatedBuilder` solo dove serve). |
| **Error handling** | Stati UI dedicati: offline, Supabase non raggiungibile, sessione scaduta. Mai schermata bianca/crash. |  |
| **Storage locale** | Hive: `onboarding_done`, `last_checkin`, `reminder_hour`, cache leaderboard leggera. | Offline-first minima, non full sync. |
| **Qualità** | `flutter_lints` (riusa config Taskly se disponibile: `include: package:flutter_lints/flutter.yaml`), `flutter analyze` pulito, RLS testata manualmente. |  |

### Fuori scope — Fase 2 (esplicitamente NON in MVP)

- Multi-startup per founder, team/co-founder, ruoli.
- Filtri avanzati leaderboard (per verticale, revenue range, geografia, MRR/ARR switch).
- Notifiche push remote intelligenti/adattive (solo locali in MVP).
- Commenti, like, feed sociale, DM, follow.
- Vetrina pubblica web / embed leaderboard (richiederebbe Next.js separato).
- Onboarding social login (OAuth Google/Apple) — Fase 2 se tempo extra Giorno 6.
- Upload immagini/file, menzioni, hashtag.
- Analytics avanzata, admin panel, moderazione.

### Piano 6 giorni (indicativo, mobile-first)

| Giorno | Obiettivo | Deliverable verificabile |
|---|---|---|
| 1 | Scope + scaffolding + v0 | `docs/scope.md` + app che gira su emulatore + Supabase connesso |
| 2 | Auth + onboarding + profiles | Login/registrazione + onboarding 3-step persistito |
| 3 | Startup + revenue stub + RLS | CRUD startup + Edge Function mock + RLS policy |
| 4 | Daily check-in + Hive | Check-in 280char + storico + vincolo 1/giorno |
| 5 | Leaderboard (view) + digest AI stub | Leaderboard ordinata + Edge Function digest |
| 6 | Polish + Windows desktop enable | Dark theme finale + error states + build Windows smoke test |

---

## 4) User journey primario — dal primo apri-app al primo check-in

1. **Splash/loading** — App apre, inizializza Supabase + Hive, verifica sessione esistente. Se nessuna sessione → vai a 2, altrimenti verifica `onboarding_done` (se falso → 4).
2. **Welcome / Auth** — Schermata con CTA "Entra nella Room" → scelta Registrati / Accedi (email+password). Link "Hai già un account? Accedi". Errore rete mostrato inline, non crash.
3. **Registrazione completata** — Supabase crea `auth.users` → trigger crea `profiles` (handle derivato da email, `onboarding_done=false`). Utente autenticato.
4. **Onboarding Step 1 — Profilo** — Input: nome visualizzato, handle (validazione unicità, max 20 char), avatar opzionale (placeholder se mancante). CTA "Continua".
5. **Onboarding Step 2 — Startup (opzionale)** — Input: nome startup, website (URL validato), descrizione breve (opzionale, max 140 char). CTA "Collega" / "Salta per ora" (skip esplicito, non blocco).
6. **Onboarding Step 3 — Promemoria** — Picker orario (default 9:00). Testo: "Ti ricordiamo il check-in ogni giorno alle…". Salva in Hive + `profiles.reminder_hour`. Schedula notifica locale giornaliera. CTA "Fatto → Entra nella Room".
7. **Home / Check-in (vuoto)** — Bottom nav visibile (Home selezionata). Card "Check-in di oggi — mancante" + campo testo libero (counter 0/280) + CTA "Pubblica check-in". Storico vuoto con empty state "Il tuo primo check-in sarà qui".
8. **Compilazione check-in** — Utente digita max 280 char. Validazione: non vuoto, ≤280, non già inviato oggi. Bottone disabilitato se invalido. Indicatore caratteri residui.
9. **Invio check-in** — POST a `daily_checkins` (RLS: `auth.uid() = user_id`). Su successo: Hive aggiorna `last_checkin`, UI mostra stato "Fatto oggi ✓" + card nello storico in cima. Su errore offline: coda locale + banner "Salvato localmente, sincronizzeremo al ritorno online" (o errore bloccante se RLS fallisce — messaggio chiaro).
10. **Feedback immediato** — Snackbar/toast "Check-in registrato — streak 1 🔥" + suggerimento "Torna domani per mantenere il momentum" + hint "Vedi dove sei in classifica" (link a Leaderboard).
11. **Esplorazione Leaderboard (opzionale ma parte del loop)** — Tab Leaderboard → vista ordinata, utente evidenziato, indicatore "Revenue verificata / non verificata". Se startup non collegata → badge "Collega Stripe per scalare la classifica".
12. **Stato finale Giorno 1 utente** — `profiles.onboarding_done=true`, 1 riga in `daily_checkins` per oggi, Hive sincronizzato, promemoria schedulato. Loop chiuso. Il digest AI arriverà dopo 7 giorni (o stub immediato su dati mock per demo).

> **Criterio di successo MVP del journey:** un nuovo utente su device pulito completa gli step 1-9 in < 90 secondi (escluso tempo di digitazione) senza errori non gestiti, anche in assenza di connessione Stripe.

---

## 5) Modello dati — alto livello (solo nomi entità + intento)

Tutte le tabelle con `RLS ON`, `created_at timestamptz default now()`, `user_id uuid references auth.users` dove applicabile. Nessuna chiave esterna verso service esterno lato client.

```
profiles
  - id (pk, fk auth.users.id)
  - handle (unique, text)
  - display_name (text)
  - avatar_url (text, nullable)
  - onboarding_done (bool, default false)
  - reminder_hour (int, 0-23, default 9)
  - created_at / updated_at
  - RLS: user può leggere tutti i profili (per leaderboard), scrivere solo il proprio

startups
  - id (pk, uuid)
  - owner_id (fk profiles.id)
  - name (text)
  - website (text, nullable)
  - description (text, nullable)
  - created_at
  - RLS: read tutti gli autenticati, write solo owner. Unico vincolo MVP: 1 startup per owner (unique index su owner_id, rimosso in Fase 2)

revenue_snapshots
  - id (pk, uuid)
  - startup_id (fk startups.id)
  - amount_cents (int)              -- sorgente Stripe via Edge Function, mai input manuale in MVP
  - currency (text, default 'EUR'|'USD')
  - period_start / period_end (date)
  - source (text: 'stripe' | 'manual_stub')
  - verified (bool, default true se source=stripe)
  - created_at
  - RLS: read autenticati, write solo via service_role (Edge Function), mai da client diretto

daily_checkins
  - id (pk, uuid)
  - user_id (fk profiles.id)
  - body (text, check length <= 280)
  - checkin_date (date, default current_date, unique(user_id, checkin_date))
  - created_at
  - RLS: read autenticati (per digest/leaderboard derivata), write solo owner. Un check-in al giorno enforced via unique index.

leaderboard (VIEW, non tabella)
  - startup_id, owner_handle, display_name
  - latest_revenue_cents (da revenue_snapshots più recente verificato)
  - streak_days (calcolata da daily_checkins, window 30gg)
  - checkins_last_7d / last_30d (count)
  - rank (row_number() over revenue + streak)
  - Definizione: VIEW materializzata o semplice VIEW in MVP (performance secondaria, < 1k utenti). RLS ereditata dalle tabelle sorgente.

-- Fase 2 (citato solo per non creare la tabella ora)
-- comments, follows, notifications, integrations (multi-provider)
```

**Note RLS/Edge:**

- Tutte le chiamate LLM/API esterne (digest AI, Stripe proxy) passano da Supabase Edge Functions con `supabase.functions.invoke()`. La chiave LLM resta in `supabase secrets`, mai in `lib/` né in `.env` bundelato.
- `revenue_snapshots` è append-only in MVP (nessun update/delete da client).

---

## 6) Decisioni aperte — con fallback espliciti

| # | Decisione | Opzioni | Fallback MVP (se non decidi entro Checkpoint 1) | Impatto se cambi dopo |
|---|---|---|---|---|
| 1 | **Check-in: testo libero o checklist?** | A) 280 char libero, B) checklist 3-5 task, C) ibrido | **A — testo libero max 280 char** (attrito minimo, implementazione 1 campo, validazione semplice) | B richiederebbe schema diverso (`checkin_items` tabella figlia) — migrazione facile ma rifare UI |
| 2 | **Leaderboard pubblica senza login?** | A) solo in-app autenticata, B) pubblica web + embed | **A — solo in-app autenticata in MVP.** Vetrina pubblica = Fase 2 + progetto Next.js separato, fuori scope 6 giorni. | B richiede RLS `anon` read + progetto web + SEO — posticipabile senza debito tecnico |
| 3 | **Notifiche promemoria** | A) orario fisso utente, B) adattivo ML, C) nessuna | **A — orario fisso configurabile in onboarding, default 9:00, notifiche locali (`flutter_local_notifications` schedulate).** Zero infra push server. | B richiede Edge Function + cron + FCM/APNS — Fase 2 |
| 4 | **Collegamento startup obbligatorio?** | A) opzionale/skippabile, B) obbligatorio | **A — opzionale.** Bloccare l'onboarding su Stripe dimezza la conversione e introduce dipendenza esterna critica. | B aumenterebbe qualità leaderboard ma va validato con utenti reali |
| 5 | **Revenue verificata: sorgente unica?** | A) solo Stripe, B) multi-provider (Paddle, LemonSqueezy…) | **A — solo Stripe in MVP** (via Edge Function proxy). Altri provider = Fase 2 con tabella `integrations`. | Estensione Edge Function, non breaking |
| 6 | **Handle unicità e naming Room** | A) handle globale unico, B) display name libero + id opaco | **A — handle unico** (necessario per leaderboard leggibile). Validazione lato DB + UI. | B richiederebbe disambiguazione — sconsigliato |
| 7 | **State management: Riverpod con o senza codegen?** | A) `riverpod_generator` (codegen), B) provider manuali | **A — `riverpod_generator` + `build_runner`** (tipato, testabile, allineato a progetti moderni Flutter 3.x). Se preferisci zero codegen, B è fallback senza costi. — *Da confermare al Checkpoint 1* | Scelta reversibile Giorno 2 mattina, non oltre |
| 8 | **Palette coerente con Vertex esistente?** | A) indipendente, B) riusa Taskly/Vertex | **A — indipendente** (vedi §1) salvo tua indicazione contraria. Proposta dark esclusivo. | Cambio palette = solo `ThemeData`, costo basso |

**Domande per te al Checkpoint 1 (risposta breve ok):**

1. Confermi fallback 1-6 così come scritti, o vuoi invertire uno?
2. Riverpod: preferisci codegen (`riverpod_generator`) o provider manuali? (raccomando codegen — motivo in tabella)
3. Stackup Room: indipendente o coerente con asset Stackup esistenti non presenti in repo locale? Se coerente, condividi asset.
4. Confermi branch naming `feature/stackuproom-day1-<timestamp>` e PR verso `main` senza merge automatico?

---

## Vincoli trasversali (non negoziabili in MVP)

- **RLS attiva su ogni tabella** da creazione (nessuna tabella senza policy).
- **Nessuna chiave LLM/service-role nel bundle mobile.** Tutto via Edge Function (`supabase/functions/*`).
- **Animazioni:** `AnimatedBuilder`/`ImplicitlyAnimatedWidget` solo dove serve; liste lunghe = `const` + `ListView.builder`, niente `setState` su parent di liste.
- **Windows + PowerShell:** comandi `flutter`, `supabase` via terminale Cursor/PowerShell. iOS simulatore richiede macOS — su Windows si verifica su Android emulator (conferma al Checkpoint 2).
- **Analisi statica:** `flutter_lints` (config Taskly `package:flutter_lints/flutter.yaml` riusata se presente) + `flutter analyze` verde prima di ogni checkpoint.

---

## Checkpoint 1 — STOP

**Questo documento è l'unico artefatto della Fase 1 (no codice).**

**Per procedere alla Fase 2 ho bisogno di un tuo "Confermato" esplicito su:**
- Scope MVP vs Fase 2 (§3) — soprattutto cosa resta fuori.
- Fallback decisioni (§6) — quali tieni, quali cambi.
- Naming/branding indipendente vs coerente (§1 Q1).
- Scelta Riverpod codegen vs manuale.

> Non inizializzo `flutter create`, non tocco `pubspec.yaml`, non creo tabelle Supabase finché non dai il via. Se qualcosa è ambiguo, lo chiarisco ora — non assumo.
