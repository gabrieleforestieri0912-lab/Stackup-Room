-- Stackup Room — Verifica RLS profiles (Checkpoint 1)
-- Esecuzione: SQL Editor Supabase (con service_role) oppure `supabase db execute`
-- Prerequisito: migration 20260912213800_profiles_onboarding.sql applicata
-- Crea due utenti di test via Auth API o Dashboard, poi esegui i check sotto.

-- ============================================================
-- Helper per simulare utente senza generare JWT reale (solo test locale via service_role)
-- Richiede estensione pgtap opzionale; versione minimale: verifica policy esistenza
-- ============================================================

-- 1. Verifica che RLS sia attiva
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname = 'profiles';
-- atteso: relrowsecurity = true

-- 2. Verifica policy esistenti
select policyname, cmd, roles::text, permissive, qual, with_check
from pg_policies
where tablename = 'profiles'
order by policyname;
-- atteso:
--  profiles_select_authenticated | SELECT | {authenticated} | PERMISSIVE | (true) | null
--  profiles_insert_own           | INSERT | {authenticated} | PERMISSIVE | null | (auth.uid() = id)
--  profiles_update_own           | UPDATE | {authenticated} | PERMISSIVE | (auth.uid() = id) | (auth.uid() = id)
--  profiles_delete_own           | DELETE | {authenticated} | PERMISSIVE | (auth.uid() = id) | null

-- 3. Verifica trigger handle_new_user
select trigger_name, event_manipulation, action_statement
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
-- atteso: 1 riga, AFTER INSERT ON auth.users

-- 4. Verifica constraint one_liner
select conname, contype, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.profiles'::regclass
and conname like '%one_liner%';
-- atteso: check (char_length(one_liner) <= 140)

-- 5. Verifica bucket avatars e policy storage
select id, name, public from storage.buckets where id = 'avatars';
-- atteso: 1 riga, public = true

select policyname, cmd, roles::text
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
and policyname like 'avatars_%'
order by policyname;
-- atteso: 4 policy (select, insert, update, delete) con foldername check

-- ============================================================
-- Test funzionale con due utenti reali (eseguire loggati come utente via client)
-- ============================================================
-- Sostituisci <USER_A_ID> e <USER_B_ID> con gli UUID reali dei due utenti di test.

-- Come USER_A (client autenticato con JWT di A):
-- -- A) Lettura: deve vedere profili di A e B (leaderboard autenticata)
-- --    supabase.from('profiles').select('*')  -- atteso: 2+ righe
-- --
-- -- B) Scrittura proprio profilo: deve riuscire
-- --    supabase.from('profiles').update({display_name: 'Alice Updated'}).eq('id', '<USER_A_ID>')
-- --    -- atteso: 1 riga aggiornata
-- --
-- -- C) Scrittura profilo altrui: deve fallire / 0 righe
-- --    supabase.from('profiles').update({display_name: 'Hacked'}).eq('id', '<USER_B_ID>')
-- --    -- atteso: 0 righe (policy violation, update non applicato)
-- --
-- -- D) Constraint one_liner:
-- --    supabase.from('profiles').update({one_liner: 'a'.repeat(141)}).eq('id', '<USER_A_ID>')
-- --    -- atteso: errore check constraint
-- --    supabase.from('profiles').update({one_liner: 'a'.repeat(140)}).eq('id', '<USER_A_ID>')
-- --    -- atteso: ok

-- Come anon (nessun JWT):
-- -- supabase.from('profiles').select('*')
-- -- atteso: []  (nessuna riga, RLS blocca anon)

-- Test storage (come USER_A):
-- -- supabase.storage.from('avatars').upload('<USER_A_ID>/avatar.jpg', file)
-- -- atteso: ok
-- -- supabase.storage.from('avatars').upload('<USER_B_ID>/avatar.jpg', file)
-- -- atteso: errore policy violation
-- -- supabase.storage.from('avatars').list('<USER_A_ID>')
-- -- atteso: lista file propri
