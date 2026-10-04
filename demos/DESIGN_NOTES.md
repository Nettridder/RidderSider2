# Design notes / decisions

## 2026-09-25 — feedback on round 1 (demos/01–05)
- Liked: the playfulness and roundness of `04-lomme`, and the dark palette of `02-rustning`.
- Disliked: every page felt cluttered, with too much info on one page.
- Decision: the **profile page is the main app page**. It is the hub for the user's own stats and for links to every other page.
- There are two kinds of links: **personal** (Registrer øving, Mitt repertoar, Achievements, Profilinnstillinger) and **general / for everyone** (Sanger, Medlemmer, Kalender, ...).
- Show little: the next øving, the streak number and a small calendar of the next few events. The detail belongs on the sub-pages.
- Round 2 (experimental): `demos/v2/`.

## 2026-09-25 — feedback on round 2 (demos/v2)
- Too much roundness and playfulness. Tone it down.
- Don't list every page at once. Use a **menu with grouped sections**, so going to Sanger doesn't show the member list or the archive.
- Drop the rank/XP bar. Rank can appear, but must not be the focus.
- **Keep for later:** the ridderkort card from `v2/B-ridderkort.html` as a possible **profile page**. Copy saved as `keep/profil-ridderkort.html`.
- The main page should be **less of a profile page and more of a basic-info page**. Use menus to hide the items that cause clutter.
- Liked the top bar of `v2/C-samtale.html`, with changes: **logo/main page on the left, profile picture + name box on the right**. Clicking the profile picture and name opens the **profile menu** (Registrer øving, Mitt repertoar, Achievements, Innstillinger, MAR Games, Logg ut).
- Round 3: `demos/v3/`.

## 2026-09-25 — feedback on round 3 (demos/v3)
- Chosen base: **`v3/B-seksjoner.html`**.
- Keep **two separate bars**: top bar (logo left, profile box right) and menu bar. Later on mobile the menu bar moves to the **bottom** (not in focus yet).
- Menu = **plain buttons, no dropdowns or sub-strips**. Each button goes to that section's **own default page**, which has its own sub-menu for its sub-pages.
  - Noter: the default is the song list (Sanger). Sub-menu: Sanger, Repertoar*, Øvingsplan*, Toneangiver (+ Note-admin by role).
  - **Toneangiver moves back into the app** (`/app/noter/toneangiver`) instead of being a separate external site.
- **Remove "Mitt repertoar"** from the profile menu. Knowing a song (kjent/litt kjent/ikke kjent) is combined into the song list/note viewer as the default.
- Main page: **more focus on Registrer øving**, and you can register practice directly on the main page.
- Round 4: `demos/v4/`.

## 2026-09-25 — feedback on round 4 (demos/v4/seksjoner.html)
- Bring back the **horizontal sub-menu strip** from `v3/B-seksjoner.html`. Clicking a main menu button now **also navigates** to that category's default page. The strip shows that category's sub-pages horizontally (no side list).
- **Profile menu only:** Vis profil, Achievements, Innstillinger, Logg ut.
- **Registrer øving smaller.** Bring back the `04-lomme` style: a default time, **−5 / +5** buttons, and you can still type your own value.
- Add an easy way to **read the latest published document** from Hjem.
- Under "God morgen, Ola." bring back: "Internsidene og appen er nå samlet på ett sted. Noter, øvingsplan, medlemslister og arkivet ligger bak samme innlogging." (from `01-klassisk`).
- Show **"Repertoar nå"** on Hjem (from `01-klassisk`).
- Round 5: `demos/v5/`.

## 2026-09-25 — feedback on round 5 (demos/v5/seksjoner.html)
- The choir's name in the UI is **"Mannskoret Arme Riddere"**.
- Hjem: **remove "Repertoar nå"**.
- Repertoar page (Noter → Repertoar):
  - Show how well the user knows each song as a **read-only color** (green = kjent, yellow = litt kjent, red = ikke kjent), with a color filter. **No editing here**; knowledge is edited in the song view.
  - **Multiple repertoires can exist (0, 1 or more).** A small secondary menu picks which repertoire to view, with an empty state when there are none.
- Profile box (top right) shows **voice group + rank**, as in v4.
- Registrer øving: **today only**, with no day picker.
- **Weekly goal is 60 min.**
- Show stats: **the longest current streak** and **the most total practice time**, with who holds each and the exact number.
- Toneangiver: each song shows **1–5 starting notes** (e.g. per voice).
- **Note-admin:** add/edit/delete songs and their files (notes/sheets, audio, pitch). The **"add song" form sits on top**, with a **searchable list below** where every song's data can be edited. Repertoar admin uses the same pattern.
- **Admin → Medlemmer:** the same pattern. An add-member form on top, and a list with the data and an edit button per member below.
- **Kalender** comes straight from Google Calendar. It has two views: **list** and **month**.
- **Narrow (phone) view:** the header (logo + profile) stays on **top**. The **main menu sits at the bottom**, with the **sub-menu directly above it**.
- Round 6: `demos/v6/`.
