# Demo walkthrough - 10 minutes

A script for showing EPHAPHATA to the host team. Every step below is real: no mocked screens, no
staged data, no fake successes.

**Before you start**

- Server running (`npm start`), browser at `http://localhost:3000`
- Two windows side by side: public site on the left, `/admin` on the right
- Signed out of the admin

---

## 1. The public experience - 2 min

Open `/`.

> "This is the front door. Bold display type pulled from the flyers, the branded artwork used as
> full-bleed bands, and white space doing the reading work."

Scroll once, slowly.

> "Content reveals as you move - nothing bounces or loops. It respects reduced-motion settings, so
> it holds up for accessibility."

Point at the countdown and the featured event.

> "Everything on this page is driven by the event record. Change the date in the admin and this
> updates - nothing here is hard-coded."

---

## 2. Register as an attendee - 2 min

Go to **Events → Ephphata UNICAL 2026 → Register**.

Fill the form (or use realistic details). Point out:

- The live confirmed count at the top
- The reassurance panel on the right: what happens next, save your QR, arrive early
- The three separate consent checkboxes

> "Notice the consent is split. Emailing them about *this event* is one thing. Adding them to a
> newsletter is a different, opt-in decision. We don't merge them."

Submit.

> "Straight to a confirmation page - reference, QR code, and a calendar file."

Point at the QR.

> "That code contains a random token, not their name or email. If someone photographs it, they
> learn nothing about the person holding it."

**If email is not configured**, point at the notice:

> "And here's where a lot of platforms lie. We say plainly that the confirmation email isn't
> configured in this environment, rather than showing a fake 'email sent' message."

---

## 3. Show the data landed - 1 min

Switch to the admin window. Sign in as `admin@ephaphata.com`.

> "The dashboard is the event's live state - registrations, arrivals, volunteer pipeline, prayer
> follow-ups."

Go to **Registrations**, search the email you just used.

> "There they are, a few seconds after the public form. Same database, same record."

---

## 4. Check them in - 2 min

Go to **Check-In**.

Type the reference from the confirmation page. Press Enter.

> "Checked in. Their name, when they arrived, and the gate are recorded against them - and the
> arrival counter on the right just moved."

Point at the session list on the right.

> "Stewards can see the last few scans, which settles most 'did that go through?' questions."

Now type the same reference again.

> "Refused - already checked in. And importantly, no second attendance record was created. On the
> night that difference is the whole point: your headcount has to be true."

Try a made-up reference.

> "Not recognised. The desk gets a clear instruction instead of a dead end."

---

## 5. Manual registration - 1 min

**Registrations → Register attendee.**

> "For walk-ins and phone bookings. Same duplicate protection as the public form - if that email
> exists, we show the existing reference instead of creating a second record."

Try submitting the same email you used earlier.

> "It refuses and shows the reference. No duplicate."

Cancel the form.

---

## 6. Volunteers and prayer - 1.5 min

**Volunteers** - open any application.

> "Availability, department preference, and why they want to serve. On the right we move them
> through review and assign a department. Every change is attributed and audited."

**Prayer** - open a request.

> "This is the most sensitive screen in the system. Access is restricted at the database level to
> the prayer team. Contact details are hidden until someone deliberately reveals them, and the text
> of a request is never written to the audit log."

---

## 7. Programme timer - 1 min

**Programme** → **Start segment** → **Open presentation screen**.

> "Run of show with a live clock. Amber as you approach time, red when you're over. The presentation
> window mirrors it for the confidence monitor."

Let the clock run for a few seconds so they see it move.

---

## 8. Settings - 1 min

**Settings**.

> "This page tells the truth about every external dependency. Green means configured and working.
> Amber means it will not work, and here is the variable to set."

Scroll to **Security posture**.

> "Permissions are enforced on the server for every request - hiding a button is never the only
> control. Sessions are opaque tokens. Public forms are rate-limited and every submission is
> audited."

---

## 9. Close - everything verified

> "86 automated checks pass against this build: every public route, every admin screen, the
> registration and check-in contracts, and this exact journey driven through a real browser."

> "What isn't done is written down rather than hidden - the production dependency list covers
> confirmed event details, email credentials, and real staff accounts. None of those are code
> problems."

---

## Likely questions

**"Can it handle the queue at the door?"**
The duplicate guard is a database constraint, so even two stewards scanning the same pass at the
same instant cannot produce two records. Load testing under a real burst is on the pre-launch list.

**"What if the network dies?"**
Manual entry works without a camera. Full offline check-in is not implemented - it is on the
production dependency list, not quietly assumed.

**"Can we send a reminder to everyone?"**
Yes, once email is configured. The composer refuses to send on an unconfigured channel rather than
reporting a delivery that never happened.

**"Is my phone number on that QR code?"**
No. The token is 32 random bytes. Validation happens server-side.

**"Can we use this for next year's edition?"**
That's the design. Events are records, not pages. Create a new one, publish it, and the site,
registration, check-in and analytics all follow.
