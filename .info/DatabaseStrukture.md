> **v2:** Bygger på `ArmeriddereDatabaseStruktur.md`. Nytt: rollebasert tilgang (`members.roles`), revidert `members`, og alle tabeller som trengs for strukturen i `ArmeriddereStruktur_v2.md`.

# Konvensjoner

- **Språk:** alt som ikke vises på nettsiden er på engelsk — tabellnavn, kolonnenavn, enum-verdier, variabelnavn, nøkler i koden. Tekst som vises på nettsiden er på norsk (settes i koden via `label`, eller er innhold brukerne skriver inn).
  - Unntak: egennavn uten god oversettelse — styreverv (`rittmester_id`) og rangtitler (`knekt`, `storridder`) — beholdes som de er.
- `snake_case`, tabeller i flertall (`songs`, `genres`).
- Koblingstabeller: eier først, i entall (`member_songs`, `member_achievements`).
- **Alle tabeller har `id`, `created_at`, `updated_at`, `created_by`** — også koblingstabeller.
  - `id` = `int(11) auto_increment`, primærnøkkel.
  - Koblingstabeller får i tillegg `UNIQUE` på paret (f.eks. `UNIQUE (song_id, genre_id)`), så samme kobling ikke kan lagres to ganger.
  - `created_by` = NULL når systemet selv lager raden (f.eks. achievements fra triggere).
- Fremmednøkler heter `<ting>_id` og er `int(11)`.
- `created_at` = `current_timestamp()`, `updated_at` = `current_timestamp() ON UPDATE current_timestamp()`.
- `created_by` / `updated_by` → `members.id`, `NULL` tillatt, `ON DELETE SET NULL` (innhold blir liggende hvis medlemmet slettes).
- Kolonnene er i tabellene under oppført først: `id`, `created_at`, `updated_at`, `created_by`.
- **Semester** lagres som `year smallint` + `term enum('spring','autumn')`. Vises som `V25` / `H25`. Enum sorteres etter rekkefølge, så `ORDER BY year DESC, term DESC` gir nyeste først.
- Glisne koblingstabeller: rad finnes kun når den betyr noe. Ingen rad = standardverdi.
- Ting som kan regnes ut (streak, konkurransepoeng, styreverv per medlem) lagres **ikke**.

# Oversikt

| Område | Tabeller |
|---|---|
| Medlemmer | `members`, `auth_tokens` |
| Styret | `boards` |
| Sanger | `songs`, `song_voice_files`, `genres`, `song_genres`, `member_songs` |
| Repertoar | `repertoires`, `repertoire_songs` |
| Øving | `practice_plans`, `practice_logs`, `practice_competitions` |
| Oppmøte | `attendance` |
| Achievements | `achievements`, `member_achievements` |
| Dokumenter | `documents`, `resolutions` |
| Utseende/oppsett | `login_backgrounds`, `settings` |

Trenger ingen tabell:
- Kalender (Google Calendar)
- Toneangiver (`song_voice_files` med `type = 'pitch'`)
- MAR Games (frittstående)
- Videoarkiv / Bildearkiv / RidderWiki (eksterne lenker)
- Kontakt oss / Book oss og Forum — lagres ikke, sendes på e-post til Rittmester sin faste adresse (hardkodet i koden)

---

# Medlemmer

## members

Eksempel: *Kristian Hafell, epost, tlf, 2. tenor, aktiv, ridder, `["master"]`, begynte V25, ikke sluttet, `kristian.png`.* Styreverv (f.eks. Noteridder) lagres **ikke** her — se `boards`.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | MUL | NULL | ON DELETE SET NULL |
| last_login | timestamp | YES | | NULL | |
| email | varchar(255) | NO | UNI | | Brukes til innlogging |
| phone | varchar(20) | YES | | NULL | Lagres som tekst, f.eks. `+4791234567` |
| password_hash | varchar(255) | YES | | NULL | bcrypt/argon2 — aldri klartekst. NULL = invitert, ikke aktivert ennå (se `auth_tokens`) |
| first_name | varchar(100) | NO | | | |
| last_name | varchar(100) | NO | | | |
| voice_group | enum('T1','T2','B1','B2') | NO | | | Fast stemmegruppe. T3 er ikke en fast gruppe (kun en stemme i femstemte sanger) |
| status | enum('active','former') | NO | | 'active' | `former` vises som "ypp.com." |
| rank | enum('aspirant','knekt','ridder','ridder_1st_class','kommandorridder','storridder') | NO | | 'aspirant' | Rekkefølge = rangorden. Visningsnavn i `RANKS` i koden |
| roles | JSON | NO | | '[]' | `CHECK (JSON_VALID(roles))`, f.eks. `["notes"]` — se *Roller* |
| is_owner | bool | NO | | 0 | Eier/utvikler av appen. Alltid full tilgang. **Kan kun endres direkte i databasen** — se *Eier-tilgang* |
| joined_year | smallint | NO | | | V25 → 2025 |
| joined_term | enum('spring','autumn') | NO | | | V25 → 'spring' |
| left_year | smallint | YES | | NULL | NULL = ikke sluttet |
| left_term | enum('spring','autumn') | YES | | NULL | |
| email_level | enum('all','important') | NO | | 'all' | Erstatter `want_email` |
| show_streak | bool | NO | | 0 | Vis lengste øvingsstreak på profil/galleri |
| show_songs | bool | NO | | 0 | Vis antall sanger medlemmet kan |
| show_achievements | bool | NO | | 0 | Vis antall achievements |
| image_file | varchar(255) | NO | | 'ukjend_ridder.png' | |

