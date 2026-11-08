# Visual refinement - audit & plan

## What the flyers actually do

Reading `unical-lineup.jpg` and `festival-multicolor.jpg`:

- **Type is the design.** One enormous condensed word (`UNICAL`, `FESTIVAL`) carries the
  whole composition. Everything else is small, tightly tracked, uppercase metadata.
- **Flat colour.** No gradients, no shadows, no glows. Colour comes from the artwork
  itself; type sits directly on it in white or the sampled lilac.
- **Hard alignment.** Information blocks are left-aligned or centred in a strict column,
  stacked tight - date, time, venue, lineup.
- **No rounded corners anywhere.** The only rounding is photographic.
- **One accent device:** the high-contrast serif word (FESTIVAL) and the script "with".
- **Colour blocks** are literal rectangles (the `03:00PM` green bar, the yellow `THE NEW` tag).

## What the current build does that contradicts this

| # | Problem | Where |
|---|---|---|
| 1 | `rounded-full` pill buttons with drop shadows + hover lift | `globals.css` `.btn`, `.btn-ink`, `.btn-white`, `.btn-gold` |
| 2 | Cards with `shadow-card` + `hover:-translate-y` + `hover:shadow-lift` | `.card`, `.card-hover`, EventCard, MinistersGrid, VolunteerInvite |
| 3 | Border radius scale up to 44px (`rounded-3xl` used as default panel) | `tailwind.config.ts` borderRadius |
| 4 | Glassmorphism: `backdrop-blur-xl` panels at `bg-white/[0.07]` | RegistrationCTA, PrayerCTA, SiteHeader |
| 5 | Scroll parallax + rotating poster | `Hero.tsx` |
| 6 | Continuous marquee + `animate-pulse-ring` | MarqueeBand, Hero |
| 7 | CSS gradient soup on the About image frame | `AboutBlock.tsx` (`from-violet-600 via-magenta-500`) |
| 8 | Brand backgrounds buried under 0.86–0.96 opacity overlays | ProgrammePreview, PrayerCTA, SiteFooter |
| 9 | Grain noise overlay + `text-shadow` on `.on-brand` | `globals.css` |
| 10 | Violet 4px focus *ring* + `ring-4` on inputs | `globals.css` |
| 11 | Scroll-reveal translate on nearly every block | `Reveal.tsx` usage |
| 12 | Floating date chips overlapping cards | Hero, EventCard |

## Target system

**Radius:** 0 for full-bleed bands, 2px for chips/labels, 4px for inputs/buttons, 6px max for panels.
No pill shapes. **Shadows:** none. Separation by hairline borders (`1px`) and whitespace only.

**Colour rhythm** - no two colour bands adjacent:

| Section | Surface |
|---|---|
| Hero | multicolor asset, white type |
| About | white |
| Upcoming event | green asset |
| Experience | white |
| Ministers | white |
| Programme | white, flat rows |
| Registration CTA | red asset |
| Previous editions | white |
| Volunteer | blue asset |
| Prayer | white |
| Footer | ink-900 |

**Motion:** opacity-only reveals at short duration; no transforms on page load; no marquee;
no parallax. Hover = colour change and underline only.

**Brand assets:** overlay reduced to a flat 0–20% scrim only where white type needs contrast;
never a heavy gradient that hides the pattern.

---

# 2. Implementation record

## 2.1 The core composition decision

The first pass dimmed each supplied background with a 70–96% gradient so white type
could sit on top. Measured against the brief this was wrong twice over: the artwork
became a murky wash (its colour and pattern were effectively deleted) and the result
still *looked* like a dark hero with an overlay - a product-page pattern.

The flyers do the opposite. **Type never sits on the artwork.** It sits on flat colour;
the artwork gets its own field. Every branded section is now built that way:

```
┌────────────────────────────┬────────────────────────┐
│ flat deep tone            │ supplied asset         │
│ (sampled from the asset's │ shown at 100%,         │
│  own shadow end)          │ nothing over it        │
│ display type + metadata   │                        │
└────────────────────────────┴────────────────────────┘
```

