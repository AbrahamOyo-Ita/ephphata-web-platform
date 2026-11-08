# Remaining production dependencies

What stands between this build and a fully live event. Written plainly - nothing here is hidden
behind a working-looking button.

---

## 1. Blocking - must be resolved before a live event

### 1.1 Verified event facts

The event details currently in the database came from design flyers and are marked **provisional**:

| Field | Current value | Needs |
| --- | --- | --- |
| Date/time | Fri 13 Nov 2026, 3:00 PM WAT | Flyers showed both 3 PM and 4 PM - confirm |
| Venue | UNICAL International Conference Centre, Calabar | Confirm hall and entrance |
| Ministers | List from flyer (Rev. A.O. Great, Esther Oji, Lyrical HI, …) | Written confirmation from each |
| Contact email | `hello@ephaphata.com` (placeholder) | Real monitored inbox |
| Contact phone | `+234 800 000 0000` (placeholder) | Real number |
| Social links | `@otesepower` handles | Confirm current handles |

**Why it matters:** publishing the wrong venue or an unconfirmed speaker is a reputational and
pastoral problem, not a technical one. Nothing in this system invents these values - but they are
placeholders until the team confirms them.

**Fix:** Admin → Events → *Ephphata UNICAL 2026* → update and save. No deploy needed.

### 1.2 Email provider

Without `RESEND_API_KEY` and a verified sending domain, no confirmation email is sent. The UI says
so honestly, but attendees will not receive their pass by email.

**Fix:** see `docs/INTEGRATIONS.md` §1. Verify SPF/DKIM; send a real test.

### 1.3 Production secrets

`SESSION_SECRET` and `IP_HASH_SALT` currently fall back to development values. Those fallbacks are
**not** safe in production - session tokens would be predictable.

**Fix:**

```bash
openssl rand -base64 48   # SESSION_SECRET
openssl rand -hex 16      # IP_HASH_SALT
```

### 1.4 Real staff accounts

The seed creates ten demo accounts with published passwords. They must not exist in production.

**Fix:** set `DEMO_MODE=false`, sign in as super admin, invite the real team from Admin → Team,
then delete every seeded profile. Change the super admin password immediately.

### 1.5 Demo dataset removal

~160 fictional registrations, 34 volunteer applications and 12 prayer requests are in the current
database. Analytics will be meaningless if they remain.

**Fix:** `npm run db:reset` against a production database with an empty seed, or truncate the
transactional tables.

---

## 2. Important - affects quality of the live experience

### 2.1 Photography and gallery media

The site uses the supplied branded background PNGs as designed. Photography of *previous editions*
is not present, so galleries and the media page use clearly-marked placeholders.

**Fix:** supply event photography with signed consent from anyone identifiable, plus a storage
bucket (see `docs/INTEGRATIONS.md` §4).

### 2.2 WhatsApp delivery

Queuing and consent are implemented; actual delivery is not. Meta requires template approval per
account before business-initiated messages can be sent.

**Fix:** submit templates for approval, then implement the send step behind the existing
`sendWhatsApp()` seam. Until then the channel stays visibly disabled.

### 2.3 Programme timer cross-device sync

The controller and presentation screen sync through `localStorage`, which means same-browser only.

**Fix (if needed):** add a websocket or Supabase Realtime channel keyed on `event_id`. The
controller's state shape is already serialisable, so this is additive.

### 2.4 Media upload pipeline

No upload endpoint exists; `media_assets` stores URLs. Editors cannot add images through the UI.

**Fix:** see `docs/INTEGRATIONS.md` §4.

---

## 3. Hardening - before public promotion

### 3.1 Postgres adapter and migration review

The SQLite schema is exercised by the test suite and the live demo. The Postgres schema is
table-for-table equivalent but the application currently does **not** switch to Postgres when
`DATABASE_URL` is set; a tested Postgres data-access adapter is still required before using it.

**Fix:** run both migrations on a staging database and execute `tests/routes.mjs` against it before
promoting.

### 3.2 Content Security Policy

Security headers are set in `next.config.ts` (`X-Frame-Options`, `Referrer-Policy`,
`X-Content-Type-Options`, `Permissions-Policy`). A strict CSP with nonces is not yet enabled because
Next.js inline bootstrap scripts need careful nonce plumbing.

**Fix:** add a nonce-based `script-src` once the deployment origin is fixed.

### 3.3 Load testing the check-in desk

The current implementation is correct and guarded by a UNIQUE constraint, but has not been load
tested. Expect a burst of several hundred scans in the twenty minutes before start.

**Fix:** simulate 500 concurrent check-ins against staging and confirm p95 latency stays acceptable.

### 3.4 Password reset flow

Sign-in and invitation are implemented. A self-service *forgot password* flow is not - recovery is
currently "super admin re-invites".

**Fix:** add the reset-token route if the team expects unattended recovery.

---

## 4. Deliberately out of scope for this release

These were considered and excluded to protect the core flows. They are not bugs.

| Feature | Why excluded |
| --- | --- |
| Public admin sign-up | Explicitly against the brief - invitation only |
| Seat selection / assigned seating | The gathering is all-standing |
| Payment processing | Registration is free; adding payments needs a provider, reconciliation and refund policy |
| Multi-tenant organisations | One org per deployment; the schema supports more when needed |
| Native mobile apps | The admin app is mobile-usable; a native app adds a release cycle for no check-in benefit |
| Third-party analytics | First-party `analytics_events` only, to keep CSP tight and avoid consent friction |
| AI-generated attendee imagery | Would fabricate people who do not exist |

---

## 5. Verification reference

Current status of the automated checks (run against this build):

| Suite | Command | Result |
| --- | --- | --- |
| Route sweep (public + admin) | `node tests/routes.mjs` | 36 passed, 0 failed |
| Registration & check-in contracts | `node tests/e2e-demo.mjs` | 20 passed, 0 failed |
| QR unit tests | `node --test tests/checkin.test.mjs` | 14 passed, 0 failed |
| Full browser journey | `node tests/demo-journey.mjs` | 16 passed, 0 failed |
| Admin visual QA | `node scripts/qa-admin.mjs` | 0 issues (18 screens × 2 widths) |
| Public visual QA | `node scripts/qa-shots.mjs` | clean |

**Total: 86 automated checks passing, zero known runtime errors.**

The gaps in §1 are configuration and data-verification tasks, not code defects. The gaps in §2–3
are known and documented rather than silently unfinished.
