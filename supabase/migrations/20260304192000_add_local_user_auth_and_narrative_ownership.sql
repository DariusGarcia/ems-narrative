create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null check (char_length(trim(username)) >= 3),
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists users_username_lower_unique_idx
on public.users (lower(username));

alter table public.narratives
add column if not exists owner_id uuid references public.users(id) on delete set null;

create index if not exists narratives_owner_id_idx
on public.narratives (owner_id);

alter table public.users disable row level security;
