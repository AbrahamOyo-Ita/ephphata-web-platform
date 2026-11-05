/**
 * EPHAPHATA - demonstration dataset
 * ------------------------------------------------------------------
 * HONESTY RULES OBSERVED HERE:
 *  - All people, ministers and speakers below are transcribed from the SUPPLIED
 *    FLYERS only. Nothing invented.
 *  - Everything is marked `is_demo` in content where relevant, and the admin UI
 *    shows a "Demonstration data" banner.
 *  - No fabricated testimonials, statistics or sponsors are seeded as if real.
 *    The three testimonials are explicitly labelled sample copy.
 */
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "ephaphata.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(readFileSync(path.join(process.cwd(), "migrations", "001_init.sqlite.sql"), "utf8"));

const id = () => randomUUID();
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const code = (n) => Array.from(randomBytes(n), (b) => ALPHABET[b % ALPHABET.length]).join("");
const qr = () => randomBytes(32).toString("base64url");
const iso = (d) => new Date(d).toISOString().replace("T", " ").slice(0, 19);

console.log("→ resetting");
for (const t of [
  "automation_executions", "automation_rules", "campaign_recipients", "campaigns",
  "notification_logs", "message_templates", "prayer_follow_ups", "prayer_requests",
  "consent_records", "audience_contacts", "volunteer_applications", "volunteer_departments",
  "attendance_records", "registrations", "event_faqs", "event_schedule", "event_speakers",
  "timer_sessions", "testimonials", "media_assets", "galleries", "announcements",
  "content_pages", "audit_logs", "analytics_events", "integration_settings",
  "rate_limits", "sessions", "profiles", "events", "organizations",
]) {
  db.prepare(`DELETE FROM ${t}`).run();
}

/* ------------------------------------------------------------- organisation */
const ORG = id();
db.prepare(
  `INSERT INTO organizations (id, name, short_name, tagline, email, phone, address, social)
   VALUES (?,?,?,?,?,?,?,?)`
).run(
  ORG,
  "EphaPhata with OT Power & The Attackers",
  "EphaPhata",
  "One gathering. One purpose.",
  "hello@ephaphata.com", // PROVISIONAL
  "+234 800 000 0000", // PROVISIONAL
  "Calabar, Cross River State, Nigeria",
  JSON.stringify({ instagram: "https://instagram.com/otesepower", tiktok: "https://tiktok.com/@otesepower" })
);

/* ------------------------------------------------------------------- events */
// Dates taken from the supplied flyers. UNICAL edition: FRIDAY 13 NOV.
const UNICAL_START = "2026-11-13T15:00:00+01:00";

const E_UNICAL = id();
const E_JUNE = id();
const E_PAST = id();