```js
// ranks.js — rekkefølge = rangorden (samme som enum)
export const RANKS = {
  aspirant:         { label: "Aspirant" },
  knekt:            { label: "Knekt" },
  ridder:           { label: "Ridder" },
  ridder_1st_class: { label: "Ridder av 1. klasse" },
  kommandorridder:  { label: "Kommandørridder" },
  storridder:       { label: "Storridder" },
};
```

Notater:
- **`status` + `left_*`:** settes status til `former`, krever Admin-siden at sluttsemester fylles ut.
- **`email_level`:** `all` = alt fra ridderne, `important` = kun invitasjoner, jubileum, sikkerhetsbrudd o.l. Ingen `none` — sikkerhetsvarsler skal alltid fram. Hver utsendelse merkes med nivå.
- **`show_*` som egne kolonner** så lenge de er få (< ~6–8). Blir det mange, flytt til én `preferences` JSON-kolonne.
- **Rang uten historikk:** kun nåværende rang lagres. Trengs historikk senere: egen tabell `member_ranks(member_id, rank, year, term)`.
- **Ny rang:** `ALTER TABLE` på enum + legg til i `RANKS`. Skjer sjelden.

## auth_tokens

Engangslenker for å sette eller bytte passord. **Ingen selvregistrering:** kun medlemmer som finnes i `members` kan få token. Nye medlemmer legges til av en admin med rollen `master`.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | Admin som sendte invitasjonen. NULL ved `reset` (medlemmet ba selv). ON DELETE SET NULL |
| member_id | int(11) → members.id | NO | MUL | | ON DELETE CASCADE. Må finnes — token kan aldri lages for ukjent e-post |
| purpose | enum('invite','reset') | NO | | | `invite` = første passord for nytt medlem, `reset` = glemt/bytte passord |
| token_hash | char(64) | NO | UNI | | SHA-256 av tokenet. Selve tokenet finnes kun i lenken på e-post |
| expires_at | datetime | NO | | | `reset`: 1 time. `invite`: 7 dager |
| used_at | datetime | YES | | NULL | Satt = brukt, kan ikke brukes igjen |

### Flyt: nytt medlem (kun `master`)
1. Admin med `master` oppretter medlemmet på Admin-siden → Medlemmer. `members.password_hash` = NULL (ikke aktivert).
2. Systemet lager token med `purpose = 'invite'`, `created_by` = admin, og sender lenke til medlemmets e-post.
3. Medlemmet åpner lenken og velger passord. `password_hash` settes, `used_at` settes.
4. Utløpt invitasjon: admin sender ny fra Admin-siden.

Serveren sjekker `hasRole(admin, "master")` før medlem opprettes eller invitasjon sendes.

### Flyt: bytte passord (eksisterende medlem)
1. Medlemmet skriver e-post på "glemt passord", eller trykker "tilbakestill passord" i Profilinnstillinger.
2. Finnes e-posten i `members`: lag token med `purpose = 'reset'` og send lenke. Finnes den ikke: gjør ingenting.
3. **Samme svar uansett:** "Hvis e-posten finnes, er en lenke sendt." Da kan ingen bruke skjemaet til å finne ut hvem som er medlem.
4. Medlemmet åpner lenken og velger nytt passord. `password_hash` oppdateres, `used_at` settes.

