# Deploying Ephphata

Everything you need from "I just downloaded this" to "the live link is working".

---

## 0. What you are deploying

A Next.js 15 application with:

- **public site** - home, about, events, programme, media, volunteer, prayer, contact, FAQ, privacy, terms
- **admin dashboard** at `/admin` - registrations, check-in with QR scanning, volunteers, prayer follow-up, programme timer, communications, content, analytics, team, audit log, settings
- **SQLite database** created automatically on first run, holding registrations, attendance, volunteers and prayer requests

Two supported paths, in order of least resistance:

| Path | Best for | Database |
|---|---|---|
| **A - Vercel** | fastest live link, zero server admin | SQLite file (persists on a mounted volume) or Postgres |
| **B - Your own server** (Railway, Render, Fly, VPS) | full control, keeps the SQLite file naturally | SQLite on disk |

> **Read this before choosing:** Vercel's filesystem is ephemeral. If you deploy
> there with SQLite and no persistent volume, **every registration is lost on
> redeploy**. If you are not attaching a volume, plan for Postgres (section 6) or
> use path B.

---

## 1. Requirements

- Node.js **20.11 or newer** (`node -v`)
- npm 10+
- A domain (optional to start - every host gives you a temporary URL)

The current runtime uses SQLite through `better-sqlite3`. Deploy it only on a host with a
persistent disk/volume mounted at `DATABASE_PATH`; do not deploy the SQLite runtime to an
ephemeral filesystem. The committed PostgreSQL migrations are a schema reference for a future
adapter, not an automatic database switch: setting `DATABASE_URL` alone does not change the
runtime database.

---

## 2. Environment variables

Copy the template and fill it in:

```bash
cp .env.example .env.local
```

### Required before going live

| Variable | What it does | How to make one |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical origin used for OG tags, sitemap and **QR check-in links** | your real URL, e.g. `https://ephaphata.com` |
| `SESSION_SECRET` | pepper for admin session tokens | `openssl rand -base64 48` |
| `IP_HASH_SALT` | salts hashed IPs in the audit log (raw IPs are never stored) | `openssl rand -hex 16` |
| `ADMIN_EMAIL` | the real operator account created at bootstrap | the email you will sign in with |
| `ADMIN_PASSWORD` | its password, **12 characters minimum** | a password manager |

### Demo data

```bash
DEMO_MODE=false
```

Set this before launch. It removes the "Demonstration dataset" banner from the admin
and hides the seeded test accounts on the login screen.

### Optional integrations

| Variable | Without it |
|---|---|
| `RESEND_API_KEY`, `EMAIL_FROM` | confirmation emails log as `not_configured` and the admin says so plainly. Nothing is faked. |
| `WHATSAPP_TOKEN`, `WHATSAPP_SENDER`, `WHATSAPP_PROVIDER` | the WhatsApp composer is disabled |
| `DATABASE_URL` | only needed if you move to Postgres (section 6) |

**Important:** `NEXT_PUBLIC_SITE_URL` is baked in at **build** time. Set it before
`npm run build`, or rebuild after changing it - otherwise QR codes will point at
localhost.

---

## 3. Path A - Vercel

```bash
# 1. create the repo
git init && git add -A && git commit -m "Ephphata"

# 2. push to GitHub, then import the repo at vercel.com/new
```

In **Vercel → Settings → Environment Variables**, add every variable from section 2
(apply to Production, Preview and Development).

Build settings are detected automatically:

| Setting | Value |
|---|---|
| Framework | Next.js |
| Build command | `npm run build` |
| Output | `.next` |
| Install command | `npm install` |

### Create the real admin account

The database is empty on first deploy, which is correct - no demo data goes to
production. Create your login once, from the Vercel **project shell** or locally
against the same database:

```bash
npm run setup
```

That reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_NAME` and creates one
super-admin. It is safe to re-run - re-running resets that account's password and
touches nothing else.

### Persistent database on Vercel

If you stay on SQLite you must attach a volume, or data disappears on redeploy:

1. Vercel → Storage → create a volume, mount at `/data`
2. set `DATABASE_PATH=/data/ephaphata.db`
3. redeploy

If a persistent volume is not available on your plan, use the own-server path below until the
PostgreSQL adapter is implemented and tested for this application.

---

## 4. Path B - your own server (recommended for SQLite)

Any Node host works. Railway and Render are the least work.

### Railway

1. New Project → Deploy from GitHub repo
2. **Add a volume**, mount path `/data`
3. Variables: everything from section 2, plus `DATABASE_PATH=/data/ephaphata.db`
4. Deploy, then open the **Shell** tab and run `npm run setup`

### Render

1. New → Web Service → connect the repo
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Add a **Disk**, mount path `/data`, then set `DATABASE_PATH=/data/ephaphata.db`
5. After the first deploy, run `npm run setup` from the Shell tab

### A plain VPS

```bash
git clone <your-repo> ephaphata && cd ephaphata
npm ci
cp .env.example .env.local && nano .env.local   # fill in section 2
npm run build
npm run setup                                    # creates the admin account

