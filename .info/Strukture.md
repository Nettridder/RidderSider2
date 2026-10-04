# Armé Riddere — Nettside- og appstruktur (v2 — rollebasert tilgang)

> Dette dokumentet beskriver **struktur og innhold** — ikke visuelt design eller databehandling. Det kommer egne dokumenter for det.
>
> **v2:** Kopi av `ArmeriddereStruktur.md` med ny tilgangsmodell: hver tilgangsrolle eier **én** admin-side (med undersider), og rollene er navngitt etter hva de gir tilgang til — ikke etter styreverv. Se seksjon 2 og 6.
>
> **Språk:** all tekst som vises på nettsiden er på norsk. Alt som ikke vises (database, kode, variabelnavn, nøkler) er på engelsk. Nøkler i `kode` i dette dokumentet er derfor engelske, med norsk visningsnavn ved siden av.

---

## 1. Oversikt over soner

Nettstedet består av seks uavhengige soner:

| Sone | URL | Innlogging | Beskrivelse |
|---|---|---|---|
| **Offentlig side** | `armeriddere.no` | Nei | Landingsside, kontakt/book oss, offentlig medlemsliste |
| **MAR Games** | `armeriddere.no/margames` | Nei | Frittstående spillsamling, ferdig implementert, kobles bare på |
| **Toneangiver** | `armeriddere.no/toneangiver` | Nei | Lister alle ikke-skjulte sanger med en gyldig toneangiver lydfil og spiller lydfilen når sangen blir trykket på (mer beskrivelse senere) |
| **Intern app** | `armeriddere.no/app` | Ja | Alt operativt: noter, repertoar, kalender, medlemmer, dokumenter, admin |
| **Admin app** | `armeriddere.no/app/admin` | Ja | for admin brukere (rolle `master`): redigere: Medlemmer, Styret, Opptellinger, Dokumenter, Resolusjonar, Bakgrunnsbilete |
| **RidderWiki** | `armeriddere.no/ridderwiki` | Ja | Egen Mediawiki for internt bruk. Denne siden har sitt eget innloggingssystem og en kode for å få lov til å bruke den. så ingen uten koden får lov til å se, men i tillegg har egen innligging som er standard for MediaWiki |

Overgangen mellom sonene:
- Offentlig side → App: footer-lenke **"Arme Riddere"** på alle offentlige sider
- Offentlig side → MAR Games: easter egg-knapp øverst til høyre på medlemssiden
- App → MAR Games: lenke i profilmenyen
- Offentlig side → Toneangiver: ikke satt enda, men mest sansynlig på samme side som Mar Games

---

## 2. Status og tilgangsroller

Tilgang styres av to uavhengige ting på hvert medlem:

### 2.1 Status — hva vanlig innhold medlemmet ser

| Status | Ser |
|---|---|
| **Aktiv** (`active`) | Alt merket "aktive" + "alle" |
| **Tidligere medlem / ypp.com.** (`former`) | Alt merket "alle", ikke "aktive" eller skjulte sanger |

### 2.2 Tilgangsroller — hvilke admin-sider medlemmet har

Hver rolle gir tilgang til **nøyaktig én** admin-side (med undersider). Rollene lagres per medlem i kolonnen `members.roles` (se `ArmeriddereDatabaseStruktur_v2.md`). Et medlem kan ha null, én eller flere roller.

| Rolle (nøkkel) | Visningsnavn | Admin-side | Innhold |
|---|---|---|---|
| `master` | Mester | **Admin** (`/app/admin`) + Note-admin | Ser og redigerer alt, begge admin-sidene |
| `notes` | Note | **Note-admin** (egen side under Noter) | Sanger, repertoar, sangkunnskap, øvingsplan, øvingskonkurranse |

Det finnes kun **to** admin-sider: Note-admin under Noter, og Admin på `/app/admin`.

Rollene er **ikke** koblet til styreverv. Styreverv er kun visning/historikk på Styret-siden. Å sette et nytt styre endrer **ikke** roller — admin må i tillegg endre roller manuelt på Admin-siden → Medlemmer.

### 2.3 Styreverv

Kun disse seks er styreverv (lagres per semester, med nummer i rekken, f.eks. Rittmester nr. 5):