### Regler
- **Token:** minst 32 tilfeldige bytes fra kryptografisk generator. Lagres kun som hash — lekker databasen, kan tokenene ikke brukes.
- **Gyldig token** = hash finnes, `used_at IS NULL`, `expires_at > NOW()`.
- **Nytt token ugyldiggjør gamle:** når et nytt token lages, sett `used_at` på medlemmets andre ubrukte tokens.
- **Begrens forespørsler:** f.eks. maks 3 `reset` per e-post per time, for å hindre spam.
- **Etter passordbytte:** logg ut medlemmets andre økter.
- **Rydding:** slett rader der `expires_at` er eldre enn f.eks. 30 dager (cron-jobb).
- **Innlogging nektes** når `password_hash IS NULL` (invitert, ikke aktivert).

---

# Styret

Styreverv og tilgangsroller er helt adskilt. Vervet er hva du **er**, rollen (`members.roles`) er hva du **har tilgang til**. Å sette et nytt styre endrer **ikke** roller — admin må endre roller manuelt på Admin-siden → Medlemmer i tillegg.

## boards

Én rad = ett styre, valgt for ett semester. Bred tabell med én kolonne per styreverv — enkelt å lese og legge inn, og valg skjer bare én gang i semesteret. Kan redigeres i ettertid på Admin-siden → Styret.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| year | smallint | NO | MUL | | f.eks. 2025 |
| term | enum('spring','autumn') | NO | | | `UNIQUE (year, term)` — ett styre per semester |
| rittmester_id | int(11) → members.id | YES | MUL | NULL | ON DELETE SET NULL |
| rittmester_number | smallint | YES | | NULL | Nummer i rekken, f.eks. 5 = Rittmester nr. 5. Settes i UI |
| paragrafrytter_id | int(11) → members.id | YES | MUL | NULL | ON DELETE SET NULL |
| paragrafrytter_number | smallint | YES | | NULL | Nummer i rekken, f.eks. 5 = Paragrafrytter nr. 5. Settes i UI |
| finansridder_id | int(11) → members.id | YES | MUL | NULL | ON DELETE SET NULL |
| finansridder_number | smallint | YES | | NULL | Nummer i rekken, f.eks. 5 = Finansridder nr. 5. Settes i UI |
| noteridder_id | int(11) → members.id | YES | MUL | NULL | ON DELETE SET NULL |
| noteridder_number | smallint | YES | | NULL | Nummer i rekken, f.eks. 5 = Noteridder nr. 5. Settes i UI |
| lagersjef_id | int(11) → members.id | YES | MUL | NULL | ON DELETE SET NULL |
| lagersjef_number | smallint | YES | | NULL | Nummer i rekken, f.eks. 5 = Lagersjef nr. 5. Settes i UI |
| dirigent_id | int(11) → members.id | YES | MUL | NULL | ON DELETE SET NULL |
| dirigent_number | smallint | YES | | NULL | Nummer i rekken, f.eks. 5 = Dirigent nr. 5. Settes i UI |

Notater:
- **Bare de seks styrevervene lagres.** Andre verv (Nettridder, AppMester, Mediaridder, Jubileum, Barbar o.l.) er flytende, trenger ingen spesielle tilganger og står ikke her. De nevnes kun på Epostlister-siden.
- **Nummer per verv** (`<verv>_number`): hvilket nummer i rekken personen er, f.eks. Håkon = Rittmester nr. 5 fordi det har vært fire før ham. Tallet bestemmes i UI (f.eks. forhåndsutfylt med forrige nummer + 1 hvis ny person, samme nummer hvis samme person sitter videre). Ingen databaseregel.
- **Sittende styre** = nyeste rad: `ORDER BY year DESC, term DESC LIMIT 1`.
- **Nytt verv** = to nye kolonner (`<verv>_id` og `<verv>_number`) + legg vervet til i `BOARD_POSITIONS`. Bevisst valg: verv endres sjelden.

```js
// boards.js — rekkefølge = rekkefølge på Styret-siden. Kolonnenavn = `${key}_id`
export const BOARD_POSITIONS = {
  rittmester:     { label: "Rittmester" },
  paragrafrytter: { label: "Paragrafrytter" },
  finansridder:   { label: "Finansridder" },
  noteridder:     { label: "Noteridder" },
  lagersjef:      { label: "Lagersjef" },
  dirigent:       { label: "Dirigent" },
};
```

