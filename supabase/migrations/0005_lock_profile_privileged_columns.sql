-- ============================================================================
-- 0005 — SECURITY FIX: prevent privilege escalation via profile self-update.
--
-- The "profiles update own" policy lets a user edit their own profile row
-- (needed for name/phone). But without a column guard, a client could set
-- their own role to 'admin' or change company_id to see another company's
-- tickets. This trigger reverts any change to role/company_id unless the
-- caller is the service role (auth.uid() is null) or an existing admin.
-- Run once in Supabase → SQL Editor.
-- ============================================================================

create or replace function public.guard_profile_privileged_cols() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  -- Service-role calls (admin Team page) have no auth.uid(): allow them.
  if auth.uid() is null then
    return new;
  end if;
  -- Existing admins may change roles/company (defense in depth).
  if exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    return new;
  end if;
  -- Everyone else: silently keep the privileged columns unchanged.
  new.role := old.role;
  new.company_id := old.company_id;
  return new;
end $$;

drop trigger if exists trg_guard_profile_cols on profiles;
create trigger trg_guard_profile_cols
  before update on profiles
  for each row execute function public.guard_profile_privileged_cols();
