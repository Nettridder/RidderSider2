# Old Site — Style & UX Reference

This describes how the previous site *looked and felt*, based on what's
actually visible across its public pages, the members' portal, and the app.
It's written as a design reference, not a code reference — the goal is to
capture what's worth carrying forward into the new site, and to be honest
about what was just incidental (defaults nobody actually chose).

The most useful finding here is probably the honest one: there's really only one deliberate brand color (the rust-orange #EC6C00 accent) and one reusable visual signature (the framed profile photo pattern) — everything else that looks "styled" is either a stock WordPress theme from 2013 or unmodified Bootstrap defaults, not an intentional choice. The navigation structure and the "current vs. archived" split, though, reflect real accumulated wisdom about what a choir like this actually needs, and that's worth carrying forward regardless of how you restyle it.

but the new website combines the internsider and the app into one combined page and the only difference in the styling for the new page is the external landing page and the internal members site. (with some non relevant pages like margames and ridderwiki which is their own thing and not described here)

## The honest starting point: three different looks stitched together

The old system isn't one consistent design — it's three separate visual
worlds that grew up around three different tools, built at different times:

1. **The public site** — has an actual chosen identity: a warm rust-orange (#EC6C00)
   accent color, near-black body text, and a centered, fairly narrow content
   column. This is the closest thing to a real "brand."
2. **The members' portal ("internsider")** — runs on a WordPress theme from
   around 2013, styled like a blog: a decorative circular graphic behind the
   header, the choir's logo paired with the university's owl logo, a serif
   font for headings paired with a plain sans-serif for body text, dropdown
   navigation, and a sidebar listing recent posts, a full month-by-month
   archive going back to 2016, and a search box.
3. **The app** — uses an unstyled, out-of-the-box look (default blue links,
   default system font, default gray body text). Nobody appears to have
   actually designed this part — it's just what the toolkit looked like
   before anyone touched it.

**Takeaway for the new site:** there isn't a single "old design" to faithfully
reproduce — there's one real brand color choice worth keeping, a navigation
and content structure worth learning from, and two sets of visual defaults
that were never actually intentional and don't need to be preserved.

## Colors

- **Accent / link color** — a warm rust-orange (EC6C00). This is the one clearly
  deliberate brand color in the whole system, used consistently for links
  across the public site.
- **Visited-link color** — a darker brick red, a shade deeper than the
  accent, used to distinguish already-read links.
- **Body text** — near-black rather than pure black, giving a slightly softer
  read than stark black-on-white.
- **Background** — plain white throughout, everywhere.
- There's no secondary or tertiary brand color anywhere in the system — no
  choir "gold," no dark theme, no seasonal palette. Just the one warm accent
  against black text on white.

## Typography

- **Body text**: a clean, humanist sans-serif (Source Sans Pro on the
  members' portal; plain system fonts elsewhere). Nothing decorative —
  legibility over personality.
- **Headings on the members' portal**: paired with a serif font (Bitter),
  giving a slightly more traditional, "official document" feel to that
  section specifically, in contrast to the plainer sans-serif used
  everywhere else.
- No custom or unusual fonts anywhere — everything is a widely-available,
  easy-to-read choice.

## Imagery & logo usage

- **Two logos side by side** in the members' portal header: the choir's own
  logo and the University of Bergen's owl logo, signaling the choir's
  official affiliation with the university.
- **A decorative background graphic** (a large, pale circular pattern) sits
  behind the header on the members' portal — purely atmospheric, not
  informational.
- **Profile pictures** are shown in a distinct "frame": a fixed height, a
  soft, subtle drop shadow (barely-there, not heavy), and very slightly
  rounded corners — closer to a photograph in a frame than a modern rounded
  "avatar" bubble. This is a nice, specific, reusable pattern.
- Photos throughout tend to be informal portraits (choir members), not
  polished studio photography — fitting a community/student organization
  rather than a professional ensemble.

## Layout & spacing feel

- The public site keeps content in a **centered, moderate-width column**
  (roughly 1080px max), with consistent side padding — not full-bleed,
  not cramped.
- The members' portal follows a **classic two-column blog layout**: main
  content on the left, a persistent sidebar on the right (search, recent
  posts, archive, categories, login link).
- Nothing is dense or data-heavy on any single screen — content is spread
  across many separate pages/posts rather than packed into dashboards.

## Navigation & information architecture

This is genuinely useful to carry forward, independent of visual styling —
it reflects years of the choir figuring out what categories of information
they actually need:

- **Semesterplan** — the term's schedule, as its own top-level item.
- **Appen** (the app), with its own sub-items: **Profil**, **Toneangiver**.
- **Medlemmer** (Members), with sub-items separating *current* member info
  from historical records: **Medlemsinfo aktive**, **Medlemshistorie**,
  **Styrehistorie** (board history).
- **E-poster** — a reference page of role-based email addresses and mailing
  lists (this is essentially their "who do I contact for what" directory).
- **MARkivet** (The Archive), with sub-items: a board-meeting log, a document
  and minutes repository, a photo archive, and a video archive.
- **Varsling / whistleblower and anonymous feedback** — its own dedicated,
  clearly-labeled page.
- **RidderWiki** — a separate wiki for deeper institutional/community
  knowledge, linked as its own top-level item rather than folded into
  anything else.
- A **search box** is present in both the header and the sidebar of the
  members' portal.

The pattern worth keeping: **current info and historical/archival info are
always separated** (active members vs. member history, current board vs.
board history, current documents vs. an archive) rather than mixed into one
long list. That's a genuinely good instinct for a choir with decades of
institutional memory and high turnover.

## Component patterns worth reusing

- **Framed profile photo**: fixed size, soft shadow, faint rounding — a
  small but distinctive visual signature worth keeping in the new design.
- **Role-based email directory**: a simple, flat page listing each role
  (Rittmester, Noteridder, Finansridder, Nettridder, etc.) next to its email
  address and mailing lists — plain, scannable, no styling needed beyond
  clear headings.
- **Recency + archive split**: a short "recent" list up top (recent posts,
  recent minutes) with a full chronological archive available but tucked
  away — good for a site with a long history and members who mostly care
  about "what's happening now."

## Tone

Playful and community-driven rather than formal: invented titles (Ridder,
Knekt, Nettridder, Rittmester, Paragrafrytter) run throughout, in copy far
more than in visual design — the visual style itself is actually fairly
plain and utilitarian. The personality lives in the *words*, not in bold
colors or illustration. Worth preserving that balance: a clean, unfussy
visual foundation that lets the choir's own voice and humor carry the
personality, rather than trying to visually "match" the playfulness with a
busier design.