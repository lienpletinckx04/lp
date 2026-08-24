# CFO Dashboard — AskLien.ai

A self-contained Next.js app that gives Lien a 5-minute weekly view of cash,
runway, Voorsprong (recurring membership), pipeline, capacity and marketing
funnel health — with an alerts bar that flags problems before they hurt.

This is **Phase 1**: manual weekly entry + optional Stripe sync. No other
external services are required to run it.

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Prisma + SQLite (single file DB, no external database needed)
- Recharts for the two charts (revenue by pijler, MRR vs goal)
- Stripe Node SDK (optional — the app runs fine with zero Stripe data)

## Setup

```bash
cd cfo-dashboard
cp .env.example .env     # DATABASE_URL="file:./dev.db" is enough to start
npm install
npx prisma migrate dev   # creates dev.db and applies the schema
npm run prisma:seed      # optional: loads sample data (members, deals, days, settings)
npm run dev
```

Open http://localhost:3000. The dashboard, `/invoer` (weekly entry) and
`/instellingen` (settings) are all mobile-responsive.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | SQLite file, e.g. `file:./dev.db` |
| `STRIPE_SECRET_KEY` | no | Enables the "Sync now" button and `/api/stripe/sync` |
| `STRIPE_WEBHOOK_SECRET` | no | Enables `/api/stripe/webhook` signature verification |

Without the Stripe variables the app works normally — dashboard, manual entry
and settings all function against manually-entered data, and the sync button
reports "Stripe niet geconfigureerd" instead of erroring.

### Database

Prisma + SQLite. To change the schema, edit `prisma/schema.prisma` then run:

```bash
npx prisma migrate dev --name <change-description>
```

To reset and reseed a local database:

```bash
npx prisma migrate reset
```

### Deploying to Vercel

SQLite on Vercel's ephemeral filesystem does not persist across deploys/
instances, so for a real deployment either:
- point `DATABASE_URL` at a hosted SQLite-compatible service (e.g. Turso/
  libSQL) using the same Prisma schema, or
- swap the `datasource` provider in `prisma/schema.prisma` to Postgres and
  point at a hosted Postgres (Vercel Postgres, Supabase, etc).

The rest of the app (queries, API routes, UI) does not need to change for
either move — only the datasource block and connection string.

## Stripe integration

- **Manual sync**: the "Sync met Stripe" button on the dashboard calls
  `POST /api/stripe/sync`, which pulls active/recent subscriptions into
  `Member` rows and recent charges/invoices into `Transaction`/`Invoice` rows.
  Idempotent — safe to click repeatedly.
- **Webhook**: `POST /api/stripe/webhook` handles `checkout.session.completed`,
  `invoice.paid`, `customer.subscription.updated` and
  `customer.subscription.deleted`, verified against `STRIPE_WEBHOOK_SECRET`.
- Pijler/plan inference from Stripe price nicknames/descriptions is a rough
  heuristic in `src/lib/stripe.ts` (`inferPlan`, `inferPijler`) — adjust the
  matching once your real Stripe price naming is finalized.

## Data model (Prisma, `prisma/schema.prisma`)

- `Transaction` — dated income entries, tagged by `pijler` (voorsprong /
  audit / traject / retainer / workshop / challenge / other) and `source`
  (stripe / manual).
- `Invoice` — sent invoices with `status` (open/paid/overdue/canceled), used
  for the outstanding-invoices aging list.
- `Deal` — pipeline deals (audit/traject/workshop) with `stage` (gesprek 25% /
  voorstel 50% / akkoord 80% / gewonnen / verloren) and `lastContact` for
  follow-up alerts.
- `Member` — Voorsprong subscribers: plan (founder/regular/annual), status,
  `startedAt`/`canceledAt` for churn and MRR-by-month calculations.
- `DayEntry` — weekly logged days by type (billable/content/product/admin),
  used for utilization and revenue-per-worked-day.
- `CashSnapshot` — weekly manually-entered cash balance, used for runway.
- `Setting` — generic key/value store (JSON-encoded values) for every target,
  threshold and cost input, plus the Phase 2/3 stub fields (see below).

## What's computed (`src/lib/metrics.ts`)

All dashboard numbers are derived server-side on every page load from the
tables above — nothing is pre-aggregated or cached, so editing settings or
entering new data updates the dashboard immediately.

Includes: runway, revenue by pijler (12mo trailing), recurring share (with
2-month decline detection), gross margin, BTW/tax reserves and "really
available" cash, invoice aging, MRR + goal path, churn/ARPU/LTV, free→paid
stub, weighted pipeline, audit→traject rolling conversion, workshop progress,
stale-proposal detection, utilization %, revenue per worked day, sold-but-
undelivered backlog in weeks, customer concentration risk, and the 8 alert
rules from the spec (churn >5%, runway <4mo, invoice >14 days, concentration
>30%, recurring share declining 2mo, proposal >7 days no follow-up, backlog
>6 weeks, MRR >15% below target).

## Phase 1 vs Phase 2/3

**Phase 1 (this build)**
- Manual weekly entry screen (`/invoer`): cash, days worked, pipeline
  add/move, ad-hoc transactions/invoices.
- Optional Stripe sync (subscriptions → members, charges/invoices →
  transactions/invoices) + webhook.
- Full dashboard with all 7 sections and the 8-rule alerts bar.
- Settings screen for every target/threshold.
- Seeded sample data so the dashboard isn't empty on first run.

**Deferred to Phase 2** (stub fields exist in `Setting.marketing` and are
shown on the dashboard as manual-entry-only, clearly marked):
- Brevo (email list size/growth/open rate) — `settings.marketing.emailListSize`,
  `emailListGrowthMonthly`, `openRatePct`
- Google Calendar (webinar signups/attendance) — `settings.marketing.webinarSignups`,
  `webinarAttendance`, `webinarConversionPct`
- Hub membership platform (free member count for free→paid conversion) —
  `settings.hubTotalLeden`, `settings.marketing.hubFreeMembers`
- Challenge funnel tooling (participants/conversion automation) —
  `settings.marketing.challengeParticipants`

**Deferred to Phase 3** (placeholders only, in `settings.integrations`):
- Accounting / bank feed integration (automatic transaction import beyond
  Stripe, automatic BTW remittance tracking)
- GA4 (traffic/acquisition data)
- Instagram (organic reach/engagement data)

Search the codebase for `TODO Phase 2` / `TODO Phase 3` to find every stub.
