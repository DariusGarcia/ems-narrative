-- Enable Row Level Security across core tables.
-- Note: your app uses server-side service-role access, which bypasses RLS.
-- These policies protect direct anon/authenticated client access to the database.

alter table public.users enable row level security;
alter table public.narratives enable row level security;
alter table public.tags enable row level security;
alter table public.narrative_tags enable row level security;
alter table public.narrative_favorites enable row level security;

-- Idempotent cleanup for re-runs.
drop policy if exists tags_public_read on public.tags;
drop policy if exists narratives_public_read on public.narratives;
drop policy if exists narrative_tags_public_read on public.narrative_tags;

-- Public/shared library can be read directly if needed.
create policy tags_public_read
on public.tags
for select
to anon, authenticated
using (true);

create policy narratives_public_read
on public.narratives
for select
to anon, authenticated
using (owner_id is null);

create policy narrative_tags_public_read
on public.narrative_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.narratives n
    where n.id = narrative_tags.narrative_id
      and n.owner_id is null
  )
);

-- No policies are intentionally created for:
-- public.users, private narratives, and public.narrative_favorites.
-- That means direct anon/authenticated access to those rows is denied.
