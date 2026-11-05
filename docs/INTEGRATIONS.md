# EPHAPHATA - Integration configuration

Every external service is optional at build time and honest at runtime: if credentials are absent,
the feature reports **not configured** instead of pretending to succeed.

Status for all of these is visible at **Admin → Settings**.

---

## 1. Email - Resend

**Used for:** registration confirmations, volunteer acknowledgements, campaign delivery.

### Configure

1. Create a Resend account and verify your sending domain (`ephaphata.com`).
2. Create an API key with send permission.
3. Set:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="EphaPhata <hello@ephaphata.com>"
```

`EMAIL_FROM` must be on the verified domain, or delivery will be rejected.

### Behaviour without it

The registration API returns `emailStatus: "not_configured"`. The confirmation page says plainly:

> *Your place is saved. Confirmation email is not configured in this environment yet.*

`notification_logs` records the attempted send with status `not_configured`. Nothing is retried,
nothing is faked.

### Swapping providers

`src/lib/notifications.ts` has a single `sendEmail()` seam. Postmark, SendGrid and SES all fit
behind the same shape: swap the transport, keep the return contract
(`sent | failed | not_configured`).

---

## 2. WhatsApp - Meta Cloud API

**Used for:** event reminders and campaigns to WhatsApp-consented registrants.

### Configure

```env
WHATSAPP_PROVIDER=meta
WHATSAPP_TOKEN=EAAG...
WHATSAPP_SENDER=+234...
```

### Important limitation

WhatsApp **queuing and consent resolution are implemented**; live message *delivery* is not.
Template message approval is required by Meta before any message can be sent to a business
account's contacts, and that approval is per-template and per-account.

Until that approval exists, the composer keeps the WhatsApp channel disabled. This is a deliberate
honesty choice: a queue marked "sent" that never reached Meta would be worse than a disabled button.

### Consent

WhatsApp recipients are resolved from `registrations.comm_whatsapp = 1` or the audience contact's
recorded consent. Numbers without consent are excluded in SQL.

---

## 3. Database - Supabase / PostgreSQL

**Development runtime:** SQLite at `data/ephaphata.db` (fast, zero-setup, works in constrained
sandboxes).

**Production:** PostgreSQL. The schema in `migrations/postgres/001_init.sql` mirrors the SQLite
schema table-for-table, and `002_rls.sql` adds row-level security.

### Row-level security

RLS is not decoration - it enforces the same matrix as `src/lib/permissions.ts` in the database
itself, so a bug in an API route cannot leak data.

| Table group | Policy |
| --- | --- |
| `events`, `event_*` | Public read of published rows; staff write per permission |
| `registrations` | Staff read per role; public insert only through the API |
| `attendance_records` | Staff with `checkin.operate` |
| `prayer_requests` | `prayer_team` and `super_admin` only |
| `audit_logs` | `super_admin` and `event_admin` read; append-only |
| `audience_contacts` | `audience.view` |
| `profiles` | `team.manage` |

Service-role keys are **never** sent to the browser. All privileged queries run server-side.

### Migrations

```bash
psql "$DATABASE_URL" -f migrations/postgres/001_init.sql
psql "$DATABASE_URL" -f migrations/postgres/002_rls.sql
```

Migrations are written to be idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT
EXISTS`), so re-running them is safe.

---

## 4. File storage - Supabase Storage

**Status: not wired.**

Media assets currently store URLs. No upload pipeline exists yet. To implement:

1. Create a public bucket (`media`) and a private bucket (`attendee-assets`) in Supabase Storage.
2. Add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` server-side only.
3. Sign upload URLs in a route handler gated on `content.manage`.
4. Store the resulting public URL in `media_assets.url`.

Generated placeholders are used wherever real photography is missing - no stock images stand in
for actual gatherings.

---

## 5. Maps and calendar

**Maps:** venue links are plain `https://maps.google.com/?q=` deep links built from the event's
venue fields. No API key, no embedded map, no tracking script.

**Calendar:** the confirmation page generates an `.ics` file in the browser as a data URI. No
service involved - it works offline and leaks nothing.

---

## 6. QR codes

- **Generation:** `qrcode` renders an inline SVG on the confirmation page. The payload is
  `https://<site>/c/<opaque-token>`.
- **Token:** 32 random bytes, base64url. It contains **no** name, email, phone or reference.
- **Validation:** entirely server-side in `validateCredential()`. The client never decides whether
  a pass is valid.
- **Double check-in:** prevented by a `UNIQUE` constraint on `attendance_records.registration_id`,
  so even two simultaneous scans cannot create two records.

If a pass is lost, the attendee is checked in by reference at the desk - no need to re-send the QR.

---

## 7. Analytics

There is no third-party analytics script. The platform records its own events in
`analytics_events` (server-side, first-party, no cookies for visitors).

To attach a product-analytics tool later, emit from the same seam rather than adding a client
script - this keeps the CSP tight and avoids consent complications.

---

## 8. Rate limiting

Backed by the `rate_limits` table (bucket, count, expiry), so limits survive restarts and work
across serverless instances without Redis.

| Endpoint | Limit |
| --- | --- |
| `POST /api/public/register` | 6 / 10 min per IP |
| `POST /api/public/volunteer` | 4 / 15 min |
| `POST /api/public/prayer` | 5 / 15 min |
| `POST /api/public/newsletter` | 5 / 15 min |
| `POST /api/public/contact` | 4 / 15 min |
| `POST /api/auth/login` | 5 / 10 min |

At scale, swap the store for Upstash Redis behind the same `rateLimit()` signature.

---

## 9. Checklist before going live

- [ ] `RESEND_API_KEY` + verified `EMAIL_FROM` set, Settings shows Email green
- [ ] Sending domain has SPF and DKIM records
- [ ] Test registration received a real confirmation email
- [ ] `SESSION_SECRET` and `IP_HASH_SALT` generated and set
- [ ] `DATABASE_URL` points at Postgres with RLS applied
- [ ] `DEMO_MODE=false`, demo dataset removed
- [ ] WhatsApp either configured *and* template-approved, or left off knowingly
