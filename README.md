# Handoff: Lipidly mobile app (v2 design)

## Overview
Lipidly is an iOS/Android app for adults with abnormal cholesterol or triglycerides. Each lab report becomes a small habit plan (focus marker + 2–3 habits + retest date) that updates when the next report arrives. It tracks medicines and appointments, and sends users to their doctor when a result is beyond lifestyle guidance. Full product rules are in `Lipidly product spec.pdf` (bundled). **The spec wins on behaviour; this README and the design files win on visuals.**

## About the design files
The files in `design/` are **design references built in HTML**. They show the intended look and content. They are not production code. Recreate them in the target stack. The spec asks for one cross-platform codebase (React Native or Flutter). Use that stack's normal patterns and platform-standard navigation.

To view them: open `design/Lipidly Screens v2.dc.html` in a browser (keep `support.js` and `TabBarPlay.dc.html` beside it). Every screen is laid out on one pan/zoom canvas, grouped by tab. Each frame has a `data-screen-label` like `"19 Confirm values"`. Numbers match the spec's screen inventory. All styles are inline on each element, so you can read exact values straight from the markup.

## Fidelity
**High fidelity.** Colours, type, radii, spacing, shadows and copy are final for this round. Recreate them exactly. Exceptions:
- **Mascot ("Lipi") and decorative scenes** are built from simple CSS shapes as stand-ins. Build the mascot as a reusable component that takes size and colour. Expect real illustration assets to replace the scenes later.
- **Icon tiles** are coloured rounded squares with simple shapes inside. Use a real icon set (e.g. Phosphor or Lucide, rounded style, 2px stroke) placed in the same tiles.
- **Striped boxes** with monospace labels are placeholders for camera views and document images.
- Habit wording, food tips, lab and doctor names are sample content awaiting clinical review.

## Design tokens
All values are also in `tokens.json`.

**Brand (from the spec)**
- Primary `#0E7490`: buttons, links, active tab, progress, selection.
- Primary pressed `#155E75`: hover/pressed, and the solid "raised" drop shadow under primary buttons (`0 5px 0 #155E75`).
- Primary tint `#ECFEFF`, with text on the tint `#164E63`: selected states, info cards, committed chips.
- Supporting teal shades: decor circles on teal `#2B8AA6`, deep panel on teal `#0B6680`, inactive dots on teal `#5FA9BE`, disabled button `#A5D3DE`, dashed "add" borders `#7FC3D3`.
- Primary on dark backgrounds `#22D3EE` (camera and viewer screens). Fallback primary `#1D4ED8`, used only if user testing favours blue.

**Neutrals**
- Ink `#0F172A`, ink-soft `#334155`, muted text `#4B5A6B`, subtle `#9AA8B4`.
- Screen background `#F5F8F9`, cards `#FFFFFF`, soft fill `#EEF2F4`, divider `#E3E9EC`, empty progress `#E2E8EC`, toggle off `#D5DEE4`.

**Decoration** (illustration, icon tiles and info blocks only; never status):
- Sky `#DDEBFF` with text `#2B4E7E`.
- Lilac `#EDE9FE` with text `#5B21B6`.
- Ice `#E0F2FE`, cyan `#A5F3FC`.
- Bar fills on white: `#8B5CF6`, `#0891B2`, `#4A8FE7`, `#0E7490`.

**Result status** (lab results only; always shown with a text label):

| Status | Text | Chip background |
|---|---|---|
| In range | `#15803D` | `#DCFCE7` |
| Borderline | `#B45309` | `#FEF3C7` |
| High / Very high / Low HDL | `#B91C1C` | `#FEE2E2` |

The escalation screen uses the same red, with title `#7F1D1D` and card ring `#FCA5A5`.

**Colour rules (from the spec)**
- Primary never shows a result status.
- Green, amber and red are never used for buttons, navigation or decoration.
- Red appears only on high results and the escalation screen.
- Text contrast is at least 4.5:1. Buttons, icons and chart lines are at least 3:1.

**Type**
- Display font: **Bricolage Grotesque** 800, letter-spacing −0.02em.
  - Screen titles 30px (26px on dense screens), line-height 1.05.
  - Onboarding heroes 32–36px.
  - Big stats 40–60px, line-height 1.
- Body font: **Figtree**.
  - Body 15px/1.5 at 400.
  - Labels and list titles 15–16px at 800.
  - Secondary text 13–14px at 600, in muted `#4B5A6B`.
  - Chips 12–13px at 700–800.
  - Overlines 11–12px at 800, letter-spacing .04em, uppercase.
- Leave room for Sinhala and Tamil, which run longer and taller. Never fix the height of a text container.

**Radius**
- Pill `999` for buttons, chips, segmented controls and inputs.
- Cards `24`; hero cards `28`.
- Coloured headers: bottom corners `36`.
- Icon tiles `12–14`; code boxes `18`; fields `16`.
- The device frame (`48`) is mock chrome only.

