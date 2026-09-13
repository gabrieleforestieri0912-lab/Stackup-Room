-- Fase 6 — Community (chat live + guide) — paywalled
-- Branch: stackup-room/fase-6-community-20260913

-- ============================================================
-- 1) community_channels
-- ============================================================
create table if not exists public.community_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  description text,
  created_at timestamptz not null default now()
);

insert into public.community_channels (id, name, description) values
  ('00000000-0000-0000-0000-000000000001', 'generale', 'Discussioni aperte per tutti i founder'),
  ('00000000-0000-0000-0000-000000000002', 'shipping', 'Cosa hai shippato oggi?'),
  ('00000000-0000-0000-0000-000000000003', 'ask', 'Domande e feedback')
on conflict (id) do nothing;

alter table public.community_channels enable row level security;
drop policy if exists "channels_select_authenticated" on public.community_channels;
create policy "channels_select_authenticated" on public.community_channels for select to authenticated using (true);

-- ============================================================
-- 2) community_messages
-- ============================================================
create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.community_channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  reply_to uuid references public.community_messages(id) on delete set null,
  voice_url text,
  reactions jsonb not null default '{}'::jsonb, -- { "🚀": ["uid1","uid2"], "🔥": [...] }
  created_at timestamptz not null default now()
);

create index if not exists idx_community_messages_channel_created on public.community_messages(channel_id, created_at desc);
create index if not exists idx_community_messages_user on public.community_messages(user_id);

alter table public.community_messages enable row level security;
drop policy if exists "community_messages_select_authenticated" on public.community_messages;
drop policy if exists "community_messages_insert_authenticated" on public.community_messages;
drop policy if exists "community_messages_update_own" on public.community_messages;
drop policy if exists "community_messages_delete_own" on public.community_messages;

create policy "community_messages_select_authenticated" on public.community_messages for select to authenticated using (true);
create policy "community_messages_insert_authenticated" on public.community_messages for insert to authenticated with check (auth.uid() = user_id);
create policy "community_messages_update_own" on public.community_messages for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "community_messages_delete_own" on public.community_messages for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- 3) guides (forum/playbook markdown)
-- ============================================================
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 120),
  category text not null check (category in ('playbook','fundraising','product','growth')),
  body_md text not null,
  created_at timestamptz not null default now()
);

insert into public.guides (title, category, body_md) values
  ('Validare in 7 giorni', 'playbook', '# Validare in 7 giorni\n\n1. Intervista 5 utenti\n2. Landing no-code\n3. Pre-sell\n\n> Shippa prima di costruire.'),
  ('Pricing per solo founder', 'product', '# Pricing\n\n- Ancoraggio\n- Trial 7gg\n- Annuale con sconto\n\nTesta 3 prezzi in parallelo.'),
  ('Fundraising senza VC', 'fundraising', '# Bootstrapping\n\nMRR → profit → opzionale. Non inseguire round se non serve.')
on conflict do nothing;

alter table public.guides enable row level security;
drop policy if exists "guides_select_authenticated" on public.guides;
create policy "guides_select_authenticated" on public.guides for select to authenticated using (true);

-- ============================================================
-- 4) Storage bucket voice_notes (audio breve, upload Supabase Storage)
-- ============================================================
insert into storage.buckets (id, name, public) values ('voice_notes', 'voice_notes', false) on conflict (id) do nothing;

drop policy if exists "voice_notes_insert_own" on storage.objects;
drop policy if exists "voice_notes_select_authenticated" on storage.objects;
drop policy if exists "voice_notes_delete_own" on storage.objects;

create policy "voice_notes_select_authenticated" on storage.objects for select to authenticated using (bucket_id = 'voice_notes');
create policy "voice_notes_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'voice_notes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "voice_notes_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'voice_notes' and (storage.foldername(name))[1] = auth.uid()::text);
