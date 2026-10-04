# RidderSider2: structure and backend plan

Written 2026-10-04 after a design review ("grilling") session. If you are a new developer or an AI agent, read this file first. It explains **what** we are building and **why** each decision was made.

Related specs in this folder:
- `DatabaseStrukture.md`: the planned DB schema
- `Strukture.md`: the site structure
- `BRIEF.md`, `DESIGN_NOTES.md`, `Styling*.md`: design

---

## 1. Context

RidderSider2 is a from-scratch redesign of armeriddere.no.

Today the app in `www/app/` is plain HTML + Alpine.js. Its data is a temporary `database/database.json`, which the browser fetches. Login is fake (client-side only), and every write is lost on reload.

The goal is to keep the HTML/JS way of working, which is what everyone prefers, and add the **smallest possible PHP layer**. PHP does only what a browser cannot do safely:

- Hold the DB password. Anything in browser JS is visible to every visitor.
- Decide who is logged in and what they may do. Any check in JS can be bypassed from DevTools.
- Serve private media from `storage/`, which sits outside the web root.
- Send email.

**Everything runs in dev for now.** That means `dev.armeriddere.no`, its own MariaDB and its own `storage/`. The old prod site keeps running untouched until this is accepted. Renaming dev to prod is done by hand later.

**Security model.** An earlier hack rewrote code to redirect visitors to a shopping site, and there was no backup. Because of that, git is the only source of truth for code. GitHub Actions mirrors `www/` to the server with `--delete` on every push to `main`. Anything on the server that is not in git is wiped, and only people with repo access can change the site.

---

## 2. Decisions

| Topic | Decision | Why |
|---|---|---|
| Hosting | Domeneshop webhotel: PHP + MariaDB + SFTP. Everything else must be free. | Already paid for; other costs need budget approval |
| Frontend | HTML + JS + Alpine only. Legacy `index.php`, `medlemmer.php` and `book-oss.php` become `.html`. No WordPress. | The team prefers HTML/JS, and nobody likes WordPress |
| PHP role | Thin JSON API only. PHP never outputs HTML. Endpoints live in `www/api/*.php`, helpers in `www/api/_lib/`, which is blocked by `.htaccess` `Require all denied`. | About 15 small files that rarely change |
| Secrets | `~/private/config.php` is outside the web root, never in git, and uploaded by hand. This is the same idea as the old `accessDB3.php`. | The web can't serve it, and git never sees it |
| Login | DB tokens in a cookie, not PHP sessions. | PHP's default `session.gc_maxlifetime` = 1440 s (24 min) caused the old "thrown out after ~20 min" bug |
| Data reads | One `api/bootstrap.php`, filtered by role on the server. The JS keeps doing joins and filters in the Alpine store as it does today. | You keep the flexibility in JS, while the server decides what you may see |
| Data writes | `api/save.php` checks a per-table, per-column, per-role whitelist and uses prepared statements. | Raw SQL from JS would let anyone read password hashes or run `DELETE`. Old string-joined SQL was injectable |
| Media | `storage/` uses type subfolders. A DB value starting with `http` is an external URL (YouTube/SmugMug) used as-is. Anything else is a path relative to `storage/`, served by `api/media.php`. Videos over about 200 MB go to YouTube (unlisted) or SmugMug. | One rule everywhere, and it saves disk on the webhotel |
| Members | One `members` table is used for the public page, the internal app, login and roles. Logged-in members see email and phone. The public sees only safe fields through a fixed query. `password_hash` is never sent anywhere. | One place to update a person, including admin access |
| Wiki | Lives at `ridderwiki.armeriddere.no` in its own folder, outside git, edited with FileZilla. `www/.htaccess` redirects `/ridderwiki/*` there and keeps the path. Read access needs an HTTP Basic Auth popup with a shared user/password (`.htpasswd` in `~/private/`). MediaWiki's own logins still work behind it. Style editing comes later. | Isolation: a wiki hack can't touch the main site, and the main deploy can't delete the wiki. Old links still work |
| MARGames | `margames.armeriddere.no`, from its own repo with its own deploy. `/margames/*` is redirected the same way as the wiki. | Same isolation pattern |
| Naming | Code, DB, comments and docs use English snake_case. The visible UI is in Nynorsk/Bokmål. | Any developer can read the code |
| Email | Sent from `nettridder@armeriddere.no` over SMTP. Every automated mail says it is automated, and replies go to that address. | |
| Calendar | The public Google calendar on `nettridder@`, read through `api/calendar.php` with a free API key (`singleEvents=true` so recurring rehearsals expand) and a 15-minute file cache. | Free, the key stays hidden, and it handles recurring events |
| Local dev | Push to a branch and test on dev.armeriddere.no. | Temporary; low priority |
| Migrations | SQL files in git, run by hand in phpMyAdmin. | Simple, and you see what happens |
| Backups | Manual for now (storage, wiki, DB). | Revisit later, for example with Google Drive |