- Rittmester
- Paragrafrytter
- Finansridder
- Noteridder
- Lagersjef
- Dirigent

Andre verv (Nettridder, AppMester, Mediaridder, Jubileum, Barbar o.l.) er flytende, trenger ingen spesielle tilganger og nevnes kun på Epostlister-siden.

---

## 3. Offentlig side — `armeriddere.no`

Ingen innlogging. Formål: representere koret utad, vise fram medlemmer uten sensitiv info, og gi tilgang til MAR Games.

### Hjem
Landingsside. Første inntrykk av koret — hvem de er, hva de gjør.

### Kontakt oss / Book oss
Skjema/info for arrangører eller andre som vil komme i kontakt med koret eller booke dem til opptreden. Skjemaet sendes på e-post til Rittmester sin faste e-postadresse (hardkodet) og lagres **ikke** i databasen.

### Medlemmer
Offentlig medlemsliste. Toggle mellom **aktive** og **ypp.com. (tidligere medlemmer)**. Viser kun ikke-sensitiv info (bilde, navn, stemme — ikke e-post eller annet internt).
- **Easter egg-knapp** øverst til høyre under header → lenke til MAR Games.

### Footer (alle offentlige sider)
Teksten **"Arme Riddere"** — klikkbar, tar deg til innlogging for `/app`.

---

## 4. MAR Games — `armeriddere.no/margames`

Ingen innlogging. Frittstående modul, allerede bygget — limes inn som den er.

### Hjem
Nettleser/oversikt over tilgjengelige spill i listen.

### [Spill]
Egen spiller/side per spill i listen. Ingen kobling til koret sin brukerdatabase eller roller — helt uavhengig funksjonalitet.

---

## 5. Intern app — `armeriddere.no/app`

Krever innlogging. Vanlige sider er filtrert på **status** (aktiv/ypp.). Admin-funksjoner finnes **kun** på to sider: **Note-admin** (under Noter, rolle `notes`) og **Admin** (`/app/admin`, rolle `master`).

### Innlogging
*(ikke innlogget — nås via footer-lenken "Arme Riddere")*
E-post + passord, og "glemt passord". Ingen registrering — nye medlemmer legges til av admin på Admin-siden.

**Bakgrunnsbilde:** hver gang siden lastes, henter den alle aktive innloggingsbakgrunner, velger én tilfeldig og viser den. Gjerne ikke samme bilde som sist (husk sist viste i en cookie). Kun innloggingssiden roterer; appen og opptellingssiden har ett fast bilde hver.

### [armeriddere-logo]
*(alle innloggede)*
Hovedsiden til appen hvor du finner struktiren og info til hvordan navigere og hva som finnes og hva internsidene (appen) gjør. Dette er en sammenslått siden der den tidligere appen og internsidene har slått seg sammen til en app.

---

### Noter (dropdown)

**Sanger** (egen side med meny som viser menyen hvis Aktiv og skuler hvis ikke)

- **Sanger**
*(alle innloggede — viser kun ikke-skjulte sanger)*
Full sangbibliotek (~400 sanger, voksende), sortert på sjangere og på forskjellige måter, med stemmedeling (1. Tenor, 2. Tenor, 3. Tenor (hvis femstemt), 1. Bass, 2. Bass), notebilder/PDF, lydfiler per stemme, én koreografivideo (som regel YouTube-lenke), tekst/lyrics. En sang blir kun synlig her dersom den enten er merket "ikke skjult", eller ligger i et synlig repertoar.

- **Repertoar**
*(kun aktive medlemmer)*
Synlige repertoarer — navngitte lister (f.eks. "Julekonsert 2025") med sangene koret faktisk øver på/bruker nå. Kortere lister enn hele sangbiblioteket. Her finnes det både hemmelige og ikke-hemmelige sanger.

- **Øvingsplan**
*(kun aktive medlemmer)*
Liste over kommende øvelser: dato, tittel og beskrivelse (hva som skal øves på, inkl. sanger, skrives i beskrivelsen). Skjult for tidligere medlemmer i sin helhet. Redigeres i Note-admin.

