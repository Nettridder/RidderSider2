# Round 2 brief: Profile = main hub (`/app`)

Throwaway, experimental style test. There is one self-contained HTML file per design. Use inline `<style>` and `<script>` only.
Allowed externals: Alpine.js (`https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js`) and Google Fonts. Nothing else.
Assets: logo = `../../logo.png` (orange heraldic shield with "MAR UiB", 432x640). Profile picture = `../../portrett.png` (200x250 silhouette in a tuxedo with an orange sash, on a light grey background).
All visible text is in Norwegian. Code is in English.

Read `../01-klassisk.html`...`../05-tidende.html` only if you need content reference. Look mostly at `../04-lomme.html` and `../02-rustning.html`, because the user liked those two.

## What the user said
- They liked the **playfulness and roundness of 04-lomme** and the **dark palette of 02-rustning**. Combine them: a dark, warm surface (graphite/iron, not pure black), `#ec6c00` as the ember accent, rounded, tactile and friendly.
- Round 1 felt **too cluttered**. This page is seen every day, so it must be clean. Show less and link more. The detail lives on the sub-pages.
- **The profile page IS the main app page.** It is the member's own hub (their stats) and also the launchpad to every other page.
- There are **two clearly different kinds of links**:
  - **Personal / "Ditt"**: Registrer øving, Mitt repertoar (kjent/litt kjent/ikke kjent), Achievements, Profilinnstillinger, MAR Games ↗, Logg ut.
  - **General / "Koret" (for everyone)**: Sanger, Repertoar*, Øvingsplan*, Toneangiver ↗, Medlemmer, Styret, Kalender, Dokumenter, RidderWiki ↗, Videoarkiv ↗, Bildearkiv ↗, Epostlister, Anonym Forum.
  - **Admin** (role-gated, visually quieter/separate): Note-admin (role `notes` or `master`) and Admin (role `master`).
  - `*` = hidden for status Tidligere (ypp.com.).
- Show only a **little** info. Experiment with which pieces, but draw from:
  - the next øving (date, time, title),
  - a streak number (days in a row),
  - a small calendar/agenda of the next ~3 events.
  - Optional, sparingly: rank, minutes this week, one recent achievement. Do NOT show all of them. Choose, and justify the choice through the layout.
- A small demo control (clearly labeled "Demo") switches status (Aktiv / Tidligere) and roles (`master`, `notes`). The hub must react.

## Fake data
- Ola Nordmann, 2. Tenor, Ridder. Rank ladder: Aspirant, Knekt, Ridder, Ridder av 1. klasse, Kommandørridder, Storridder.
- Streak: 6 days. 85 min this week.
- Next øving: Torsdag 2. okt 19:00, "Julekonsert-innspurt".
- Agenda: Tor 2. okt Øving 19:00 · Lør 4. okt Opptreden Grieghallen foyer 14:00 · Tor 9. okt Øving 19:00 · Fre 17. okt Semesterfest.
- Achievement: "Øvd totalt en dag".

## Quality
- Low info density and generous whitespace.
- Clear hierarchy: one thing is the hero, and the rest is secondary.
- Keyboard accessible, visible focus.
- Respect `prefers-reduced-motion`.
- Work at phone width with no horizontal scroll, and on desktop.
- Keep the framed-portrait signature: fixed size, soft shadow, slight rounding, not a circle.
- Personality lives in the words (Ridder, Knekt, Rittmester...). Be experimental in your assigned direction, and make it clearly different from the other two.
