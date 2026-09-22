# Armé Riddere — Nettside- og appstruktur

> Dette dokumentet beskriver **struktur og innhold** — ikke visuelt design eller databehandling. Det kommer egne dokumenter for det.

---

## 1. Oversikt over soner

Nettstedet består av tre uavhengige soner:

| Sone | URL | Innlogging | Beskrivelse |
|---|---|---|---|
| **Offentlig side** | `armeriddere.no` | Nei | Landingsside, kontakt/book oss, offentlig medlemsliste |
| **MAR Games** | `armeriddere.no/margames` | Nei | Frittstående spillsamling, ferdig implementert, kobles bare på |
| **Toneangiver** | `armeriddere.no/toneangiver` | Nei | Lister alle ikke-skjulte sanger med en gyldig toneangiver lydfil og spiller lydfilen når sangen blir trykket på (mer beskrivelse senere) |
| **Intern app** | `armeriddere.no/app` | Ja | Alt operativt: noter, repertoar, kalender, medlemmer, dokumenter, admin |
| **RidderWiki** | `armeriddere.no/ridderwiki` | Ja | Egen Mediawiki for internt bruk. Denne siden har sitt eget innloggingssystem og en kode for å få lov til å bruke den. så ingen uten koden får lov til å se, men i tillegg har egen innligging som er standard for MediaWiki |

Overgangen mellom sonene:
- Offentlig side → App: footer-lenke **"Arme Riddere"** på alle offentlige sider
- Offentlig side → MAR Games: easter egg-knapp øverst til høyre på medlemssiden
- App → MAR Games: lenke i profilmenyen
- Offentlig side → Toneangiver: ikke satt enda, men mest sansynlig på samme side som Mar Games

---

## 2. Roller — kort referanse

Fulle tilgangsregler ligger under hver side. Kort oppsummert:

| Rolle | Domene |
|---|---|
| **Rittmester, Nettridder, AppMester** | Full tilgang til alt (samme nivå, to ulike titler/personer) |
| **Noteridder, Dirigent** | Sanger, kategorier, repertoar, skjult/ikke skjult-status, admin-panel, øvingsplan |
| **Paragrafrytter** | Kalender, øvingsplan, dokumentpublisering, opptellinger, admin-panel (samme nivå, to ulike titler/personer) |
| **Aktivt medlem** (aktiv) | Ser alt merket "aktive" + "alle" |
| **Tidligere medlem** (ypp.com.) | Ser alt merket "alle", ikke "aktive" eller skjulte sanger |

---

## 3. Offentlig side — `armeriddere.no`

Ingen innlogging. Formål: representere koret utad, vise fram medlemmer uten sensitiv info, og gi tilgang til MAR Games.

### Hjem
Landingsside. Første inntrykk av koret — hvem de er, hva de gjør.

### Kontakt oss / Book oss
Skjema/info for arrangører eller andre som vil komme i kontakt med koret eller booke dem til opptreden.

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

Krever innlogging. Alt innhold under er filtrert basert på **status** (aktiv/ypp.) og **admin-rolle**.

### Noter (dropdown)

**Alle sanger**
*(alle innloggede — viser kun ikke-skjulte sanger)*
Full sangbibliotek (~400 sanger, voksende), kategorisert og sortert på forskjellige måter, med stemmedeling (1. Tenor, 2. Tenor, 3. Tenor (hvis femstemt), 1. Bass, 2. Bass), notebilder/PDF, lydfiler per stemme, evt. videofiler, tekst/lyrics. En sang blir kun synlig her dersom den enten er merket "ikke skjult", eller er lagt inn i et aktivt repertoar.

**Repertoar**
*(kun aktive medlemmer)*
Gjeldende repertoarliste — sangene koret faktisk øver på/bruker nå. Egen, kortere liste enn hele sangbiblioteket. Her finnes det både synlige og ikke-synlige sanger.

**Toneangiver**
*(link til extern side /toneangiver — viser kun ikke-skjulte sanger som har en toneangiver-lydfil)*
Søkbar liste der man klikker en sang og kun toneangiver-klippet (ikke hele sangen) spilles av. Denne listen er synkronisert med Alle sanger — samme datagrunnlag, to ulike visninger, slik at en sang markert/valgt ett sted gjenspeiles i det andre.

**Sang-admin**
*(kun Noteridder og Dirigent)*
Ser **alle** sanger, skjulte og ikke-skjulte. Her legges nye sanger til, kategorier redigeres, filer (noter, lyd, video, tekst) lastes opp/fjernes, og hver sang får en **skjult/ikke skjult**-toggle (settes ved opprettelse av ny sang, kan endres senere).

**Repertoar-admin**
*(Noteridder og Dirigent)*
Ser alle sanger. Legger til/fjerner/redigerer repertoaroppføringer, og setter synlighet per oppføring (gjeldende vs. historikk). 

**Sangkunskaps-admin**
*(Noteridder og Dirigent)*
Slker opp sanger og ser hvem av de aktive som kan hvilke sanger. lager en tabell sortert på stemmegruppe og fargen på medlemmet (rød, gul, grønn) viser hvor bra medlemmet kan den valgte sangen.

---

### Medlemmer (dropdown)

**Medlemmer**
*(alle innloggede)*
Full medlemsliste, internt. To visningsvalg: galleri (med bilder) eller liste (uten bilder). Toggle mellom aktive og tidligere (ypp.com.) medlemmer. Hvert medlem har stemme, rang, aktiv/ypp.com., Acievements, etc. (beskrevet i et annet dokument)