**Toneangiver**
*(link til extern side /toneangiver — viser kun ikke-skjulte sanger som har en toneangiver-lydfil)*
Søkbar liste der man klikker en sang og kun toneangiver-klippet (ikke hele sangen) spilles av. Denne listen er synkronisert med Alle sanger — samme datagrunnlag, to ulike visninger, slik at en sang markert/valgt ett sted gjenspeiles i det andre.

**Note-admin** (egen side)
*(rolle `notes` — vises kun i menyen for de som har tilgang)*

- **Sanger** — ser **alle** sanger, skjulte og ikke-skjulte. Legg til nye sanger, rediger sjangere, last opp/fjern stemmefiler (lyd per stemme, noter, toneangiver-klipp), sett koreografilenke og tekst. Hver sang har en **skjult/ikke skjult**-toggle (settes ved opprettelse, kan endres senere).
- **Repertoar** — opprett navngitte repertoarer, legg til/fjern/sorter sanger i dem, og sett hvert repertoar **synlig/skjult** (skjult = utkast eller historikk).
- **Sangkunnskap** — søk opp sanger og se hvem av de aktive som kan hvilke sanger. Tabell sortert på stemmegruppe, fargen på medlemmet (rød, gul, grønn) viser hvor bra medlemmet kan den valgte sangen.
- **Øvingsplan** — legg til/endre/slett øvelser: dato, tittel, beskrivelse.
- **Øvingskonkurranse** — start-/sluttdato, visning av øvingsgrafer.

---

### Medlemmer (egen side med meny)

**Medlemmer**
*(alle innloggede)*
Full medlemsliste, internt. To visningsvalg: galleri (med bilder) eller liste (uten bilder). Toggle mellom aktive og tidligere (ypp.com.) medlemmer. Hvert medlem har stemme (1. tenor, 2. tenor, 1. bass, 2. bass — 3. tenor er ikke en fast gruppe), rang, aktiv/ypp.com., Acievements, etc. (beskrevet i et annet dokument)

Rang (laveste til høyeste): Aspirant, Knekt, Ridder, Ridder av 1. klasse, Kommandørridder, Storridder.

**Styret**
*(alle innloggede)*
Galleri/liste-toggle, hvor galeri viser nåværende og liste viser hele historikken for styresammensetning over tid (ett styre per semester). Viser styreverv med nummer (f.eks. "Rittmester nr. 5") og bilde per styremedlem. Styremedlemmene: Rittmester, Paragrafrytter, Finansridder, Noteridder, Lagersjef, Dirigent

**Admin** (egen side med meny) "app/admin"
*(rolle `master` — vises kun i menyen for de som har tilgang)*

- **Medlemmer** — legg til, endre eller fjern medlemmer. Nye medlemmer kan **kun** legges til her (ingen selvregistrering) og får en invitasjonslenke på e-post for å sette passord. Her deles også **tilgangsroller** ut (avkrysning per rolle fra rolleregisteret).
- **Styret** — legg inn et helt styre for ett semester av gangen, med nummer per verv (f.eks. Rittmester nr. 5 — UI kan forhåndsutfylle forrige nummer + 1). Se og endre tidligere styrer. Endrer **ikke** roller — det gjøres manuelt under Medlemmer.
- **Opptellinger** — én øvelse per uke. Viser liste over alle aktive medlemmer med avkrysning; hele lista sendes inn på én gang (lagrer hvem som var der, hvem som sendte inn og når). Ingen reset — hver uke blir en ny oppføring. Historikk over alle øvelser, der hver kan åpnes, endres og sendes inn på nytt.
- **Dokumenter** — last opp, endre og fjern dokumenter (tittel + fil) i dokumentarkivet.
- **Resolusjonar** — legg til resolusjon: år, semester (vår/høst) og selve resolusjonsteksten. Flere per semester.
- **Bakgrunnsbilete** — last opp innloggingsbakgrunner og skru hver av/på (f.eks. julebilder på i desember). Sett fast bakgrunnsbilete for appen og opptellingssiden.

---

### Ridderdata (dropdown)

**RidderWiki**
*(alle innloggede — ekstern lenke)*
MediaWiki-instans på `/ridderwiki`. Lengre referansestoff, historikk, videoarkiv-siden nevnt over.

