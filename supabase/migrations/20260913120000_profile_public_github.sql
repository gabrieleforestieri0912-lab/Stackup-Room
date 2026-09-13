-- Stackup Room — Fase 7 Profilo founder + GitHub sync
-- Branch: stackup-room/fase-7-paywall-20260913
-- Aggiunge: visibilità pubblica per startup, colonne GitHub su profiles,
-- tabella github_accounts (token per-utente, accessibile SOLO da service_role).

-- ============================================================
-- 1) startups.is_public — portfolio pubblico opt-in per progetto
-- ============================================================
alter table public.startups
  add column if not exists is_public boolean not null default false;

comment on column public.startups.is_public is 'true = il progetto è visibile nel portfolio pubblico agli altri founder autenticati. Default false (privacy-first).';

create index if not exists idx_startups_public on public.startups(is_public) where is_public = true;

-- NB: NON aggiungiamo una policy permissiva di SELECT su startups per le righe
-- pubbliche: esporrebbe colonne private (es. `notes`). Servirebbe una policy
-- row-level, ma il leak è a livello di colonna → usiamo invece una vista con
-- proiezione sicura (sotto), lasciando la tabella strict owner-only (Fase 3).

-- Vista portfolio pubblico: solo colonne safe, solo progetti opt-in e non archiviati.
-- security_invoker = false (default): la vista è eseguita come owner, quindi
-- bypassa la RLS row-level della tabella; la restrizione di righe è nel WHERE
-- e la restrizione di colonne nella proiezione. Accesso concesso SOLO ad
-- authenticated (nessun anon), in coerenza con la decisione #2 (leaderboard
-- e portfolio visibili solo dentro l'app autenticata).
create or replace view public.public_portfolios as
select
  s.id as startup_id,
  s.owner_id,
  p.display_name,
  p.avatar_url,
  s.name as startup_name,
  s.status as startup_status,
  s.description,
  s.website,
  -- Rispetta il toggle privacy "show_mrr" della leaderboard (Fase 4):
  -- se l'utente nasconde l'MRR in classifica, resta nascosto anche qui.
  (case when coalesce(loi.show_mrr, true) then s.mrr_cents else null end) as mrr_cents,
  s.updated_at
from public.startups s
join public.profiles p on p.id = s.owner_id
left join public.leaderboard_opt_in loi on loi.user_id = s.owner_id
where s.is_public = true
  and s.is_archived = false
  and p.onboarding_completed_at is not null;

comment on view public.public_portfolios is 'Portfolio pubblico opt-in: proiezione sicura (senza notes) per lettura cross-utente authenticated. Fase 7.';

revoke all on public.public_portfolios from anon;
grant select on public.public_portfolios to authenticated;

-- ============================================================
-- 2) profiles — metadati GitHub sincronizzati (denormalizzati, leggibili)
-- ============================================================
alter table public.profiles
  add column if not exists github_login text,
  add column if not exists github_contributions int check (github_contributions >= 0),
  add column if not exists github_synced_at timestamptz;

comment on column public.profiles.github_contributions is 'Attività GitHub ultimi 30gg (fetch via Edge Function github-sync). Solo metrica, nessun token.';

-- ============================================================
-- 3) github_accounts — token OAuth per-utente (mai lato client)
-- ============================================================
create table if not exists public.github_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  github_login text not null,
  access_token text not null, -- token OAuth GitHub (service_role only)
  scope text,
  contributions_30d int not null default 0 check (contributions_30d >= 0),
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.github_accounts is 'Token OAuth GitHub per-utente. RLS abilitata con ZERO policy: leggibile/scrivibile solo da service_role (Edge Functions). Il client legge solo i metadati denormalizzati su profiles.';

alter table public.github_accounts enable row level security;

-- Nessuna policy creata intenzionalmente: nessun accesso client (né anon né authenticated).
-- Solo service_role (Edge Functions) può leggere/scrivere questa tabella.

-- ============================================================
-- 4) Verifica RLS (manuale)
-- ============================================================
-- Come utente B: select * from startups → solo le proprie (le pubbliche di A NON sono visibili qui).
-- Come utente B: select * from public_portfolios → righe pubbliche di A, senza colonna notes.
-- Come utente A: update startups set is_public = true where id = <mia> → ok.
-- Anon: select from startups → 0 righe; select from public_portfolios → permission denied.
-- Qualsiasi utente (anche autenticato): select * from github_accounts → 0 righe (nessuna policy).
-- Service role (Edge Function): insert/upsert github_accounts → ok.