**Spacing**
- Screen side padding: 20px (24px on onboarding).
- Vertical gaps between blocks: 10–14px.
- Card padding: 14–18px.
- Rows inside cards: 9–14px vertical padding, with 1px `#EEF2F4` dividers.

**Shadows**
- Raised primary button `0 5px 0 #155E75`; raised primary card `0 6px 0 #155E75`.
- Tab bar `0 8px 24px rgba(15,23,42,.12)`.
- Paper preview `0 6px 20px rgba(15,23,42,.08)`.
- Selected card ring `0 0 0 2.5px #0E7490`.

## Core components
- **Primary button**: height 56, pill, fill `#0E7490`, white Figtree 17/800, shadow `0 5px 0 #155E75`.
  - Pressed: move down 3px and shrink the shadow to `0 2px 0`.
  - Disabled: fill `#A5D3DE`, no shadow.
- **Secondary button**: height 56, pill, white fill, 2px `#E3E9EC` border, ink text 17/800.
- **Choice chip**: pill, padding 10×16 (6×12 when dense), white fill with 2px `#E3E9EC` border, 15/600 (13/600 dense).
  - Selected: `#0E7490` fill and border, white text 700, prefixed with "✓ ".
  - "+ Other" chip: 2px dashed `#7FC3D3`, text `#0E7490` 700. Tapping it opens a text field and adds the typed value as a selected chip (e.g. "✓ Skipping rope").
- **Yes/No answer pair**: two equal pill buttons, height 46.
  - Not yet answered: both `#ECFEFF` fill with `#0E7490` text 800, and the card gets a 2.5px primary ring.
  - Picked "Yes": Yes becomes primary fill with white text and "✓"; the other button becomes `#EEF2F4` with muted text.
  - Picked "No / Not today": No becomes ink `#0F172A` fill with white text; Yes becomes `#EEF2F4`.
- **Status chip**: pill, padding 3×10, 12/800, colours from the status table. Fixed width 82 in results lists.
- **Range gauge** (Results): 6px bar coloured green/amber/red segment by segment at each marker's band cut-offs, with a 14px white dot and 3px ink border at the value.
- **Icon tile**: rounded square, 34–44px, decor-colour fill.
- **Toggle**: 48×30 track, 24px white knob. On `#0E7490`, off `#D5DEE4`.
- **Segmented control (Week/Month)**: `#EEF2F4` track with 3px padding. Segments are 12/800 with 5×12 padding; the active one is white with `0 1px 3px rgba(15,23,42,.12)`.
- **Tab bar** (`TabBarPlay.dc.html`): a floating white pill, 66 tall, radius 33, with tab-bar shadow and outer padding 6/14/24.
  - Five tabs: Home, Plan, Reports, Medicines, Profile.
  - Active tab: 36×26 primary pill behind a white icon; label `#0E7490` 11/800.
  - Inactive tab: outline icon `#7C8B99`; label `#4B5A6B` 11/600.
- **Coloured header**: a full-bleed block in a tint or primary colour behind the status bar, with bottom radius 36. Used on Home, Plan, Profile, Sign in, Habit detail, Not eligible and Escalation.
- **Mascot "Lipi"**: 72px base, `border-radius: 50% 50% 44% 44%`, white eyes (8×12, r4), a smile arc, optional `#C4B5FD` cheeks.
  - Teal on light backgrounds; `#A5F3FC` body with ink features on teal backgrounds.
  - Moods used: happy, calm (line eyes), surprised (round mouth), thinking (flat mouth), celebrating (closed eyes, open mouth).
  - Never shown on the escalation screen.

## Screens
Device frame 390×844 with a 50px status bar. Copy is in the HTML; use it verbatim.

**Onboarding**
- **01 Welcome**: full teal background with a decorative scene and a cyan mascot.
  - Headline 36/800 white.
  - "Not medical advice" text.
  - 3 page dots (active 24×8).
  - White button "Let's go" with teal text.
- **02 Sign in**: lilac-tint header with title and mascot.
  - Six code boxes, 62 tall, r18. The focused box has a 2.5px primary border and a 4px `#ECFEFF` halo.
  - Resend timer.
  - Disabled "Verify" until all 6 digits are entered.
- **03 Consent**: four white cards (icon tile + title + one line), a policy link, "I agree" primary button and "Not now".
- **04 Profile setup**: segmented progress bar (6 segments, 8px, gap 4) and health-question chips.
- **36 What fits your life**: five lifestyle questions as dense chips, with "+ Other" on Places, Equipment and Physical limits.
- **05 Not eligible**: sky header with a calm mascot, an explanation and an "Edit my answers" secondary button.
- **06 First report prompt**: a large teal "Add a report" card plus two tiles, "Enter values by hand" (sky) and "I don't have one yet" (lilac).