```sql
-- sittende styre med navn og nummer
SELECT b.year, b.term,
       r.first_name AS rittmester, b.rittmester_number,
       p.first_name AS paragrafrytter, b.paragrafrytter_number  -- osv.
FROM boards b
LEFT JOIN members r ON r.id = b.rittmester_id
LEFT JOIN members p ON p.id = b.paragrafrytter_id
ORDER BY b.year DESC, b.term DESC
LIMIT 1;

-- alle styreverv et medlem har hatt
SELECT year, term,
       rittmester_id = :id     AS rittmester,
       paragrafrytter_id = :id AS paragrafrytter,
       finansridder_id = :id   AS finansridder,
       noteridder_id = :id     AS noteridder,
       lagersjef_id = :id      AS lagersjef,
       dirigent_id = :id       AS dirigent
FROM boards
WHERE :id IN (rittmester_id, paragrafrytter_id, finansridder_id,
              noteridder_id, lagersjef_id, dirigent_id);
```

---

# Sanger

Modell: én **sang** har mange **stemmefiler** og mange **sjangere**. Et **repertoar** er en navngitt liste med sanger; én sang kan ligge i flere repertoarer.

```
songs 1 ──< song_voice_files
songs >──< genres          (via song_genres)
songs >──< repertoires     (via repertoire_songs)
songs >──< members         (via member_songs — kunnskap/favoritt)
```

## songs

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | MUL | NULL | ON DELETE SET NULL |
| name | varchar(255) | NO | MUL | | Sangens navn, søkbar |
| lyrics | text | YES | | NULL | Tekst |
| choreography_url | varchar(512) | YES | | NULL | Koreografivideo, som regel YouTube-lenke. Maks én per sang. NULL = ingen |
| is_secret | bool | NO | | 0 | Hemmelig. Settes ved opprettelse i Note-admin |

Synlighet i *Sanger*: `is_secret = 0` **eller** sangen ligger i minst ett repertoar med `is_visible = 1`.

```sql
SELECT s.* FROM songs s
WHERE s.is_secret = 0
   OR EXISTS (SELECT 1 FROM repertoire_songs rs
              JOIN repertoires r ON r.id = rs.repertoire_id
              WHERE rs.song_id = s.id AND r.is_visible = 1);
```

## song_voice_files

Stemmefiler. Én sang har mange. Hver fil har et visningsnavn og et filnavn.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| song_id | int(11) → songs.id | NO | MUL | | ON DELETE CASCADE |
| name | varchar(128) | NO | | | Visningsnavn, f.eks. "1. tenor", "Tutti", "Noter" |
| file | varchar(255) | NO | | | Filnavn på disk |
| voice | enum('T1','T2','T3','B1','B2') | YES | | NULL | Stemmen i sangen, NULL = alle/tutti. T3 finnes her fordi femstemte sanger har 3. tenor |
| type | enum('audio','sheet','pitch') | NO | | 'audio' | `sheet` = noter/PDF, `pitch` = toneangiver-klipp |
| sort_order | tinyint | NO | | 0 | Rekkefølge på sangsiden |

Notater:
- **`name` og `voice` er begge med.** `name` er fritekst for visning, `voice` er fast verdi så appen kan sortere og filtrere ("vis min stemme"). Uten `voice` må appen gjette stemme ut fra navnet.
- **Toneangiver** = rad med `type = 'pitch'`. Toneangiver-siden: ikke-skjulte sanger med minst én slik rad.
- **Video** er ikke en stemmefil — den ene videoen per sang er `songs.choreography_url`.

## genres

Sjangere.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| name | varchar(64) | NO | UNI | | f.eks. "Drikkevise", "Julesang" |
| sort_order | tinyint | NO | | 0 | |

## song_genres

Mange-til-mange: én sang har flere sjangere.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| song_id | int(11) → songs.id | NO | MUL | | ON DELETE CASCADE |
| genre_id | int(11) → genres.id | NO | MUL | | ON DELETE CASCADE |

`UNIQUE (song_id, genre_id)`. Indeks `(genre_id)` for "alle sanger i sjanger X".

## member_songs

Kunnskap og favoritter. **Glissen:** rad finnes kun når `knowledge > 0` eller `is_favorite = 1`. Ingen rad = kan ikke, ikke favoritt. Går begge tilbake til standard, slettes raden.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | Medlemmet selv. ON DELETE SET NULL |
| member_id | int(11) → members.id | NO | MUL | | ON DELETE CASCADE |
| song_id | int(11) → songs.id | NO | MUL | | ON DELETE CASCADE |
| knowledge | tinyint | NO | | 0 | 0 = ikke kjent, 1 = litt kjent, 2 = kjent |
| is_favorite | bool | NO | | 0 | |

