-- ============================================================================
-- RDB IT Services — demo seed
-- Run AFTER 0001_init.sql, and AFTER you've created your login user.
-- Replace the email below with YOUR login email, then Run once.
-- ============================================================================

-- 1) Promote your account to admin so you see the full staff dashboard.
update profiles set role = 'admin', full_name = coalesce(full_name, 'Admin')
 where email = 'ak4343359@gmail.com';

-- 2) A demo client company.
insert into companies (name)
select 'Northside Dental'
where not exists (select 1 from companies where name = 'Northside Dental');

-- 3) Demo tickets (created_by / assigned_to = your admin account).
insert into tickets
  (subject, description, category, priority, status, created_by, company_id, assigned_to,
   created_at, updated_at, resolved_at, closed_at)
select v.subject, v.description, v.category, v.priority::ticket_prio, v.status::ticket_status,
       me.id, co.id, me.id, v.created_at, v.created_at, v.resolved_at, v.closed_at
from (values
  ('Warehouse camera 3 offline',
   'Camera 3 covering the loading dock shows "no signal" in the NVR. Others are fine.',
   'Surveillance / Cameras', 'urgent', 'open',
   now() - interval '6 hours', null::timestamptz, null::timestamptz),
  ('Front-door badge reader not accepting cards',
   'Badge reader at the main entrance beeps red for all staff cards. Keypad still works.',
   'Access Control & Alarms', 'high', 'in_progress',
   now() - interval '2 days', null::timestamptz, null::timestamptz),
  ('Outlook keeps asking for password',
   'Three users get repeated Outlook password prompts after the last update.',
   'Managed IT', 'medium', 'on_hold',
   now() - interval '4 days', null::timestamptz, null::timestamptz),
  ('New Cat6 drops for 2 desks',
   'Two new hires need network drops in the east office.',
   'Network / Cabling', 'low', 'resolved',
   now() - interval '9 days', now() - interval '2 days', null::timestamptz),
  ('Conference room mic cutting out',
   'Ceiling mic drops audio intermittently during calls.',
   'Audio / AV', 'medium', 'closed',
   now() - interval '20 days', now() - interval '14 days', now() - interval '14 days')
) as v(subject, description, category, priority, status, created_at, resolved_at, closed_at)
cross join (select id from profiles where email = 'ak4343359@gmail.com') me
cross join (select id from companies where name = 'Northside Dental' limit 1) co;

-- 4) A couple of demo messages on the first ticket.
insert into ticket_messages (ticket_id, author_id, body, is_internal)
select t.id, me.id, m.body, m.is_internal
from (select id from tickets where subject = 'Front-door badge reader not accepting cards' limit 1) t
cross join (select id from profiles where email = 'ak4343359@gmail.com') me
cross join (values
  ('Thanks — scheduled a site visit this afternoon.', false),
  ('Controller firmware looks out of date. Bringing a spare reader.', true)
) as m(body, is_internal);
