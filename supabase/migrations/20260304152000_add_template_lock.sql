alter table public.narratives
add column if not exists is_locked boolean not null default false,
add column if not exists lock_password_hash text;

alter table public.narratives
drop constraint if exists narratives_lock_password_check;

alter table public.narratives
add constraint narratives_lock_password_check check (
  (is_locked = false and lock_password_hash is null) or
  (is_locked = true and lock_password_hash is not null)
);
