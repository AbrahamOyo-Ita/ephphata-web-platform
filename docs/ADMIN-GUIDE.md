# EPHAPHATA - Admin onboarding guide

Welcome to the operations app. This guide is for the team who will actually run the gathering:
registration desk, check-in stewards, volunteer coordinators, communications and programme.

**Address:** `https://ephaphata.com/admin`
**Sign in:** invitation only - there is no public sign-up.

---

## 1. Signing in

1. Open `/admin/login`.
2. Enter the email you were invited with and your password.
3. You land on the dashboard, scoped to the current event.

If you were invited but never set a password, ask a super admin to re-issue your invitation.
If you try five times in ten minutes you will be locked out for ten minutes - this is deliberate.

> **During a demonstration**, the login screen shows a *demo credentials* panel listing one account
> per role. Use it to show what each role sees. Those accounts do not exist in production.

---

## 2. Reading the dashboard

The dashboard answers four questions at a glance:

- **How many people are coming?** Total registrations, with the change since last week.
- **How many have arrived?** Checked-in count and the percentage of the register.
- **Do we have enough volunteers?** Pending applications against accepted.
- **Is anyone waiting on us?** Prayer requests flagged for follow-up.

Below the metrics: a 14-day registration trend, a countdown to the event, the newest registrations,
recent activity from the audit log, live campaigns, and the last few check-ins.

Anything marked with the **DEMO DATA** badge is generated test data.

---

## 3. Day-to-day tasks

### Register someone manually

*Registrations → Register attendee*

Use this for walk-ins, phone bookings and anyone who cannot use the public form. The record is
marked as staff-registered and stamped with your name. Duplicate detection is identical to the
public form - if that email already exists for the event, you will be shown the existing reference
instead of creating a second record.

### Find a registration

*Registrations* - search by name, email or reference. Filter by status. Export the current view to
CSV (each export is audited).

### Cancel a registration

Open the registration → *Cancel registration*.

Cancelling keeps the record for reporting but frees the place and blocks check-in. **You cannot
cancel a registration that has already been checked in** - the attendance record must stay truthful.

---

## 3b. Content

*Content -> New announcement*

Announcements are the one piece of site copy you can publish without a deploy. Published
announcements are visible on the public site; leave **Publish now** unchecked to save a draft.

Pages, testimonials and galleries are listed here for reference - those come from the codebase and
are released with a deploy.

---

## 4. Check-in on the night

*Check-In*

Two modes, always both available:

**Scan QR** - taps the rear camera and reads the attendee's code. Works on Chrome/Android. If the
browser cannot scan, the app tells you so and offers manual entry rather than failing silently.

**Manual entry** - type the reference from the attendee's pass (e.g. `EPH-26-AB12CD`). This is the
fallback that always works, including on an old phone with a cracked camera.

Things the desk will refuse, and why:

| What you see | Meaning | What to do |
| --- | --- | --- |
| *Already checked in* | This pass was already scanned | No duplicate record was created. Let them in. |
| *Credential not recognised* | Typo, or a pass from another event | Re-check the reference; if it still fails, send them to the registration desk. |
| *Wrong event* | Valid pass, different gathering | Direct them to the correct venue. |
| *Waitlisted* / *Cancelled* | Not entitled to entry | Refer to the registration desk. |

Each successful check-in shows the attendee's name, reference, arrival intent and the gate, plus
the running arrival total on the right. The last eight check-ins on this device stay visible so a
steward can confirm what just happened.

**Choose the gate** before you start scanning - it is recorded against every check-in and makes
the end-of-night report meaningful.

---

## 5. Volunteers

*Volunteers*

Applications move through five states: **Submitted → Under review → Accepted / Waitlisted /
Declined**.

Open an application to see availability, department preference, experience and their reason for
serving. On the right:

- Set the **status**
- Assign a **department**
- Add an **internal note** (never visible to the applicant)

