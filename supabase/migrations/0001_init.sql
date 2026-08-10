-- ============================================================================
-- RDB IT Services — Client Portal :: initial schema, RLS, triggers
-- Run in Supabase → SQL Editor (or via `supabase db push`).
-- ============================================================================

-- ---------- enums ----------
create type user_role     as enum ('client','agent','admin');
create type ticket_status as enum ('open','in_progress','on_hold','resolved','closed');
create type ticket_prio   as enum ('low','medium','high','urgent');

-- ---------- companies ----------
create table companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

-- ---------- profiles (extends auth.users) ----------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  role        user_role not null default 'client',
  company_id  uuid references companies(id),
  created_at  timestamptz default now()
);

-- ---------- tickets ----------
create table tickets (
  id                bigint generated always as identity primary key,
  subject           text not null,
  description       text,
  category          text,
  priority          ticket_prio   not null default 'medium',
  status            ticket_status not null default 'open',
  created_by        uuid not null references profiles(id),
  company_id        uuid references companies(id),
  assigned_to       uuid references profiles(id),
  sla_response_due  timestamptz,
  sla_resolve_due   timestamptz,
  first_response_at timestamptz,
  resolved_at       timestamptz,
  closed_at         timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create index on tickets (company_id);
create index on tickets (assigned_to);
create index on tickets (status);

-- ---------- messages ----------
create table ticket_messages (
  id          bigint generated always as identity primary key,
  ticket_id   bigint not null references tickets(id) on delete cascade,
  author_id   uuid references profiles(id),
  body        text not null,
  is_internal boolean not null default false,
  via_email   boolean not null default false,
  created_at  timestamptz default now()
);
create index on ticket_messages (ticket_id);

-- ---------- attachments ----------
create table attachments (
  id           bigint generated always as identity primary key,
  ticket_id    bigint references tickets(id) on delete cascade,
  message_id   bigint references ticket_messages(id) on delete cascade,
  storage_path text not null,
  file_name    text,
  mime_type    text,
  size_bytes   bigint,
  uploaded_by  uuid references profiles(id),
  created_at   timestamptz default now()
);

-- ---------- audit log ----------
create table ticket_events (
  id          bigint generated always as identity primary key,
  ticket_id   bigint references tickets(id) on delete cascade,
  actor_id    uuid references profiles(id),
  kind        text,
  detail      jsonb,
  created_at  timestamptz default now()
);
create index on ticket_events (ticket_id);

-- ---------- CSAT ----------
create table csat_ratings (
  id           bigint generated always as identity primary key,
  ticket_id    bigint unique references tickets(id) on delete cascade,
  score        int check (score between 1 and 5),
  comment      text,
  token        uuid default gen_random_uuid(),
  submitted_at timestamptz,
  created_at   timestamptz default now()
);
create index on csat_ratings (token);

-- ---------- in-app notifications ----------
create table notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid references profiles(id),
  ticket_id   bigint references tickets(id) on delete cascade,
  message     text,
  read_at     timestamptz,
  created_at  timestamptz default now()
);
create index on notifications (user_id);

-- ============================================================================
-- Helper functions (SECURITY DEFINER so RLS policies don't recurse on profiles)
-- ============================================================================
create or replace function public.is_staff() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('agent','admin') from profiles where id = auth.uid()), false)
$$;

create or replace function public.auth_company() returns uuid
  language sql stable security definer set search_path = public as $$
  select company_id from profiles where id = auth.uid()
$$;

-- ============================================================================
-- SLA matrix + triggers
-- ============================================================================
-- Response / resolution windows per priority (in minutes).
create or replace function public.sla_minutes(p ticket_prio)
  returns table(response_min int, resolve_min int)
  language sql immutable as $$
  select m.response_min, m.resolve_min from (values
    ('urgent'::ticket_prio,   60,   240),
    ('high'::ticket_prio,    240,   480),
    ('medium'::ticket_prio,  480,  2880),   -- 8h / 2 days
    ('low'::ticket_prio,    1440,  7200)    -- 1 day / 5 days
  ) as m(prio, response_min, resolve_min)
  where m.prio = p
$$;

create or replace function public.set_ticket_sla() returns trigger
  language plpgsql as $$
declare r int; v int;
begin
  select response_min, resolve_min into r, v from public.sla_minutes(new.priority);
  new.sla_response_due := new.created_at + make_interval(mins => r);
  new.sla_resolve_due  := new.created_at + make_interval(mins => v);
  return new;
end $$;

create trigger trg_ticket_sla
  before insert on tickets
  for each row execute function public.set_ticket_sla();