**Home**
- **07 Home**:
  - Tint header: date, "Good evening, Nimal", "Active mode" chip, mascot.
  - Teal check-in card with a progress ring (64px conic-gradient, `#A5F3FC` over `#2B8AA6`) and the count "0/4".
  - Check-ins card with a Week/Month switch:
    - Week view: big "5" of 7, the line "Check in tonight to make it 6", and a "Best run · 9 days" chip.
    - Seven 34px day dots: done = teal with ✓; missed = 2px dashed `#C9D3DA`; today = 3px teal ring with a `#ECFEFF` halo.
  - Focus marker card and sky retest card ("66 days").
  - A "Next:" reminder pill.
  - Tab bar.
- **07c Home, month view**: same card in Month mode.
  - Calendar for October 2026 with Sunday-first weekday headers. Cells are 36 tall, r12, gap 6.
  - Shading by habits kept that day: all `#0E7490`; most `#2B8AA6`; some `#A5D3DE`; no check-in white with 2px dashed `#C9D3DA`; today white with a 3px teal border; future days `#F5F8F9` with `#9AA8B4` text.
  - Legend.
  - Three stat tiles: check-ins this month (teal), days in a row now (sky), best run (lilac).
  - Mascot tip about filling in missed days.
- **07b Home, no report yet**: empty state with an illustrated card, "Add a report", a "Remind me to get tested" row and two learn tiles.
- **08 Check-in**: full-screen flow.
  - Close button, 4-segment progress and "2/4".
  - One card per habit (icon tile + question + Yes/No pair). The doctor habit has the overline "FROM YOUR DOCTOR".
  - Optional meal photo row with a dashed tile.
  - "Done" stays disabled until every habit is answered.
- **09 Check-in done**: teal background with static confetti shapes and a celebrating mascot (zoom 1.7).
  - "That's today done!" 42/800.
  - Week panel `#0B6680` with 34px dots (done = `#A5F3FC` with ✓; today = white with a halo).
  - White "Close" button.
- **10 Weekly summary**: teal hero "6 of 7 days checked in", a 12px bar for each habit, a gentle note and an optional weight pill.
- **31 Assistant (P1)**: sky scope notice, primary-colour user bubbles (radius 22 22 6 22), white assistant bubbles beside a small mascot, a source chip `#ECFEFF`, "Report this answer", and a floating input with a round send button.

**Plan**
- **11 Plan overview**: teal header with the focus marker and status chip; habit cards (the doctor habit on an `#ECFEFF` card); retest card with a "Change" chip; "View past plans" link.
- **12 Habit detail**: ice header with a plate scene; title 26; "needs" chips (`#ECFEFF`/`#164E63`); why it helps; how to do it; food chips; reminder pill; "Swap this habit".
- **13 Swap habit**: only habits that fit the user's answers, with a summary of those answers and an "Edit" link. Radio cards; the selected one gets a primary ring and a 7px-border radio. Habits that clash with a doctor habit are shown at 55% opacity and can't be picked. Note about the two-week swap limit.
- **37 What got in the way (P1)**: thinking mascot; reasons as a 2×2 pill grid; an "updated your answers" tint note with "Undo"; a sky card offering a habit that fits, with an "I can do this" button.
- **14 Plan proposal**: "What changed" tint card; each habit has "I can do this" (primary small pill) or "✓ Committed" (tint), plus "Swap". "Start plan" stays disabled until every habit is committed.

**Reports**
- **15 Reports list**: report cards with a date tile (latest = teal, older = tint), lab name and status chips; two shortcut tiles.
- **16 Add report**: a bottom sheet (top radius 36) over a dim background, with a 2×2 tile grid; "Take a photo" is the primary tile.
- **17 Capture**: dark `#0F172A` background; 5px `#22D3EE` corner guides; dark pill controls; shutter with a cyan ring.
- **18 Reading report**: document-and-mascot scene; 14px progress bar; three step rows (done = teal ✓, current = spinner); Cancel.
- **19 Confirm values**: the original image stays visible at the top (210 tall) while the user edits, with the source line highlighted in teal.
  - Editable value pills, 76×38, with a unit label on every value.
  - A flagged field gets a 2.5px primary border on `#ECFEFF` and a tint message explaining the check.
  - "Confirm values" button; "Nothing is saved until you confirm"; "Report a problem".
- **20 Results**: teal focus card; five marker rows (name, value + unit, status chip, range gauge, change since the last report); doctor disclaimer; button.
- **21 Marker detail**: 52px value; chart with status bands as background (the only place status colours fill large areas) and a 4px primary line with point markers; explanation; band legend with status dots; lab's reference range.
- **22 Comparison**: table of 14 Jun vs 22 Sep with change chips (better = tint, flat = soft); stat tiles for habits kept and doses taken; wording never claims a cause.
- **23 See your doctor**: red tint header with a red "!" circle and a `#7F1D1D` title; the triggering value with a "Very high" chip; "What still works" list; primary "Add a doctor's appointment"; red text link to the warning-signs screen.
- **24 Original viewer**: dark screen with page arrows and "Page 1 of 2".

