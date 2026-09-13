-- Stackup Room — Fase 8 offline-first: tasks + standups
-- Branch: stackup-room/fase-8-settings-responsive-20260913
--
-- RLS strict owner-only su entrambe le tabelle.
-- Chiavi di idempotenza per la coda offline (Hive → Supabase):
--   tasks:    unique (user_id, client_id)  → client_id = id locale del task in Hive
--   standups: unique (user_id, day)        → 1 standup per giorno
-- L'upsert con onConflict rende i retry offline sicuri (nessun duplicato).

-- ============================================================
-- 1) tasks
-- ============================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id text not null, -- id generato dal client offline (chiave di idempotenza)
  title text not null check (char_length(title) between 1 and 160),
  project text, -- nome progetto in Today (match con startups.name), null = Generale
  completed boolean not null default false,
  day date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists idx_tasks_user_day on public.tasks(user_id, day desc);
create index if not exists idx_tasks_user_pending on public.tasks(user_id) where completed = false;

comment on table public.tasks is 'Task del giorno — scrittura offline-first da Hive, sync via outbox (upsert idempotente su user_id+client_id).';

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

create policy "tasks_select_own" on public.tasks for select to authenticated using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert to authenticated with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks for each row execute function public.handle_updated_at();

-- ============================================================
-- 2) standups
-- ============================================================
create table if not exists public.standups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  yesterday text,
  today text,
  blockers text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists idx_standups_user_day on public.standups(user_id, day desc);

comment on table public.standups is 'Standup giornaliero (ieri/oggi/blocchi) — 1 per utente al giorno, upsert idempotente su user_id+day.';

alter table public.standups enable row level security;

drop policy if exists "standups_select_own" on public.standups;
drop policy if exists "standups_insert_own" on public.standups;
drop policy if exists "standups_update_own" on public.standups;
drop policy if exists "standups_delete_own" on public.standups;

create policy "standups_select_own" on public.standups for select to authenticated using (auth.uid() = user_id);
create policy "standups_insert_own" on public.standups for insert to authenticated with check (auth.uid() = user_id);
create policy "standups_update_own" on public.standups for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "standups_delete_own" on public.standups for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists trg_standups_updated_at on public.standups;
create trigger trg_standups_updated_at before update on public.standups for each row execute function public.handle_updated_at();

-- ============================================================
-- 3) Hardening viste (checklist Fase 8)
-- ============================================================
-- Le viste security-definer bypassano la RLS delle tabelle sorgente, quindi i
-- permessi vanno ristretti esplicitamente: nessuna lettura anon (decisione #2:
-- leaderboard e portfolio visibili solo dentro l'app autenticata).
revoke all on public.leaderboard from public;
revoke all on public.leaderboard from anon;
grant select on public.leaderboard to authenticated;

revoke all on public.public_portfolios from public;
revoke all on public.public_portfolios from anon;
grant select on public.public_portfolios to authenticated;

-- ============================================================
-- 4) Verifica RLS (manuale)
-- ============================================================
-- Come utente A: insert tasks con user_id = B → violation.
-- Come utente B: select/update/delete su task di A → 0 righe.
-- Upsert ripetuto con stesso (user_id, client_id) → 1 sola riga (idempotenza retry offline).
-- Upsert ripetuto con stesso (user_id, day) su standups → 1 sola riga.
-- Anon: select tasks/standups → 0 righe; select leaderboard/public_portfolios → permission denied.
