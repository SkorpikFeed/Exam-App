create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  bio text,
  has_tutorial boolean default false,
  role text default 'student',
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists has_tutorial boolean default false;

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  subject text,
  new_limit integer default 8,
  created_at timestamptz default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references public.decks (id) on delete cascade,
  front text not null,
  back text not null,
  tags text[] default '{}',
  fsrs jsonb,
  created_at timestamptz default now(),
  last_review timestamptz,
  reps integer default 0,
  lapses integer default 0
);

create table if not exists public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  deck_id uuid references public.decks (id) on delete cascade,
  card_id uuid references public.cards (id) on delete cascade,
  rating text not null,
  reviewed_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.review_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create policy "Profiles are viewable by owner" on public.profiles
  for select using (id = auth.uid());

create policy "Profiles can be inserted by owner" on public.profiles
  for insert with check (id = auth.uid());

create policy "Profiles can be updated by owner" on public.profiles
  for update using (id = auth.uid());

create policy "Admins can update profiles" on public.profiles
  for update using (public.is_admin());

create policy "Admins can delete profiles" on public.profiles
  for delete using (public.is_admin());

create policy "Admins can view profiles" on public.profiles
  for select using (
    id = auth.uid() or public.is_admin()
  );

create policy "Decks are managed by owner" on public.decks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Cards are managed by deck owner" on public.cards
  for all using (
    exists (
      select 1 from public.decks
      where public.decks.id = cards.deck_id
        and public.decks.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.decks
      where public.decks.id = cards.deck_id
        and public.decks.user_id = auth.uid()
    )
  );

create policy "Review logs are managed by owner" on public.review_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
