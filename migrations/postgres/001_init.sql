-- ============================================================================
-- EPHAPHATA — 001_init (PostgreSQL / Supabase PRODUCTION target)
-- ----------------------------------------------------------------------------
-- This is the authoritative production schema. The SQLite schema in
-- migrations/001_init.sqlite.sql mirrors it 1:1 for the demonstration runtime.
-- Apply with:  psql "$DATABASE_URL" -f migrations/postgres/001_init.sql
--         then migrations/postgres/002_rls.sql
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Enums -----------------------------------------------------------------------
create type user_role as enum (
  'super_admin','event_admin','registration_officer','volunteer_coordinator',
  'communications_manager','content_editor','prayer_team','programme_manager',
  'check_in_officer','viewer'
);
create type account_status  as enum ('invited','active','suspended');
create type event_status    as enum ('draft','published','registration_closed','live','completed','archived');
create type reg_status      as enum ('confirmed','waitlisted','cancelled');
create type reg_source      as enum ('public','admin','import');
create type attendance_intent as enum ('in_person','online','undecided');
create type volunteer_status as enum ('submitted','under_review','accepted','waitlisted','declined');
create type prayer_status   as enum ('received','in_prayer','follow_up','answered','archived');
create type campaign_status as enum ('draft','scheduled','sending','sent','failed','cancelled');
create type publish_status  as enum ('draft','published','scheduled','archived');
create type channel_kind    as enum ('email','whatsapp');

-- Organisation ----------------------------------------------------------------
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text,
  tagline     text,
  logo_url    text,
  email       text,
  phone       text,
  website     text,
  address     text,
  social      jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Identity --------------------------------------------------------------------
