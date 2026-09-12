-- Stackup Room — Giorno 2 Fase 1
-- Migration: profiles + RLS + trigger + storage bucket avatars
-- Branch: feature/stackuproom-day2-onboarding-20260912213751
-- Verifica docs/scope.md: leaderboard SOLO dentro app autenticata (decisione #2 fallback A).
-- Quindi: nessuna view pubblica, nessun anon read. Lettura profili = solo authenticated.

-- ============================================================
-- 1) Tabella profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text, -- nullable inizialmente, valorizzato allo Step 1 onboarding
  startup_name text, -- nullable (Step 2)
  one_liner text check (char_length(one_liner) <= 140), -- nullable, max 140 (Step 2)
  avatar_url text, -- nullable, URL Supabase Storage (Step 1, skippabile)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  onboarding_completed_at timestamptz -- nullable, valorizzato allo Step 3 (welcome)
);

-- Indici utili
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_onboarding_completed_at on public.profiles(onboarding_completed_at);

comment on table public.profiles is 'Profili founder — 1:1 con auth.users. Onboarding leggero 3-step (Giorno 2).';
comment on column public.profiles.one_liner is 'Pitch 140 char max — Step 2 onboarding';
comment on column public.profiles.onboarding_completed_at is 'Null = onboarding incompleto → redirect a wizard. Valorizzato allo Step 3.';

-- Trigger updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- 2) RLS
-- ============================================================
alter table public.profiles enable row level security;

-- NB: docs/scope.md §5 diceva "user può leggere tutti i profili (per leaderboard), scrivere solo il proprio".
-- Spec Giorno 2 Fase 1 dice "ogni utente legge/scrive solo il proprio profilo" ma aggiunge:
-- "Se la Fase 1 del Giorno 1 ha confermato che la leaderboard resta solo dentro l'app autenticata,
--  non serve una view pubblica separata — verifica comunque in docs/scope.md."
-- Verifica: docs/scope.md → decisione #2 = A (solo in-app autenticata), leaderboard view §5 = read autenticati.
-- Conclusione: Lettura = tutti gli utenti autenticati (serve per leaderboard interna), Scrittura = solo owner.
-- Questo soddisfa entrambi: nessun anon può leggere, nessun utente può scrivere profili altrui.
-- Se si volesse strettamente "solo proprio anche in lettura", basterebbe sostituire la SELECT policy con
--   using (auth.uid() = id)  — ma romperebbe la leaderboard (Giorno 5).

-- Pulizia policy esistenti (idempotenza)
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

-- SELECT: tutti gli utenti autenticati possono leggere tutti i profili (necessario per leaderboard autenticata)
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Alternativa stretta (commentata) — solo proprio profilo:
-- create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);

-- INSERT: solo il proprio profilo (usato dal trigger con service_role bypass, ma anche per sicurezza client)
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- UPDATE: solo il proprio profilo
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- DELETE: solo il proprio profilo (opzionale, per completezza — non usato in MVP)
create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- ============================================================
-- 3) Trigger auto-creazione profilo su signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: crea profili mancanti per utenti esistenti (se migration su DB già popolato)
insert into public.profiles (id, email, display_name)
select id, email, coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

-- ============================================================
-- 4) Storage bucket avatars (Step 1 onboarding — upload opzionale, skippabile)
-- ============================================================
-- Bucket dedicato con RLS a livello storage — no upload libero senza policy (requisito Fase 3 Step 1)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Abilita RLS su storage.objects (già abilitata di default su Supabase, ma esplicito)
-- Le policy storage controllano chi può leggere/scrivere oggetti nel bucket 'avatars'.

-- Rimuove policy precedenti se esistono (per idempotenza)
drop policy if exists "avatars_select_all_authenticated" on storage.objects;
drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

-- SELECT: chiunque (anche anon) può leggere avatar se bucket pubblico = true.
-- Se si vuole limitare a solo autenticati, usare: to authenticated using (bucket_id = 'avatars')
-- Con bucket public=true, Supabase serve già via URL pubblico; policy resta per coerenza.
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- INSERT: solo utenti autenticati, e solo nella propria cartella <uid>/...
-- Path atteso: avatars/<auth.uid()>/avatar.jpg  — enforced via foldername()
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: solo owner della cartella
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: solo owner
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 5) Verifica RLS (per CHECKPOINT 1)
-- ============================================================
-- Esegui questi test manualmente in SQL Editor con due utenti diversi (o via service_role + set_config):
--
-- -- Test 1: utente A vede solo il proprio profilo in scrittura, ma legge tutti (per leaderboard)
-- -- Come utente A (JWT auth.uid() = 'aaa'):
-- --   select * from profiles; -- deve vedere tutte le righe (se authenticated)
-- --   update profiles set display_name = 'Hacked' where id != auth.uid(); -- deve fallire (0 righe / policy violation)
-- --   update profiles set display_name = 'Mio Nome' where id = auth.uid(); -- deve riuscire
--
-- -- Test 2: anon non legge nulla
-- --   set role anon; select * from profiles; -- 0 righe
--
-- -- Test 3: trigger
-- --   insert into auth.users ... -- deve creare automaticamente riga in profiles
--
-- -- Test 4: one_liner constraint
-- --   update profiles set one_liner = repeat('a', 141) where id = auth.uid(); -- deve fallire check
-- --   update profiles set one_liner = repeat('a', 140) where id = auth.uid(); -- ok
--
-- -- Test 5: storage
-- --   come utente A, upload a 'avatars/<A-uid>/avatar.jpg' -- ok
-- --   upload a 'avatars/<B-uid>/avatar.jpg' -- deve fallire (policy violation)
-- --   anon select su storage.objects where bucket_id='avatars' -- ok se public, altrimenti solo authenticated
