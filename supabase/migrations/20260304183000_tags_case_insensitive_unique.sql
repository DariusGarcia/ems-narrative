with ranked_tags as (
  select
    id,
    lower(name) as name_key,
    first_value(id) over (
      partition by lower(name)
      order by created_at asc, id asc
    ) as canonical_id,
    row_number() over (
      partition by lower(name)
      order by created_at asc, id asc
    ) as rn
  from public.tags
),
duplicate_tags as (
  select
    id as duplicate_id,
    canonical_id
  from ranked_tags
  where rn > 1
)
insert into public.narrative_tags (narrative_id, tag_id)
select
  nt.narrative_id,
  dt.canonical_id
from public.narrative_tags nt
join duplicate_tags dt
  on nt.tag_id = dt.duplicate_id
on conflict (narrative_id, tag_id) do nothing;

with ranked_tags as (
  select
    id,
    row_number() over (
      partition by lower(name)
      order by created_at asc, id asc
    ) as rn
  from public.tags
),
duplicate_tags as (
  select id as duplicate_id
  from ranked_tags
  where rn > 1
)
delete from public.narrative_tags nt
using duplicate_tags dt
where nt.tag_id = dt.duplicate_id;

with ranked_tags as (
  select
    id,
    row_number() over (
      partition by lower(name)
      order by created_at asc, id asc
    ) as rn
  from public.tags
),
duplicate_tags as (
  select id as duplicate_id
  from ranked_tags
  where rn > 1
)
delete from public.tags t
using duplicate_tags dt
where t.id = dt.duplicate_id;

create unique index if not exists tags_name_lower_unique_idx
on public.tags (lower(name));
