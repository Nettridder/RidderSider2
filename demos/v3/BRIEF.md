# Round 3 brief: Main page (`/app`) = calm basic-info page + grouped menus

Throwaway style test. One self-contained HTML file per design, with inline `<style>` and `<script>` only.
The only allowed externals are Alpine.js (`https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js`) and Google Fonts.
Assets: the logo is `../../logo.png` (orange shield, 432x640) and the profile picture is `../../portrett.png` (200x250).
All visible text is in Norwegian. Code is in English. Real link paths: `/app/...`, `/toneangiver`, `/margames`, `/ridderwiki`, `https://armeriddere.smugmug.com`. Do not invent domains.

Before designing, look at `../v2/C-samtale.html` (the top bar and the overall mood) and `../02-rustning.html` (the palette).

## What the user said (round 2 feedback)
- **Less roundness and playfulness than v2.** Keep it dark and warm (graphite, not pure black) with ember `#ec6c00` as the accent, as in 02-rustning. Use moderate corner radii (about 6–10px, pills only for small chips). Keep motion restrained. It should feel calm, adult and confident. The personality comes from the words.
- **Do not list every page at once.** Use a **menu** with grouped sections, so a user going to Sanger does not see the member list or the archive pages at the same time. Each group reveals only its own pages.
- **No rank or XP bar.** The rank can appear as small text, but must not be the focus.
- The main page is **not a profile page**. It is a **"get basic info" page**: a short greeting, the next øving, the streak number, and a small calendar of the next few events. Nothing more is required. The detail lives on the sub-pages.
- **Top bar (based on C-samtale's):** logo + "Armé Riddere" on the **left**, linking to this main page. **Profile picture + name box on the right** (the framed portrait: slight rounding, soft shadow, not a circle). **Clicking the picture/name box opens the profile menu:** Registrer øving, Mitt repertoar, Achievements, Profilinnstillinger, MAR Games ↗, Logg ut. The main navigation menu also lives in or under this top bar, depending on your variant.

## Menu groups (the source of truth, from the structure doc)
- **Noter:** Sanger, Repertoar*, Øvingsplan*, Toneangiver ↗. Plus **Note-admin** only for role `notes` or `master`.
- **Medlemmer:** Medlemmer, Styret. Plus **Admin** (`/app/admin`) only for role `master`.
- **Ridderdata:** Kalender, Dokumenter, RidderWiki ↗, Videoarkiv ↗, Bildearkiv ↗.
- **Kontakt:** Epostlister, Anonym Forum.
- **Profile menu** (from the portrait): as listed above.
- `*` = hidden for status Tidligere (ypp.com.). The profile menu stays available for everyone who is logged in.
- Admin entries are visually quieter or separated inside their group.

## Content on the page (keep it sparse)
- A greeting (by time of day), e.g. "God kveld, Ola."
- **Neste øving:** Torsdag 2. okt 19:00, "Julekonsert-innspurt". Link to Øvingsplan.
- **Streak:** 6 days in a row, with a quiet "Registrer øving" action nearby. This can be small.
- **Mini calendar:** Tor 2. okt Øving 19:00 · Lør 4. okt Opptreden, Grieghallen foyer 14:00 · Tor 9. okt Øving 19:00 · Fre 17. okt Semesterfest. Link to Kalender.
- Nothing else unless your variant brief says so.
- For Tidligere: no streak and no øving, show upcoming public events instead.
- A small "Demo" control switches status (Aktiv / Tidligere) and roles (`master`, `notes`), and the menus react.

## Quality
- Lots of whitespace, with one clear hero and a clear hierarchy.
- Menus are keyboard accessible: Esc closes, focus is managed, outside click closes. Visible focus.
- Respect `prefers-reduced-motion`.
- Works at phone width with no horizontal scroll, and on desktop.
- On mobile the main menu collapses sensibly, and the portrait stays top right.
