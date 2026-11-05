# EPHAPHATA - digital experience & event operations platform

> **Deploying?** Start with **[docs/DEPLOY.md](./docs/DEPLOY.md)** - environment
> variables, host-by-host steps, first admin account, and a go-live checklist.

A branded public site and a full operations app for **Ephaphata**, the worship gathering hosted by
OT Power & The Attackers. One Next.js codebase, two surfaces, one database, built to be reused for
every future edition.

```
/            → public site  (editorial, motion-led, mobile-first registration)
/admin       → operations app (light, dense, built for the night)
```

---

## Quick start

```bash
npm install
cp .env.example .env.local
npm run db:seed
npm run build && npm start        # then open http://localhost:3000
```

**Demo sign-in:** `admin@ephaphata.com` / `EphaphataAdmin2026!`
The login screen also lists a demo account per role behind a disclosure panel.

---

## What's built

### Public site

| Route | Purpose |
| --- | --- |
| `/` | Editorial homepage: kinetic hero, countdown, featured event, motion reveals |
| `/about` | Host, story, values - no invented facts |
| `/events`, `/events/[slug]` | Editions list and full event detail |
| `/events/[slug]/register` | Registration form with live confirmed count |
| `/register/success` | Reference, inline-SVG QR, `.ics` download, print |
| `/volunteer` | Volunteer application with availability and department choice |
| `/prayer` | Prayer request form (confidential, never logged) |
| `/media`, `/programme`, `/faq`, `/contact`, `/privacy`, `/terms` | Supporting pages |
| 404, `robots.txt`, `sitemap.xml`, OG metadata | SEO and crawl hygiene |

Motion is IntersectionObserver-based, restrained, and fully disabled under
`prefers-reduced-motion`.

### Operations app

| Route | Purpose |
| --- | --- |
| `/admin` | Dashboard: live metrics, 14-day trend, countdown, activity |
| `/admin/registrations` | Search, filter, paginate, CSV export |
| `/admin/registrations/[id]`, `/new` | Full record; manual registration |
| `/admin/checkin` | QR scanning + manual entry, duplicate and cross-event rejection |
| `/admin/volunteers`, `/[id]` | Application pipeline, department assignment, capacity |
| `/admin/events`, `/new`, `/[id]` | Event CRUD with publish/registration controls |
| `/admin/programme`, `/present` | Run-of-show timer and full-screen presentation |
| `/admin/prayer` | Confidential prayer desk with status pipeline |
| `/admin/audience` | Contacts with per-purpose consent |
| `/admin/communications` | Campaign composer, honest provider status |
| `/admin/content` | Pages, testimonials, galleries, announcements |
| `/admin/analytics` | Trends, arrivals, edition comparison |
| `/admin/team` | Invitation-only accounts, 10 roles, guards |
| `/admin/audit` | Filterable, append-only activity log |
| `/admin/settings` | Live integration status, security posture |

---

## The demonstration journey

The connection between the public site and the operations app is the core of this build:

1. Register on `/events/ephaphata-unical-2026/register` → land on a confirmation page with a
   reference and a QR code.
2. Sign in at `/admin/login` → the registration is already in `/admin/registrations`.
3. Open `/admin/checkin` → type the reference (or scan the QR) → the attendee is checked in.
4. The dashboard's checked-in count, show-up rate, and the registration's own record all update.
5. Scan again → refused as *already checked in*, with no duplicate record created.

This is verified end-to-end through a real browser by `tests/demo-journey.mjs`.

---

## Verification

| Suite | Command | Result |
| --- | --- | --- |
| Route sweep (public + admin, auth guards) | `node tests/routes.mjs` | 36 passed |
| Registration & check-in contracts | `node tests/e2e-demo.mjs` | 20 passed |
| QR logic (duplicates, isolation, PII) | `node --test tests/checkin.test.mjs` | 14 passed |
| Full browser journey | `node tests/demo-journey.mjs` | 16 passed |
| Admin write paths (every dashboard action) | `node tests/admin-smoke.mjs` | 69 passed |
| Admin screens driven in a real browser | `node tests/admin-ui.mjs` | 52 passed |
| Admin visual QA (18 screens × 2 widths) | `node scripts/qa-admin.mjs` | 0 issues |
| Public visual QA (12 routes × 2 widths) | `node scripts/qa-shots.mjs` | clean |

**207 automated checks, zero known runtime errors.** The two admin suites exercise every
mutation in the dashboard - create, edit and publish an event, staff registration,
cancellation, check-in by reference and by QR, volunteer review, prayer follow-up, campaign
composition, team invitation and role change, announcement publishing, CSV export and the
audit trail - and assert the database actually changed. They also prove a limited role
cannot perform any of them. Run both with `npm run qa`.

---

## Architecture

- **Framework:** Next.js 15 App Router, React 19, strict TypeScript
- **Styling:** Tailwind with a brand palette sampled from the supplied artwork
- **Type:** Anton (display), Bodoni Moda (editorial serif), Inter (body)
- **Data:** SQLite for the demo runtime; PostgreSQL/Supabase schema committed in `migrations/postgres`
- **Auth:** first-party sessions - bcrypt cost 12, hashed opaque tokens, httpOnly cookies, invitation only
- **Authorisation:** enforced server-side on every route and mutation, mirrored by RLS in Postgres
- **QR:** opaque 32-byte tokens, server-side validation, UNIQUE constraint against double check-in
- **Notifications:** never claim success without a provider - `sent | failed | not_configured`

### Design decisions worth knowing

- **White dominates reading surfaces.** Branded artwork appears in deliberate bands, not everywhere.
- **No invented facts.** Speakers, dates, venues and contact details come from the database and are
  marked provisional until the team confirms them. Missing imagery uses labelled placeholders.
- **Nothing fails silently.** Unconfigured email says *not configured*. A disabled WhatsApp channel
  says why. A refused check-in explains the reason and what to do.
- **Registration is not marketing consent.** Consent is recorded per purpose, and audience queries
  enforce it in SQL.

---

## Documentation

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) - deploy, environment, first-run checklist
- [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) - email, WhatsApp, database, storage, QR
- [`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md) - onboarding for the operations team
- [`docs/PRODUCTION-DEPENDENCIES.md`](docs/PRODUCTION-DEPENDENCIES.md) - what remains before go-live
- [`docs/DEMO-WALKTHROUGH.md`](docs/DEMO-WALKTHROUGH.md) - the 10-minute demo script

---

## Project layout

```
src/app/(public)/      public pages
src/app/admin/         operations app
src/app/api/           auth, admin, and public write endpoints
src/components/        public, admin, motion, brand
src/lib/               data access, auth, validation, notifications
migrations/            001_init.sqlite.sql + postgres/
scripts/               seed, migrate, visual QA
tests/                 route, contract, unit, and journey suites
```