-- updated_at + status timestamps + audit
create or replace function public.touch_ticket() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    if new.status = 'resolved' and new.resolved_at is null then new.resolved_at := now(); end if;
    if new.status = 'closed'   and new.closed_at   is null then new.closed_at   := now(); end if;
    insert into ticket_events(ticket_id, actor_id, kind, detail)
      values (new.id, auth.uid(), 'status_change',
              jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    insert into ticket_events(ticket_id, actor_id, kind, detail)
      values (new.id, auth.uid(), 'assignment',
              jsonb_build_object('to', new.assigned_to));
  end if;
  return new;
end $$;

create trigger trg_touch_ticket
  before update on tickets
  for each row execute function public.touch_ticket();

-- On new message: stamp first_response_at, bump updated_at, reopen resolved tickets
create or replace function public.on_new_message() returns trigger
  language plpgsql security definer set search_path = public as $$
declare t tickets;
begin
  select * into t from tickets where id = new.ticket_id;
  update tickets set
    updated_at = now(),
    first_response_at = case
      when first_response_at is null
       and not new.is_internal
       and (select role in ('agent','admin') from profiles where id = new.author_id)
      then now() else first_response_at end,
    status = case
      when status = 'resolved'
       and (select role from profiles where id = new.author_id) = 'client'
      then 'in_progress'::ticket_status else status end
  where id = new.ticket_id;
  return new;
end $$;

create trigger trg_on_new_message
  after insert on ticket_messages
  for each row execute function public.on_new_message();

-- Create CSAT row + audit when a ticket is closed
create or replace function public.on_ticket_closed() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'closed' and old.status is distinct from 'closed' then
    insert into csat_ratings(ticket_id) values (new.id)
      on conflict (ticket_id) do nothing;
  end if;
  return new;
end $$;

create trigger trg_ticket_closed
  after update on tickets
  for each row execute function public.on_ticket_closed();

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table companies       enable row level security;
alter table profiles        enable row level security;
alter table tickets         enable row level security;
alter table ticket_messages enable row level security;
alter table attachments     enable row level security;
alter table ticket_events   enable row level security;
alter table csat_ratings    enable row level security;
alter table notifications   enable row level security;

-- profiles: read own, staff, and any staff profile (so clients see assignee names)
create policy "profiles read" on profiles for select
  using (id = auth.uid() or is_staff() or role in ('agent','admin'));
create policy "profiles update own" on profiles for update
  using (id = auth.uid());

-- companies: staff read all; clients read own
create policy "companies read" on companies for select
  using (is_staff() or id = auth_company());

-- tickets
create policy "tickets read" on tickets for select
  using (is_staff() or company_id = auth_company());
create policy "tickets insert" on tickets for insert
  with check (created_by = auth.uid() and (is_staff() or company_id = auth_company()));
create policy "tickets update staff" on tickets for update
  using (is_staff());

-- messages: staff see all; clients see non-internal on their tickets
create policy "messages read" on ticket_messages for select
  using (
    is_staff() or (
      not is_internal and exists (
        select 1 from tickets t where t.id = ticket_id and t.company_id = auth_company()
      )
    )
  );
create policy "messages insert" on ticket_messages for insert
  with check (
    author_id = auth.uid()
    and (is_internal = false or is_staff())
    and exists (
      select 1 from tickets t where t.id = ticket_id
      and (is_staff() or t.company_id = auth_company())
    )
  );

-- attachments: follow ticket visibility
create policy "attachments read" on attachments for select
  using (exists (
    select 1 from tickets t where t.id = ticket_id
    and (is_staff() or t.company_id = auth_company())
  ));
create policy "attachments insert" on attachments for insert
  with check (uploaded_by = auth.uid() and exists (
    select 1 from tickets t where t.id = ticket_id
    and (is_staff() or t.company_id = auth_company())
  ));

-- events: staff read all; clients read non-internal-ish events on their tickets
create policy "events read" on ticket_events for select
  using (exists (
    select 1 from tickets t where t.id = ticket_id
    and (is_staff() or t.company_id = auth_company())
  ));

-- csat: staff read all; clients read their own tickets' ratings
create policy "csat read" on csat_ratings for select
  using (exists (
    select 1 from tickets t where t.id = ticket_id
    and (is_staff() or t.company_id = auth_company())
  ));

-- notifications: own only
create policy "notifications read" on notifications for select
  using (user_id = auth.uid());
create policy "notifications update own" on notifications for update
  using (user_id = auth.uid());

-- ============================================================================
-- Public CSAT submission (called from the token page, no login required)
-- ============================================================================
create or replace function public.submit_csat(p_token uuid, p_score int, p_comment text)
  returns void
  language plpgsql security definer set search_path = public as $$
begin
  update csat_ratings
     set score = p_score, comment = p_comment, submitted_at = now()
   where token = p_token and submitted_at is null;
  if not found then
    raise exception 'invalid or already-used rating link';
  end if;
end $$;
grant execute on function public.submit_csat(uuid, int, text) to anon, authenticated;

-- ============================================================================
-- Auto-create a profile row when a user signs up
-- ============================================================================
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
