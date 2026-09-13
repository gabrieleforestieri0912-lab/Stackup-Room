-- Fase 4 — Leaderboard verificata (Stripe read-only via Edge Function proxy)
-- Branch: stackup-room/fase-4-leaderboard-20260913

-- ============================================================
-- 1) revenue_snapshots — sorgente Stripe verificata (append-only)
-- ============================================================
create table if not exists public.revenue_snapshots (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'EUR' check (char_length(currency)=3),
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  source text not null check (source in ('stripe','manual_stub')) default 'stripe',
  verified boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_revenue_startup_period on public.revenue_snapshots(startup_id, period_end desc);
create index if not exists idx_revenue_owner on public.revenue_snapshots(owner_id);

comment on table public.revenue_snapshots is 'Snapshot revenue verificata via Edge Function stripe-verify (mai input manuale client in MVP).';

alter table public.revenue_snapshots enable row level security;

drop policy if exists "revenue_select_authenticated" on public.revenue_snapshots;
drop policy if exists "revenue_insert_service" on public.revenue_snapshots;

-- SELECT: tutti gli autenticati leggono (serve per leaderboard comparativa autenticata, già paywalled a livello UI)
create policy "revenue_select_authenticated" on public.revenue_snapshots for select to authenticated using (true);
-- INSERT/UPDATE/DELETE: solo service_role (Edge Function) — nessun client diretto
-- Non creiamo policy per authenticated insert → di fatto solo service_role bypassa RLS

-- ============================================================
-- 2) leaderboard_opt_in — privacy toggle per metrica
-- ============================================================
create table if not exists public.leaderboard_opt_in (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  show_mrr boolean not null default true,
  show_github boolean not null default false,
  show_streak boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.leaderboard_opt_in enable row level security;

drop policy if exists "optin_select_authenticated" on public.leaderboard_opt_in;
drop policy if exists "optin_upsert_own" on public.leaderboard_opt_in;
drop policy if exists "optin_update_own" on public.leaderboard_opt_in;

create policy "optin_select_authenticated" on public.leaderboard_opt_in for select to authenticated using (true);
create policy "optin_upsert_own" on public.leaderboard_opt_in for insert to authenticated with check (auth.uid() = user_id);
create policy "optin_update_own" on public.leaderboard_opt_in for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_optin_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_optin_updated_at on public.leaderboard_opt_in;
create trigger trg_optin_updated_at before update on public.leaderboard_opt_in for each row execute function public.handle_optin_updated_at();

-- ============================================================
-- 3) View leaderboard — ordinata su revenue verificata + streak (sintetica)
-- ============================================================
create or replace view public.leaderboard as
select
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  s.id as startup_id,
  s.name as startup_name,
  s.status as startup_status,
  -- ultimo snapshot verificato
  (select rs.amount_cents from public.revenue_snapshots rs where rs.startup_id = s.id and rs.verified = true order by rs.period_end desc, rs.created_at desc limit 1) as latest_revenue_cents,
  (select rs.currency from public.revenue_snapshots rs where rs.startup_id = s.id and rs.verified = true order by rs.period_end desc, rs.created_at desc limit 1) as currency,
  -- privacy
  coalesce(loi.show_mrr, true) as show_mrr,
  coalesce(loi.show_streak, true) as show_streak,
  p.created_at
from public.profiles p
left join public.startups s on s.owner_id = p.id and s.is_archived = false
left join public.leaderboard_opt_in loi on loi.user_id = p.id
where p.onboarding_completed_at is not null;

comment on view public.leaderboard is 'Vista leaderboard — ordinata lato client su revenue verificata. RLS ereditata da tabelle sorgente.';