`DEEP_TONE` in `src/components/brand/BrandBG.tsx`:

| family | deep tone | role |
|---|---|---|
| green | `#003238` | upcoming-event band, list CTA |
| multicolor | `#1C003A` | hero type block |
| red | `#60000B` | registration CTA, contact band |
| pink | `#1F003A` | mission & vision |
| blue | `#050845` | volunteer CTA, admin login, closing CTA |

Contrast is guaranteed rather than hoped for (white on all five is > 12:1), the asset
is never dimmed, and the hard vertical edge becomes the flyer's own colour-block device.
`BrandBG overlay` therefore defaults to `false` everywhere; the flat `.brand-scrim`
classes remain available but are no longer used to bury artwork.

## 2.2 Page headers

Interior pages use `src/components/public/PageHero.tsx`: white ground, tracked label,
oversized condensed H1, lead, ruled metadata row, then a full-bleed brand asset strip
(`clamp(84px, 11vw, 150px)`) closing the header. One component, so all nine public
pages are typographically identical.

## 2.3 What was deleted

| Removed | Files |
|---|---|
| Hero parallax, poster rotation, `animate-pulse-ring` badge, floating date chips | `Hero.tsx` |
| Gradient image frame (`from-violet-600 via-magenta-500 to-flame-500`) | `AboutBlock.tsx` |
| Infinite marquee (`motion/Marquee.tsx` deleted; `MarqueeBand` is now a static ruled strip) | - |
| Word-mask translate + per-character rise | `SplitText.tsx` → opacity only |
| Count-up numerals | `CountUp.tsx` → printed value |
| Pointer tilt (`Magnetic`) | `SplitText.tsx` → plain wrapper |
| Card shadows, hover lift, image zoom, floating status chips | `EventCard`, `.card`, `.card-hover` |
| Glass header (transparent → frosted on scroll), height jump | `SiteHeader.tsx` → solid white 62/70px |
| 22 `backdrop-blur` uses across 15 files | swept to zero |
| Radial glow, gradient area fill, violet-on-white accent links | admin dashboard, `TrendChart`, `MetricCard` |
| Display face on 33 admin labels/metrics | admin is now Inter-semibold; Anton is reserved for the present screen, check-in result and the timer |

## 2.4 Motion policy as implemented

- Reveal = opacity, 360–500 ms, `ease-out`, 35–60 ms stagger, once.
- Interaction feedback = `transition-colors` 150–200 ms; the only transform left is a
  2–3 px arrow nudge on hover.
- Loading = `animate-spin` on the button that is actually working.
- Countdown ticks once a second - it is information, not decoration.
- `prefers-reduced-motion` short-circuits every reveal.

## 2.5 Typography hierarchy

| Role | Face | Use |
|---|---|---|
| Display | Anton | page H1, section H2, hero statement, programme rows, minister names |
| Editorial | Bodoni Moda italic | theme lines (*the new*), pull-quotes, band phrases |
| Body | Inter | all prose, metadata values, forms, admin |
| Label | Inter 11px, semibold, `0.18em` tracked | eyebrows, `dt` labels, status tags |

Anton is never applied to a paragraph, a form control or a table cell.

## 2.6 Admin

White surfaces, `border-ink-900/[0.08]` hairlines, 2–4px radii, flat metric panels
with a single small brand-coloured icon, one flat line chart (emerald, no gradient
fidelity loss), ink countdown panel, plain tables. Density untouched - row heights,
column sets, filters and actions are unchanged.

---

# 3. Revision - full-bleed artwork, one set of facts, real mobile rhythm

Feedback on the first implementation, and what changed.

## 3.1 The asset/colour split was wrong

Cutting each band into "flat colour + asset" made the seam obvious: a hard edge, a
half-empty blue panel (see the volunteer band), and the artwork read as decoration
rather than as the identity. Replaced with **one full-bleed asset per band**.