`UNIQUE (member_id, song_id)`. Indeks `(song_id, knowledge)` for Sangkunnskap-admin.

Vurderte alternativer:
- **To tabeller** (`song_knowledge` + `song_favorites`): gyldig, renere hvis favoritter får egne felt (`favorited_at`, rekkefølge). Koster to spørringer på profilsiden.
- **JSON på medlemmet:** frarådes. "Hvem kan sang X" krever å lese alle medlemmer, ingen fremmednøkler, samtidige endringer overskriver hverandre.
- **Full tabell (medlemmer × sanger):** frarådes. Må fylles på for hver ny sang og hvert nytt medlem.

```sql
-- Sangkunnskap-admin: hvem kan sang X, sortert på stemme
SELECT m.first_name, m.last_name, m.voice_group, COALESCE(ms.knowledge, 0) AS knowledge
FROM members m
LEFT JOIN member_songs ms ON ms.member_id = m.id AND ms.song_id = :song
WHERE m.status = 'active'
ORDER BY m.voice_group, knowledge DESC;
```

---

# Repertoar

Et repertoar er en navngitt liste (f.eks. "Julekonsert 2025", "Faste sanger"). Flere repertoarer kan finnes samtidig. Synlige vises for aktive medlemmer på *Repertoar*-siden; skjulte er utkast eller historikk.

## repertoires

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| name | varchar(128) | NO | | | |
| is_visible | bool | NO | | 0 | Synlig for aktive medlemmer. Default skjult, så et nytt repertoar kan bygges ferdig først |

## repertoire_songs

Mange-til-mange: et repertoar har mange sanger, en sang kan ligge i flere repertoarer.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| repertoire_id | int(11) → repertoires.id | NO | MUL | | ON DELETE CASCADE |
| song_id | int(11) → songs.id | NO | MUL | | ON DELETE CASCADE |
| sort_order | smallint | NO | | 0 | Rekkefølge i repertoaret (f.eks. konsertrekkefølge) |

`UNIQUE (repertoire_id, song_id)`.

Notater:
- **Hemmelige sanger i synlig repertoar** blir synlige i *Sanger* så lenge repertoaret er synlig (se spørring under `songs`). Skjules repertoaret, blir sangen hemmelig igjen — ingenting må endres på sangen.
- **Historikk:** gamle repertoarer settes til `is_visible = 0` i stedet for å slettes.

---

# Øving

## practice_plans (Øvingsplan)

Vises kun for aktive medlemmer. Redigeres i Note-admin. Hva som skal øves (inkl. sanger) skrives i beskrivelsen — ingen kobling til `songs`.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| date | date | NO | MUL | | Dato for øvelsen |
| title | varchar(128) | NO | | | f.eks. "Julekonsert-øving" |
| description | text | YES | | NULL | Hva som skal øves, oppmøte osv. |

```sql
SELECT * FROM practice_plans WHERE date >= CURDATE() ORDER BY date;
```

## practice_logs (Eigenøving)

Enkelt: medlemmet taster inn antall minutter (f.eks. 5) og sender inn. Én rad per innsending, summeres ved spørring.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | Når det ble registrert |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | Hvem som registrerte (vanligvis medlemmet selv). ON DELETE SET NULL |
| member_id | int(11) → members.id | NO | MUL | | Hvem som øvde. ON DELETE CASCADE |
| date | date | NO | | | Dagen det ble øvd. Default i skjemaet: i dag |
| minutes | smallint | NO | | | `CHECK (minutes BETWEEN 1 AND 600)` |

Indeks `(member_id, date)`.

Regnes ut, lagres ikke: streak (dager på rad med sum > 0), totalt antall minutter, konkurransepoeng. Hver innsending er også en trigger for achievements (se *Achievements*).

## practice_competitions (Øvingskonkurranse)

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| name | varchar(128) | NO | | | |
| start_date | date | NO | | | |
| end_date | date | NO | | | `CHECK (end_date >= start_date)` |

```sql
-- stilling i en konkurranse
SELECT m.id, m.first_name, SUM(p.minutes) AS total
FROM practice_logs p JOIN members m ON m.id = p.member_id
WHERE p.date BETWEEN :start AND :end
GROUP BY m.id
ORDER BY total DESC;
```

---

# Oppmøte

