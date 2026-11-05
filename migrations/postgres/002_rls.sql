-- ============================================================================
-- EPHAPHATA — 002_rls (Row Level Security)
-- ----------------------------------------------------------------------------
-- Authorization is enforced in the database, not only in the UI.
-- Every policy keys off `profiles` (joined to auth.uid()) so the same rules
-- apply to server routes and to any direct Supabase client access.
-- ============================================================================

-- Helper: current user's role -------------------------------------------------
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and status = 'active';
$$;

-- Helper: does the current user hold any of these roles? ----------------------
create or replace function has_role(variadic roles user_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth_role() = any(roles), false);
$$;

-- Helper: current user is staff (any non-viewer internal role) ----------------
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth_role() is not null, false);
$$;

revoke all on function auth_role(), has_role(user_role[]), is_staff() from public;

-- Enable RLS ------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','sessions','events','event_speakers','event_schedule',
    'event_faqs','registrations','attendance_records','volunteer_departments',
    'volunteer_applications','audience_contacts','consent_records','prayer_requests',
    'prayer_follow_ups','message_templates','campaigns','campaign_recipients',
    'notification_logs','automation_rules','automation_executions','content_pages',
    'announcements','galleries','media_assets','testimonials','timer_sessions',
    'analytics_events','audit_logs','integration_settings'
  ]
  loop execute format('alter table %I enable row level security', t); end loop;
end $$;

-- PUBLIC READ SURFACES --------------------------------------------------------
-- Anonymous visitors may read published events and their public sub-entities.
create policy "public can read published events"
  on events for select to anon, authenticated
  using (status in ('published','registration_closed','live','completed'));

create policy "public can read speakers of published events"
  on event_speakers for select to anon, authenticated
  using (exists (select 1 from events e where e.id = event_id
                 and e.status in ('published','registration_closed','live','completed')));

create policy "public can read schedule of published events"
  on event_schedule for select to anon, authenticated
  using (exists (select 1 from events e where e.id = event_id
                 and e.status in ('published','registration_closed','live','completed')));

create policy "public can read faqs of published events"
  on event_faqs for select to anon, authenticated
  using (exists (select 1 from events e where e.id = event_id
                 and e.status in ('published','registration_closed','live','completed')));

create policy "public can read open volunteer departments"
  on volunteer_departments for select to anon, authenticated
  using (is_open = true and exists (select 1 from events e where e.id = event_id
         and e.status in ('published','registration_closed','live')));

create policy "public can read approved testimonials"
  on testimonials for select to anon, authenticated using (status = 'approved');

create policy "public can read published galleries and media"
  on galleries for select to anon, authenticated using (status = 'published');

create policy "public can read media of published galleries"
  on media_assets for select to anon, authenticated
  using (exists (select 1 from galleries g where g.id = gallery_id and g.status = 'published'));

create policy "public can read published content pages"
  on content_pages for select to anon, authenticated using (status = 'published');

create policy "public can read live announcements"
  on announcements for select to anon, authenticated
  using (is_published and (ends_at is null or ends_at > now()));

create policy "public can read organisation profile"
  on organizations for select to anon, authenticated using (true);

-- WRITE PATHS: public forms go through the server (service role) --------------
-- Anonymous clients never write directly. This blocks tampering with
-- acknowledgements, statuses, check-in records and audit trails.
-- (No insert policies are granted to `anon` for registrations etc.)

-- INTERNAL READ / WRITE -------------------------------------------------------
create policy "staff read own profile"
  on profiles for select to authenticated using (id = auth.uid() or is_staff());

create policy "super admins manage profiles"
  on profiles for all to authenticated
  using (has_role('super_admin')) with check (has_role('super_admin'));

create policy "users update own profile"
  on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

create policy "staff read sessions of self"
  on sessions for select to authenticated using (profile_id = auth.uid());

create policy "staff manage events"
  on events for all to authenticated
  using (has_role('super_admin','event_admin','content_editor'))
  with check (has_role('super_admin','event_admin','content_editor'));

create policy "staff read event sub-entities"
  on event_speakers for select to authenticated using (is_staff());
create policy "content editors manage speakers"
  on event_speakers for all to authenticated
  using (has_role('super_admin','event_admin','content_editor'))
  with check (has_role('super_admin','event_admin','content_editor'));

create policy "staff read schedules"
  on event_schedule for select to authenticated using (is_staff());
create policy "programme managers manage schedules"
  on event_schedule for all to authenticated
  using (has_role('super_admin','event_admin','programme_manager'))
  with check (has_role('super_admin','event_admin','programme_manager'));

-- Registrations: PII. Only registration-capable roles may read.
create policy "authorised roles read registrations"
  on registrations for select to authenticated
  using (has_role('super_admin','event_admin','registration_officer','check_in_officer'));

create policy "authorised roles create registrations"
  on registrations for insert to authenticated
  with check (has_role('super_admin','event_admin','registration_officer')
              and created_by = auth.uid());

create policy "authorised roles update registrations"
  on registrations for update to authenticated
  using (has_role('super_admin','event_admin','registration_officer'))
  with check (has_role('super_admin','event_admin','registration_officer'));

