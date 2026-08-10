-- ============================================================================
-- 0004 — fix: status/assignment updates were failing silently.
-- The audit + CSAT triggers write to RLS-protected tables. They must run as
-- SECURITY DEFINER so those internal writes bypass RLS. Run once in SQL Editor.
-- ============================================================================

create or replace function public.touch_ticket() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    if new.status = 'resolved' and new.resolved_at is null then new.resolved_at := now(); end if;
    if new.status = 'closed'   and new.closed_at   is null then new.closed_at   := now(); end if;
    insert into ticket_events(ticket_id, actor_id, kind, detail)
      values (new.id, auth.uid(), 'status_change', jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    insert into ticket_events(ticket_id, actor_id, kind, detail)
      values (new.id, auth.uid(), 'assignment', jsonb_build_object('to', new.assigned_to));
  end if;
  return new;
end $$;

create or replace function public.on_ticket_closed() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'closed' and old.status is distinct from 'closed' then
    insert into csat_ratings(ticket_id) values (new.id) on conflict (ticket_id) do nothing;
  end if;
  return new;
end $$;
