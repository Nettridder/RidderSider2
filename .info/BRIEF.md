# Demo brief — Armé Riddere intern app, hovedside ("[armeriddere-logo]"-siden)

Throwaway style test. One self-contained HTML file per style in `demos/`. Inline `<style>` and `<script>` blocks only.
Allowed externals: Alpine.js (`https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js`, the real app will use Alpine) and Google Fonts. Nothing else.
Assets: logo = `../logo.png` (orange shield, MCMXCVI, "MAR UiB", heart/notes/beer mugs, 432x640 portrait ratio). Profile picture = `../portrett.png` (200x250 silhouette in tuxedo with orange sash, light grey bg).

All visible text in Norwegian. Code/vars/classes in English.

## Brand
- Only real brand color: `#ec6c00` (rust-orange). Visited/darker: brick red (~#b8430a). Text near-black (#1c1a18-ish). Build complementary palette around it (complement is blue ~#0080ec; split complements teal/violet; analogous amber/brick).
- Define all colors as CSS variables on `:root` (matches their future `variables.css` approach).
- Signature pattern to keep: **framed profile photo** — fixed height, soft barely-there shadow, very slight rounding (like a framed photograph, NOT a circle avatar).
- Tone: playful titles live in the words (Ridder, Knekt, Rittmester, Noteridder...), visual foundation clean, lets the humor carry personality.
- Keep "current vs archive" split visible in the IA.
- Must work at phone width (no horizontal scroll) and desktop.

## The page to build: app home page (`/app`)
Hovedsiden etter innlogging. Merger old "internsider" + old app into one app. Should contain:
1. Header with logo (links home) + full navigation + profile icon (framed portrett.png) at right.
2. Short welcome/description: what the app is, that internsidene and appen are now one place, how to navigate.
3. A structured overview of every section (the "map" of the app) with a one-line description each, grouped as below.
4. A few personal "now" widgets with fake data: next øving (from Øvingsplan), your øvingsstreak / minutes this week with a quick "Registrer øving" minutes input, current repertoire ("Julekonsert 2026"), latest document, a recent achievement.
5. Footer.
6. A small floating "demo" control (clearly marked as demo) to switch **status** (Aktiv / Tidligere – ypp.com.) and toggle **roles** `master` (Mester) and `notes` (Note). Menus must react: Note-admin shown only with `notes` or `master`; Admin shown only with `master`; Repertoar and Øvingsplan hidden for Tidligere.

## Full navigation (every item must appear)
- **Noter**
  - Sanger → (Sanger — hele sangbiblioteket ~400 sanger; Repertoar — kun aktive; Øvingsplan — kun aktive)
  - Toneangiver (external link `/toneangiver`, klikk sang, hør startklippet)
  - Note-admin (role `notes`/`master`): Sanger, Repertoar, Sangkunnskap, Øvingsplan, Øvingskonkurranse
- **Medlemmer**
  - Medlemmer (galleri/liste, aktive/ypp.com.)
  - Styret (nåværende + historikk; Rittmester, Paragrafrytter, Finansridder, Noteridder, Lagersjef, Dirigent)
  - Admin `/app/admin` (role `master`): Medlemmer, Styret, Opptellinger, Dokumenter, Resolusjonar, Bakgrunnsbilete
- **Ridderdata**
  - RidderWiki (external), Kalender (Google Calendar), Dokumenter (arkiv, nyeste først, søkbar), Videoarkiv (external, RidderWiki), Bildearkiv (external, armeriddere.smugmug.com)
- **Kontakt**
  - Epostlister (rolle-eposter + distribusjonslister), Anonym Forum (varsling, ektesnakk, anonyme innspill)
- **[Profil-ikon]** (own page, not dropdown) with its own menu: Registrer øving, Repertoar (kjent/litt kjent/ikke kjent), Achievements, MAR Games (external), Profilinnstillinger. Also Logg ut.
Mark external links with a small ↗ icon.

## Fake data
Member: Ola Nordmann, 2. Tenor (T2), rang Ridder (ranks: Aspirant, Knekt, Ridder, Ridder av 1. klasse, Kommandørridder, Storridder). Streak 6 dager, 85 min denne uka. Neste øving: Torsdag 2. okt 19:00 "Julekonsert-innspurt" — Stille Natt, Deilig er jorden, Glade jul. Achievement: "Øvd totalt en dag" (1440 min). Siste dokument: "Styrereferat 18.09.2026". Nåværende styre: Rittmester nr. 31, etc.

## Deliverable quality
Real polish: considered typography, spacing, hover/focus states, keyboard-accessible menus, smooth but restrained motion, `prefers-reduced-motion` respected. Links can be `#` placeholders. It is a style exploration: be bold within your assigned direction, and make it clearly different from the other four.