---

## 3. Server layout (dev)

```
~/                         (Domeneshop home)
├── dev/                   ← git mirror of www/ (--delete). Served at dev.armeriddere.no
├── private/               ← manual. config.php, dev.htpasswd, wiki.htpasswd, cache/
└── storage/               ← manual and upload.php. Media
    ├── images/profile/   images/backgrounds/
    ├── songs/audio/      songs/sheets/
    ├── video/
    └── documents/
```

PHP finds the config through `__DIR__ . '/../../../private/config.php'`, which resolves from `dev/api/_lib/`. `config.php` defines:

- `STORAGE_DIR`
- the DB credentials
- the SMTP host, user and password
- `GOOGLE_API_KEY` and `CALENDAR_ID`
- `SITE_URL`

At the prod cutover only this file changes.

---

## 4. Repo layout (`www/` = the git repo)

```
www/
├── .github/workflows/deploy.yml
├── .htaccess              Options -Indexes, deny dotfiles/.md, 301 redirects for ridderwiki and margames
├── .info/                 specs + this plan (excluded from deploy)
├── index.html  book-oss.html  medlemmer.html   public pages (index-super look); index = Hjem, Om oss, Fakta, Bli en ridder, Kontakt
├── css/global.css         public site: styling shared by all public pages (page-only styling is in each page's <style>)
├── js/global.js           public site: SITE facts/links, MENU, header/footer, contact form, fade-in (same structure as app/js/global.js)
├── js/countries.js, confetti.js, easter-egg.js   effects from the old site
├── images/logo.png        small public assets only
├── api/
│   ├── _lib/              .htaccess "Require all denied"
│   │   ├── core.php       loads config, PDO (ERRMODE_EXCEPTION, utf8mb4), query(), json_out()/json_error(), rate limiting
│   │   ├── auth.php       current_member(), require_login(), require_role(), token helpers
│   │   ├── permissions.php  WRITE_RULES: table → role (master/notes/self) → allowed actions, columns, child tables
│   │   └── mail.php       send_mail() with PHP mail() + "automated email" footer (swap to SMTP here if mail lands in spam)
│   ├── login.php  logout.php  me.php
│   ├── password-request.php  password-reset.php
│   ├── bootstrap.php      all data the current member may see
│   ├── save.php           create/update/delete through the whitelist. Fills updated_by
│   ├── upload.php         role check, finfo type check, generated filename, writes to STORAGE_DIR/<type>/
│   ├── media.php          login check, realpath must stay under STORAGE_DIR, Content-Type, HTTP Range
│   ├── public.php         fixed queries for the public pages: member list, counts, login backgrounds, carousel
│   ├── calendar.php       Google Calendar API, cached in private/cache/
│   └── contact.php        contact form mail
├── app/                   existing app. Only the data layer changes (section 6)
└── db/                   (excluded from deploy)
    ├── migrations/001_schema.sql     from DatabaseStrukture.md, with audit columns created_at/by, updated_at/by
    ├── migrations/010_import_old.sql INSERT…SELECT from old_* tables (old Norwegian schema), keeping IDs (not written yet)
    └── tools/seed_from_json.py       turns ../database/database.json into INSERTs for a dev database
```

---

## 5. Auth design

**Tables:**
- `members.password_hash` uses `password_hash()` / `password_verify()`.
- `auth_tokens` has `id`, `member_id`, `type` (`login` or `reset`), `token_hash` (sha256), `expires_at`, `created_at` and `user_agent`.
- The real token is only ever in the cookie or the email link. The DB stores only its hash.

**Login (`api/login.php`):**
1. Check email + password. Only active members can log in.
2. Create a 32-byte random token. Store its hash with type `login`, expiring after 90 days.
3. Send the cookie `rs_token` with `HttpOnly; Secure; SameSite=Lax; Path=/`. JS can't read this cookie, so an XSS bug can't steal it.
4. Count recent failed attempts and slow down repeated failures.

**`require_login()`, which starts every protected endpoint:**
1. Hash the cookie and look up the row, requiring `expires_at > NOW()`.
2. If the token is more than a day old, slide `expires_at` forward.
3. Opportunistically run `DELETE FROM auth_tokens WHERE expires_at < NOW()`.
4. Return `401` if the token is invalid.

An admin can kick a member off every device by deleting their tokens.

**New member:**
- Only an admin can create one.
- The new row gets a `password_hash` built from a random string that nobody knows.
- The member then uses "Gløymt passord" to set their own password, the same flow everyone uses.
- No account means no reset.