## attendance (Opptellinger)

Én øvelse per uke = **én rad per øvelse**. Admin krysser av på en liste over aktive medlemmer og sender inn hele lista på én gang. Kun de som **var der** lagres (som liste med `member_id`). Frontend viser alle aktive og markerer hvem som er i lista.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | Sendt inn |
| updated_at | timestamp | NO | | current_timestamp() | Sist endret. ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | Sendt inn av. ON DELETE SET NULL |
| updated_by | int(11) → members.id | YES | | NULL | Sist endret av. ON DELETE SET NULL |
| rehearsal_date | date | NO | UNI | | Dato for øvelsen. Én rad per dato |
| present_member_ids | JSON | NO | | '[]' | `CHECK (JSON_VALID(present_member_ids))`, f.eks. `[3, 7, 12]` |

Notater:
- **Ingen reset.** Ny uke = ny rad. Alle tidligere øvelser ligger som historikk, sortert på `rehearsal_date`.
- **Endre i ettertid:** hele lista sendes inn på nytt og erstatter `present_member_ids`. `updated_by` / `updated_at` viser hvem som endret sist. Ingen endringslogg.
- **Kun tilstedeværende lagres.** Fravær utledes ikke i databasen — hvem som var aktive akkurat da kan ha endret seg. Frontend viser lista mot dagens aktive.
- **Hvorfor JSON-liste her** (mens `member_songs` er egen tabell): lista skrives og leses alltid som én helhet, og er liten (~20–40 id-er). Én rad per øvelse passer skjemaet direkte. Ulempe: ingen fremmednøkler — slettede medlemmer blir liggende som id i gamle lister (ufarlig, frontend hopper over ukjente id-er).

```sql
-- hvem var på øvelsen denne datoen
SELECT m.id, m.first_name, m.last_name
FROM attendance a
JOIN members m ON JSON_CONTAINS(a.present_member_ids, CAST(m.id AS JSON))
WHERE a.rehearsal_date = :date;

-- antall øvelser et medlem har vært på
SELECT COUNT(*) FROM attendance
WHERE JSON_CONTAINS(present_member_ids, CAST(:member_id AS JSON));
```

---

# Achievements

Achievements gis **automatisk** av triggere i koden — ingen søknad eller manuell godkjenning. En achievement er en bool: enten har medlemmet klart den, eller ikke. Oppnås den igjen, skjer ingenting.

## achievements

Erstatter den ødelagte tabellen i originalen. Tittel, beskrivelse og bilde redigeres her; selve regelen ligger i koden og kobles via `key`.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| key | varchar(64) | NO | UNI | | Kobling til regelen i koden, f.eks. `practice_total_1_day` |
| title | varchar(128) | NO | | | Visningsnavn (norsk), f.eks. "Øvd i en hel dag" |
| description | varchar(256) | NO | | | |
| image | varchar(128) | NO | | 'standardillustrasjon.png' | |
| trigger_event | varchar(64) | NO | | | Hendelsen som sjekker den, f.eks. `practice_logged`. (`trigger` er reservert ord i SQL) |
| is_secret | bool | NO | | 0 | Skjult til den er oppnådd |
| sort_order | tinyint | YES | | NULL | |

## member_achievements

**Glissen:** rad finnes = medlemmet har klart den. `UNIQUE (member_id, achievement_id)` gjør at den bare kan lagres én gang.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | = når den ble oppnådd |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | NULL = gitt automatisk av trigger. ON DELETE SET NULL |
| member_id | int(11) → members.id | NO | MUL | | ON DELETE CASCADE |
| achievement_id | int(11) → achievements.id | NO | MUL | | ON DELETE CASCADE |

## Triggere i koden

```js
// achievements.js — regel per achievement-key
export const ACHIEVEMENT_RULES = {
  practice_total_1_day: {
    event: "practice_logged",
    check: async (db, memberId) =>
      (await db.totalPracticeMinutes(memberId)) >= 1440,   // 24 t
  },
  // ny achievement: rad i `achievements` + regel her med samme key
};

// kalles etter hver hendelse, f.eks. etter ny rad i practice_logs
export async function runAchievementTriggers(db, event, memberId) {
  for (const [key, rule] of Object.entries(ACHIEVEMENT_RULES)) {
    if (rule.event === event && await rule.check(db, memberId)) {
      await db.awardAchievement(memberId, key);
    }
  }
}
```

