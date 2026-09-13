-- Fase 5 — AI Coach (chat con contesto progetti, streaming via Edge Function proxy)
-- Branch: stackup-room/fase-5-ai-coach-20260913

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  startup_id uuid references public.startups(id) on delete set null,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_user_created on public.ai_messages(user_id, created_at desc);
create index if not exists idx_ai_messages_startup on public.ai_messages(startup_id, created_at desc);

comment on table public.ai_messages is 'Storico AI Coach — 1 riga per bubble, filtrato per startup. Mai chiave LLM client.';

alter table public.ai_messages enable row level security;

drop policy if exists "ai_messages_select_own" on public.ai_messages;
drop policy if exists "ai_messages_insert_own" on public.ai_messages;
drop policy if exists "ai_messages_delete_own" on public.ai_messages;

create policy "ai_messages_select_own" on public.ai_messages for select to authenticated using (auth.uid() = user_id);
create policy "ai_messages_insert_own" on public.ai_messages for insert to authenticated with check (auth.uid() = user_id);
create policy "ai_messages_delete_own" on public.ai_messages for delete to authenticated using (auth.uid() = user_id);
