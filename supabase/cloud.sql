-- Verb Adventure — cloud accounts. Paste into Supabase → SQL Editor → Run. Safe to run more than once.
-- The account belongs to a parent (Supabase Auth, email + password). Children never sign in.
-- One row per child: nickname, avatar and the app's progress document. The app merges devices client-side
-- (src/lib/sync.ts), so the server stores whole documents. No child emails, real names or voice data.

create table if not exists public.child_profile (
  parent uuid not null default auth.uid() references auth.users on delete cascade,
  id uuid not null,
  name text not null default '' check (char_length(name) <= 20),
  avatar text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (parent, id)
);
alter table public.child_profile enable row level security;

-- A parent can only ever see and change their own children. Signed-out visitors get nothing.
drop policy if exists own_children on public.child_profile;
create policy own_children on public.child_profile for all to authenticated
  using (parent = (select auth.uid())) with check (parent = (select auth.uid()));

-- GDPR erasure from inside the app: deletes the parent's login; their children's rows go with it (on delete cascade).
create or replace function public.delete_my_account() returns void
  language sql security definer set search_path = '' as $$ delete from auth.users where id = (select auth.uid()); $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