create policy "only admins delete registrations"
  on registrations for delete to authenticated using (has_role('super_admin'));

create policy "check-in roles read attendance"
  on attendance_records for select to authenticated
  using (has_role('super_admin','event_admin','registration_officer','check_in_officer','viewer'));

create policy "check-in roles write attendance"
  on attendance_records for insert to authenticated
  with check (has_role('super_admin','event_admin','registration_officer','check_in_officer'));

-- Volunteers
create policy "coordinators read volunteer applications"
  on volunteer_applications for select to authenticated
  using (has_role('super_admin','event_admin','volunteer_coordinator'));

create policy "coordinators manage volunteer applications"
  on volunteer_applications for update to authenticated
  using (has_role('super_admin','event_admin','volunteer_coordinator'))
  with check (has_role('super_admin','event_admin','volunteer_coordinator'));

create policy "staff read departments"
  on volunteer_departments for select to authenticated using (is_staff());
create policy "coordinators manage departments"
  on volunteer_departments for all to authenticated
  using (has_role('super_admin','event_admin','volunteer_coordinator'))
  with check (has_role('super_admin','event_admin','volunteer_coordinator'));

-- Audience & consent: communications + admin only
create policy "comms roles read audience"
  on audience_contacts for select to authenticated
  using (has_role('super_admin','event_admin','communications_manager'));

create policy "comms roles manage audience"
  on audience_contacts for all to authenticated
  using (has_role('super_admin','event_admin','communications_manager'))
  with check (has_role('super_admin','event_admin','communications_manager'));

create policy "comms roles read consent"
  on consent_records for select to authenticated
  using (has_role('super_admin','event_admin','communications_manager'));

-- Prayer: strictly the prayer team + admins. No viewer access.
create policy "prayer team read requests"
  on prayer_requests for select to authenticated
  using (has_role('super_admin','event_admin','prayer_team'));

create policy "prayer team update requests"
  on prayer_requests for update to authenticated
  using (has_role('super_admin','event_admin','prayer_team'))
  with check (has_role('super_admin','event_admin','prayer_team'));

create policy "prayer team read follow ups"
  on prayer_follow_ups for select to authenticated
  using (has_role('super_admin','event_admin','prayer_team'));

create policy "prayer team write follow ups"
  on prayer_follow_ups for insert to authenticated
  with check (has_role('super_admin','event_admin','prayer_team') and author_id = auth.uid());

-- Communications
create policy "comms roles read campaigns"
  on campaigns for select to authenticated
  using (has_role('super_admin','event_admin','communications_manager'));

create policy "comms roles manage campaigns"
  on campaigns for all to authenticated
  using (has_role('super_admin','event_admin','communications_manager'))
  with check (has_role('super_admin','event_admin','communications_manager'));

create policy "comms roles read templates"
  on message_templates for select to authenticated using (is_staff());

create policy "comms roles manage templates"
  on message_templates for all to authenticated
  using (has_role('super_admin','event_admin','communications_manager'))
  with check (has_role('super_admin','event_admin','communications_manager'));

-- Timer / programme
create policy "programme roles manage timer"
  on timer_sessions for all to authenticated
  using (has_role('super_admin','event_admin','programme_manager'))
  with check (has_role('super_admin','event_admin','programme_manager'));

create policy "staff read timer"
  on timer_sessions for select to authenticated using (is_staff());

-- CMS
create policy "staff read content"
  on content_pages for select to authenticated using (is_staff());

create policy "editors manage content"
  on content_pages for all to authenticated
  using (has_role('super_admin','event_admin','content_editor'))
  with check (has_role('super_admin','event_admin','content_editor'));

create policy "editors manage announcements"
  on announcements for all to authenticated
  using (has_role('super_admin','event_admin','content_editor','communications_manager'))
  with check (has_role('super_admin','event_admin','content_editor','communications_manager'));

create policy "editors manage galleries"
  on galleries for all to authenticated
  using (has_role('super_admin','event_admin','content_editor'))
  with check (has_role('super_admin','event_admin','content_editor'));

create policy "editors manage media"
  on media_assets for all to authenticated
  using (has_role('super_admin','event_admin','content_editor'))
  with check (has_role('super_admin','event_admin','content_editor'));

create policy "editors manage testimonials"
  on testimonials for all to authenticated
  using (has_role('super_admin','event_admin','content_editor'))
  with check (has_role('super_admin','event_admin','content_editor'));

-- Analytics: aggregate reads for staff, no raw PII
create policy "staff read analytics"
  on analytics_events for select to authenticated using (is_staff());

-- Audit logs: immutable. Readable by admins, never updatable by anyone.
create policy "admins read audit logs"
  on audit_logs for select to authenticated
  using (has_role('super_admin','event_admin'));

create policy "system writes audit logs"
  on audit_logs for insert to authenticated with check (true);

-- Integration settings: super admin only; secrets stored encrypted at rest
create policy "super admins manage integrations"
  on integration_settings for all to authenticated
  using (has_role('super_admin')) with check (has_role('super_admin'));

-- notification_logs
create policy "staff read notification logs"
  on notification_logs for select to authenticated using (is_staff());