**Forgot / new password:**
1. `password-request.php` takes an email address.
2. If an active member has that email, it creates a `reset` token valid for 1 hour.
3. It emails a link to `app/nytt-passord.html?token=…`.
4. The response is always the same, whether or not the email exists, so nobody can probe for members.
5. `password-reset.php` checks the token and sets the new hash.
6. It then deletes that reset token **and** all of the member's login tokens.
7. Expired reset tokens are removed by the opportunistic cleanup.

**Keepalive in `app/`** is event-based, with no interval timer, because the site has low traffic:
- Call `api/me.php` on page load and on `visibilitychange` back to visible. That call also slides the expiry.
- Any API response of `401` shows a toast and redirects to `logg-inn.html?next=…`.
- This replaces the client-side guard at `app/js/global.js:103-105`.
- `hasRole()` and `canSee()` stay, but **only to hide UI**. The server is the real security check.

---

## 6. Data layer changes in `app/`

- **Loading data:** in `global.js:125-142`, replace `fetch(DATABASE_URL+'database.json')` with `fetch('/api/bootstrap.php', {credentials:'same-origin'})`. The response keeps the same shape (`{members, songs, …}`), so the rest of the app is unaffected.
- **`storageUrl(path)`** (`global.js:86`):
  - If the value starts with `http`, return it unchanged.
  - Otherwise return `/api/media.php?path=` + the encoded path.
- **Hardcoded media paths** must go through the same rule:
  - `logg-inn.html:63,71`. Backgrounds are public, so they come from `public.php` or a `www/` asset.
  - `documents.js:67`.
- **New helper** `api.save(table, data)` / `api.remove(table, id)`. It POSTs JSON to `save.php` and updates the store from the returned row.
  - Swap the in-memory writes in `songs.js`, `members.js`, `documents.js` and `updateMemberSong` (`global.js:178-200`) to use it.
  - Remove the "Demo: endringen lagres ikkje" toast (`global.js:111`).
- **Login page:** `logg-inn.html:75-79` posts to `api/login.php`. Remove `DEMO_USERS` and `logInAs` (`global.js:16-20, 94-97, 584`).
- **New pages:** "Glemt passord" is a second mode on `app/logg-inn.html`; `app/nytt-passord.html` is opened from the email link.
- **Uploads:** these admin inputs only capture the filename today. They should use `upload.php`:
  - `admin/dokumenter.html:86`
  - `admin/bakgrunnsbilete.html:29`
  - `admin/achievements.html:59`
  - `admin/medlemmer.html:170`
  - `noter/admin/sanger.html:173`

---

## 7. `bootstrap.php` and `save.php` rules

- **Never sent:** `password_hash`, and nothing from `auth_tokens`.
- **Logged-in member:**
  - all members, including email and phone
  - the songs they may see (same rule as `canSeeSong()`, with `is_secret` respected)
  - the shared tables
- **Admin roles (`master`, `notes`):** may also get admin-only tables such as `settings`. The exact list lives in `permissions.php`.
- **Who may write what:**
  - Members (`self`) may change only their own settings and login info.
  - `notes` may change the music tables.
  - `master` may change everything.
- Every write is a prepared statement. `updated_by` is set from the logged-in member, so you always know who changed what.
- **Adding a feature** usually means adding one line to `permissions.php`.

---

## 8. Deploy changes (`.github/workflows/deploy.yml`)

- Before the mirror, write a dev-only Basic Auth block into the checkout's `.htaccess`, with `AuthUserFile` set to the absolute path of `~/private/dev.htpasswd`. Because it is written before the mirror, the `diff -r` verify still matches. This keeps Google and the public away from dev.
- Add `--exclude db/` and `--exclude .info/` to the mirror, and the same exclusions to the verify diff.
- Leave everything else as it is: `--delete` into `dev/`, then the verify step.

---

## 9. Build order

0. ✅ Write this plan to `www/.info/Plan.md`.
1. **Manual prerequisites (Kristian):**
   - Create the dev DB and its DB user.
   - Write `~/private/config.php` (template: `.info/config.example.php`).
   - Create `dev.htpasswd` and `wiki.htpasswd`.
   - Get the SMTP password for `nettridder@`.
   - Create a free Google Cloud API key with the Calendar API enabled.
   - Create the folders under `~/storage/`.
2. ✅ Write `001_schema.sql` and run it in phpMyAdmin. Load the small dev sample data.
3. ✅ Build `_lib/` + `.htaccess` + `me.php` / `login.php` / `logout.php`. Wire up the login page and the event-based keepalive.
4. ✅ Build `bootstrap.php` and switch `global.js` to it.
5. ✅ Build `save.php` + `permissions.php`. Convert the save functions one module at a time: songs, then members, then documents.
6. ✅ `media.php`, `storageUrl` and `upload.php` are built (profile images, backgrounds and documents).
7. ✅ Build the password reset flow + `mail.php` + the two new pages.
8. ½ done: `public.php`, `contact.php` and the three `.html` pages are built; `calendar.php` is still open.
9. Write `010_import_old.sql` and rehearse the import from an `old_*` dump in the dev DB until it is correct.
   - The old tables include `Songar`, `Sjangrar`, `SongarSjangrar` and `Stemmefiler`.
   - Old flat filenames such as `28_grunner_Mix.mp3` are moved into the type subfolders by a one-time script.
