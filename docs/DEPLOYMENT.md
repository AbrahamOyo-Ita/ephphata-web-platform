# EPHAPHATA - Deployment guide

Two applications ship from one Next.js codebase:

| Surface | Path | Audience |
| --- | --- | --- |
| Public site | `/` | Visitors, registrants |
| Operations app | `/admin` | Staff (invitation only) |

Both are the same deployment. There is no separate admin domain to configure or secure.

---

## 1. Prerequisites

- Node.js 20+
- A persistent SQLite volume for the current runtime, or a Node host with durable disk
- A Vercel account (or any Node host that supports Next.js 15)

---

## 2. Local development

```bash
npm install
cp .env.example .env.local      # then fill in SESSION_SECRET
npm run db:seed                 # loads the demonstration dataset
npm run dev
```

The public site runs at `http://localhost:3000`, the operations app at `http://localhost:3000/admin`.

> **Note on this sandbox:** `next dev` exceeds the available memory here, so development uses
> `next build && next start`. This is an environment constraint, not a code one - `npm run dev`
> works normally on a machine with 2 GB+ available.

---

## 3. Seeding

`npm run db:seed` creates:

- 1 organisation, 10 staff accounts (one per role)
- 3 events, including the featured **Ephphata UNICAL 2026**
- ~160 registrations, ~34 volunteer applications, 12 prayer requests
- Departments, schedule segments, campaigns, testimonials, galleries
- Notification logs and audit entries

**Every seeded person is fictional.** Addresses use `example.com`, names are generated. The admin
UI carries a visible demonstration banner whenever `DEMO_MODE` is on.

To reset: `npm run db:reset` (migrates fresh, then reseeds).

---

## 4. Production deployment

The application currently runs on SQLite. Use a host with a persistent volume and set
`DATABASE_PATH` to that mounted path. The PostgreSQL SQL files below are a future-adapter schema;
setting `DATABASE_URL` does not switch the current runtime to PostgreSQL.

### 4.1 Optional PostgreSQL preparation

1. Create a Supabase project.
2. Run the Postgres migrations in order:

   ```bash
   psql "$DATABASE_URL" -f migrations/postgres/001_init.sql
   psql "$DATABASE_URL" -f migrations/postgres/002_rls.sql
   ```

3. Confirm RLS is enabled: every table should show `rowsecurity = true` in
   `pg_tables`. The policies mirror `src/lib/permissions.ts` exactly.

### 4.2 Environment variables

In Vercel → Settings → Environment Variables, set at minimum:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical URLs, sitemap, QR links |
| `SESSION_SECRET` | ✅ | Session token pepper |
| `IP_HASH_SALT` | ✅ | Audit-log IP hashing |
| `DATABASE_URL` | ✅ | Postgres connection |
| `DEMO_MODE` | ✅ | Set `false` for live |
| `RESEND_API_KEY` / `EMAIL_FROM` | Recommended | Confirmation email |
| `WHATSAPP_TOKEN` / `WHATSAPP_SENDER` / `WHATSAPP_PROVIDER` | Optional | WhatsApp |

Generate secrets:

```bash
openssl rand -base64 48   # SESSION_SECRET
openssl rand -hex 16      # IP_HASH_SALT
```

### 4.3 Build & deploy

```bash
npm run build
```

Vercel detects Next.js automatically. No custom build command is needed.

### 4.4 First-run checklist

- [ ] `DEMO_MODE=false` and the demo dataset removed
- [ ] Sign in as the first super admin (created by the seed, then change the password)
- [ ] Invite real staff from **Admin → Team**; delete the seeded accounts
- [ ] Confirm **Admin → Settings** shows Email and WhatsApp as *Configured*
- [ ] Submit a test registration on the live domain and check the confirmation page
- [ ] Scan that test QR at **Admin → Check-In** and confirm the counter increments
- [ ] Verify `/robots.txt` disallows `/admin` and a sitemap is served at `/sitemap.xml`

---

## 5. Post-deploy verification

Run the automated suites against the deployed URL:

```bash
BASE_URL=https://ephaphata.com node tests/routes.mjs
BASE_URL=https://ephaphata.com node tests/e2e-demo.mjs
BASE_URL=https://ephaphata.com node tests/demo-journey.mjs
```

`routes.mjs` checks every public and admin route returns 200 (or a correct redirect),
and that anonymous admin access is refused. `e2e-demo.mjs` verifies the registration and
check-in contracts. `demo-journey.mjs` drives the whole journey through a real browser.

> ⚠️ `e2e-demo.mjs` and `demo-journey.mjs` create real registrations. Point them at a staging
> deployment, not production during an event.

---

## 6. Operational notes

**Rate limits** live in the `rate_limits` table, so they survive restarts and work across
serverless instances. Public endpoints: register 6/10 min, volunteer 4/15 min, prayer 5/15 min,
newsletter 5/15 min, contact 4/15 min - all per hashed IP. Sign-in is 5/10 min per IP.

If a staff member locks themselves out during setup:

```sql
DELETE FROM rate_limits WHERE bucket LIKE 'login:%';
```

**Backups.** Supabase performs daily backups on paid plans. Before an event, take a manual
snapshot - registrations and attendance are the records that matter most.

**Event day.** The check-in desk works on a phone. Open `/admin/checkin`, choose *Scan QR* if the
device browser supports `BarcodeDetector` (Chrome/Android), otherwise *Manual entry* - both paths
are always available because camera support is not universal.

**Programme timer.** The controller and presentation screen sync through `localStorage` across
tabs of the same browser. Open the presentation view on the machine driving the projector and
control it from the same browser. Cross-device sync would require a websocket layer and is listed
as a future dependency.

---

## 7. Known limitations

These are honest gaps, not hidden ones. See `docs/PRODUCTION-DEPENDENCIES.md` for the full list.

- Email and WhatsApp require provider credentials; without them the app reports *not configured*.
- WhatsApp campaign *sending* is not implemented - only queuing and consent resolution are.
- The programme timer does not sync across separate devices.
- Media uploads use URLs; there is no upload pipeline or storage bucket wiring yet.