-- `profiles.id` mirrors auth.users.id in Supabase.
create table profiles (
  id           uuid primary key,
  email        citext not null unique,
  full_name    text not null,
  phone        text,
  role         user_role not null default 'viewer',
  status       account_status not null default 'invited',
  invite_token text unique,
  invited_by   uuid references profiles(id) on delete set null,
  last_login_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  token_hash  text not null unique,
  user_agent  text,
  ip_hash     text,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Events ----------------------------------------------------------------------
create table events (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  slug              text not null unique,
  title             text not null,
  edition_label     text,
  theme             text,
  scripture         text,
  summary           text,
  description       text,
  status            event_status not null default 'draft',
  is_featured       boolean not null default false,
  starts_at         timestamptz not null,
  ends_at           timestamptz,
  timezone          text not null default 'Africa/Lagos',
  venue_name        text,
  venue_address     text,
  maps_url          text,
  poster_url        text,
  hero_bg           text not null default 'multicolor',
  capacity          integer,
  registration_open boolean not null default true,
  volunteer_open    boolean not null default true,
  contact_email     text,
  contact_phone     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on events (status, starts_at desc);

create table event_speakers (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  name       text not null,
  role       text,
  bio        text,
  photo_url  text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index on event_speakers (event_id, sort_order);

create table event_schedule (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  title        text not null,
  description  text,
  speaker      text,
  starts_at    timestamptz,
  duration_min integer not null default 20,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index on event_schedule (event_id, sort_order);

create table event_faqs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  question   text not null,
  answer     text not null,
  sort_order integer not null default 0
);

-- Registrations ---------------------------------------------------------------
create table registrations (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references events(id) on delete cascade,
  reference           text not null unique,
  first_name          text not null,
  last_name           text not null,
  email               citext not null,
  phone               text not null,
  whatsapp            text,
  city                text,
  attendance_intent   attendance_intent not null default 'in_person',
  heard_via           text,
  communication_prefs jsonb default '{}'::jsonb,
  consent_privacy     boolean not null default false,
  consent_marketing   boolean not null default false,
  status              reg_status not null default 'confirmed',
  source              reg_source not null default 'public',
  qr_token            text not null unique,
  created_by          uuid references profiles(id) on delete set null,
  notes               text,
  confirmation_sent_at timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- Prevent duplicate active registrations for the same person at the same event
create unique index uq_registration_email_event
  on registrations (event_id, email) where deleted_at is null;
create index on registrations (event_id, created_at desc);
create index on registrations (event_id, status);

create table attendance_records (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  registration_id uuid not null unique references registrations(id) on delete cascade,
  checked_in_at   timestamptz not null default now(),
  method          text not null default 'qr' check (method in ('qr','manual','lookup')),
  checked_in_by   uuid references profiles(id) on delete set null,
  gate            text,
  created_at      timestamptz not null default now()
);
create index on attendance_records (event_id, checked_in_at desc);

-- Volunteers ------------------------------------------------------------------
create table volunteer_departments (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null,
  description text,
  capacity    integer,
  is_open     boolean not null default true,
  sort_order  integer not null default 0,
  unique (event_id, name)
);

create table volunteer_applications (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references events(id) on delete cascade,
  reference        text not null unique,
  full_name        text not null,
  email            citext not null,
  phone            text not null,
  whatsapp         text,
  department_id    uuid references volunteer_departments(id) on delete set null,
  second_choice_id uuid references volunteer_departments(id) on delete set null,
  experience       text,
  availability     jsonb default '[]'::jsonb,
  motivation       text,
  status           volunteer_status not null default 'submitted',
  internal_notes   text,
  reviewed_by      uuid references profiles(id) on delete set null,
  reviewed_at      timestamptz,
  consent          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (event_id, email)
);
create index on volunteer_applications (event_id, status);

-- Audience & consent ----------------------------------------------------------
create table audience_contacts (
  id             uuid primary key default gen_random_uuid(),
  email          citext not null unique,
  full_name      text,
  phone          text,
  city           text,
  source         text not null default 'registration',
  subscribed     boolean not null default false,
  unsubscribed_at timestamptz,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now()
);

create table consent_records (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid references audience_contacts(id) on delete cascade,
  registration_id uuid references registrations(id) on delete cascade,
  purpose         text not null,
  granted         boolean not null,
  source          text,
  recorded_at     timestamptz not null default now()
);
create index on consent_records (contact_id, purpose);

-- Prayer ----------------------------------------------------------------------
create table prayer_requests (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references events(id) on delete set null,
  reference       text not null unique,
  is_anonymous    boolean not null default false,
  display_name    text,
  email           text,
  phone           text,
  request         text not null,
  category        text,
  status          prayer_status not null default 'received',
  allow_follow_up boolean not null default false,
  assigned_to     uuid references profiles(id) on delete set null,
  internal_notes  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on prayer_requests (status, created_at desc);

create table prayer_follow_ups (
  id                uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references prayer_requests(id) on delete cascade,
  note              text not null,
  author_id         uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- Communications --------------------------------------------------------------
create table message_templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  channel    channel_kind not null,
  subject    text,
  body       text not null,
  variables  jsonb default '[]'::jsonb,
  status     text not null default 'draft' check (status in ('draft','approved','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table campaigns (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references events(id) on delete set null,
  name            text not null,
  channel         channel_kind not null,
  template_id     uuid references message_templates(id) on delete set null,
  subject         text,
  body            text,
  audience        text not null default 'all_registrants',
  status          campaign_status not null default 'draft',
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  recipient_count integer not null default 0,
  delivered_count integer not null default 0,
  failed_count    integer not null default 0,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table campaign_recipients (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  email       citext,
  phone       text,
  status      text not null default 'pending' check (status in ('pending','sent','delivered','failed','skipped')),
  error       text,
  updated_at  timestamptz not null default now()
);

create table notification_logs (
  id           uuid primary key default gen_random_uuid(),
  channel      text not null,
  recipient    text not null,
  template     text,
  status       text not null,
  provider     text,
  provider_ref text,
  error        text,
  related_type text,
  related_id   uuid,
  created_at   timestamptz not null default now()
);

create table automation_rules (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references events(id) on delete cascade,
  name        text not null,
  trigger     text not null,
  channel     text not null default 'email',
  template_id uuid references message_templates(id) on delete set null,
  offset_hours integer,
  is_enabled  boolean not null default true,
  last_run_at timestamptz,
  created_at  timestamptz not null default now()
);

create table automation_executions (
  id         uuid primary key default gen_random_uuid(),
  rule_id    uuid not null references automation_rules(id) on delete cascade,
  subject_id uuid,
  status     text not null default 'pending' check (status in ('pending','success','failed','skipped')),
  detail     text,
  attempts   integer not null default 0,
  created_at timestamptz not null default now()
);

-- Content ---------------------------------------------------------------------
create table content_pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  body         text,
  status       publish_status not null default 'draft',
  published_at timestamptz,
  updated_by   uuid references profiles(id) on delete set null,
  updated_at   timestamptz not null default now()
);

create table announcements (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references events(id) on delete cascade,
  title      text not null,
  body       text not null,
  severity   text not null default 'info' check (severity in ('info','important','urgent')),
  is_published boolean not null default false,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);

create table galleries (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references events(id) on delete set null,
  title      text not null,
  slug       text not null unique,
  cover_url  text,
  category   text,
  status     publish_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table media_assets (
  id         uuid primary key default gen_random_uuid(),
  gallery_id uuid references galleries(id) on delete cascade,
  url        text not null,
  alt        text,
  kind       text not null default 'image' check (kind in ('image','video')),
  width      integer,
  height     integer,
  sort_order integer not null default 0
);

create table testimonials (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references events(id) on delete set null,
  author_name text not null,
  author_role text,
  quote       text not null,
  avatar_url  text,
  status      text not null default 'draft' check (status in ('draft','approved','archived')),
  consent     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Event-day ops ---------------------------------------------------------------
create table timer_sessions (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  segment_id  uuid references event_schedule(id) on delete set null,
  label       text not null,
  planned_sec integer not null default 600,
  elapsed_sec integer not null default 0,
  state       text not null default 'idle' check (state in ('idle','running','paused','done')),
  started_at  timestamptz,
  updated_at  timestamptz not null default now()
);

-- Telemetry -------------------------------------------------------------------
create table analytics_events (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  path         text,
  event_id     uuid,
  props        jsonb,
  session_hash text,
  created_at   timestamptz not null default now()
);
create index on analytics_events (name, created_at desc);

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  actor_email citext,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  detail      jsonb,
  ip_hash     text,
  created_at  timestamptz not null default now()
);
create index on audit_logs (created_at desc);

create table integration_settings (
  key        text primary key,
  value      text,
  is_secret  boolean not null default false,
  updated_at timestamptz not null default now()
);

-- updated_at triggers ---------------------------------------------------------
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['organizations','profiles','events','registrations',
    'volunteer_applications','prayer_requests','message_templates','content_pages']
  loop
    execute format('drop trigger if exists trg_touch_%1$s on %1$s', t);
    execute format('create trigger trg_touch_%1$s before update on %1$s
                    for each row execute function touch_updated_at()', t);
  end loop;
end $$;
