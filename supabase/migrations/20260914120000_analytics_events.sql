-- Stackup Room — Giorno 5 Fase 4: Analytics minimali + monitoring decision
-- Branch: feature/stackuproom-day5-launch-prep-*
-- Principio: defer infrastructure until demand is proven.
-- Eventi chiave immagazzinati in tabella Supabase (nessun SDK esterno).
-- Sentry: valutato ma differito per primo lancio (usa crash report nativi Play Console / App Store Connect).

-- ============================================================
-- 1) Tabella analytics_events
-- ============================================================
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null check (event_name in (
    'signup_completed',
    'onboarding_completed',
    'first_checkin_completed',
    'revenue_connected',
    'github_connected',
    'paywall_viewed',
    'subscription_purchased'
  )),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.analytics_events is 'Analytics minimali Giorno 5 Fase 4: eventi chiave funnel (signup, onboarding, first check-in, revenue). No SDK esterno — coerente con defer infra.';
comment on column public.analytics_events.properties is 'Payload JSON leggero (es. {source:"email", startup_id:"..."}), mai dati sensibili.';

create index if not exists idx_analytics_events_name on public.analytics_events(event_name);
create index if not exists idx_analytics_events_user on public.analytics_events(user_id);
create index if not exists idx_analytics_events_created on public.analytics_events(created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_insert_own" on public.analytics_events;
drop policy if exists "analytics_select_own" on public.analytics_events;

-- INSERT: utente autenticato può loggare solo i propri eventi (o anon con user_id null per pre-auth se necessario)
create policy "analytics_insert_own"
  on public.analytics_events for insert
  to authenticated
  with check (auth.uid() = user_id);

-- SELECT: solo il proprio storico (dashboard personale futura). Admin via service_role.
create policy "analytics_select_own"
  on public.analytics_events for select
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 2) Verifica
-- ============================================================
-- Come utente A: insert into analytics_events(user_id,event_name) values (auth.uid(),'signup_completed') => OK
-- Come utente A: insert con user_id != auth.uid() => RLS violation
-- Come utente A: select * from analytics_events => solo le proprie righe
-- Anon: insert => denied (richiede authenticated) — per funnel pre-auth si usa Edge Function con service_role se necessario