Every change records your name and produces an audit entry. The right-hand panel shows each
department's accepted count against its capacity so you can see where you are short.

*Export accepted assignments* produces the list coordinators print for the day.

---

## 6. Prayer desk

*Prayer*

> This is the most sensitive screen in the system. Access is restricted to the prayer team at the
> database level.

Requests arrive as **Received**. Move them to **In prayer**, **Follow-up**, **Answered** or
**Archived**. Contact details are hidden behind a *Reveal* button - reveal them only when you are
actually following up with that person.

Request text is never written to the audit log, and audit entries record only that a status
changed.

---

## 7. Programme timer

*Programme*

The controller runs the show. It shows the current segment, time remaining, and turns amber then
red as you approach and pass the allotted time.

- **Start segment** begins the clock; **Pause** stops it; **Next segment** advances.
- Click any row in the run of show to jump to it.
- **Open presentation screen** launches a full-screen view for the confidence monitor or projector.
  It mirrors the controller live, including the running clock.

Open the presentation view in a second tab or window of the **same browser** that is running the
controller - that is what keeps them in sync.

---

## 8. Communications

*Communications*

The composer refuses to send on a channel that is not configured. That is intentional: the platform
will never tell you a message went out when it did not.

Audiences are resolved by SQL, not by the UI:

- **Event registrants** - confirmed registrations for the event
- **Checked-in attendees** - a subset of the above
- **Newsletter subscribers** - *only* contacts with recorded marketing consent
- **Accepted volunteers**

Registration is not marketing consent. Someone who registered for the event is not automatically
eligible for a newsletter campaign.

---

## 9. Team and permissions

*Team* (super admin only)

There are ten roles. Each sees only the sections it needs - but the restriction is enforced on the
server for every request, not by hiding buttons.

A few guardrails:

- You cannot change your own role or status.
- The last active super admin cannot be demoted or suspended.
- Suspending an account destroys its sessions immediately.

---

## 10. Audit log

*Audit log*

Every privileged action is recorded: who, what, on which record, when. Use it to answer "who
cancelled that registration?" or "who exported the attendee list?".

It deliberately never contains prayer request text, passwords, or QR tokens, and IP addresses are
stored only as salted hashes.

---

## 10b. Read-only pages

Four screens are deliberately read-only. Nothing on them is a missing button:

| Page | Why it has no write action |
| --- | --- |
| **Audience** | A derived view - it merges registrations, volunteers and subscribers into one contact list. Edit the source record, not the merge. |
| **Analytics** | Counts and rates calculated from live data on every load. |
| **Audit log** | Append-only by design. An audit trail you can edit is not an audit trail. |
| **Settings** | Reads the running environment. Change the value in your host's environment variables and redeploy; that is the only way it should be possible. |

Everything else in the dashboard writes: events, registrations, check-in, volunteers, prayer,
communications, content and team.

---

## 11. Settings

*Settings* shows the live status of every external dependency, read from the running environment:

- **Email** - green when a provider key is present
- **WhatsApp** - green when configured
- **Database** - which engine is in use
- **Session signing** - whether a production secret is set

If something reads *Not configured*, that feature genuinely will not work - do not promise
confirmations or reminders until it is green.

---

## 12. Keyboard and mobile

- **⌘K / Ctrl+K** opens the command palette from anywhere in the admin app.
- Arrow keys move, Enter opens, Escape closes.
- The whole app is usable on a phone, which is how check-in will actually run.

---

## 13. If something goes wrong

| Situation | Fix |
| --- | --- |
| Locked out after failed sign-ins | Super admin clears `rate_limits` (see deployment guide) |
| Camera will not scan | Switch to manual entry - always available |
| Attendee has no pass | Look them up by email and check them in by reference |
| Email did not arrive | Check Settings → Email is green; check the notification log |

Nothing in the system silently fails. If a send did not happen, it says so.