Legibility now comes from `BRAND_TONE[family].wash` - a horizontal tonal wash built
from the *same hues* as the artwork (deep at the reading edge, clearing toward the far
edge). It blends into the asset instead of slicing it, and the pattern still reads.
Strips and page-header bands use the same wash so nothing looks like a colour chip.

## 3.2 The hero is about the gathering, not one edition

- H1 is the ministry's statement: **ONE GATHERING. ONE PURPOSE.**
- Script line: *be opened* - Mark 7:34 (the name, and the invitation).
- One line names the next edition; nothing else.
- **When / Where / Doors / Countdown were removed from the hero.** They belong to the
  next-gathering section and were being repeated verbatim twice on one page; the
  countdown now lives only on the event detail and register pages, where it is actually
  being acted on.
- The UNICAL poster was removed from the hero. Listing it as the hero art made the
  front page read as one event's flyer; it now appears on the event page and in the
  archive where it belongs.

## 3.3 Responsive rhythm

- Vertical section rhythm: `clamp(3.5rem, 6.5vw, 6.5rem)` (was up to 9rem).
- Stats strip: 2 columns on phones (was 4 stacked, very tall), tighter padding.
- Ticker: never wraps - only the first three phrases render below `sm`, row clips
  instead of stacking.
- Hero: copy flows top-down on phones with generous spacing, full-width buttons,
  no fixed viewport height that traps content.

## 3.4 Facts live in exactly one place

| Fact | Where it appears |
|---|---|
| Event date · time · venue · doors | "The next gathering" band (home), event header (detail) |
| Countdown | event detail + register only |
| Poster / flyer art | event detail, archive cards, about |
| Theme + scripture | hero (as the gathering's motto), each event header |

---

# 4. Revision - fewer rules, fewer labels, more air

The build had accumulated decorative hairlines and micro-labels the brief never asked
for. Rules should mean something or not exist.

## 4.1 What was removed

| Removed | Why |
|---|---|
| `border-t`/`border-b` on the "At a glance" rows, programme rows, ministers/programme section headers, prayer CTA, event cards, ticket list, department list, PageHero metadata | They were decoration. Two of them stacked in the green band read as a stray box in a screenshot. **Exception, later restored on request: the stats strip rules are back - see 4.2.** |
| Countdown unit cards (bordered boxes around 08 / 05 / 42 / 33) | Information, not a widget - now a plain inline line |
| Most `label-xs` micro-labels: "At a glance", "What you get", "Ten departments", "Order of service" kickers, "Doors", "Seating", "Entry" | The copy underneath already says it |
| Stats notes (e.g. "Transcribed from the official flyer") | Second line of fine print under every figure |
| Section-header descriptions that restated the heading | |
| Artefact captions ("Official Ephphata UNICAL artwork") | |
| `·` separators inside metadata lines | Replaced with plain spacing |
| Hero divider under the statement | |

## 4.2 Rule policy

Hairlines appear in exactly four places:

1. The site header.
2. The programme's day rows, where they separate discrete times.
3. **The stats strip**, above the figures. This was removed in the first pass and then
   restored: the client asked specifically for the rules that carry the 2026 edition,
   8 ministers, 10 departments and the free-entry line. They are intentional. Do not
   remove them again when sweeping decorative lines.
4. The admin dashboard's data tables, where a rule genuinely separates rows.

Everything else - bands, cards, CTAs, section headers, event detail blocks - is
separated by space alone.

## 4.3 Kept

Kickers that orient a reader arriving mid-page (About the gathering, On the platform,
Order of service, Archive, Serve, Registration) stay - one short phrase, not a label
stack. Facts keep their small labels where a value is meaningless alone (the event
detail's Date / Start / Venue grid).

Result: the green band, the programme, the ticket list and the department list are all
plain typographic blocks; the page opens with type and colour rather than furniture.
