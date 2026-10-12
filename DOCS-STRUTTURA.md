# StackUp — Documentazione della Struttura

## Architettura Generale

StackUp è una piattaforma Next.js 16 per l'apprendimento della programmazione: corsi a pagamento, guide, percorsi di carriera e un'area utente con dashboard, ordini e certificati.

**Stack:** Next.js 16.2.2 (App Router + Turbopack in dev), React 19, TypeScript, Tailwind CSS 4, Supabase (Auth + PostgreSQL), Stripe, Resend, Framer Motion, react-hot-toast, lucide-react.

> ⚠️ **Architettura ibrida**: il sito è in **App Router** (`src/app/`), ma parte dell'area utente è ancora in **Pages Router legacy** (`src/pages/`). La migrazione completa ad App Router è un lavoro in corso (vedi §9).

---

## 1. Variabili d'Ambiente (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL              # URL progetto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY         # Chiave anonima (pubblica)
SUPABASE_SERVICE_ROLE_KEY             # Service role (SOLO server-side)
STRIPE_SECRET_KEY                     # Chiave segreta Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    # Chiave pubblicabile Stripe
STRIPE_WEBHOOK_SECRET                 # Segreto webhook Stripe
NEXT_PUBLIC_APP_URL                   # URL base app (es. http://localhost:3000)
NEXT_PUBLIC_CONTACT_EMAIL             # Email di contatto
RESEND_API_KEY                        # API key Resend (email)
RESEND_FROM_EMAIL                     # Mittente email Resend
NEXT_PUBLIC_GA_ID                     # Google Analytics (opzionale)
```

---

## 2. Struttura delle Directory

```
/
├── .env.local                    # Variabili d'ambiente (gitignored)
├── next.config.mjs               # Config Next.js (React Compiler, headers CORS, images)
├── package.json                  # Dipendenze e script
├── DOCS-STRUTTURA.md             # Questo file
│
├── public/                       # Asset statici
│   ├── stackup.png / stackup-og.svg   # Logo e immagine OG
│   ├── course-placeholder.svg
│   ├── robots.txt / sitemap.xml
│
├── supabase/migrations/
│   └── 002_full_schema.sql       # Schema completo (tabelle, RLS, RPC)
│
└── src/
    ├── app/                      # APP ROUTER (marketing + API)
    │   ├── layout.tsx            #   Root layout: font, metadata, Analytics, ErrorBoundary
    │   ├── providers.tsx         #   AuthProvider + Toaster
    │   ├── globals.css           #   Tailwind + stili globali
    │   ├── not-found.tsx
    │   ├── (public)/             #   Pagine pubbliche
    │   │   ├── layout.tsx        #   Navbar + Footer (layout condiviso)
    │   │   ├── page.tsx          #   Homepage
    │   │   ├── courses/          #   Catalogo + dettaglio corso
    │   │   ├── paths/ path/      #   Percorsi di carriera
    │   │   ├── guide/            #   Guide (index + dettaglio)
    │   │   ├── resources/        #   Risorse (index + dettaglio)
    │   │   ├── ai-skills/        #   Skill AI (dettaglio)
    │   │   ├── login/ register/  #   Auth con layout propri
    │   │   ├── forgot-password/ reset-password/
    │   │   ├── auth/callback/    #   Callback OAuth Supabase
    │   │   └── contact/ privacy/ terms/
    │   └── api/                  #   API ROUTES (vedi §4)
    │
    ├── pages/                    # PAGES ROUTER LEGACY (area utente)
    │   ├── _app.tsx / _document.tsx / 404.tsx
    │   ├── globals.css
    │   ├── dashboard.tsx         #   Dashboard utente
    │   ├── settings.tsx          #   Impostazioni profilo/password
    │   ├── my-courses.tsx        #   Corsi acquistati
    │   ├── orders.tsx            #   Storico ordini
    │   ├── certificates/         #   Certificati (index + dettaglio/stampa)
    │   └── courses/preview/[slug].tsx
    │
    ├── components/
    │   ├── layout/               #   Navbar, Footer, DashboardSidebar
    │   ├── course/               #   ExerciseComponent (editor + test)
    │   └── ui/                   #   Analytics, Badge, Card, ErrorBoundary, SEO, SectionTitle, TopBar
    │
    ├── context/
    │   └── AuthContext.tsx       # Stato auth globale (sessione + token)
    │
    ├── lib/
    │   ├── supabase.ts           #   Client browser (@supabase/ssr)
    │   ├── supabase-admin.ts     #   Client service role (server-side) + helper profilo/streak
    │   ├── auth-token.ts         #   getAccessToken(): sessione viva + fallback localStorage
    │   ├── rateLimit.ts          #   Rate limiter via RPC Supabase
    │   └── fetcher.ts            #   apiFetch (client, con timeout)
    │
    ├── data/                     # Dati statici (landing, preview corsi, AI skills)
    └── scripts/                  # Script standalone (seed corsi, check prezzi)
