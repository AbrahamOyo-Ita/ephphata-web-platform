-- ============================================================================
-- EPHAPHATA - 001_init (SQLite adapter)
-- ----------------------------------------------------------------------------
-- Runnable schema for the demonstration environment.
-- The production target is PostgreSQL: see migrations/postgres/001_init.sql
-- (+ 002_rls.sql). Entity names, columns and constraints are kept identical so
-- the data-access layer is portable.
--
-- Notes:
--   * All timestamps are ISO-8601 UTC strings.
--   * Soft deletes use `deleted_at` where history matters.
--   * `event_id` is carried on every operational record so editions never mix.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- organisation
CREATE TABLE IF NOT EXISTS organizations (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  short_name      TEXT,
  tagline         TEXT,
  logo_url        TEXT,
  email           TEXT,
  phone           TEXT,
  website         TEXT,
  address         TEXT,
  social          TEXT,              -- JSON object
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------------- identity
CREATE TABLE IF NOT EXISTS profiles (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  role            TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('super_admin','event_admin','registration_officer',
                                  'volunteer_coordinator','communications_manager',
                                  'content_editor','prayer_team','programme_manager',
                                  'check_in_officer','viewer')),
  status          TEXT NOT NULL DEFAULT 'invited'
                  CHECK (status IN ('invited','active','suspended')),
  password_hash   TEXT,
  invite_token    TEXT UNIQUE,
  invited_by      TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  last_login_at   TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,
  profile_id      TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,   -- sha256 of the cookie value; never the raw token
  user_agent      TEXT,
  ip_hash         TEXT,
  expires_at      TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_profile ON sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

-- --------------------------------------------------------------------- events
CREATE TABLE IF NOT EXISTS events (
  id                TEXT PRIMARY KEY,
  org_id            TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  edition_label     TEXT,               -- e.g. "UNICAL"
  theme             TEXT,               -- e.g. "THE NEW - Isaiah 43:19"
  scripture         TEXT,
  summary           TEXT,
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published','registration_closed','live','completed','archived')),
  is_featured       INTEGER NOT NULL DEFAULT 0,
  starts_at         TEXT NOT NULL,      -- ISO-8601 UTC
  ends_at           TEXT,
  timezone          TEXT NOT NULL DEFAULT 'Africa/Lagos',
  venue_name        TEXT,
  venue_address     TEXT,
  maps_url          TEXT,
  poster_url        TEXT,
  hero_bg           TEXT NOT NULL DEFAULT 'multicolor',   -- brand background family
  capacity          INTEGER,
  registration_open INTEGER NOT NULL DEFAULT 1,
  volunteer_open    INTEGER NOT NULL DEFAULT 1,
  contact_email     TEXT,
  contact_phone     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts ON events(starts_at DESC);

CREATE TABLE IF NOT EXISTS event_speakers (
  id            TEXT PRIMARY KEY,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  role          TEXT,                  -- "Host", "Guest Minister", …
  bio           TEXT,
  photo_url     TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_speakers_event ON event_speakers(event_id, sort_order);

CREATE TABLE IF NOT EXISTS event_schedule (
  id            TEXT PRIMARY KEY,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  speaker       TEXT,
  starts_at     TEXT,
  duration_min  INTEGER NOT NULL DEFAULT 20,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_schedule_event ON event_schedule(event_id, sort_order);

CREATE TABLE IF NOT EXISTS event_faqs (
  id            TEXT PRIMARY KEY,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_faqs_event ON event_faqs(event_id, sort_order);

-- --------------------------------------------------------------- registrations
CREATE TABLE IF NOT EXISTS registrations (
  id                    TEXT PRIMARY KEY,
  event_id              TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reference             TEXT NOT NULL UNIQUE,       -- human readable, e.g. EPH-26-8H4K2Q
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  email                 TEXT NOT NULL COLLATE NOCASE,
  phone                 TEXT NOT NULL,
  whatsapp              TEXT,
  city                  TEXT,
  attendance_intent     TEXT NOT NULL DEFAULT 'in_person'
                        CHECK (attendance_intent IN ('in_person','online','undecided')),
  heard_via             TEXT,                        -- source attribution
  communication_prefs   TEXT,                        -- JSON { email:bool, whatsapp:bool, newsletter:bool }
  consent_privacy       INTEGER NOT NULL DEFAULT 0,
  consent_marketing     INTEGER NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'confirmed'
                        CHECK (status IN ('confirmed','waitlisted','cancelled')),
  source                TEXT NOT NULL DEFAULT 'public'
                        CHECK (source IN ('public','admin','import')),
  qr_token              TEXT NOT NULL UNIQUE,        -- opaque, high-entropy; never contains PII
  created_by            TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  notes                 TEXT,
  confirmation_sent_at  TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at            TEXT
);
-- One active registration per email per event (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_registration_email_event
  ON registrations(event_id, lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reg_event ON registrations(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reg_status ON registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_reg_email ON registrations(email);

CREATE TABLE IF NOT EXISTS attendance_records (
  id                TEXT PRIMARY KEY,
  event_id          TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id   TEXT NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
  checked_in_at     TEXT NOT NULL DEFAULT (datetime('now')),
  method            TEXT NOT NULL DEFAULT 'qr' CHECK (method IN ('qr','manual','lookup')),
  checked_in_by     TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  gate              TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance_records(event_id, checked_in_at DESC);

-- ------------------------------------------------------------------ volunteers
CREATE TABLE IF NOT EXISTS volunteer_departments (
  id            TEXT PRIMARY KEY,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  capacity      INTEGER,
  is_open       INTEGER NOT NULL DEFAULT 1,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(event_id, name)
);

CREATE TABLE IF NOT EXISTS volunteer_applications (
  id                TEXT PRIMARY KEY,
  event_id          TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reference         TEXT NOT NULL UNIQUE,
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL COLLATE NOCASE,
  phone             TEXT NOT NULL,
  whatsapp          TEXT,
  department_id     TEXT REFERENCES volunteer_departments(id) ON DELETE SET NULL,
  second_choice_id  TEXT REFERENCES volunteer_departments(id) ON DELETE SET NULL,
  experience        TEXT,
  availability      TEXT,               -- JSON array of slots
  motivation        TEXT,
  status            TEXT NOT NULL DEFAULT 'submitted'
                    CHECK (status IN ('submitted','under_review','accepted','waitlisted','declined')),
  internal_notes    TEXT,
  reviewed_by       TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at       TEXT,
  consent           INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vol_event ON volunteer_applications(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vol_status ON volunteer_applications(event_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_volunteer_email_event
  ON volunteer_applications(event_id, lower(email));

-- -------------------------------------------------------------------- audience
CREATE TABLE IF NOT EXISTS audience_contacts (
  id                TEXT PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE COLLATE NOCASE,
  full_name         TEXT,
  phone             TEXT,
  city              TEXT,
  source            TEXT NOT NULL DEFAULT 'registration',
  subscribed        INTEGER NOT NULL DEFAULT 0,     -- newsletter opt-in only
  unsubscribed_at   TEXT,
  first_seen_at     TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consent_records (
  id            TEXT PRIMARY KEY,
  contact_id    TEXT REFERENCES audience_contacts(id) ON DELETE CASCADE,
  registration_id TEXT REFERENCES registrations(id) ON DELETE CASCADE,
  purpose       TEXT NOT NULL,          -- 'event_updates' | 'newsletter' | 'follow_up'
  granted       INTEGER NOT NULL,
  source        TEXT,
  recorded_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_consent_contact ON consent_records(contact_id, purpose);

-- ---------------------------------------------------------------- prayer wall
CREATE TABLE IF NOT EXISTS prayer_requests (
  id                TEXT PRIMARY KEY,
  event_id          TEXT REFERENCES events(id) ON DELETE SET NULL,
  reference         TEXT NOT NULL UNIQUE,
  is_anonymous      INTEGER NOT NULL DEFAULT 0,
  display_name      TEXT,
  email             TEXT,
  phone             TEXT,
  request           TEXT NOT NULL,
  category          TEXT,
  status            TEXT NOT NULL DEFAULT 'received'
                    CHECK (status IN ('received','in_prayer','follow_up','answered','archived')),
  allow_follow_up   INTEGER NOT NULL DEFAULT 0,
  assigned_to       TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  internal_notes    TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_prayer_status ON prayer_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_event ON prayer_requests(event_id);

CREATE TABLE IF NOT EXISTS prayer_follow_ups (
  id                TEXT PRIMARY KEY,
  prayer_request_id TEXT NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  note              TEXT NOT NULL,
  author_id         TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------- communications
CREATE TABLE IF NOT EXISTS message_templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  channel     TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  subject     TEXT,
  body        TEXT NOT NULL,
  variables   TEXT,                    -- JSON array of supported merge tags
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campaigns (
  id            TEXT PRIMARY KEY,
  event_id      TEXT REFERENCES events(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  channel       TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  template_id   TEXT REFERENCES message_templates(id) ON DELETE SET NULL,
  subject       TEXT,
  body          TEXT,
  audience      TEXT NOT NULL DEFAULT 'all_registrants',   -- filter descriptor
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','scheduled','sending','sent','failed','cancelled')),
  scheduled_at  TEXT,
  sent_at       TEXT,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0,
  created_by    TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_campaign_status ON campaigns(status, created_at DESC);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id            TEXT PRIMARY KEY,
  campaign_id   TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email         TEXT,
  phone         TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','sent','delivered','failed','skipped')),
  error         TEXT,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_recipients_campaign ON campaign_recipients(campaign_id, status);

CREATE TABLE IF NOT EXISTS notification_logs (
  id            TEXT PRIMARY KEY,
  channel       TEXT NOT NULL,
  recipient     TEXT NOT NULL,
  template      TEXT,
  status        TEXT NOT NULL,          -- 'queued' | 'sent' | 'not_configured' | 'failed'
  provider      TEXT,
  provider_ref  TEXT,
  error         TEXT,
  related_type  TEXT,
  related_id    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notification_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS automation_rules (
  id            TEXT PRIMARY KEY,
  event_id      TEXT REFERENCES events(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  trigger       TEXT NOT NULL
                CHECK (trigger IN ('registration_created','volunteer_submitted',
                                   'volunteer_accepted','event_reminder','post_event')),
  channel       TEXT NOT NULL DEFAULT 'email',
  template_id   TEXT REFERENCES message_templates(id) ON DELETE SET NULL,
  offset_hours  INTEGER,
  is_enabled    INTEGER NOT NULL DEFAULT 1,
  last_run_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS automation_executions (
  id            TEXT PRIMARY KEY,
  rule_id       TEXT NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  subject_id    TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','success','failed','skipped')),
  detail        TEXT,
  attempts      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_auto_exec ON automation_executions(rule_id, created_at DESC);

-- -------------------------------------------------------------------- content
CREATE TABLE IF NOT EXISTS content_pages (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  body          TEXT,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','published','scheduled','archived')),
  published_at  TEXT,
  updated_by    TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS announcements (
  id            TEXT PRIMARY KEY,
  event_id      TEXT REFERENCES events(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  severity      TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','important','urgent')),
  is_published  INTEGER NOT NULL DEFAULT 0,
  starts_at     TEXT,
  ends_at       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS galleries (
  id            TEXT PRIMARY KEY,
  event_id      TEXT REFERENCES events(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  cover_url     TEXT,
  category      TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media_assets (
  id            TEXT PRIMARY KEY,
  gallery_id    TEXT REFERENCES galleries(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  alt           TEXT,
  kind          TEXT NOT NULL DEFAULT 'image' CHECK (kind IN ('image','video')),
  width         INTEGER,
  height        INTEGER,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS testimonials (
  id            TEXT PRIMARY KEY,
  event_id      TEXT REFERENCES events(id) ON DELETE SET NULL,
  author_name   TEXT NOT NULL,
  author_role   TEXT,
  quote         TEXT NOT NULL,
  avatar_url    TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  consent       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --------------------------------------------------------------- event day ops
CREATE TABLE IF NOT EXISTS timer_sessions (
  id            TEXT PRIMARY KEY,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  segment_id    TEXT REFERENCES event_schedule(id) ON DELETE SET NULL,
  label         TEXT NOT NULL,
  planned_sec   INTEGER NOT NULL DEFAULT 600,
  elapsed_sec   INTEGER NOT NULL DEFAULT 0,
  state         TEXT NOT NULL DEFAULT 'idle' CHECK (state IN ('idle','running','paused','done')),
  started_at    TEXT,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_timer_event ON timer_sessions(event_id, updated_at DESC);

-- ------------------------------------------------------------------- telemetry
CREATE TABLE IF NOT EXISTS analytics_events (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  path          TEXT,
  event_id      TEXT,
  props         TEXT,
  session_hash  TEXT,                  -- privacy-first: hashed, no PII, no cookies
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_analytics_name ON analytics_events(name, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id            TEXT PRIMARY KEY,
  actor_id      TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  actor_email   TEXT,
  action        TEXT NOT NULL,          -- 'registration.create', 'auth.login', …
  entity_type   TEXT,
  entity_id     TEXT,
  detail        TEXT,                   -- JSON
  ip_hash       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);

CREATE TABLE IF NOT EXISTS integration_settings (
  key           TEXT PRIMARY KEY,
  value         TEXT,
  is_secret     INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------- rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket        TEXT PRIMARY KEY,
  count         INTEGER NOT NULL DEFAULT 0,
  expires_at    TEXT NOT NULL
);
