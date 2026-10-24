# KamaiClear architecture

## Current MVP boundary

The current MVP is a local-first Next.js App Router web application. It uses typed calculation functions and browser `localStorage` so the core user journey works without pretending that a hosted database or payment account is already connected.

```text
Next.js page
  └─ KamaiClearApp (client interaction boundary)
      ├─ earnings domain functions (pure calculations)
      ├─ localStorage adapter (demo persistence)
      ├─ `/api/assistant` action route (live model + local fallback)
      └─ accessible views: overview, log, history, receipt
```

The important product rule is that the calculation engine is independent from the storage provider. The same `Shift` shape can later be persisted through Supabase or a server API without rewriting the arithmetic or receipt UI.

## Planned production stack

| Concern | Planned choice | Current status |
| --- | --- | --- |
| Web | Next.js App Router | Implemented |
| Mobile | Expo + React Native | Planned after web validation |
| UI | Tailwind CSS + shadcn/ui patterns | Implemented as a focused custom layer; primitives can be extracted as the app grows |
| Hosted data | Supabase | Not connected yet; requires project URL and anon key |
| Reporting database | Neon Postgres | Not connected yet; requires a server-only `DATABASE_URL` |
| Authentication | Supabase Auth / Clerk / Better Auth | Not needed for the single-user local MVP |
| Hosting | Vercel | Ready for a later deployment |
| DNS/security | Cloudflare | Deployment boundary, not required for local validation |
| Payments | Razorpay / Cashfree / Dodo | Not part of the free core MVP |
| Email | Resend | Not needed until receipts or reminders are sent remotely |

## Data model

The first hosted table can use this shape:

```text
shifts
  id uuid primary key
  user_id uuid not null
  date date not null
  platform text not null
  hours numeric not null
  waiting_hours numeric not null default 0
  orders integer not null default 0
  kilometres numeric not null default 0
  payout numeric not null default 0
  tips numeric not null default 0
  incentives numeric not null default 0
  fuel numeric not null default 0
  maintenance numeric not null default 0
  phone numeric not null default 0
  other_cost numeric not null default 0
  note text
  created_at timestamptz not null default now()
```

## Security rules before hosted persistence

1. Never put `DATABASE_URL`, service-role keys, payment secrets or Resend keys in client code.
2. Use row-level security so a worker can read and write only their own shifts.
3. Keep the local demo clearly labelled until authentication is enabled.
4. Treat `payout`, costs and receipts as user-provided records, not verified platform statements.
5. Add consent before using any anonymised aggregate benchmark.

## Next implementation slice

After five or more rider interviews, add a server-backed storage adapter behind the same `Shift` domain model. Start with Supabase Auth + Supabase Postgres for the smallest deployment surface. Introduce Neon only when reporting workloads need a separate read model; do not operate two databases before the product has real usage. The assistant route already validates model output into a small action contract before the UI can navigate, fill fields or save.