```

---

## 3. Pagine — Mappa e Descrizione

### App Router (`src/app/`)

| Route | File | Auth | Contenuto |
|-------|------|------|-----------|
| `/` | `(public)/page.tsx` | No | Homepage: hero, risorse, corsi, prezzi, FAQ, percorsi |
| `/courses` | `(public)/courses/page.tsx` | No | Catalogo corsi (da API) |
| `/courses/[slug]` | `(public)/courses/[slug]/page.tsx` | No* | Dettaglio corso + acquisto (contenuti gated) |
| `/paths` | `(public)/paths/page.tsx` | No | Percorsi di carriera |
| `/path/[slug]` | `(public)/path/[slug]/page.tsx` | No | Dettaglio percorso |
| `/guide` | `(public)/guide/page.tsx` | No | Guide pratiche |
| `/guide/[slug]` | `(public)/guide/[slug]/page.tsx` | No | Dettaglio guida |
| `/resources` | `(public)/resources/page.tsx` | No | Risorse e strumenti |
| `/resources/[slug]` | `(public)/resources/[slug]/page.tsx` | No | Dettaglio risorsa |
| `/ai-skills/[slug]` | `(public)/ai-skills/[slug]/page.tsx` | No | Dettaglio AI skill |
| `/login` | `(public)/login/page.tsx` | No | Login email/password + OAuth |
| `/register` | `(public)/register/page.tsx` | No | Registrazione + OAuth |
| `/forgot-password` | `(public)/forgot-password/page.tsx` | No | Reset password |
| `/reset-password` | `(public)/reset-password/page.tsx` | No | Nuova password |
| `/auth/callback` | `(public)/auth/callback/page.tsx` | No | Callback OAuth / recovery |
| `/contact` | `(public)/contact/page.tsx` | No | Form contatti |
| `/privacy` `/terms` | `(public)/privacy|terms/page.tsx` | No | Pagine legali |

\* Il dettaglio corso mostra i metadati a tutti, ma **contenuti/video/esercizi sono visibili solo agli iscritti** (gating server-side, vedi §8).

### Pages Router legacy (`src/pages/`)

| Route | File | Auth | Contenuto |
|-------|------|------|-----------|
| `/dashboard` | `pages/dashboard.tsx` | Sì | Dashboard utente (stats, ordini) |
| `/settings` | `pages/settings.tsx` | Sì | Profilo, password, collegamenti account |
| `/my-courses` | `pages/my-courses.tsx` | Sì | Corsi acquistati |
| `/orders` | `pages/orders.tsx` | Sì | Storico ordini |
| `/certificates` | `pages/certificates/index.tsx` | Sì | Certificati ottenuti |
| `/certificates/[id]` | `pages/certificates/[id].tsx` | Sì | Certificato / stampa PDF |
| `/courses/preview/[slug]` | `pages/courses/preview/[slug].tsx` | No | Preview corso / upsell |
| `/404` | `pages/404.tsx` | No | Pagina non trovata (legacy) |

---

## 4. API Routes (`src/app/api/`)

| Metodo | Route | Auth | Descrizione |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | Rate-limit | Login Supabase → user + token + refreshToken |
| POST | `/api/auth/register` | Rate-limit | Registrazione (crea utente, profilo e sessione) |
| GET | `/api/auth/me` | Bearer | Profilo utente corrente |
| POST | `/api/auth/update-profile` | Bearer | Aggiorna nome/email |
| POST | `/api/auth/change-password` | Bearer | Cambia password |
| POST | `/api/auth/forgot-password` | Rate-limit | Invia link reset |
| POST | `/api/auth/reset-password` | Bearer | Imposta nuova password |
| POST | `/api/auth/supabase-callback` | Bearer | Sync profilo OAuth (identità dal JWT) |
| POST | `/api/auth/activity` | Bearer | Attività utente (streak) |
| GET | `/api/courses` | No | Lista corsi pubblicati (paginata, filtri) |
| GET | `/api/courses/[slug]` | No* | Dettaglio corso (contenuti gated per iscritti + gating moduli) |
| GET | `/api/courses/enrolled` | Bearer | Corsi dell'utente |
| GET | `/api/certificates` | Bearer | Certificati utente |
| POST | `/api/certificates` | Bearer | Genera certificato (verifica enrollment, idempotente) |
| POST | `/api/contact` | No | Form contatti → Resend + tabella messages |
| GET | `/api/orders` | Bearer | Ordini utente |
| POST | `/api/progress/exercises` | Bearer | Salva esercizio completato (XP + streak, una sola volta; segnala checkpoint superato) |
| POST | `/api/payments/create-checkout` | Bearer | Sessione Stripe Checkout |
| POST | `/api/payments/webhook` | Stripe sig | Webhook: enrollment + transaction |

Tutte le route sono `runtime = 'nodejs'`. Le route protette validano il token con `getAuthUser()` (service role) e restituiscono i dati solo dell'utente autenticato.

---

## 5. Database (Supabase PostgreSQL)

Lo schema è versionato in `supabase/migrations/`:
- `002_full_schema.sql` — **schema completo idempotente**: tutte le tabelle, indici, vincoli, RLS e funzioni RPC (eseguibile nel SQL Editor anche su DB esistente)

Tabelle:
- **profiles** — Profili utente (`id` = `auth.users.id`)
- **courses** — Corsi (slug univoco, prezzo, tags/array, is_published; blueprint: `subtitle`, `outcome`, `lesson_duration`, `stack_version`, `prerequisite_check`, `prerequisite_course_id`/`next_course_id` per i percorsi)
- **sections** — Moduli di un corso (colonna riservata `"order"`; blueprint: `objective`, `checkpoint_title`/`checkpoint_description`, `starter_repo_url`/`solution_repo_url`, `cheat_sheet`, `docs_links`/`troubleshooting` JSONB, `ai_prompt`)
- **exercises** — Lezioni (test_cases/hints JSONB; blueprint: formato 5 punti `why`/`how`/`common_errors`/`checkpoint`, flag `is_checkpoint` per il gating)
- **enrollments** — Iscrizioni (unique `user_id + course_id`)
- **certificates** — Certificati (certificate_id univoco)
- **transactions** — Pagamenti Stripe (unique `stripe_session_id + course_id` per dedup webhook)
- **messages** — Messaggi del form contatti
- **free_exercises** — Catalogo esercizi liberi
- **exercise_progress** — Esercizi completati per utente (unique `user_id + exercise_id`, punti XP)
- **blog_posts** — Articoli blog (per ora non usata dal codice)
- **rate_limits** — Rate limiting

Funzioni RPC:
- `increment_rate_limit(p_key, p_window_ms, p_max_requests)` → JSONB
- `increment_enrollment_count(course_id)` → incrementa il contatore iscritti (usata dal webhook)

**RLS**: policy conservative — gli utenti autenticati leggono/aggiornano solo i propri dati; il service role (usato da tutte le API) bypassa le policy. Sezioni/esercizi non hanno policy di lettura pubbliche.

---

## 6. Autenticazione

Flusso reale (fix del token applicato):

1. **Login/registrazione** → le API restituiscono `user`, `token` (access token) e `refreshToken`.
2. `AuthContext` chiama `supabase.auth.setSession()` → la sessione sopravvive al refresh — **e** persiste il token in `localStorage('token')`.
3. Sul mount, `AuthContext` ripristina la sessione da Supabase e sincronizza il token.
4. Le chiamate autenticate usano `getAccessToken()` (`src/lib/auth-token.ts`): sessione viva Supabase (auto-rinnovata) con fallback sul token persistito.
5. **OAuth** (Google/GitHub): redirect a `/auth/callback`, il client ha già la sessione; `supabase-callback` sincronizza/crea il profilo dal JWT.

Provider: email/password, Google, GitHub. Il `logout` rimuove sessione e token.

---

## 7. Pagamenti (Stripe)

1. Utente clicca "Acquista ora" sulla pagina corso → `POST /api/payments/create-checkout` (Bearer token).
2. La route valida l'utente, **legge titolo e prezzo dal DB** e crea la sessione Checkout (metadati: `userId`, `courseIds`).
3. Redirect a Stripe → `success_url=/dashboard?success=true`.
4. Webhook `checkout.session.completed` (firma verificata) → crea `transactions` (dedup su `stripe_session_id + course_id`) + `enrollments` (upsert) + incrementa `enrollment_count`.

> Nota: il percorso singolo e quello carrello (`items`) di create-checkout leggono **sempre** titolo e prezzo dal DB (mai dal client): la vulnerabilità del prezzo è chiusa.

---

## 8. Protezione Contenuti e Gating Moduli

I contenuti a pagamento sono protetti **server-side** in `GET /api/courses/[slug]`:
- **Non iscritti**: sezioni → solo `title/description/duration/order`; esercizi → solo metadati (niente `content`, `video_url`, `instructions`, `starter_code`, `hints`, `solution`, `test_cases`).
- **Iscritti** (enrollment verificato dal token): ricevono tutto **tranne i moduli bloccati dal gating**.
- Solo i corsi con `is_published = true` sono serviti.

Nell'UI i non iscritti vedono lucchetti e messaggi "riservato ai membri".

### Gating moduli (blueprint StackUp)

Ogni corso è organizzato in **moduli** (sezioni) che terminano con un **checkpoint pratico** (esercizio marcato `is_checkpoint = true`):

- Un modulo è **sbloccato** solo se il checkpoint del modulo precedente è stato completato (riga in `exercise_progress`) — il primo modulo è sempre sbloccato.
- Il gating è calcolato **server-side** nella route: i moduli bloccati non ricevono `content`, `video_url` né i materiali (repo, cheat sheet, docs, troubleshooting).
- `POST /api/progress/exercises` risponde con `checkpointCompleted: true` quando l'esercizio consegnato è un checkpoint; l'UI mostra il toast e ricarica il corso per sbloccare il modulo successivo.
- Un modulo senza checkpoint non blocca mai il successivo (backward compatible con corsi esistenti).

L'UI mostra: lucchetto sui moduli bloccati, obiettivo del modulo (`objective`), box "Checkpoint del modulo" con stato superato, e messaggio "Completa il checkpoint del modulo precedente".

### Formato lezione (blueprint)

Ogni lezione (esercizio) segue il formato fisso a 5 punti, mostrato nell'UI:
1. **Perché** (`why`) — a cosa serve nella vita reale
2. **Come** (`how`) — dimostrazione pratica
3. **Fallo tu** — istruzioni + starter code
4. **Errori comuni** (`common_errors` JSONB: `error`/`fix`)
5. **Checkpoint** (`checkpoint`) — criterio oggettivo di riuscita ("il test passa", "vedi X in console")

### Identity Card del corso

La pagina corso mostra i campi blueprint: `subtitle` (promessa), `outcome` ("Cosa saprai fare alla fine"), `lesson_duration` (min a lezione), `stack_version`, prerequisiti con domanda filtro (`prerequisite_check`) e i corsi propedeutico/successivo (`prerequisite_course_id`/`next_course_id`).

---

## 9. Debito Tecnico e Note

- **Pages Router legacy da migrare ad App Router**: dashboard, settings, my-courses, orders, certificates, preview corso (usano `react-helmet-async`/SEO.tsx e `globals.css` proprio).
- **`create-checkout`**: legge titolo e prezzo dal DB (`is_published = true`), rifiuta corsi gratuiti/inesistenti; il percorso carrello (`items`) accetta solo gli id.
- **Certificato automatico attivo**: il certificato viene rilasciato automaticamente al 100% degli esercizi del corso (verificato server-side in `/api/progress/exercises`).
- **Blueprint corsi implementato**: Identity Card, moduli con checkpoint, gating progressivo, formato lezione a 5 punti, materiali per modulo (repo/cheat sheet/docs/troubleshooting) — vedi §8.
- **Nota**: le route auth espongono solo `POST` (nessun `PUT`); le pagine che le chiamano usano `POST`.
- **File non utilizzati**: `components/ui/SEO.tsx` (solo legacy), `data/coursesPreviewData.ts` (usato solo dalla homepage preview).
- **Dipendenze installate ma inutilizzate**: `aos`, `micro`, `nodemailer`, `nextjs-cors`, `@fontsource/jetbrains-mono`, `babel-plugin-react-compiler`, `react-helmet-async`.
- **Vitest rimosso** (luglio 2026): non ci sono più test né script `test`.
- **Turbopack dev cache riabilitata** (agosto 2026): rimosso `experimental.turbopackFileSystemCacheForDev: false`; se il loop di persistenza della cache (RAM/disco) dovesse ripresentarsi su Next 16.2.x, riapplicare il flag.
- **Nota font**: tutto il sito usa JetBrains Mono (inclusa la classe `font-jakarta`, aliasata al mono).

---

## 10. Comandi di Sviluppo

```bash
npm run dev      # Dev server (Turbopack, localhost:3000)
npm run build    # Build di produzione
npm run start    # Server di produzione
npm run lint     # ESLint
npx tsc --noEmit # Typecheck
```

Per popolare i corsi: `npx tsx src/scripts/seed-courses.ts` (usa `.env`).
> ⚠️ `src/scripts/check-courses.ts` imposta **tutti i prezzi a 0** — non eseguirlo se non è voluto.
> ℹ️ Test Room: `npm test` (Vitest, `src/lib/room/__tests__/`).

---

## 11. Stackup Room — Stato Operativo (memoria sessioni)

Moduli Room (`/room/*`, API `/api/room/*`, lib `src/lib/room/`): Auth OTP (M1), Startup+Planner+Streak (M2),
Classifiche+Stripe/GitHub (M3), Community+moderazione+notifiche (M4), Coach AI+consenso (M5), Feedback+test (M6).
Migrazioni `supabase/migrations/003_room_*.sql` → `008_room_feedback.sql` (nomi descrittivi, ordine numerico).
Esclusi su richiesta: PWA, pannello admin (moderazione/feedback via SQL + email `ADMIN_EMAILS`).

**Provider AI coach: xKiro** (`https://api.xkiro.com/v1/messages`, formato Anthropic, header `x-api-key`).
Env: `XKIRO_API_KEY` (configurata in `.env` locale + Vercel prod/preview/dev, ottobre 2026),
`AI_MODEL` (default `anthropic/claude-sonnet-5`, ID con prefisso vendor obbligatorio),
`AI_DAILY_LIMIT` (default 50), `DEEPGRAM_API_KEY` (opz, STT vocali).
STT: Claude non accetta audio → trascrizione solo via Deepgram, altrimenti fallback senza trascrizione.
Altre env Room: `OTP_PEPPER`, `STRIPE_CONNECT_CLIENT_ID`, `TENOR_API_KEY`, `GITHUB_TOKEN` (tutte opz).
