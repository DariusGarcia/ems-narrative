create extension if not exists pgcrypto;

create table if not exists public.narratives (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.narrative_tags (
  narrative_id uuid not null references public.narratives(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (narrative_id, tag_id)
);

create or replace function public.set_updated_at_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists narratives_set_updated_at on public.narratives;

create trigger narratives_set_updated_at
before update on public.narratives
for each row
execute function public.set_updated_at_timestamp();

alter table public.narratives disable row level security;
alter table public.tags disable row level security;
alter table public.narrative_tags disable row level security;