10. Write README docs for future developers:
    - the folder map
    - the `config.php` template
    - how to add a table or column to `permissions.php`
    - how to add an endpoint
    - the media rule

---

## 10. Verification (on dev.armeriddere.no after each push)

**Server lockdown and redirects:**
- `curl -I /api/_lib/auth.php` returns 403.
- `/api/` shows no directory listing.
- `.info/` and `db/` are not on the server.
- `/ridderwiki/Some_Page` returns 301 to `ridderwiki.armeriddere.no/Some_Page`. The same works for `/margames`.

**Data endpoints:**
- `bootstrap.php` without a cookie returns 401.
- With a cookie, `grep password_hash` on the `bootstrap.php` output finds nothing.
- A non-admin calling `save.php` to edit another member gets 403.
- `save.php` rejects a column that isn't in the whitelist.
- Sending `' OR 1=1 --` as a value through `save.php` stores it literally.

**Media and uploads:**
- `media.php?path=../private/config.php` is rejected.
- A Range request on an mp3 returns 206, and seeking in the audio player works.
- Uploading a `.php` file renamed to `.jpg` is rejected by `finfo`.

**Login and password reset:**
- Log in, close the browser, and come back the next day. You are still logged in.
- Delete the token row in phpMyAdmin, then focus the tab. You are redirected to login.
- A reset link works once. Reusing it, or using it after 1 hour, fails.
- After a reset, all of that member's old login tokens are gone.
- An unknown email gets the same message as a known one.
- The reset email says it is automated and comes from `nettridder@`.

**Calendar and public page:**
- The calendar shows real events, and a second load within 15 minutes is served from the cache.
- The public `index.html` shows members without email or phone.

---

## 11. Progress log

### 2026-10-04: schema, login API, public pages
Done (tested locally against MariaDB 10.11 in Docker plus headless Chrome):
- `db/migrations/001_schema.sql`: all tables. Additions to `DatabaseStrukture.md`:
  - `updated_by` on every table
  - `members.show_public`
  - `song_voice_files.start_note`
  - `auth_tokens.purpose` is `login`/`reset`: no `invite`, and tokens are deleted when used instead of getting `used_at`
  - new table `auth_attempts` for rate limiting
- `db/tools/seed_from_json.py` loads the sample data into a dev DB.
- `api/_lib/` (`core.php`, `auth.php`, `mail.php`) plus `login.php`, `logout.php`, `me.php`, `password-request.php`, `password-reset.php`.
- `api/bootstrap.php`: reads are done (role-filtered). **Writes are still in-memory only.** That is step 5, `save.php`.
- `api/media.php`: Range support; `images/public/`, `images/backgrounds/` and public profile pictures can be seen without login.
- `api/public.php`, `api/contact.php`.
- App:
  - `global.js` uses the API: `api.get/post`, the redirect to login on 401, and the `visibilitychange` keepalive.
  - The demo login and demo switcher are removed.
  - `storageUrl()` follows the media rule. Song and document paths in the DB are now relative to `storage/` (`songs/...`, `documents/...`).
- Public site: `index.html`, `medlemmer.html` and `book-oss.html` replace the `.php` pages. `.htaccess` sends `/*.php` there with a 301.
- `.htaccess`: no directory listing, source files denied, `/ridderwiki` and `/margames` redirect to the subdomains.
- `deploy.yml`:
  - `.info/` and `db/` are not uploaded.
  - Optional dev Basic Auth through the secret `DEV_HTPASSWD_PATH`.

Still open / needs Kristian:
- Step 1 prerequisites (server config, DB, htpasswd, mail).
- ✅ `SITE` facts are filled in, in `js/global.js`.
- Put public images in `storage/images/public/`: `hero.jpg`, `about-background.jpg`, `call-to-action.jpg`, plus `carousel/*.jpg`.
- The old site's `confetti.js`, flag icons and easter egg are not in the repo, so those effects do nothing until the files are added.
- The calendar still reads the mock `../database/google-calendar.json` (step 8).

### 2026-10-04: saving (step 5)
- `api/save.php` with `api/_lib/permissions.php` (`WRITE_RULES`). Requests look like `{action: insert|update|delete, table, id, fields, children}`.
  - "children" save a parent together with its linked rows, e.g. a song with its genres and files, or a repertoire with its songs. They replace all of the old linked rows.
  - The server fills in `created_by`/`updated_by` itself.
  - On 'self' inserts the server sets the owner column, so a member can only add their own practice logs and song knowledge.
