-- Windowsill database. Run once in the Supabase SQL editor of a new project.
-- Every row belongs to one signed-in user, and row-level security means
-- nobody can read or change anyone else's plants, rooms, cuttings or photos.

-- One table holds every collection the app uses (plants, rooms, props, checkins).
-- Each document is JSON, matching docs/schema.md.
create table if not exists public.docs (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  coll       text not null check (coll in ('plants', 'rooms', 'props', 'checkins')),
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, coll, id)
);

alter table public.docs enable row level security;

drop policy if exists "own docs" on public.docs;
create policy "own docs" on public.docs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Shallow merge, like a document store's update(): top-level keys in patch replace old ones.
create or replace function public.merge_doc(p_coll text, p_id text, p_patch jsonb)
returns void language sql security invoker as $$
  update public.docs
     set data = data || p_patch, updated_at = now()
   where user_id = auth.uid() and coll = p_coll and id = p_id;
$$;

-- Live updates across a person's devices.
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- Photos: a private bucket, each person's files under a folder named by their user id.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "own photos" on storage.objects;
create policy "own photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Phone push subscriptions, used by the daily reminder job.
create table if not exists public.push_subscriptions (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint   text primary key,
  keys       jsonb not null,
  tz         text not null default 'UTC',
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "own subscriptions" on public.push_subscriptions;
create policy "own subscriptions" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