```sql
-- awardAchievement: INSERT IGNORE = ingenting skjer hvis den allerede er oppnådd
INSERT IGNORE INTO member_achievements (member_id, achievement_id)
SELECT :member_id, id FROM achievements WHERE `key` = :key;
```

Hendelser (eksempler): `practice_logged` (eigenøving sendt inn), `attendance_saved` (oppmøte lagret — sjekk alle i lista), `song_knowledge_updated`.

---

# Dokumenter

## documents

Styrereferater og andre filer (docx/pdf). Lastes opp på Admin-siden → Dokumenter, vises for alle innloggede.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | MUL | current_timestamp() | Default sortering: nyeste først |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | Oppretta av. ON DELETE SET NULL |
| title | varchar(255) | NO | MUL | | Tittel, søkbar |
| file | varchar(255) | NO | | | Filnavn på disk. Filtype (pdf/docx) leses fra endelsen |

```sql
SELECT * FROM documents
WHERE title LIKE CONCAT('%', :search, '%')
ORDER BY created_at DESC;
```

## resolutions (Resolusjonar)

Flere resolusjoner per semester. Hver har år, semester, selve resolusjonsteksten og lenke til RidderWiki — ingen tittel eller klokkeslett.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | Oppretta av. ON DELETE SET NULL |
| year | smallint | NO | MUL | | f.eks. 2025 |
| term | enum('spring','autumn') | NO | | | |
| text | text | NO | | | Selve resolusjonen |
| wiki_url | varchar(512) | NO | | | Lenke til RidderWiki-artikkel. Alltid påkrevd |

Indeks `(year, term)` (ikke unik). Sortering: `ORDER BY year DESC, term DESC, created_at`.

---

# Utseende og oppsett

## login_backgrounds

Bakgrunnsbilder for innloggingssiden. Kun innloggingssiden roterer. Valg av tilfeldig bilde skjer på nettsiden (se `ArmeriddereStruktur_v2.md`).

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| file | varchar(255) | NO | | | f.eks. `ridderborg.png` |
| is_active | bool | NO | | 1 | "Er bakgrunnsbilde". 1 = med i utvalget, 0 = lagret men vises ikke. Skrus av/på manuelt på Admin-siden |

**Sesongbilder** (f.eks. jul): lastes opp én gang og ligger med `is_active = 0` resten av året. Admin skrur dem på og av manuelt. Ingenting slettes.

## settings

Enkeltverdier som ikke fortjener egen tabell. Ny innstilling = ny rad, ingen migrering.

| Field | Type | Null | Key | Default | Extra |
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | | auto_increment |
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | ON UPDATE current_timestamp() |
| created_by | int(11) → members.id | YES | | NULL | ON DELETE SET NULL |
| updated_by | int(11) → members.id | YES | | NULL | Sist endret av. ON DELETE SET NULL |
| key | varchar(64) | NO | UNI | | f.eks. `app_background`, `attendance_background` (ett fast bilde hver, roterer ikke) |
| value | JSON | NO | | | `CHECK (JSON_VALID(value))` |

---

# Roller / tilganger — implementeringsnotater

## Valg: liste av strenger

```
member.roles = []                     -- vanlig medlem, ingen admin-sider
member.roles = ["notes"]              -- Note-admin (under Noter)
member.roles = ["master"]             -- alt: Admin (/app/admin) + Note-admin
member.roles = ["notes", "master"]    -- flere roller samtidig er lov
```

Nøklene er engelske (kode). Visningsnavn på nettsiden er norske ("Mester", "Note") og settes i `ROLES`.

**Hvorfor liste og ikke objekt** (`{notes: false, master: true}`):
- Mangler rollen i lista = ingen tilgang. Med objekt må hver rad ha `false` for alle roller den ikke har, eller koden må uansett tolke manglende nøkkel som `false` — da er objektet bare en mer støyete liste.
- Kun sanne verdier lagres. Ingen tvetydighet mellom `false` og manglende nøkkel.
- Enkel å lese og vise i admin (avkrysningsbokser = elementene i lista).

## Kolonnen

MariaDB (JSON er alias for LONGTEXT med gyldighetssjekk):

```sql
ALTER TABLE members
  ADD COLUMN roles JSON NOT NULL DEFAULT '[]'
  CHECK (JSON_VALID(roles));
```

Finn alle med en rolle:

```sql
SELECT * FROM members WHERE JSON_CONTAINS(roles, '"notes"');
```

## Rolleregister — én kilde i koden