**Styret**
*(alle innloggede)*
Galleri/liste-toggle, hvor galeri viser nåværende og liste viser hele historikken for styresammensetning over tid. Viser Styre-rolle og bilde per styremedlem Styremedlemmene: Rittmester, Paragrafrytter, Finansridder, Noteridder, Lagersjef, Dirigent

**Medlemmer-admin**
*(Paragrafrytter)*
Medlemmer blir lagt til, endret eller fjernet. Her blir også Rollene (tilgangene) delt ut.

**Styret og Tilganger-admin**
*(Paragrafrytter)*
Styret og roller blir lagt til, endret og fjernet. Her legger Admin til en helt Styreliste av gangen og ser tidligere historikk som kan endres. 

**Opptellinger**
*(Paragrafrytter)*
Ukentlig oppmøtesjekk for aktive medlemmer. Resetter hver søndag midnatt til mandag. Redigerbar historikk vises på siden.

---

### Kalender (dropdown hvis Aktiv / lenke hvis ypp.com.)

**Kalender**
*(alle innloggede)*
Google Calendar-visning av aktiviteter, arrangementer og øvinger. Redigeres av Paragrafrytter.

**Øvingsplan**
*(kun aktive medlemmer)*
Hva som skal øves på, og datoer for neste fysiske øvelse. Skjult for tidligere medlemmer i sin helhet.

---

### Dokumenter (dropdown)

**Dokumenter**
*(alle innloggede)*
Arkiv over styrereferater og andre filer (docx/pdf), én samlet visning sortert etter nyeste først, med tittel per dokument. også søkbarhet og forskjellige sorteringer, men sist lagt til er default.

**Videoarkiv**
*(alle innloggede — ekstern lenke)*
Peker til egen side i RidderWiki.

**Bildearkiv**
*(alle innloggede — ekstern lenke)*
Peker til armeriddere.smugmug.com

**Adminpanel**
*(Paragrafrytter, Noteridder og Dirigent)*
Samlested for driftsfunksjoner som ikke hører hjemme i den vanlige navigasjonen:
- Øvingskonkurranse — start-/sluttdato, visning av øvingsgrafer
- Resolusjonar — legg til resolusjon (semester vår/høst, år, lenke til RidderWiki-artikkel skrives inn manuellt)
- Bakgrunn- og opptellingsbilete — sett bakgrunnsbilete for appen/opptellingssiden

---

### RidderWiki
*(alle innloggede — ekstern lenke)*
MediaWiki-instans på `/ridderwiki`. Lengre referansestoff, historikk, videoarkiv-siden nevnt over.

---

### Kontakt (dropdown)

**Epostlister**
*(alle innloggede)*
Oversikt over roll-e-poster (Rittmester, Dirigent, Paragrafrytter, Noteridder, Finansridder, Lagersjef, Nettridder, Mediaridder, Appmester, Jubileum, Barbar, "Alle i styret unntatt dirigent") og distribusjonslister (Notelauget, Alle aktive medlemmer, "Alle aktive + mange tidligere", Alle ypp.com, Riddere — kun invitasjoner/viktige oppdateringer, Koreografilauget, Motelauget). denne siden har et forklarende bilde under.

**Forum**
*(alle innloggede)*
Varsling, Ektesnakk og anonyme innspill — fungerer som en e-postrelé til Rittmester sin innboks, med mulighet for anonym innsending. (Nøyaktig mekanisme for anonymitet er ikke bestemt ennå.)

---

### [Profil-ikon]
*(alle innloggede — egen side, ikke dropdown)*

Tar deg rett til profilsiden, som har sin egen undermeny:

- **Registrer øving** — personlig registrering av øvingstider for egenøving utenom obligatorisk aktivitet.
- **Repertoar** — full sangliste der brukeren kan markere hver sang som kjent/litt kjent/ikke kjent
- **Achievements** — badges/historikk knyttet til brukeren
- **MAR Games** — lenke ut til den frittstående spillmodulen
- **Profilinnstillinger** — velg hva som skal deles på medlemssiden (lengste øvingsstreak, antall sanger man kan, antall achievements), samt tilbakestill passord. Bilde, navn og andre grunndata settes av admin, ikke av brukeren selv.

---

## 6. Fotnoter

- **Rittmester**, **Nettridder** og **AppMester** er tre separate roller med samme tilgangsnivå (alt), men er ikke listet side for side på hver enkelt sak ovenfor for å holde dokumentet lesbart.
- **MAR Games-integrasjon** — helt frikoblet fra korets brukersystem (ingen pålogging, ingen kobling til medlemsprofiler), intensjonen er at denne skal få brukere til å registrere hvor brukeren kan enten være et medlem på /app, eller en egen liste over ikke-brukere men vil registrere highscore etc. Dette er derimot ikke gjort enda og per nå er denne helt frigjort fra alt annet og er en ferdig modul som blir kopiert inn senere
- **Roller og styremedlemmer** Roller og Styremedlemmer henger sammen og hver rolle bestemmer en satt tilgangsnivå, når et styreverv blir fjernet og en ny blir lagt til, så skal tilgange endres for å passe til det mye styremedlemmet (det er alltid en med person per styrerolle). Det skal være mulig å endre hvilke sider som de forskjellige styrerollene har tilgang til i tillegg til å endre på enkeltpersoner sine tilganger.