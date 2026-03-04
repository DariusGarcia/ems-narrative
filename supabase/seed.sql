-- Default password for all seeded templates: seed-lock
-- To add future seeds, add a row in seeded_templates below.
-- Every seeded template is always forced to locked state.

insert into public.tags (name)
values
  ('5150'),
  ('csu'),
  ('jail'),
  ('er'),
  ('st joseph'),
  ('oc global'),
  ('sc global'),
  ('anaheim global'),
  ('psych'),
  ('5585'),
  ('uci'),
  ('bewell'),
  ('w6000'),
  ('psychiatric'),
  ('ift'),
  ('snf'),
  ('assisted living'),
  ('discharge')
on conflict (name) do nothing;

with lock_value as (
  select encode(digest('seed-lock', 'sha256'), 'hex') as hash
),
seeded_templates as (
  select
    'jail narrative'::text as title,
    $$Unit 3 arrived on scene at OC JAIL IRC to find 49 y/o M. Found in the standing position. Pt report received from Joni H R.N. Going from jail to CSU for ext care.

Pt transported by ambulance due to 5150 hold. Pt was AxO4, GCS 15, no iso, full code. pt hx none and allergies NKDA. Upon first pt contact, pt was assessed and vitals were taken on scene. Pt chief complaint is GD 5150 hold. Pain 0/10, Medical devices are as listed; none. Pt assisted from cell to stretcher via two EMTs. Pt placed in semi fowlers to monitor for airway precautions, with rails up and safety straps secured. 4-point soft physical restraints applied due to 5150 hold. PMSCs were assessed immediately before applying restraints, within five minutes after application, and every 15 minutes during transport, remaining intact throughout. A final PMSC check was performed immediately after removing the restraints. Vitals monitored en route and remained stable.

Pt was loaded into rig without incident. Pt was closely monitor enroute and arrived at destination with no significant change in status.

Pt assisted from stretcher to lobby hallway via two EMTs, Pt care transferred to RN. All equipment decontaminated. All times approximate.$$::text as content,
    array['jail', '5150', 'csu', 'psych']::text[] as tag_names
  union all
  select
    '5585 going to BeWell'::text,
    $$Unit 3 AOS at 23072 lake center Dr to find a 57 y/o male standing outside. Chief complaint of anxiety. On w6000 hold voluntary. Report, transfer packet received from BHC II Danielle G. Patient is being transported to BEWELL for behavioral and psychiatric evaluation and treatment. Requires ambulance transport due to voluntarily hold.

PMHx anxiety. Allergies: NKA. Patient reports a past history of alcohol use. AxOx4, GCS 15. Vitals on scene: WNL for BLS transport. No pain reported (0/10). Patient is cooperative. No medical devices.

Patient transferred to the gurney via assisted ambulation EMTX2 without incident. Placed in semi-Fowler's position to maintain airway patency.

Patient transported to BEWELL. Upon arrival, patient was transferred to the hallway via assisted ambulation. Patient placed in semi-Fowler's position. Report was handed off to RN Brianna S. Gurney and equipment were decontaminated and prepared for the next call.

All times approximate.$$::text,
    array['5585', 'bewell', 'w6000', 'psych']::text[]
  union all
  select
    'SC global golden years discharge'::text,
    $$Unit 3 AOS at SC Global Unit golden years to find a 81 y/o male standing in lobby. Chief complaint of agitation. Transfer to SNF. Patient was able to get onto the gurney with assistance EMTX2. Report, PT belongings, transfer packet received from RN Aliysa H. PT is being transported to Advanced Rehabilitation SNF for ext care. Requires ambulance transport due to fall risk.

PMHx of HTN, COPD, dementia, etc. Allergies: NKA. Full code. AxOx1, GCS 14. Vitals on scene: WNL for BLS transport. No pain reported (0/10). Patient appears cooperative. No medical devices.

Patient transferred to the gurney with assistance EMTX2 without incident. Placed in semi-Fowler's position to maintain airway patency and comfort. Vitals monitored en route and remained stable.

Patient transported to Advanced Rehab SNF without incident. Upon arrival, patient was transferred to room 43-A with assistance emtx2. Report, transfer packet, and patient's belongings were handed off to RN Carolina U. Gurney and equipment were decontaminated and prepared for the next call.

All times approximate.$$::text,
    array['sc global', 'discharge', 'snf']::text[]
),
updated as (
  update public.narratives n
  set
    content = s.content,
    is_locked = true,
    lock_password_hash = (select hash from lock_value)
  from seeded_templates s
  where lower(n.title) = lower(s.title)
  returning lower(n.title) as title_key
),
inserted as (
  insert into public.narratives (title, content, is_locked, lock_password_hash)
  select
    s.title,
    s.content,
    true,
    (select hash from lock_value)
  from seeded_templates s
  where not exists (
    select 1
    from public.narratives n
    where lower(n.title) = lower(s.title)
  )
  returning id, title
),
target_narratives as (
  select distinct on (lower(n.title))
    n.id,
    lower(n.title) as title_key
  from public.narratives n
  join seeded_templates s
    on lower(n.title) = lower(s.title)
  order by lower(n.title), n.created_at asc
)
insert into public.narrative_tags (narrative_id, tag_id)
select
  tn.id,
  t.id
from target_narratives tn
join seeded_templates s
  on lower(s.title) = tn.title_key
join unnest(s.tag_names) as requested(name)
  on true
join public.tags t
  on lower(t.name) = lower(requested.name)
on conflict (narrative_id, tag_id) do nothing;