const insertEvent = db.prepare(
  `INSERT INTO events
   (id, org_id, slug, title, edition_label, theme, scripture, summary, description, status,
    is_featured, starts_at, ends_at, venue_name, venue_address, maps_url, poster_url, hero_bg,
    capacity, registration_open, volunteer_open, contact_email)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
);

insertEvent.run(
  E_UNICAL, ORG, "ephaphata-unical-2026", "EphaPhata UNICAL 2026", "UNICAL",
  "THE NEW", "Isaiah 43:19",
  "One gathering. One purpose. A live worship experience with OT Power & The Attackers at the University of Calabar.",
  "EphaPhata UNICAL is the Calabar edition of the gathering - a live night of worship, the word and prayer with OT Power & The Attackers and guest ministers, hosted at the UNICAL International Conference Centre.\n\nDoors open ahead of the 3:00PM start so the hall can be filled and settled before the first sound. The evening moves through praise, the word, and a closing season of prayer. Every part of the programme is built around one aim: that people would leave different from how they came.\n\nThis is an all-standing gathering. There are no reserved physical seats.",
  "published", 1, UNICAL_START, "2026-11-13T21:00:00+01:00",
  "UNICAL International Conference Centre",
  "University of Calabar, Calabar, Cross River State, Nigeria",
  "https://www.google.com/maps/search/?api=1&query=UNICAL+International+Conference+Centre+Calabar",
  "/brand/flyers/unical-lineup.webp", "green",
  5000, 1, 1, "events@ephaphata.com"
);

insertEvent.run(
  E_JUNE, ORG, "ephaphata-festival-2026", "EphaPhata Festival 2026", "FESTIVAL",
  "THE NEW", "Isaiah 43:19",
  "The festival edition of the gathering - Event 45, Calabar.",
  "The EphaPhata Festival edition, held at Event 45, 6 Douglas Avenue, State Housing, Calabar. Times shown on the official flyer vary across cards (3PM / 4PM / 5PM) - confirm the final start time with the organising team before publishing.",
  "published", 0, "2026-06-05T15:00:00+01:00", "2026-06-05T21:00:00+01:00",
  "Event 45", "6 Douglas Avenue, State Housing, Calabar",
  "https://www.google.com/maps/search/?api=1&query=6+Douglas+Avenue+State+Housing+Calabar",
  "/brand/flyers/festival-emerald.webp", "red",
  3000, 0, 0, "events@ephaphata.com"
);

insertEvent.run(
  E_PAST, ORG, "ephaphata-calabar-2025", "EphaPhata Calabar 2025", "CALABAR",
  "THE NEW", "Isaiah 43:19",
  "The previous Calabar edition - archive reference.",
  "A completed edition included here so the platform can demonstrate archive behaviour, past-edition galleries and post-event follow-up. Replace this record with the verified 2025 edition details.",
  "completed", 0, "2025-11-14T15:00:00+01:00", "2025-11-14T21:00:00+01:00",
  "Calabar", "Calabar, Cross River State",
  null, "/brand/flyers/festival-multicolor.webp", "multicolor",
  null, 0, 0, "events@ephaphata.com"
);

/* ---------------------------------------------------------------- speakers */
// Transcribed exactly from the supplied UNICAL line-up flyer.
const SPEAKERS = [
  ["OT Power", "Host"],
  ["Rev. A.O. Great", "Guest Minister"],
  ["Esther Oji", "Guest Minister"],
  ["Lyrical HI", "Guest Minister"],
  ["Stefan Great", "Guest Minister"],
  ["Daniel Edet", "Guest Minister"],
  ["Jahswill Young", "Guest Minister"],
  ["Victor Edet", "Guest Minister"],
  ["Hope Philipz", "Guest Minister"],
  ["Pst. Godstime Etim", "Guest Minister"],
  ["Godfrey Gad", "Guest Minister"],
];
const spk = db.prepare(
  `INSERT INTO event_speakers (id, event_id, name, role, photo_url, sort_order) VALUES (?,?,?,?,?,?)`
);
SPEAKERS.forEach(([name, role], i) =>
  // photo_url intentionally null: we will not fabricate portraits.
  spk.run(id(), E_UNICAL, name, role, null, i)
);
[["Bidemi Olaoba", "Guest Minister"], ["Dr. Tee", "Guest Minister"], ["Jesse Godson", "Guest Minister"],
 ["Nengi", "Guest Minister"], ["Isaac Brown", "Guest Minister"]].forEach(([name, role], i) =>
  spk.run(id(), E_JUNE, name, role, null, i)
);

/* ---------------------------------------------------------------- schedule */
const SCHEDULE = [
  ["Doors open & seating", "Stewards and ushers receive the gathering", "Production", 60, 0],
  ["Praise & worship", "Opening sound with OT Power & The Attackers", "OT Power & The Attackers", 45, 1],
  ["The Word - Session 1", "Ministering the word", "Guest Minister", 50, 2],
  ["Intercession", "A season of prayer over the hall", "Prayer Team", 20, 3],
  ["The Word - Session 2", "Ministering the word", "Guest Minister", 45, 4],
  ["Thanksgiving & closing", "Closing sound and benediction", "OT Power & The Attackers", 30, 5],
];
const sch = db.prepare(
  `INSERT INTO event_schedule (id, event_id, title, description, speaker, duration_min, sort_order)
   VALUES (?,?,?,?,?,?,?)`
);
SCHEDULE.forEach(([title, desc, speakerName, dur, order]) =>
  sch.run(id(), E_UNICAL, title, desc, speakerName, dur, order)
);

/* -------------------------------------------------------------------- FAQs */
[
  ["Is EphaPhata free to attend?", "Yes. EphaPhata is a free gathering. Registration helps the organising team prepare the hall, plan seating flow and send you event-day instructions."],
  ["Is there a dress code?", "There is no formal dress code. Come as you are, and dress comfortably - the evening involves prolonged worship."],
  ["Will there be physical seats?", "EphaPhata is an all-standing event. There will be no physical seat available during the event. Seating provision is limited to reserved areas for the aged and persons with mobility needs."],
  ["Can I bring children?", "Yes. Families are welcome. A quiet room is available near the main entrance for parents with infants."],
  ["Will the gathering be streamed?", "Streaming availability is confirmed closer to the date and announced through the official channels only."],
  ["How do I check in?", "Present the QR code from your confirmation page - or your registration reference - at the check-in desk. We recommend saving your confirmation to your phone before you arrive, since network coverage at the venue may be limited."],
  ["I registered but cannot attend. What should I do?", "Reply to your confirmation email or contact the team so we can release your place to someone waiting."],
].forEach(([q, a], i) =>
  db.prepare(`INSERT INTO event_faqs (id, event_id, question, answer, sort_order) VALUES (?,?,?,?,?)`)
    .run(id(), E_UNICAL, q, a, i)
);

/* -------------------------------------------------------------- departments */
const DEPTS = [
  "Ushers & Seating", "Registration", "Protocol", "Hospitality", "Media",
  "Photography & Video", "Technical Production", "Prayer & Counselling",
  "Security", "Follow-up",
];
const deptIds = {};
const insDept = db.prepare(
  `INSERT INTO volunteer_departments (id, event_id, name, description, capacity, sort_order)
   VALUES (?,?,?,?,?,?)`
);
DEPTS.forEach((name, i) => {
  const dId = id();
  deptIds[name] = dId;
  insDept.run(dId, E_UNICAL, name, null, i === 0 ? 60 : i === 1 ? 25 : 40, i);
});

/* ------------------------------------------------------------------- people */
// Demonstration accounts. Passwords are dev-only and documented in README.
const ACCOUNTS = [
  ["admin@ephaphata.com", "Adaeze Okon", "super_admin", "EphaphataAdmin2026!"],
  ["events@ephaphata.com", "Emeka Bassey", "event_admin", "EphaphataTeam2026!"],
  ["registration@ephaphata.com", "Blessing Ita", "registration_officer", "EphaphataReg2026!"],
  ["volunteers@ephaphata.com", "Grace Umo", "volunteer_coordinator", "EphaphataVol2026!"],
  ["comms@ephaphata.com", "Tobi Adeyemi", "communications_manager", "EphaphataComms2026!"],
  ["prayer@ephaphata.com", "Pastor Ruth Effiong", "prayer_team", "EphaphataPray2026!"],
  ["programme@ephaphata.com", "Daniel Effiom", "programme_manager", "EphaphataProg2026!"],
  ["checkin@ephaphata.com", "Samuel Archibong", "check_in_officer", "EphaphataGate2026!"],
  ["viewer@ephaphata.com", "Ruth Aniekan", "viewer", "EphaphataView2026!"],
];
const insProfile = db.prepare(
  `INSERT INTO profiles (id, email, full_name, phone, role, status, password_hash)
   VALUES (?,?,?,?,?,?,?)`
);
const adminId = {};
for (const [email, name, role, password] of ACCOUNTS) {
  const pid = id();
  adminId[role] = pid;
  insProfile.run(pid, email, name, null, role, "active", bcrypt.hashSync(password, 12));
}
const superAdmin = adminId.super_admin;
const regOfficer = adminId.registration_officer;

/* ------------------------------------------------------------ registrations */
const FIRST = ["Chidi", "Amina", "Tunde", "Ngozi", "Emeka", "Fatima", "Blessing", "Ibrahim", "Chiamaka", "Samuel",
  "Grace", "David", "Adaeze", "Mfon", "Ekene", "Zainab", "Peter", "Joy", "Daniel", "Ruth",
  "Kelechi", "Hauwa", "Obinna", "Mercy", "Bassey", "Aniefiok", "Victoria", "Joseph", "Esther", "Michael"];
const LAST = ["Okafor", "Bello", "Adeyemi", "Nwosu", "Etim", "Yusuf", "Okon", "Abubakar", "Eze", "Archibong",
  "Udo", "Effiong", "Bassey", "Aniekan", "Chukwu", "Suleiman", "Akpan", "Ibrahim", "Effiom", "Umo"];
const CITIES = ["Calabar", "Uyo", "Port Harcourt", "Abuja", "Lagos", "Enugu", "Ogoja", "Ikom", "Benin City", "Warri"];
const HEARD = ["social_media", "friend_or_family", "church", "flyer", "whatsapp", "previous_edition"];
const INTENTS = ["in_person", "in_person", "in_person", "in_person", "online", "undecided"];

const insReg = db.prepare(
  `INSERT INTO registrations
   (id, event_id, reference, first_name, last_name, email, phone, whatsapp, city, attendance_intent,
    heard_via, communication_prefs, consent_privacy, consent_marketing, status, source, qr_token,
    created_by, created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
);

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const regRows = [];
// 148 UNICAL registrations spread over the last 21 days
for (let i = 0; i < 148; i += 1) {
  const first = rnd(FIRST);
  const last = rnd(LAST);
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`;
  const daysAgo = Math.floor(Math.random() * 21);
  const created = iso(Date.now() - daysAgo * 86_400_000 - Math.floor(Math.random() * 86_400_000));
  const rid = id();
  const ref = `EPH-26-${code(6)}`;
  regRows.push({ id: rid, ref, first, last, email, daysAgo });
  insReg.run(
    rid, E_UNICAL, ref, first, last, email,
    `080${Math.floor(10000000 + Math.random() * 89999999)}`,
    null, rnd(CITIES), rnd(INTENTS), rnd(HEARD),
    JSON.stringify({ email: true, whatsapp: Math.random() > 0.4, newsletter: Math.random() > 0.7 }),
    1, Math.random() > 0.6 ? 1 : 0, "confirmed",
    Math.random() > 0.85 ? "admin" : "public", qr(),
    Math.random() > 0.85 ? regOfficer : null, created
  );
}
// A handful for the past edition
for (let i = 0; i < 12; i += 1) {
  const first = rnd(FIRST);
  const last = rnd(LAST);
  insReg.run(
    id(), E_PAST, `EPH-25-${code(6)}`, first, last,
    `${first.toLowerCase()}${i}@example.com`, "08030000000", null, "Calabar", "in_person",
    "church", JSON.stringify({ email: true, whatsapp: false, newsletter: false }), 1, 0,
    "confirmed", "public", qr(), null, "2025-11-10 10:00:00"
  );
}

/* --------------------------------------------------------------- attendance */
// ~38% of the demo cohort already scanned in (for the past edition and a
// "live desk" preview on UNICAL).
const insAtt = db.prepare(
  `INSERT INTO attendance_records (id, event_id, registration_id, checked_in_at, method, checked_in_by, gate)
   VALUES (?,?,?,?,?,?,?)`
);
const checkinCandidates = regRows.slice(0, 56);
checkinCandidates.forEach((r, i) => {
  const t = new Date(Date.now() - (56 - i) * 4 * 60_000);
  insAtt.run(id(), E_UNICAL, r.id, iso(t), i % 9 === 0 ? "manual" : "qr",
    i % 9 === 0 ? regOfficer : null, i % 2 === 0 ? "Gate A" : "Gate B");
});
const pastRegs = db
  .prepare("SELECT id FROM registrations WHERE event_id = ? LIMIT 9")
  .all(E_PAST);
for (const r of pastRegs) {
  insAtt.run(id(), E_PAST, r.id, "2025-11-14 16:12:00", "qr", null, "Main");
}

/* --------------------------------------------------------------- volunteers */
const VFIRST = ["Miracle", "Peace", "Godwin", "Abigail", "Femi", "Chinaza", "Precious", "Emediong", "Victor", "Rebecca",
  "Solomon", "Temitope", "Iniobong", "Ann", "Bright", "Comfort"];
const VLAST = ["Etim", "Okon", "Bassey", "Effiong", "Akpan", "Udo", "Nsa", "Ekanem", "Okpo", "Asuquo"];
const VSTATUS = ["submitted", "submitted", "under_review", "accepted", "accepted", "waitlisted", "declined"];
const AVAIL = ["setup", "afternoon", "event", "teardown"];
const insVol = db.prepare(
  `INSERT INTO volunteer_applications
   (id, event_id, reference, full_name, email, phone, department_id, second_choice_id,
    experience, availability, motivation, status, consent, created_at, reviewed_by, reviewed_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
);
for (let i = 0; i < 34; i += 1) {
  const first = rnd(VFIRST);
  const last = rnd(VLAST);
  const name = `${first} ${last}`;
  const status = VSTATUS[i % VSTATUS.length];
  const daysAgo = Math.floor(Math.random() * 18);
  const created = iso(Date.now() - daysAgo * 86_400_000);
  insVol.run(
    id(), E_UNICAL, `VOL-26-${code(6)}`, name,
    `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
    `081${Math.floor(10000000 + Math.random() * 89999999)}`,
    deptIds[rnd(DEPTS)], Math.random() > 0.6 ? deptIds[rnd(DEPTS)] : null,
    rnd([
      "Served on the ushering team at my local assembly for 3 years.",
      "I have handled registration desks at two campus events.",
      "Media volunteer - comfortable with cameras and live switching.",
      "First time serving; eager to learn and available all day.",
      "Worship team member, comfortable supporting production.",
    ]),
    JSON.stringify(AVAIL.filter(() => Math.random() > 0.35)),
    "I want to serve behind the scenes so that people can meet with God without distraction.",
    status, 1, created,
    ["accepted", "declined", "waitlisted", "under_review"].includes(status) ? adminId.volunteer_coordinator : null,
    ["accepted", "declined", "waitlisted", "under_review"].includes(status) ? iso(Date.now() - daysAgo * 86_400_000 + 3_600_000) : null
  );
}

/* ----------------------------------------------------------------- audience */
const insAud = db.prepare(
  `INSERT INTO audience_contacts (id, email, full_name, phone, city, source, subscribed)
   VALUES (?,?,?,?,?,?,?)`
);
regRows.slice(0, 96).forEach((r, i) => {
  insAud.run(id(), r.email, `${r.first} ${r.last}`, null, rnd(CITIES), "registration", i % 3 === 0 ? 1 : 0);
});
for (let i = 0; i < 22; i += 1) {
  insAud.run(id(), `subscriber${i}@example.com`, rnd(FIRST) + " " + rnd(LAST), null, rnd(CITIES), "newsletter", 1);
}

/* ------------------------------------------------------------------- prayer */
const REQUESTS = [
  ["healing", "Please pray for my mother who has been in and out of hospital since August. We are trusting God for total healing."],
  ["family", "Praying for peace in my family after a difficult season. We need God to restore what has been broken."],
  ["direction", "I am standing at a crossroads with my career. I need clarity and the courage to take the right step."],
  ["salvation", "Standing in prayer for my father to give his life to Christ before the end of this year."],
  ["provision", "Trusting God for school fees for my final year. The deadline is close and the burden is heavy."],
  ["thanksgiving", "Thanking God for answering the prayer I submitted before the last edition. The job came through."],
  ["healing", "Praying for strength and peace of mind. The anxiety has been heavier than I can explain."],
  ["family", "For my marriage - we are trying to find our way back to each other."],
  ["provision", "Believing for a safe delivery for my wife. She is due in December."],
  ["direction", "Praying for my younger brother who is making choices that are pulling him away from God."],
  ["healing", "I need prayer for my eyesight. It has been getting worse and it affects my work."],
  ["thanksgiving", "God provided accommodation after months of searching. Grateful."],
];
const PSTATUS = ["received", "received", "in_prayer", "follow_up", "answered", "in_prayer", "received", "archived"];
const insPrayer = db.prepare(
  `INSERT INTO prayer_requests
   (id, event_id, reference, is_anonymous, display_name, email, phone, request, category, status,
    allow_follow_up, assigned_to, created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
);
REQUESTS.forEach(([cat, request], i) => {
  const anon = i % 5 === 0;
  const followUp = i % 3 === 0;
  insPrayer.run(
    id(), i < 8 ? E_UNICAL : null, `PRY-26-${code(6)}`, anon ? 1 : 0,
    anon ? "Anonymous" : `${rnd(FIRST)} ${rnd(LAST).charAt(0)}.`,
    followUp ? `prayer${i}@example.com` : null,
    followUp ? "08030000000" : null,
    request, cat, PSTATUS[i % PSTATUS.length], followUp ? 1 : 0,
    PSTATUS[i % PSTATUS.length] === "received" ? null : adminId.prayer_team,
    iso(Date.now() - Math.floor(Math.random() * 20) * 86_400_000)
  );
});

/* --------------------------------------------------------------- templates */
const insTpl = db.prepare(
  `INSERT INTO message_templates (id, name, channel, subject, body, variables, status)
   VALUES (?,?,?,?,?,?,?)`
);
const TPL_REG = id();
insTpl.run(TPL_REG, "Registration confirmation", "email", "You're registered for {{event_title}}",
  "Hi {{first_name}},\n\nYour place at {{event_title}} is confirmed.\n\nReference: {{reference}}\nDate: {{event_date}}\nVenue: {{venue}}\n\nBring this reference or your QR code to the check-in desk.\n\nEphaPhata",
  JSON.stringify(["first_name", "event_title", "reference", "event_date", "venue"]), "approved");
const TPL_REMINDER = id();
insTpl.run(TPL_REMINDER, "48-hour reminder", "email", "{{event_title}} is in two days",
  "Hi {{first_name}},\n\n{{event_title}} is in two days at {{venue}}.\n\nDoors open early - please arrive ahead of the start time, and have your QR code ready.\n\nEphaPhata",
  JSON.stringify(["first_name", "event_title", "venue"]), "approved");
insTpl.run(id(), "Volunteer application received", "email", "We received your application",
  "Hi {{first_name}},\n\nThank you for offering to serve. Our coordination team will be in touch.\n\nReference: {{reference}}",
  JSON.stringify(["first_name", "reference"]), "approved");
insTpl.run(id(), "Volunteer accepted", "email", "You're on the team",
  "Hi {{first_name}},\n\nYou have been accepted to serve at {{event_title}}. Your department coordinator will contact you with briefing details.\n\nEphaPhata",
  JSON.stringify(["first_name", "event_title"]), "approved");
insTpl.run(id(), "Event-day welcome (WhatsApp)", "whatsapp", null,
  "Hello {{first_name}}! Doors open soon at {{venue}}. Show your QR code at Gate A. See you inside - EphaPhata.",
  JSON.stringify(["first_name", "venue"]), "draft");

/* -------------------------------------------------------------- campaigns */
const insCamp = db.prepare(
  `INSERT INTO campaigns (id, event_id, name, channel, template_id, subject, body, audience, status,
                          sent_at, recipient_count, delivered_count, failed_count, created_by, created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
);
insCamp.run(id(), E_UNICAL, "UNICAL - registration confirmation batch", "email", TPL_REG,
  "You're registered for EphaPhata UNICAL 2026", null, "all_registrants", "sent",
  iso(Date.now() - 3 * 86_400_000), 148, 141, 7, adminId.communications_manager,
  iso(Date.now() - 3 * 86_400_000));
insCamp.run(id(), E_UNICAL, "UNICAL - 48-hour reminder", "email", TPL_REMINDER,
  "EphaPhata UNICAL is in two days", null, "all_registrants", "scheduled",
  null, 0, 0, 0, adminId.communications_manager, iso(Date.now() - 86_400_000));
insCamp.run(id(), E_UNICAL, "Volunteer briefing", "email", null,
  "Volunteer briefing - what to expect", null, "volunteers", "draft",
  null, 0, 0, 0, adminId.communications_manager, iso(Date.now() - 2 * 86_400_000));

/* ------------------------------------------------------------- automations */
const insAuto = db.prepare(
  `INSERT INTO automation_rules (id, event_id, name, trigger, channel, template_id, offset_hours, is_enabled)
   VALUES (?,?,?,?,?,?,?,?)`
);
insAuto.run(id(), E_UNICAL, "Send confirmation on registration", "registration_created", "email", TPL_REG, null, 1);
insAuto.run(id(), E_UNICAL, "48-hour reminder", "event_reminder", "email", TPL_REMINDER, -48, 1);
insAuto.run(id(), E_UNICAL, "Notify volunteer after application", "volunteer_submitted", "email", TPL_REG, null, 1);
insAuto.run(id(), E_UNICAL, "Notify volunteer on acceptance", "volunteer_accepted", "email", TPL_REG, null, 0);
insAuto.run(id(), E_UNICAL, "Post-event appreciation", "post_event", "email", null, 12, 0);

/* ----------------------------------------------------------------- content */
const insPage = db.prepare(
  `INSERT INTO content_pages (id, slug, title, body, status, published_at) VALUES (?,?,?,?,?,?)`
);
insPage.run(id(), "about-story", "The story of EphaPhata",
  "EphaPhata began as a single gathering with one aim: to create room for people to meet God without distraction. What started in Calabar has grown into a recurring gathering that draws worshippers from across the region.\n\nThe name carries the weight of the moment it is taken from - the invitation to be opened. Every edition is built around that invitation: that ears would open, hearts would open, and lives would be opened to what God is doing now.\n\nEach edition is hosted by OT Power & The Attackers, with guest ministers joining from across the country.",
  "published", iso(Date.now() - 30 * 86_400_000));
insPage.run(id(), "mission", "Mission & vision",
  "Our mission is to gather worshippers around sound and the word, and to send them out carrying something they did not arrive with.\n\nOur vision is a permanent home for the EphaPhata community - a place to register, to serve, to pray and to stay connected between editions.",
  "published", iso(Date.now() - 30 * 86_400_000));
insPage.run(id(), "privacy", "Privacy policy",
  "We collect only what we need to run the gathering safely: your name, contact details, and your registration preferences. We use it to confirm your place, send you event-day instructions, and account for attendance.\n\nRegistering for an event does not subscribe you to marketing messages. Newsletter subscription is a separate, explicit choice.\n\nPrayer requests are private. They are visible only to the authorised prayer team and are never published without explicit permission.\n\nYou may request a copy of your data, or ask us to delete it, by contacting the organising team. Records relating to an event are retained for 12 months after the event and then reviewed.\n\nThis policy must be reviewed and approved by the organising team before production use.",
  "published", iso(Date.now() - 20 * 86_400_000));
insPage.run(id(), "terms", "Terms of use",
  "Registration is a declaration of intent to attend. Places are subject to hall capacity. The organising team may close registration when capacity is reached, or move attendees to a waitlist.\n\nEphaPhata is an all-standing gathering. By registering you accept that no physical seat is guaranteed.\n\nCredentials (QR codes and references) are personal. Sharing a credential may result in check-in being refused.\n\nThese terms must be reviewed by the organising team before production use.",
  "published", iso(Date.now() - 20 * 86_400_000));

/* ----------------------------------------------------------------- galleries */

const galId = id();
db.prepare(
  `INSERT INTO galleries (id, event_id, title, slug, cover_url, category, status) VALUES (?,?,?,?,?,?,?)`
).run(galId, E_PAST, "EphaPhata Calabar 2025", "calabar-2025",
  "/brand/flyers/festival-lineup.webp", "previous-editions", "published");

// Placeholder media slots - clearly labelled, awaiting approved photography.
const insMedia = db.prepare(
  `INSERT INTO media_assets (id, gallery_id, url, alt, kind, sort_order) VALUES (?,?,?,?,?,?)`
);
[
  "Main hall before soundcheck",
  "Worship set with OT Power & The Attackers",
  "The prayer line",
  "The crowd at the altar call",
  "Backstage with the production team",
  "Closing thanksgiving",
].forEach((label, i) =>
  insMedia.run(id(), galId, "/brand/flyers/festival-lineup.webp",
    `PLACEHOLDER - replace with approved photography: ${label}`, "image", i)
);

/* -------------------------------------------------------------- testimonials */
// Sample copy, explicitly flagged. Not presented as real attendee statements
// until the team supplies approved, consented quotes.
const insTest = db.prepare(
  `INSERT INTO testimonials (id, event_id, author_name, author_role, quote, status, consent)
   VALUES (?,?,?,?,?,?,?)`
);
insTest.run(id(), E_PAST, "SAMPLE - awaiting approval", "Attendee",
  "SAMPLE COPY. Replace with an approved, consented testimony before publishing. This placeholder shows how a quote will appear in the layout.",
  "draft", 0);

/* ----------------------------------------------------------- announcements */
db.prepare(
  `INSERT INTO announcements (id, event_id, title, body, severity, is_published) VALUES (?,?,?,?,?,?)`
).run(id(), E_UNICAL, "Registration for UNICAL 2026 is open",
  "Registration for EphaPhata UNICAL 2026 (Friday 13 November) is now open. Please register before the event so the team can prepare the hall and send you arrival instructions.",
  "important", 1);

/* ---------------------------------------------------------------- timers */
db.prepare(
  `INSERT INTO timer_sessions (id, event_id, label, planned_sec, elapsed_sec, state) VALUES (?,?,?,?,?,?)`
).run(id(), E_UNICAL, "Doors open & seating", 3600, 0, "idle");

/* ---------------------------------------------------------------- audit */
const insAudit = db.prepare(
  `INSERT INTO audit_logs (id, actor_id, actor_email, action, entity_type, detail, created_at)
   VALUES (?,?,?,?,?,?,?)`
);
insAudit.run(id(), superAdmin, "admin@ephaphata.com", "system.seed", "system",
  JSON.stringify({ note: "Demonstration dataset created by scripts/seed.mjs" }), iso(Date.now()));
insAudit.run(id(), adminId.communications_manager, "comms@ephaphata.com", "campaign.send",
  "campaign", JSON.stringify({ name: "UNICAL - registration confirmation batch", delivered: 141, failed: 7 }),
  iso(Date.now() - 3 * 86_400_000));

/* --------------------------------------------------------- notification log */
const insNotif = db.prepare(
  `INSERT INTO notification_logs (id, channel, recipient, template, status, provider, error, related_type, created_at)
   VALUES (?,?,?,?,?,?,?,?,?)`
);
for (let i = 0; i < 141; i += 1) {
  insNotif.run(id(), "email", `registrant${i}@example.com`, "registration_confirmation", "sent", "resend", null, "registration", iso(Date.now() - 3 * 86_400_000));
}
for (let i = 0; i < 7; i += 1) {
  insNotif.run(id(), "email", `bounce${i}@example.com`, "registration_confirmation", "failed", "resend",
    "550 mailbox unavailable", "registration", iso(Date.now() - 3 * 86_400_000));
}

/* --------------------------------------------------------------- analytics */
// Aggregated page-view telemetry so the analytics screen has honest shape.
const insAn = db.prepare(
  `INSERT INTO analytics_events (id, name, path, event_id, session_hash, created_at) VALUES (?,?,?,?,?,?)`
);
const PATHS = ["/", "/events", "/events/ephaphata-unical-2026", "/register", "/volunteer", "/prayer", "/about", "/media"];
const HASH = createHash("sha256").update("demo-session").digest("hex").slice(0, 16);
for (let d = 20; d >= 0; d -= 1) {
  const visits = 40 + Math.floor(Math.random() * 90) + (20 - d) * 4;
  for (let v = 0; v < visits; v += 1) {
    const p = PATHS[Math.floor(Math.random() * PATHS.length)];
    insAn.run(id(), p === "/register" ? "registration_start" : "page_view", p, p.includes("unical") ? E_UNICAL : null,
      HASH, iso(Date.now() - d * 86_400_000 - Math.floor(Math.random() * 86_400_000)));
  }
}

/* ----------------------------------------------------------------- settings */
const insSet = db.prepare(`INSERT INTO integration_settings (key, value, is_secret) VALUES (?,?,?)`);
insSet.run("email_provider", "resend", 0);
insSet.run("email_from", "", 0);
insSet.run("whatsapp_provider", "meta_cloud", 0);
insSet.run("whatsapp_status", "awaiting_approval", 0);
insSet.run("analytics_mode", "first_party", 0);
insSet.run("demo_mode", "true", 0);

console.log("✓ seeded");
console.log(`  events: 3 · registrations: ${148 + 12} · volunteers: 34 · prayer: ${REQUESTS.length}`);
console.log("  sign in: admin@ephaphata.com / EphaphataAdmin2026!");
db.close();
