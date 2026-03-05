create table if not exists public.narrative_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  narrative_id uuid not null references public.narratives(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, narrative_id)
);

create index if not exists narrative_favorites_user_id_idx
on public.narrative_favorites (user_id);

create index if not exists narrative_favorites_narrative_id_idx
on public.narrative_favorites (narrative_id);

alter table public.narrative_favorites disable row level security;