Selve rolledefinisjonene (visningsnavn, side) ligger i koden, ikke i databasen. Databasen lagrer kun hvilke nøkler hvert medlem har.

```js
// roles.js — eneste sted roller defineres
export const ROLES = {
  master: { label: "Mester", page: "/app/admin", all: true },   // Admin
  notes:  { label: "Note",   page: "/app/noter/admin" },        // Note-admin under Noter
};

export function hasRole(user, role) {
  return user.is_owner                    // eier: alltid alt, uavhengig av roles
      || user.roles.includes("master")
      || user.roles.includes(role);
}

// Lenker til admin-sidene medlemmet har tilgang til (Note-admin i Noter-menyen, Admin i hovedmenyen)
export function adminPages(user) {
  return Object.entries(ROLES)
    .filter(([key]) => hasRole(user, key))
    .map(([key, r]) => ({ key, label: r.label, page: r.page }));
}
```

Kun to admin-sider: Admin (`/app/admin`) og Note-admin (under Noter; URL `/app/noter/admin` er et forslag). URL-er er norske der de vises i nettleseren.

## Regler

- **Sjekk på serveren.** Hver admin-rute (sider og API-kall) sjekker `hasRole(user, "<rolle>")`. Å skjule menyen er ikke nok.
- **Valider ved lagring.** Når Admin-siden lagrer roller, avvis nøkler som ikke finnes i `ROLES`.
- **`master` er implisitt alt.** Aldri legg `master` inn i andre roller sine lister eller sjekk for den ved siden av; `hasRole` håndterer det.
- **Siste mester.** Admin-siden skal ikke tillate å fjerne `master` fra det siste medlemmet som har den. Eieren (`is_owner`) er i tillegg en sikkerhetsventil hvis alle andre mister tilgang.
- **Øktdata.** Les roller fra databasen ved innlogging (eller per forespørsel), så endringer får effekt uten at medlemmet må gjøre noe spesielt. Hvis rollene caches i økten, oppdater økten når roller endres.
- **Ingen automatikk fra styret.** Nytt styre på Admin-siden endrer aldri `members.roles`. Roller endres kun manuelt på Admin-siden → Medlemmer.

## Eier-tilgang (`is_owner`)

Utvikleren av appen skal alltid ha tilgang, også hvis alle andre mister admin-tilgang. Løsning: kolonnen `members.is_owner`.

**Hvorfor egen kolonne og ikke en rolle i `roles`:** `roles` redigeres på Admin-siden, så en annen mester kan fjerne den. `is_owner` finnes ikke i appen i det hele tatt — den kan bare endres med SQL direkte i databasen.

Settes én gang ved oppsett:

```sql
UPDATE members SET is_owner = 1 WHERE email = 'kristianhafell@gmail.com';
```

Regler i koden (alle sjekkes på serveren):
- **`hasRole` gir alltid `true` for eieren**, uavhengig av `roles`, `status` eller styreverv.
- **Ingen API/skjema skriver `is_owner`.** Oppdateringer av medlemmer bruker en fast liste med tillatte felter (allowlist), og `is_owner` er aldri med. Da kan den ikke settes via et manipulert skjema heller.
- **Eierens konto er beskyttet mot andre admins.** Andre enn eieren selv kan ikke:
  - slette eieren
  - endre eierens `email` eller `password_hash`
  - sende `reset`-token til eieren fra Admin-siden

  Grunn: kan en annen admin bytte eierens e-post, kan de deretter bestille nytt passord til sin egen adresse og ta over kontoen. Da er sikkerhetsventilen borte.
- **Eieren kan redigere egen konto** som vanlig (passord, profil) via Profilinnstillinger og "glemt passord".
- **Vises ikke i appen.** Admin-siden viser ikke `is_owner` som et valg. Eventuelt kun en liten merking "Eier" på medlemmet, så andre forstår hvorfor kontoen ikke kan endres.

Nødprosedyre hvis eieren selv er låst ute (glemt passord og e-post virker ikke): generer ny hash lokalt og kjør `UPDATE members SET password_hash = '<ny hash>' WHERE is_owner = 1;` direkte i databasen.

Sikkerhet: eierkontoen har full tilgang for alltid, så den bør ha sterkt, unikt passord. Vurder tofaktor (2FA) for denne kontoen senere.

## Nye roller

Appen har **ingen** måte å opprette nye roller på. Trengs en ny rolle, legger Nettridder den inn manuelt (i `ROLES` i koden og i `members.roles` direkte i databasen).

# Åpne spørsmål

1. 