**Kalender**
*(alle innloggede)*
Google Calendar-visning av aktiviteter, arrangementer og øvinger. Redigeres direkte i Google Calendar av de som har tilgang der.

**Dokumenter**
*(alle innloggede)*
Arkiv over styrereferater og andre filer (docx/pdf), én samlet visning sortert etter nyeste først, med tittel per dokument. også søkbarhet og forskjellige sorteringer, men sist lagt til er default. Lastes opp på Admin-siden.

**Videoarkiv**
*(alle innloggede — ekstern lenke)*
Peker til egen side i RidderWiki.

**Bildearkiv**
*(alle innloggede — ekstern lenke)*
Peker til armeriddere.smugmug.com

---

### Kontakt (dropdown)

**Epostlister**
*(alle innloggede)*
Oversikt over roll-e-poster (Rittmester, Dirigent, Paragrafrytter, Noteridder, Finansridder, Lagersjef, Nettridder, Mediaridder, Appmester, Jubileum, Barbar, "Alle i styret unntatt dirigent") og distribusjonslister (Notelauget, Alle aktive medlemmer, "Alle aktive + mange tidligere", Alle ypp.com, Riddere — kun invitasjoner/viktige oppdateringer, Koreografilauget, Motelauget). denne siden har et forklarende bilde under.

**Anonym Forum**
*(alle innloggede)*
Varsling, Ektesnakk og anonyme innspill — fungerer som en e-postrelé til Rittmester sin faste e-postadresse (hardkodet), med mulighet for anonym innsending. Lagres **ikke** i databasen. (Nøyaktig mekanisme for anonymitet er ikke bestemt ennå — anonym innsending sender uten avsenderinfo.)

---

### [Profil-ikon]
*(alle innloggede — egen side, ikke dropdown)*

Tar deg rett til profilsiden, som har sin egen meny:


- **Registrer øving** — enkel registrering av egenøving: én boks for antall minutter (f.eks. 5) og send inn. Dato er i dag som standard.
- **Repertoar** — full sangliste der brukeren kan markere hver sang som kjent/litt kjent/ikke kjent
- **Achievements** — badges knyttet til brukeren. Gis automatisk av triggere i koden (f.eks. "øvd totalt en dag" når eigenøving passerer 1440 minutter). Enten har man klart den eller ikke — ingen søknad, ingen telling.
- **MAR Games** — lenke ut til den frittstående spillmodulen
- **Profilinnstillinger** — velg hva som skal deles på medlemssiden (lengste øvingsstreak, antall sanger man kan, antall achievements), samt tilbakestill passord. Bilde, navn og andre grunndata settes av admin, ikke av brukeren selv.

---

## 6. Fotnoter

- **Tilgang ligger på medlemmet, ikke på styrevervet.** Kolonnen `members.roles` er fasit. Nytt styre endrer aldri roller automatisk — admin endrer dem manuelt. Et medlem uten styreverv kan få en rolle, og et styremedlem kan mangle en.
- **`master` (Mester) er en superrolle.** Den gir tilgang til alle admin-sider.
- **Eier-tilgang.** Utvikleren av appen har alltid full tilgang via `members.is_owner`, uavhengig av roller. Flagget kan ikke endres i appen, kun direkte i databasen, og eierens konto kan ikke slettes eller få e-post/passord endret av andre admins. Sikkerhetsventil hvis alle andre mister admin-tilgang.
- **Alle kan ha flere roller** Selv om noen roller overskriver hverandre som master som kan se alt, så vil det etterhvert komme flere roller og det skal være mulig å kunne ha e.g. både master og note.
- **Nye roller** lages ikke i appen. Trengs en ny rolle, legger Nettridder den inn manuelt i koden og direkte i databasen.
- **MAR Games-integrasjon** — helt frikoblet fra korets brukersystem (ingen pålogging, ingen kobling til medlemsprofiler), intensjonen er at denne skal få brukere til å registrere hvor brukeren kan enten være et medlem på /app, eller en egen liste over ikke-brukere men vil registrere highscore etc. Dette er derimot ikke gjort enda og per nå er denne helt frigjort fra alt annet og er en ferdig modul som blir kopiert inn senere

# Åpne spørsmål

1. 