- Extra member rules:
  - roles must be `master`/`notes`
  - the last Mester can't lose the role
  - you can't delete yourself
  - only the owner can change the owner's email or delete the owner account
  - new members get a random password and an invitation (= the reset email)
- DB errors become Norwegian messages: duplicate, missing link, invalid value. Strict SQL mode is turned on per connection.
- App: every save/delete calls `$store.app.save()` / `$store.app.remove()` (global.js) and only updates the store after the server confirms. A failed save shows a toast and keeps the form as it was.
  - The "reset password" button in Innstillinger and "send new invitation" in Admin both call `password-request.php`.
- Still waiting for `upload.php`: documents, login backgrounds and achievement images only save the file NAME (documents as `documents/<name>`). Put the files in `storage/` by hand until upload exists.
- Tested in Docker MariaDB + headless Chrome:
  - Role checks for member, notes and master.
  - Owner and last-Mester protection.
  - SQL text is stored literally.
  - A failed child insert rolls back the whole save.
  - Practice, knowledge/favourite, settings and new songs survive a reload.
  - All 27 app pages load without JS errors.

### 2026-10-04: old public-site files translated
- `js/head.php` became the `<head>` of `index.html`, `medlemmer.html` and `book-oss.html`. Static HTML can't include files, so if you change the head, change it in all three.
- Its `.fade-in` CSS moved into `css/global.css`.
- `js/html-helpers.php` and the jQuery `js/main.js` became `js/global.js` plus Alpine components in the pages. jQuery, counterUp, waypoints, easing and Bootstrap's JS are no longer needed.
- `glare.js`, `countries.js` and `confetti.js` are loaded on all public pages.
- `css/global.css` (+ each page's `<style>`) started as the "Regna" template (originally SCSS: green #2dc997, Open Sans) and was customised by hand. The SCSS sources were deleted because they were outdated. **Edit the CSS directly; there is no build step.**

**How styling works (two separate systems):**
- **Public site** (`index.html`, `medlemmer.html`, `book-oss.html`): built exactly like `app/`. Shared CSS/JS is in `css/global.css` and `js/global.js`; code used by one page is in that page's `<style>`/`<script>`; interactivity is Alpine.js (`x-data`, `x-text`, `x-for`). Bootstrap 5 CSS (from CDN) is only used for the layout grid. Light theme, orange accent `--orange: #ec6c00`.
- **App** (`app/`): no Bootstrap.
  - Dark theme, with tokens in `app/css/global.css` `:root`.
  - Category styles in `app/css/songs.css`, `members.css` and `documents.css`.
  - One-page styles go in a `<style>` in that page.
  - See the header comment in `app/css/global.css`. `StylingStructure.md` describes the intended idea; its file names (`variables.css`, `base.css`) were not used.

**Images (`www/images/`, small public assets in git):**

| File | Used for |
|---|---|
| `MARlogo.png` | favicon, and the coloured shield in "Om oss" (bottom layer of `.gold`) |
| `logoColor.png` | logo top left in the public header (`.logo-img`), in the app header and on the login page |
| `hero26.jpg` | front-page hero background (`#hero` in `index.html`'s `<style>`). Web version: 1920×1280, about 410 KB. The full-size original is in `storage/images/originals/`. |
| `MARgamesIcon.png` | MAR Games button on `medlemmer.html` |
| `logo.jpg` | black line drawing laid exactly over the `MARlogo.png` shield in "Om oss" (`.gold__lines`, `mix-blend-mode: multiply`); the moving gold shine (`.gold::after`, set by `js/glare.js`) is cut to it |
| `MARvapenskjold.png`, `marsignatur.png`, `MARsignaturvapenskjold.png` | not used by any page yet |

**From the old site, now translated:**
- `config.php` became `SITE` in `js/global.js`.
- `easter-egg.js` is loaded on every public page: type "ridder" or the Konami code.
- `privacy-policy.html` is the footer link.

**Other public images:**
- **"Bli en ridder" background:** loaded straight from SmugMug (`#call-to-action` in `index.html`'s `<style>`). Phones and tablets get size `XL` (1024 px, about 340 KB); screens wider than 1024 px get `X2` (1280 px). The size code appears twice in a SmugMug URL (`.../XL/MAR_6097-XL.jpg`). Swap it to pick another size: M, L, XL, X2, X3, X4, X5 or O (original). This is the pattern for any photo that already lives on SmugMug.
- **Carousel (`book-oss.html`):** every image in `www/images/carousel/`, listed by `api/carousel.php`. That endpoint uses no database, so the carousel works even before the DB is set up. Keep them about 1600 px wide and under 600 KB, because they are in git and every visitor downloads them. Full-size originals live outside git in `storage/images/originals/carousel/`.

### 2026-10-04: public site restructured like app/
- **Same rules as `app/`:**
  - `css/global.css` and `js/global.js` hold what several pages use.
  - Each page's own `<style>`/`<script>` holds what only that page uses.
  - Interactivity is Alpine.js; the header and footer are injected by `buildLayout()`.
  - A new page = one HTML file (copy an existing page's `<head>`) plus one line in `MENU` in `js/global.js`.
- **Alpine components:**
  - `siteLayout` (header, mobile menu, back-to-top) and `contactForm` are in `global.js`.
  - `countdownSection` and `countUp` are in `index.html`.
  - `carousel` is in `book-oss.html`.
  - `membersPage` is in `medlemmer.html`.
- **Checked against the old site** (RidderSider, run locally):
  - Old and new pages were screenshotted side by side.
  - The restructured pages are pixel-identical to the version before the restructure; the only change is a removed "." to match the old text.
  - All interactions were tested: menu, mobile menu, back-to-top, counters, flags, contact form, carousel, the practical-info box, the member list and the easter egg.
- **Known (also on the old site):** `book-oss.html` is about 12 px wider than the screen.

### 2026-10-04: public site = one page (look copied from index-super.html)
- `index.html` copies the look and layout of the Haiku draft `index-super.html`:
  - all sections on one page; the menu scrolls to them and marks the section you are in
  - an orange line-drawing logo (`logo.jpg` as a mask)
  - no Bootstrap and no Font Awesome; a small grid and SVG icons in `js/global.js` (`ICONS`)
- The content is real, unlike the draft: texts from the old site, `SITE` facts and contact details, real member list, carousel folder, and forms that send through `api/contact.php`.
- Flags, confetti and the easter egg are kept.
- `book-oss.html`, `medlemmer.html` and `js/glare.js` were removed. `.htaccess` sends `/book-oss.(php|html)` to `/#book-oss` and `/medlemmer.(php|html)` to `/#team`.
- Countdown: "Neste jubileum" always counts down to the next 20 February at 19:30 (`countdownSection()` in `index.html`).
- Checked: every section looks the same as the draft at 1280 px and 390 px. All interactions were tested: menu, scroll marking, mobile menu, counters, flags, both forms, carousel, the practical-info box, members and the easter egg.
- `index-super.html` (the draft) is still in the repo, and the deploy would publish it. Delete it once it is no longer needed.

### 2026-10-04: Book oss and Medlemmer are separate pages again
- `book-oss.html` and `medlemmer.html` are their own pages again, in the same index-super look. `index.html` no longer contains those two sections.
- The menu in `js/global.js`: Hjem, Om oss, Fakta and Kontakt scroll on the front page (and link to `/#...` from the other pages). Book Oss and Medlemmer open their pages. The current page or section is underlined.
- `.htaccess`: `/book-oss.php` and `/medlemmer.php` go to the `.html` pages again.
- Tested: both forms, carousel, the practical-info box, members, the menu between pages, and the mobile menu. No JS errors.

### 2026-10-04: starting the dev database
- Settings file: `RidderSider2/private/config.php`, outside git. Upload it by hand to `~/private/config.php`.
- **`db/migrations/002_start_data.sql`** adds the first rows. Run it right after `001_schema.sql` in phpMyAdmin.
  - The owner: kristianhafell@gmail.com. 2. tenor, Ridder, `["master"]`, `is_owner = 1`, started this semester, no password yet.
  - The settings `weekly_practice_goal_minutes` (60), `app_background` and `attendance_background`.
  - The example achievement `practice_total_1_day`.
- **Safety:** both scripts stop at once if they are run in the old live database (`armeriddere`), or in any database that has the old site's tables (`Songar`, `Sjangrar`, `mainwp_posts`). phpMyAdmin then shows "Subquery returns more than 1 row" on the `SET @STOP_...` line.
- **First password:** use "Glemt passord" on the login page (needs mail), or run `php www/db/tools/set_password.php` and paste the printed `UPDATE` line in phpMyAdmin.
- **Fixed:** the app home page crashed when there were no documents yet. The "Nytt dokument" box is now `x-if`.
- **Tested** on an empty MariaDB 10.11: both guards; 21 tables created; login; admin can save; nothing secret in `bootstrap.php`; all 24 app pages without errors, both empty and with data.

### 2026-10-05: song files simplified, Note-admin editor, repertoire for ypp.com., search instead of dropdowns
(This replaces the "song file paths" note that followed here.)

**Song files**
- **`song_voice_files` = sound files only:** `name` (Stemme, free text), `file` (file name only) and `sort_order` (set by Note-admin).
  - This matches old `Stemmefiler` (`Stemme`, `Mp3filnamn`), so importing is a straight copy.
  - There is no default voice per voice group any more: everyone gets Note-admin's order, and the first track plays by default.
- **On `songs`:**
  - `sheet_file`: one PDF per song, file name only (old `Notefilnamn`).
  - `pitch_notes`: tones like `"E4 C4 G3"`.
  - `pitch_gap_ms`: time between tones.
  - If `pitch_notes` is empty, the pitch pipe is hidden in the app.
- **Folders are not stored.** `SONG_FOLDERS` in `app/js/global.js` knows them: sound is in `storage/songs/melody/`, PDF in `storage/songs/pdf/`, video in `storage/songs/video/`.
- **Migrations:**
  - `003_simplify_song_files.sql` converts a database made with the old `001`. Already run on the dev database? Skip it.
  - `010_import_old.sql` imports `Songar`, `Stemmefiler`, `Sjangrar` and `SongarSjangrar`. It was tested with messy `Stemme` names.

**Note-admin → Sanger**
- One "Legg til sang" button opens the same editor as "Rediger". Nothing is saved before you press save: "Avbryt" or "Slett sang" on a new song creates nothing.
- The editor has:
  - a PDF file name (with a file picker)
  - the Toneangiver: tones + seconds between them, with preview and wrong tones in red
  - "Legg til lydfil" rows: Stemme + file name (audio only) + up/down arrows for the order

**Repertoires**
- `repertoires.hidden_for_former` ("Skjult for ypp.com.") is on by default. When it is off, former members also see that visible repertoire, and its secret songs.
- `bootstrap.php` enforces this on the server.
- Repertoar appears in the menu for former members only when at least one repertoire is shown to them.

**No dropdowns for long lists**
- `searchSelect()` + the `search-select` piece in `app/js/global.js` give a search field instead.
- Used for:
  - the song in Sangkunnskap
  - adding songs to a repertoire (its own search list)
  - members in Styret
  - "Gi til medlem" in Achievements
- Short fixed lists (term, rank, speed, sort order, genre) are still dropdowns.
- **Fixed:** picking a member on the Styret form crashed (`renumber(FORM, …)` was never filled in by the form template). Now `renumberPosition(key, FORM)`.

### 2026-10-04: song file paths
- Song files on the server are in `storage/songs/melody/` (sound and pitch) and `storage/songs/pdf/` (sheet music). These are the folder names already in use; the earlier plan said `songs/audio` / `songs/sheets`.
- Note-admin only shows the file name. When the song is saved, `SONG_FOLDERS` in `app/js/songs.js` adds the folder, so the database always holds the full path (e.g. `songs/melody/Bromance_Mix.mp3`).
- `db/migrations/003_fix_song_file_paths.sql` adds the folder to rows saved before this fix. Run it once; running it twice is safe.
- A missing PDF shows "Fant ikke notefilen" instead of an error.
- The app no longer requests the sample `database/google-calendar.json`, so the calendar is empty until `api/calendar.php` exists.

### 2026-10-05: role names
- `members.roles` now uses `"admin"` (shown as **Admin**) and `"noteadmin"` (shown as **Note Admin**), instead of `"master"` / `"notes"`. Admin can do everything Note Admin can.
- The code uses the new names everywhere: `permissions.php`, `has_role()`, `bootstrap.php`, the last-Admin check in `save.php`, `LABELS.roles`/`hasRole()`/`MENU` in `app/js/global.js`, and the role boxes in Admin → Medlemmer.
- `004_rename_roles.sql` converts a database that still has the old names. It is safe to run twice.
- Tested:
  - A Note Admin can edit songs, but not Admin tables or pages.
  - Admin gets both.
  - The last Admin cannot lose the role.
  - The old name `master` is now refused ("Ukjent rolle.").

### 2026-10-05: light mode in the app
- Profil → Innstillinger → **Utseende**: Mørk / Lys. The choice is saved in the browser (`localStorage` key `theme`), not in the database.
- Light mode looks like the old site: white background, orange header and orange details. The colours are the `:root[data-theme="light"]` tokens at the end of `app/css/global.css`.
- Each app page has a small inline script at the top of `<head>`. It sets the theme before anything is drawn, so light mode does not flash dark. The `THEME` helper in `app/js/global.js` reads and changes the theme.
- The login page has its own fix for light mode: its inputs used a white border that could not be seen on white.
- Light mode header (fixed after review): the text in the orange header is black, not white. The profile menu links are black on white. The orange logo keeps its colours and gets a thin dark outline so it shows on the orange background.

### 2026-10-05: gold shine on the logo (public front page)
- `www/index.html` now uses the old site's shine exactly: the same image (`/images/MARlogo.png`), the same `.gold::after` CSS (mask `/images/logo.jpg`), and the same maths as the old `js/glare.js` + `refreshGold()`:
  - `--glare-y` = (top of the logo + 3 % of its height) ÷ window height × 200 %
  - `--background-size` = the window size in px
- It updates at most once per frame on scroll, resize and orientation change (`goldShine()` in the page script).
- Checked against the old site side by side at three scroll positions: the values and the screenshots are the same.

### 2026-10-05: former members on the public Medlemmer page
- `medlemmer.html` has a button at the bottom, "Vis tidligere medlemmer". It shows a "Tidligere medlemmer" block under the current members, and "Skjul tidligere medlemmer" hides it again. The button is not shown when there are no former members.
- `api/public.php` now also sends `former_members`: members with `status = 'former'` and `show_public = 1`. It sends the same columns as for active members, plus `joined_year` and `left_year`. The newest leavers come first.
- Each card shows the rank and the years, e.g. "Storridder · 2015–2021". The years are left out when unknown. Photos are slightly greyed.
- To hide a former member from the public page, turn off `show_public`.
- Member photos on the public page (current and former) are square boxes. Every photo fills its box and is cropped to fit (`object-fit: cover`), so no background shows. Wide photos lose the sides. Tall photos keep the top and lose the bottom, as on the old site. The rank frames (Storridder etc.) stay around the photo. A missing photo shows `images/UkjendRidder.jpg`.

### 2026-10-05: image uploads (profile pictures and backgrounds)
- New endpoint `api/upload.php` (POST, multipart). It stores the file **and** saves it in the database in one step:
  - `kind=profile` + `member_id` puts the file in `storage/images/profile/` and sets `members.image_file`. Admin may do this for any member, and a member for themself.
  - `kind=background` puts the file in `storage/images/backgrounds/` and adds a `login_backgrounds` row, switched on. Only Admin may do this.
- The file must really be a JPG, PNG or WebP image. This is checked from its content, not its name. The limit is 15 MB.
- The file gets a new, safe name, e.g. "Ola Nordmann (2).JPG" becomes `ola-nordmann-2-3f9a1c.jpg`. Nothing is ever overwritten.
- If the database step fails, the file is removed again.
- `image_file` is still not writable through `save.php`. It only changes through an upload, so nobody can point it at another file.
- In the app, `$store.app.uploadImage(kind, file, memberId)` is in `app/js/global.js`.
  - Admin → Medlemmer: the picked image is uploaded when the member is saved (new or edited).
  - Admin → Bakgrunnsbilete: "Last opp" sends the image. The tiles now show the real image from storage.
- `media.php`: profile images of **former** members with `show_public` are now public too, because the public Medlemmer page shows them.
- Old files are kept when a member's image is replaced or a background is deleted. Clean them up by hand in storage/ if needed.
- Tested on a local MariaDB:
  - Admin uploads a profile image for another member and a background.
  - A member uploads their own profile image.
  - A normal member gets 403 for another member's image and for backgrounds.
  - A PHP file named .jpg is refused. Without login: 401. No file: 400.
  - Upload in the browser works on both admin pages, including a new member with an image.
- On Domeneshop: the folders `storage/images/profile/` and `storage/images/backgrounds/` must exist. upload.php creates them if missing.

### 2026-10-05: document upload, background picker without dropdowns
- `api/upload.php` also takes documents: `kind=document`. Only Admin may do this.
  - With `title`, it adds a new document.
  - With `document_id`, it replaces the file of that document.
  - The file goes to `storage/documents/`, and `documents.file` holds `documents/<name>`.
- Allowed files are PDF, DOCX and DOC, max 30 MB, checked from the content. A Word file must also have the matching extension, so a random zip renamed to .pdf or .docx is refused.
- The app uses `$store.app.upload(kind, file, extra)` (it was `uploadImage`).
  - Admin → Dokumenter "Last opp" sends the file.
  - "Rediger" saves the title through `save.php` and, if a new file was picked, uploads it.
- `permissions.php`: the file columns can no longer be changed through `save.php`.
  - `documents`: only `title` can change (update and delete).
  - `login_backgrounds`: only `is_active` can change (update and delete).
  - New rows only come from `upload.php`.
- Admin → Bakgrunnsbilete → "Faste bakgrunner" has no dropdowns any more. For Appen and Opptellingssiden you click an image tile, or "Ingen" (Standard). The chosen tile has an orange frame.
- Tested on a local MariaDB:
  - The API: PDF and DOCX upload, replacing a file, a zip named .pdf refused, .txt refused, no title refused, a normal member refused, `save.php` refusing `file`, and a member downloading a document.
  - In the browser: upload, editing with a new file, and the tile picker saved and still selected after reload.
