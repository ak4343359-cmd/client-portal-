-- ============================================================================
-- 0002 — allow client self-signup to work without a company.
-- Tickets are now visible to: staff, the ticket's company, OR the creator.
-- Run this whole block once in Supabase → SQL Editor.
-- ============================================================================

-- ---- tickets ----
drop policy if exists "tickets read"   on tickets;
drop policy if exists "tickets insert" on tickets;

create policy "tickets read" on tickets for select
  using (is_staff() or created_by = auth.uid() or company_id = auth_company());

create policy "tickets insert" on tickets for insert
  with check (is_staff() or created_by = auth.uid());

-- ---- messages ----
drop policy if exists "messages read"   on ticket_messages;
drop policy if exists "messages insert" on ticket_messages;

create policy "messages read" on ticket_messages for select
  using (
    is_staff() or (
      not is_internal and exists (
        select 1 from tickets t
        where t.id = ticket_id
          and (t.created_by = auth.uid() or t.company_id = auth_company())
      )
    )
  );

create policy "messages insert" on ticket_messages for insert
  with check (
    author_id = auth.uid()
    and (is_internal = false or is_staff())
    and exists (
      select 1 from tickets t
      where t.id = ticket_id
        and (is_staff() or t.created_by = auth.uid() or t.company_id = auth_company())
    )
  );

-- ---- attachments ----
drop policy if exists "attachments read"   on attachments;
drop policy if exists "attachments insert" on attachments;

create policy "attachments read" on attachments for select
  using (exists (
    select 1 from tickets t where t.id = ticket_id
      and (is_staff() or t.created_by = auth.uid() or t.company_id = auth_company())
  ));

create policy "attachments insert" on attachments for insert
  with check (uploaded_by = auth.uid() and exists (
    select 1 from tickets t where t.id = ticket_id
      and (is_staff() or t.created_by = auth.uid() or t.company_id = auth_company())
  ));

-- ---- events ----
drop policy if exists "events read" on ticket_events;
create policy "events read" on ticket_events for select
  using (exists (
    select 1 from tickets t where t.id = ticket_id
      and (is_staff() or t.created_by = auth.uid() or t.company_id = auth_company())
  ));

-- ---- csat ----
drop policy if exists "csat read" on csat_ratings;
create policy "csat read" on csat_ratings for select
  using (exists (
    select 1 from tickets t where t.id = ticket_id
      and (is_staff() or t.created_by = auth.uid() or t.company_id = auth_company())
  ));