**Medicines**
- **25 Medicines**: the current dose is a raised teal card with Taken (white pill) / Skipped / Snooze (`#0B6680` pills), 52 tall and within thumb reach; taken doses show a "✓ Taken" tint chip; medicine list; sky next-appointment card.
- **26 Add prescription**: 2×2 source tiles and a mascot tip.
- **27 Confirm prescription**: original image at the top; one card per medicine with field boxes. A field the app can't read is left blank, never guessed: shown in a 2px dashed teal box on `#ECFEFF` with an "Add" button. Doctor instruction toggle on lilac. Confirm stays disabled until the blank is filled.
- **28 Medicine detail**: fields exactly as written on the prescription; last-7-days dots (skipped = dashed); source prescription; "ask your doctor or pharmacist" note.
- **29 Appointments**: sky card for the upcoming appointment with a date tile and a "Prepare a visit summary" button; past list.
- **30 Visit summary (P1)**: paper preview with a 6px teal top border; questions as lilac cards plus a dashed add row; "Show on screen" / "Share PDF".

**Profile**
- **32 Profile**: tint header with avatar; details card; settings list including "What fits your life".
- **33 Reminder settings**: toggles; lilac quiet-hours card; the 3-a-day cap note.
- **34 Privacy and data**: consent card with View/Withdraw; app lock; download data; delete account in a neutral style (not red).
- **35 About**: disclaimer; urgent warning signs; dark "Call 1990 (Suwa Seriya)" button; contact and version list.

## Interactions & behaviour
- Navigation: five bottom tabs. Check-in, add report, add prescription, capture and confirm screens open full-screen over the tabs (iOS modal / Android full-screen dialog).
- Check-in opens in one tap from its reminder (within 2 seconds) and takes under a minute. A missed check-in can be filled in for the previous 2 days.
- Streaks (07/07c): count check-in days, not habits kept. Never show "streak lost" or guilt wording. A missed day becomes a check-in if filled in within 2 days (to confirm with product).
- Celebration (09): suggested motion is confetti falling over 1.2s and the mascot bouncing (scale 0.9 → 1.05 → 1, 500ms, spring). Respect Reduce Motion.
- Buttons press down 3px over 80ms. Chips and toggles change over 150ms ease-out.
- Confirm screens: nothing is saved until confirmed. Consistency-check flags highlight the field but never block the user. Blank prescription fields do block until filled.
- Every screen needs empty, loading, error and offline states (only 07b and 18 are drawn).
- Notifications and the app switcher must never show lab values, medicine names or conditions.

## State (main entities)
User, Profile (with lifestyle answers), Consent, Report, MarkerResult, Plan, PlanHabit (source: app or doctor; committed flag), CheckIn (answer per habit), Prescription, Medicine, DoseEvent, Appointment, Escalation. Field lists are in the spec's data model section. The plan, status, focus and escalation come from the rule engine only.

## Sample data used in the design
- Nimal Perera, 46, male, Active mode.
- Reports: 14 Jun 2026 and 22 Sep 2026, both from Lanka Diagnostics.

| Marker (mg/dL) | 14 Jun | 22 Sep | Status on 22 Sep |
|---|---|---|---|
| Triglycerides | 342 | 286 | High (focus) |
| Non-HDL | 196 | 184 | Borderline |
| Total cholesterol | 232 | 222 | Borderline |
| HDL | 36 | 38 | Low |
| LDL | 131 | 127 | In range |

- Retest: Tue 15 Dec 2026 (66 days away).
- Medicines: Atorvastatin 10 mg at night; Vitamin D3 1000 IU in the morning.
- Escalation example: triglycerides 540 mg/dL.

## Assets
- No bitmap assets yet.
- Fonts come from Google Fonts: Bricolage Grotesque, Figtree, JetBrains Mono.
- Still needed: mascot artwork (plus mood variants), onboarding and empty-state illustrations, an icon set, and the app icon in primary `#0E7490`.

## Files
- `design/Lipidly Screens v2.dc.html`: all screens (main reference).
- `design/TabBarPlay.dc.html`: tab bar component.
- `design/support.js`: runtime needed to open the HTML files in a browser.
- `tokens.json`: every design token in machine-readable form.
- `Lipidly product spec.pdf`: product behaviour, rules and copy constraints. Pages 33–54 are an appendix with a screenshot of every v2 screen, two per page.
- `screens/`: the same screenshots as individual PNGs (662×1389), numbered in canvas order.
