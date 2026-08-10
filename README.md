# RDB IT Services — Client Portal

A production support-ticketing portal: clients raise tickets, staff triage / assign /
resolve them, with SLA tracking, an analytics dashboard, CSAT ratings, file attachments,
and email notifications + reply-by-email.

**Stack:** Next.js 14 (App Router, TypeScript) · Supabase (Postgres + Auth + Storage +
Realtime + Edge Functions) · Tailwind · Recharts. Deploys to Vercel.

---

## Features

| # | Feature | Where |
|---|---------|-------|
| 1 | **SLA due dates + overdue/due-soon badges** | `src/lib/sla.ts`, DB trigger `set_ticket_sla` |
| 2 | **File attachments** | Supabase Storage `ticket-files` (see setup) |
| 3 | **Email notifications + reply-by-email** | `supabase/functions/*` |
| 4 | **Analytics dashboard** (staff) | `/analytics` |
| 5 | **CSAT rating on close** | `/rate/[token]` + in-portal widget |
| — | Role-based access (client / agent / admin) | RLS policies in `0001_init.sql` |
| — | Threaded conversation + internal notes | `/tickets/[id]` |
| — | People allocation (assignment) + status workflow | `/tickets/[id]` |
| — | Audit log of status/assignment changes | table `ticket_events` |

Client isolation is enforced by **Row-Level Security in Postgres**, not just the UI —
a client can never fetch another company's tickets even via the API.

---

## 1. Prerequisites

- Node 18+ (tested on 23)
- A free [Supabase](https://supabase.com) project
- (Optional, Phase 3) [Resend](https://resend.com) account + an inbound-email provider

## 2. Database setup

1. Create a Supabase project.
2. Open **SQL Editor** and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   This creates all tables, triggers (SLA, audit, first-response, auto-close CSAT),
   RLS policies, and the `submit_csat` RPC.
3. **Create users:** Authentication → Users → *Add user* for each admin/agent/client
   (set a password, mark email confirmed).
4. Open [`supabase/seed.sql`](supabase/seed.sql), paste each user's UUID into the variables
   at the top, and run it. This assigns roles/companies and inserts demo tickets.

## 3. Storage setup (feature 2 — attachments)

1. Storage → **New bucket** → name `ticket-files`, **Private**.
2. Add these policies (SQL editor) so access mirrors ticket visibility:

```sql
create policy "read own ticket files" on storage.objects for select
  using (bucket_id = 'ticket-files' and exists (
    select 1 from tickets t
    where t.id = split_part(name, '/', 2)::bigint
      and (public.is_staff() or t.company_id = public.auth_company())));

create policy "upload ticket files" on storage.objects for insert
  with check (bucket_id = 'ticket-files' and auth.uid() is not null);
```
Files are stored at `ticket/<ticket_id>/<uuid>-<filename>`. Download via signed URLs.

## 4. Environment variables

```bash
cp .env.local.example .env.local
```
Fill in from **Supabase → Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server/edge only — never exposed to the browser)

## 5. Run locally

```bash
npm install
npm run dev
```
Open http://localhost:3000 and sign in with one of the users you created.

## 6. Deploy

- Push to GitHub → import into **Vercel**.
- Add the same env vars in Vercel → Settings → Environment Variables.
- Point `rdbit.net/support` (or `portal.rdbit.net`) at the deployment.

---

## Phase 3 — Email (notifications + reply-by-email)

Both live in `supabase/functions/`:

- **`send-notification`** — fires from a **Database Webhook** on `INSERT into ticket_messages`,
  emails the other party via **Resend** with a signed `Reply-To`
  (`support+<ticketId>-<hmac>@rdbit.net`), and writes an in-app `notifications` row.
- **`inbound-email`** — your inbound-email provider (Postmark Inbound / Mailgun Routes /
  Cloudflare Email Workers) POSTs replies here; it verifies the HMAC, strips quoted
  history, and appends the reply to the ticket.

```bash
supabase functions deploy send-notification --no-verify-jwt
supabase functions deploy inbound-email     --no-verify-jwt
supabase secrets set RESEND_API_KEY=... INBOUND_EMAIL_HMAC_SECRET=... APP_URL=https://portal.rdbit.net
```
Then: create the Database Webhook (Database → Webhooks) to call `send-notification`, and
point your inbound provider's route for `support+*@rdbit.net` at `inbound-email`.
Set up **SPF, DKIM, DMARC** on `rdbit.net` so notifications don't land in spam.

---

## Optional — SLA breach sweep (pg_cron)

Flag overdue tickets hourly and (optionally) notify:

```sql
select cron.schedule('sla-sweep', '0 * * * *', $$
  insert into ticket_events (ticket_id, kind, detail)
  select id, 'sla_breach', jsonb_build_object('due', sla_resolve_due)
  from tickets
  where status not in ('resolved','closed')
    and sla_resolve_due < now()
    and not exists (select 1 from ticket_events e
                    where e.ticket_id = tickets.id and e.kind = 'sla_breach');
$$);
```

## Project structure

```
src/
  app/
    login/                 sign-in (Supabase Auth)
    (portal)/
      layout.tsx           authed shell + nav
      tickets/             list + [id] detail + server actions
      analytics/           staff dashboard (Recharts)
    rate/[token]/          public CSAT page (no login)
    auth/signout/          sign-out route
  components/              Badges, TicketsView, TicketControls, MessageComposer, CsatWidget, AnalyticsCharts
  lib/
    supabase/              browser + server + middleware clients
    sla.ts  format.ts  types.ts  constants.ts
supabase/
  migrations/0001_init.sql schema + RLS + triggers
  seed.sql                 demo data
  functions/               send-notification, inbound-email (Deno edge)
middleware.ts              route protection + session refresh
```
