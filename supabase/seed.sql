-- Default password for all seeded templates: 0000
-- To add future seeds, add a row in seeded_templates below.
-- Every seeded template is always forced to locked state.

with seed_tags as (
  select distinct on (lower(v.name))
    v.name
  from (
    values
      ('5150'),
      ('CSU'),
      ('Jail'),
      ('ER'),
      ('St Joseph'),
      ('OC Global'),
      ('SC Global'),
      ('Anaheim Global'),
      ('Psych'),
      ('5585'),
      ('UCI'),
      ('BeWell'),
      ('Aliso Ridge'),
      ('MRI'),
      ('W6000'),
      ('SNF'),
      ('Assisted Living'),
      ('Discharge')
  ) as v(name)
  order by lower(v.name), v.name
)
insert into public.tags (name)
select st.name
from seed_tags st
where not exists (
  select 1 from public.tags t where lower(t.name) = lower(st.name)
);

with lock_value as (
  select encode(digest('0000', 'sha256'), 'hex') as hash
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
    '5150 going to BeWell'::text,
    $$Unit 3 AOS at 23072 lake center Dr to find a 57 y/o male standing outside. Chief complaint of 5150 DTS. Report, transfer packet received from BHC II Danielle G. Patient is being transported to BEWELL for behavioral and psychiatric evaluation and treatment. Requires ambulance transport due to 5150 hold.

PMHx anxiety. Allergies: NKA. Patient reports a past history of alcohol use. AxOx4, GCS 15. Vitals on scene: WNL for BLS transport. No pain reported (0/10). Patient is cooperative. No medical devices.

Patient transferred to the gurney via assisted ambulation EMTX2 without incident. Placed in semi-Fowler's position to maintain airway patency.

Patient transported to BEWELL. Upon arrival, patient was transferred to the hallway via assisted ambulation. Patient placed in semi-Fowler's position. Report was handed off to RN Brianna S. Gurney and equipment were decontaminated and prepared for the next call. $$::text,
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
  union all
  select
    'BEWell to aliso ridge'::text,
    $$Unit 3 AOS at BeWell to find a 41 y/o male standing in hallway. Chief complaint of GD 5150. Report, transfer packet received from RN Kaitlyn D. Patient is being transported to Aliso Ridge for ext care. Patient going for ext care. Requires ambulance transport due to 5150 hold.

AxOx3, GCS 14. Vitals on scene: WNL for BLS transport. No pain reported (0/10). No medical devices. PMHx of none, etc. Allergies: NKA. Patient reports a past history no alcohol or drug use.

Patient transferred to the gurney via assisted ambulation EMTx2 without incident. Placed in semi-Fowler's position to maintain airway patency. 4-point soft physical restraints applied due to 5150 hold. PMSCs were assessed immediately before applying restraints, within five minutes after application, and every 15 minutes during transport, remaining intact throughout. A final PMSC check was performed immediately after removing the restraints. Vitals monitored en route and remained stable.

Patient transported to Aliso Ridge. Upon arrival, patient was transferred to the hallway via assisted ambulation EMTx2 without incident. Report, transfer packet, and patient's belongings were handed off to RN Nick B. Gurney and equipment were decontaminated and prepared for the next call.$$::text,
    array['bewell', 'aliso ridge', '5150', 'psych']::text[]
  union all
  select
    'Transport to OC GLOBAL MRI'::text,
    $$Unit 3 AOS at Anaheim Global CMS Unit to find a 46 y/o male sitting in room 605-1. Chief complaint of left foot wound. PT assisted ambulated via EMTX2 from bed to gurney. PT is being transported to OC Global MRI trailer for MRI. Report received from RN BernadetteM. Needs ambulance transport due to law enforcement custody. Sheriff Sciacc rode in back.

PMHx of Hepatitis C. Allergies: NKA. Patient reports a past history of no drug or alcohol use.

AxOx4, GCS 15. Patient cooperative. pain 3/10 left foot. Medical devices: none. Vitals: WNL for BLS transport. Vitals monitored en route and remained stable. 4 point soft restraints were placed on pt and stayed on until transfer of care. CSM was checked before and every 15 minutes after restraints were applied.

Patient transported to OC GLOBAL without incident. Upon arrival, patient was transferred to MRI trailer bed via assisted ambulation via EMTX2. Report, patients belongings were handed off to Rad Tech. Gurney and equipment were decontaminated and prepared for the next call.

All times approximate.

All times approximate.$$::text,
    array['anaheim global', 'oc global', 'mri']::text[]
  union all
  select
    '5150 CAT Transport Template'::text,
    $$Unit [unit] AOS at [origin] to find a [age] y/o [gender] [position] in [location]. Chief complaint of [CC]. Report, transfer packet received from RN [nurse]. Patient is being transported to [destination] for [reason]. Requires ambulance transport due to [medical necessity].

AxOx[aox], GCS [gcs]. Vitals on scene: [vitals] for BLS transport. Pain [pain]/10. Medical devices: [devices]. PMHx of [pmhx]. Allergies: [allergies]. Patient reports a past history of [substance history].

Patient transferred to the gurney via [transfer method] EMTx2 without incident. Placed in [positioning] to maintain airway patency. [restraint type] applied due to [restraint reason]. PMSCs were assessed immediately before applying restraints, within five minutes after application, and every [pmsc interval] during transport, remaining intact throughout. A final PMSC check was performed immediately after removing the restraints. Vitals monitored en route and remained stable.

Patient transported to [destination]. Upon arrival, patient was transferred to [location] via [transfer method] EMTx2 without incident. Report, transfer packet, and patient's belongings were handed off to RN [handoff nurse]. Gurney and equipment were decontaminated and prepared for the next call.

All times approximate.$$::text,
    array['5150', 'cat', 'psych']::text[]
  union all
  select
    'generic ift transfer'::text,
    $$Unit [unit] AOS at [origin] to find a [age] y/o [gender] admitted for [CC]. Patient found in [position] in [location]. Delay on scene due to [scene delay]. Report received from RN [nurse]. Patient is being transported to [destination] for [reason].

Patient transported by ambulance due to [medical necessity]. AxOx[aox], GCS [gcs]. Isolation status: [isolation status]. Code status: [code status]. PMHx of [pmhx]. Allergies: [allergies].

Upon initial patient contact, patient was assessed and initial vitals obtained. Chief complaint of [CC]; secondary complaint of [secondary complaint]. Pain [pain]/10. Vitals monitored and remained [vitals] for BLS transport.

Patient transferred to the gurney via [transfer method] EMTx2 without incident. Patient placed in [positioning] with side rails up and safety straps secured. Due to [restraint reason], [restraint type] were applied for patient and crew safety. PMSCs were assessed immediately prior to restraint application, within five minutes after application, and every [pmsc interval] during transport, remaining intact throughout. A final PMSC check was completed immediately after restraints were removed at destination.

No medications administered during transport.

Patient loaded into ambulance without incident. Patient closely monitored en route and arrived at destination with no significant change in status.

Upon arrival at [destination], patient transferred from gurney to [location] via [transfer method] EMTx2 without incident and placed in [positioning]. Patient care transferred to RN [handoff nurse]. Delay at destination due to [destination delay]. Gurney and equipment were decontaminated and prepared for the next call.

All times approximate.$$::text,
    array['ift', 'discharge']::text[]
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
