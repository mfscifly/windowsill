-- "Notify me" sign-ups from the public demo. Anyone may add an email; nobody can read
-- the list through the public (anon) key. Read it in the Supabase dashboard (Table Editor).
create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  source text default 'demo' check (length(source) <= 40),
  created_at timestamptz not null default now()
);
create unique index if not exists waitlist_email_key on public.waitlist (lower(email));
alter table public.waitlist enable row level security;
drop policy if exists "anyone can join the waitlist" on public.waitlist;
create policy "anyone can join the waitlist" on public.waitlist for insert to anon, authenticated with check (true);
-- No select, update or delete policies: the list is write-only from the web.
grant insert (email, source) on public.waitlist to anon, authenticated;
