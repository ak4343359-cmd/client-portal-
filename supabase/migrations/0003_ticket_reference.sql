-- ============================================================================
-- 0003 — give every ticket its own unique, human-friendly reference number.
-- Format: RDB-<year>-<sequence>, e.g. RDB-2026-1001. Guaranteed unique.
-- Run this whole block once in Supabase → SQL Editor.
-- ============================================================================

alter table tickets add column if not exists reference text unique;

create sequence if not exists ticket_ref_seq start 1001;

create or replace function public.set_ticket_reference() returns trigger
  language plpgsql as $$
begin
  if new.reference is null then
    new.reference := 'RDB-' || to_char(coalesce(new.created_at, now()), 'YYYY')
      || '-' || lpad(nextval('ticket_ref_seq')::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_ticket_reference on tickets;
create trigger trg_ticket_reference
  before insert on tickets
  for each row execute function public.set_ticket_reference();

-- Backfill any existing tickets that don't have a reference yet.
update tickets
   set reference = 'RDB-' || to_char(created_at, 'YYYY') || '-' || lpad(id::text, 4, '0')
 where reference is null;
