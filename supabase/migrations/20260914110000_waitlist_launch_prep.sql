-- Stackup Room — Giorno 5 Fase 1: Waitlist + feature flag launch gating
-- Branch: feature/stackuproom-day5-launch-prep-*
-- Scope check: docs/scope.md NON prevede fase beta/waitlist esplicita.
-- Quindi: launch = public di default (ENABLE_PUBLIC_SIGNUP = true).
-- Questa migration crea l'infrastruttura waitlist come opt-in per futuro gating,
-- senza bloccare il funnel attuale. Se vuoi attivare waitlist: setta
-- ENABLE_PUBLIC_SIGNUP=false in Env/feature flag e distribuisci via TestFlight/Internal Testing.

-- ============================================================
-- 1) Tabella waitlist
-- ============================================================
create table if not exists public.waitlist (
  email text primary key check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now(),
  invited_at timestamptz,
  source text, -- es. 'landing', 'referral', 'internal'
  notes text
);

comment on table public.waitlist is 'Waitlist pre-lancio Stackup Room. Usata solo se ENABLE_PUBLIC_SIGNUP=false. Fase 5 opt-in, non bloccante.';
comment on column public.waitlist.invited_at is 'Null = in attesa. Valorizzato quando invito inviato (sblocco signup).';

create index if not exists idx_waitlist_created_at on public.waitlist(created_at);
create index if not exists idx_waitlist_invited_at on public.waitlist(invited_at) where invited_at is null;

-- RLS: solo service_role scrive. Lettura/inserimento pubblico controllato via policy anon.
alter table public.waitlist enable row level security;

drop policy if exists "waitlist_insert_anon" on public.waitlist;
drop policy if exists "waitlist_select_service_only" on public.waitlist;

-- Chiunque (anon + authenticated) può iscriversi alla waitlist (insert email).
-- Evita enumerazione: nessuna SELECT per anon/authenticated.
create policy "waitlist_insert_anon"
  on public.waitlist for insert
  with check (true);

-- Nessuna SELECT per client (solo service_role / dashboard). Evita scraping email.
-- Non creare policy SELECT => default deny per anon/authenticated.

-- ============================================================
-- 2) Verifica (manuale)
-- ============================================================
-- anon: insert into waitlist(email) values ('test@example.com') => OK (1 riga)
-- anon: insert into waitlist(email) values ('test@example.com') => errore duplicate key
-- anon: insert into waitlist(email) values ('not-an-email') => errore check
-- anon/authenticated: select * from waitlist => 0 righe (RLS deny)
-- service_role: select * from waitlist => vede tutte le righe