# keep it running
npm install -g pm2
pm2 start "npm run start" --name ephaphata
pm2 save && pm2 startup
```

Put nginx or Caddy in front for TLS. Sample nginx location block:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

> `X-Forwarded-For` matters: the rate limiter and audit log use it to identify
> clients. Ship it from your proxy.

---

## 5. Verify the deployment

```bash
curl https://your-domain.com/api/health
```

Healthy response:

```json
{
  "status": "ok",
  "checks": {
    "database": { "ok": true, "detail": "3 events" },
    "siteUrl": { "ok": true, "detail": "https://your-domain.com" }
  },
  "integrations": { "sessionSecret": true, "email": true, "whatsapp": false, "postgres": false }
}
```

- `status: "degraded"` with HTTP 503 means the database or site URL is wrong
- `integrations.*` are booleans only - **no secrets are ever returned**
- point an uptime monitor at this endpoint

Then check by hand:

- [ ] `/` renders with the multicolor hero
- [ ] `/events` lists your events
- [ ] `/admin/login` **does not** show demonstration accounts
- [ ] you can sign in with the account from `npm run setup`
- [ ] `/admin` loads with **no** "Demonstration dataset" banner
- [ ] create a test event in `/admin/events`
- [ ] register for it on the public site - you get a reference and QR code
- [ ] scan/enter that QR at `/admin/checkin` - it checks you in
- [ ] `/sitemap.xml` and `/robots.txt` return your real domain

### Full automated pass against the live URL

Both suites run against whatever `BASE_URL` points at, and both are safe to run against a
production database: they only ever write rows addressed to `@example.test` (a reserved
domain), and they delete them again.

```bash
BASE_URL=https://your-domain.com node tests/admin-smoke.mjs   # 69 checks, every write path
BASE_URL=https://your-domain.com node tests/admin-ui.mjs      # 52 checks, every screen driven in a browser
```

`admin-smoke` covers the API contracts behind every dashboard action - create and edit an
event, manual registration, check-in, cancellation, volunteer review, prayer follow-up,
campaign creation, team invitation and role change, announcement publishing, CSV export,
the audit trail, and the permission boundaries of a limited role. `admin-ui` clicks through
the same screens with a real browser and fails on any console error.

If a check fails, the name tells you exactly which action is broken. Neither suite resets
the database or deletes anything it did not create itself.

---

## 6. Moving to Postgres (optional, for scale)

The app talks to the database through one module, `src/lib/db.ts`, and the query
helpers in `src/lib/data/*`. Those are the only places that know SQLite exists.

1. Create a Postgres database (Supabase, Neon, RDS).
2. Apply `migrations/postgres/001_init.sql` - it mirrors the SQLite schema, with
   Row Level Security policies mirroring `src/lib/permissions.ts`.
3. Set `DATABASE_URL`.
4. Replace the `better-sqlite3` calls in `src/lib/db.ts` with a Postgres client
   (`postgres` or `pg`). The function signatures stay the same.

Until you do that, the SQLite runtime is what runs - and it is genuinely reliable,
just single-file.

---

## 7. Things that are still yours to finish

These are honest gaps, not hidden ones:

| Item | Status |
|---|---|
| `hello@ephaphata.com`, `+234 800 000 0000` | placeholders in `src/lib/site.ts` - replace with real contact details |
| Email delivery | `not_configured` until `RESEND_API_KEY` is set. Confirmations are recorded, not sent. |
| WhatsApp | disabled until a provider token is set |
| Minister photographs | monogram blocks; no faces have been invented |
| Testimonials | sample copy, explicitly labelled, until real ones are approved |

---

## 8. Day-of-event checklist

- [ ] `NEXT_PUBLIC_SITE_URL` set, site rebuilt so QR links are correct
- [ ] `DEMO_MODE=false`, demo data cleared from the live database
- [ ] real account created, demo accounts removed from `/admin/team`
- [ ] `SESSION_SECRET` and `IP_HASH_SALT` are unique to production
- [ ] `/api/health` returns `ok`
- [ ] one end-to-end registration + check-in tested from a phone
- [ ] check-in staff given the `check_in_officer` role, not `super_admin`
- [ ] database backup taken (SQLite: copy `data/ephaphata.db` while the app is stopped)
