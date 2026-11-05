/**
 * Demonstration credentials.
 * ------------------------------------------------------------------
 * These accounts exist ONLY in the seeded demonstration dataset. They are
 * surfaced on the login screen behind an explicit "demo" disclosure so the host
 * can walk the system without hunting for passwords.
 *
 * In production: run scripts/migrate + invite real users from
 * Admin → Team, and delete every seeded profile.
 */
export type DemoAccount = {
  role: string;
  roleKey: string;
  email: string;
  password: string;
  label: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    roleKey: "super_admin",
    role: "Super Admin",
    label: "Everything, including team & settings",
    email: "admin@ephaphata.com",
    password: "EphaphataAdmin2026!",
  },
  {
    roleKey: "registration_officer",
    role: "Registration Officer",
    label: "Registrations, manual entry, check-in",
    email: "registration@ephaphata.com",
    password: "EphaphataReg2026!",
  },
  {
    roleKey: "volunteer_coordinator",
    role: "Volunteer Coordinator",
    label: "Applications and department assignment",
    email: "volunteers@ephaphata.com",
    password: "EphaphataVol2026!",
  },
  {
    roleKey: "prayer_team",
    role: "Prayer Team",
    label: "Private prayer requests only",
    email: "prayer@ephaphata.com",
    password: "EphaphataPray2026!",
  },
  {
    roleKey: "check_in_officer",
    role: "Check-in Officer",
    label: "Attendance desk only",
    email: "checkin@ephaphata.com",
    password: "EphaphataGate2026!",
  },
];

/** Shown in the admin chrome so a demo is never mistaken for live data. */
// Demo credentials must never be exposed by an accidentally incomplete
// production environment. Local development opts in explicitly via true.
export const DEMO_MODE = process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true";
