/**
 * EPHAPHATA - role & permission matrix
 * ------------------------------------------------------------------
 * Shared by the server (authorization), the API layer, and the admin UI
 * (progressive disclosure only - never the sole enforcement point).
 * The database enforces the same matrix through RLS on PostgreSQL.
 */

export const ROLES = [
  "super_admin",
  "event_admin",
  "registration_officer",
  "volunteer_coordinator",
  "communications_manager",
  "content_editor",
  "prayer_team",
  "programme_manager",
  "check_in_officer",
  "viewer",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  event_admin: "Event Admin",
  registration_officer: "Registration Officer",
  volunteer_coordinator: "Volunteer Coordinator",
  communications_manager: "Communications Manager",
  content_editor: "Content Editor",
  prayer_team: "Prayer Team",
  programme_manager: "Programme Manager",
  check_in_officer: "Check-in Officer",
  viewer: "Read-only Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Full access including team management, settings and integrations.",
  event_admin: "Manages events, registrations, volunteers and operations.",
  registration_officer: "Creates and manages registrations and check-in.",
  volunteer_coordinator: "Reviews volunteer applications and assigns departments.",
  communications_manager: "Builds campaigns, templates and automations.",
  content_editor: "Publishes website content, galleries and announcements.",
  prayer_team: "Confidential access to prayer requests and follow-up.",
  programme_manager: "Builds the agenda and runs the event-day timer.",
  check_in_officer: "Attendance desk only: scan and verify credentials.",
  viewer: "Read-only access to operational dashboards.",
};

/** Permission keys are `domain.action`. */
export const PERMISSIONS = [
  "dashboard.view",
  "events.view",
  "events.manage",
  "registrations.view",
  "registrations.manage",
  "checkin.operate",
  "volunteers.view",
  "volunteers.manage",
  "audience.view",
  "audience.manage",
  "communications.view",
  "communications.manage",
  "prayer.view",
  "prayer.manage",
  "programme.view",
  "programme.manage",
  "content.view",
  "content.manage",
  "analytics.view",
  "team.manage",
  "settings.manage",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, Permission[]> = {
  super_admin: [...PERMISSIONS],

  event_admin: [
    "dashboard.view", "events.view", "events.manage",
    "registrations.view", "registrations.manage", "checkin.operate",
    "volunteers.view", "volunteers.manage",
    "audience.view", "audience.manage",
    "communications.view", "communications.manage",
    "programme.view", "programme.manage",
    "content.view", "content.manage",
    "analytics.view", "audit.view",
  ],

  registration_officer: [
    "dashboard.view", "events.view",
    "registrations.view", "registrations.manage", "checkin.operate",
    "volunteers.view", "audience.view", "analytics.view",
  ],

  volunteer_coordinator: [
    "dashboard.view", "events.view",
    "registrations.view",
    "volunteers.view", "volunteers.manage",
    "communications.view", "audience.view", "analytics.view",
  ],

  communications_manager: [
    "dashboard.view", "events.view",
    "registrations.view", "volunteers.view",
    "audience.view", "audience.manage",
    "communications.view", "communications.manage",
    "content.view", "content.manage",
    "analytics.view",
  ],

  content_editor: [
    "dashboard.view", "events.view", "events.manage",
    "content.view", "content.manage",
    "analytics.view",
  ],

  prayer_team: ["dashboard.view", "events.view", "prayer.view", "prayer.manage"],

  programme_manager: [
    "dashboard.view", "events.view",
    "programme.view", "programme.manage",
    "registrations.view", "volunteers.view",
  ],

  check_in_officer: [
    "dashboard.view", "events.view",
    "registrations.view", "checkin.operate",
  ],

  viewer: [
    "dashboard.view", "events.view", "registrations.view",
    "volunteers.view", "programme.view", "analytics.view",
  ],
};

export function permissionsFor(role: Role): Permission[] {
  return MATRIX[role] ?? [];
}

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(permission) ?? false;
}

export function canAny(role: Role | undefined | null, perms: Permission[]): boolean {
  return perms.some((p) => can(role, p));
}

/** Landing route per role, so nobody lands on a page they cannot use. */
export function homeRouteFor(role: Role): string {
  if (can(role, "registrations.view")) return "/admin";
  if (can(role, "prayer.view")) return "/admin/prayer";
  if (can(role, "programme.manage")) return "/admin/programme";
  return "/admin";
}
