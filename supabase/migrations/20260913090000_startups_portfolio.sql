-- Stackup Room — Fase 3 Portfolio startup
-- Branch: stackup-room/fase-3-portfolio-20260913
-- Tabella startups multi-progetto + RLS strict owner-only (offline-first Hive, sync Supabase)

-- ============================================================
-- 1) Tabella startups
-- ============================================================
create table if not exists public.startups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  status text not null check (status in ('idea','in_sviluppo','lanciata')) default 'idea',
  description text check (char_length(description) <= 280),
  website text,
  notes text,
  mrr_cents int check (mrr_cents >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_startups_owner on public.startups(owner_id);
create index if not exists idx_startups_owner_archived on public.startups(owner_id, is_archived);
create index if not exists idx_startups_updated on public.startups(updated_at desc);

comment on table public.startups is 'Portfolio multi-startup — 1 utente = N startup. Offline-first Hive, sync Supabase.';
comment on column public.startups.status is 'idea | in_sviluppo | lanciata';
comment on column public.startups.mrr_cents is 'Placeholder MRR verificato Fase 4 (Stripe read-only via Edge Function), null = non collegato';

-- Trigger updated_at (riusa handle_updated_at se già esiste)
create or replace function public.handle_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_startups_updated_at on public.startups;
create trigger trg_startups_updated_at before update on public.startups for each row execute function public.handle_updated_at();

-- ============================================================
-- 2) RLS — strict owner-only (nessun anon, nessun altro authenticated legge)
-- ============================================================
alter table public.startups enable row level security;

drop policy if exists "startups_select_own" on public.startups;
drop policy if exists "startups_insert_own" on public.startups;
drop policy if exists "startups_update_own" on public.startups;
drop policy if exists "startups_delete_own" on public.startups;

create policy "startups_select_own" on public.startups for select to authenticated using (auth.uid() = owner_id);
create policy "startups_insert_own" on public.startups for insert to authenticated with check (auth.uid() = owner_id);
create policy "startups_update_own" on public.startups for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "startups_delete_own" on public.startups for delete to authenticated using (auth.uid() = owner_id);

-- ============================================================
-- 3) Verifica RLS (manuale)
-- ============================================================
-- Come utente A: select * from startups → solo proprie; insert con owner_id != auth.uid() → violation
-- Come utente B: update startups set name='Hacked' where owner_id = A.id → 0 righe
-- Anon: select → 0 righe
