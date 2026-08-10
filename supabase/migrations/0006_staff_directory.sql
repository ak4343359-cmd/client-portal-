-- ============================================================================
-- 0006 — stop clients from reading staff emails/phones.
-- Clients previously could read full agent/admin profile rows (to show assignee
-- names). Now they can read only their OWN profile row; staff names come from a
-- restricted view that exposes id + full_name + role only.
-- Run once in Supabase → SQL Editor.
-- ============================================================================

-- Clients read only their own row; staff (agent/admin) still read everyone.
drop policy if exists "profiles read" on profiles;
create policy "profiles read" on profiles for select
  using (id = auth.uid() or is_staff());

-- Names-only directory of staff, safe for clients to read (no email/phone).
-- Runs with owner privileges (default), so it bypasses profiles' RLS but only
-- ever exposes these three columns for agent/admin rows.
create or replace view public.staff_directory as
  select id, full_name, role
  from profiles
  where role in ('agent', 'admin');

grant select on public.staff_directory to authenticated;
