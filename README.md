# Smoelenboek van het Stadstheater

Intern smoelenboek van Stadstheater Zoetermeer: wie is wie en bij wie moet je zijn voor wat. Bedoeld voor smoelenboek.stadstheater.app.

**Stack:** Claude Code › GitHub › Vercel (Next.js 16, Tailwind CSS 4, Vercel Blob). Dezelfde opzet en huisstijl als [tools.stadstheater.app](https://tools.stadstheater.app).

## Wat zit erin

- **Smoelenboek**: iedereen per afdeling (het hoofd eerst) of van A tot Z, met foto, naam en functie. Filteren op afdeling via de chips of de zijbalk. De Raad van Toezicht staat apart onderaan.
- **Pop-up per persoon** (deelbaar via `?p=naam`): foto, functie, afdeling, waarvoor je bij iemand terecht kunt, contact (mailen, Teams-chat, bellen, e-mail kopiëren), werkdagen, over mij, in dienst sinds, talen, leidinggevende, team en collega's. Bladeren met ← en →, sluiten met Esc.
- **Zoeken in de topbalk** (Ctrl K of /): direct bij elke toets, met uitleg waarom iemand gevonden is. Zie hieronder.
- **Zoekpagina** (`/zoeken`) met alle resultaten, filters op afdeling en werkdag plus de afdelingen die passen.
- **Organigram**: de structuur vanaf de directeur, met de Raad van Toezicht erboven. Teams klap je in en uit.
- **Beheer** achter een pincode:
  - Medewerkers toevoegen, bewerken, verbergen en verwijderen, met foto-upload (wordt automatisch vierkant) en een live voorbeeld
  - Afdelingen met hoofd, subafdelingen, volgorde en trefwoorden
  - Structuur: per persoon afdeling, leidinggevende en volgorde, met controle op rondjes en een lijst aandachtspunten
  - Zoekwoorden: woorden die hetzelfde betekenen, met een testveld
  - Import en export: Excel (CSV) exporteren en importeren met eerst een voorstel. Daarnaast een volledige back-up (JSON) downloaden en terugzetten
- **Licht en donker thema** uit de huisstijl, gedeeld met alle apps op stadstheater.app (map `thema/`).

## Zo werkt het zoeken

Alles draait in de browser, zonder AI en zonder externe dienst. Per persoon kijkt het naar naam, functie, trefwoorden ("waarvoor kun je bij mij terecht"), afdeling en de trefwoorden van de afdeling, e-mail, telefoon, werkplek, over mij en talen. Elk veld heeft een eigen gewicht.

- **Hele vragen** mogen: "Bij wie moet ik zijn voor een bedrijfsborrel?" Vraagwoorden en vulwoorden vallen weg.
- **Typfouten**: "charels" vindt Charles, "vrijwiligerz" vindt vrijwilligers.
- **Accenten** maken niet uit: "leon" vindt Léon.
- **Stukjes van woorden**: "huur" vindt zaalhuur, "bedrijfsborrel" vindt borrel. Aan elkaar getypte namen ("vanderploeg") werken ook.
- **Zoekwoorden** (synoniemen) uit het beheer: "kaartjes" vindt ook tickets en kaartverkoop, "laptop" vindt ICT.
- **Initialen** ("cd") en **stukjes van een telefoonnummer** ("7060").
- **Filters**: `afdeling:techniek`, `functie:manager`, `dag:vrijdag`, `"online marketing"` (letterlijk) en `-stagiaire` (uitsluiten).
- Wie alle zoekwoorden raakt, staat bovenaan. Loopt een match via de afdeling, dan komt het hoofd eerst. Vindt het niemand, dan stelt het een correctie voor en toont het welke afdeling past.

De beste resultaten krijg je door per persoon goede trefwoorden in te vullen. Denk aan wat collega's zouden typen.

## Live zetten op Vercel

1. **Project**: in team STZ het project `smoelenboek` koppelen aan de repo `stadstheater/smoelenboek`. Vercel herkent Next.js zelf.
2. **Opslag**: Storage > Create > Blob, kies **Private** en koppel de store aan het project. Vercel zet `BLOB_STORE_ID` en `BLOB_WEBHOOK_PUBLIC_KEY` dan zelf.
3. **Omgevingsvariabelen** (Settings > Environment Variables), zie ook `.env.example`:
   - `APP_WACHTWOORD`: het wachtwoord voor het hele team. Zonder deze variabele blijft de app dicht.
   - `BEHEER_PINCODE`: de pincode voor het beheer, liefst 6 cijfers of meer. Zonder pincode is het beheer dicht.
4. **Vercel Authentication uitzetten** (Settings > Deployment Protection). De app heeft een eigen wachtwoord; anders heeft iedere collega een Vercel-account nodig.
5. **Domein**: `smoelenboek.stadstheater.app` toevoegen bij Settings > Domains.
6. **Opnieuw deployen**, zodat alle variabelen actief zijn.

Bij het eerste bezoek staat de organisatie van [stadstheater.nl/over-ons/organisatie](https://stadstheater.nl/over-ons/organisatie/) erin: 27 mensen in 10 afdelingen, met de foto's van de website. Hoofden, leidinggevenden en trefwoorden zijn een voorstel op basis van de functietitels: controleer ze in Beheer, Structuur.

## Lokaal draaien

```bash
npm install
npm run dev
```

Zonder `BLOB_STORE_ID` (of `BLOB_READ_WRITE_TOKEN`) draait de app in **demomodus** met de startdata in het geheugen. Zonder `APP_WACHTWOORD` is er lokaal geen inlogscherm en is de pincode `1234`. Echte gegevens lokaal: `vercel env pull`.

Testen: `npm test` (zoeken, hiërarchie, import en validatie), `npm run lint` en `npm run build`.

## Goed om te weten

- **Wachtwoord of pincode wijzigen**: pas de variabele aan in Vercel en deploy opnieuw. Iedereen moet dan opnieuw inloggen. Een sessie blijft 30 dagen geldig, het beheer 12 uur.
- **Pincode raden**: na 5 foute pogingen is de pincode 15 minuten dicht voor dat adres.
- **Gedeelde mailadressen** (servicebalie@, sales@) krijgen geen Teams-knop; persoonlijke adressen wel.
- **Tegelijk bewerken**: als twee beheerders tegelijk iets wijzigen, blijven beide wijzigingen bewaard.
- **Iemand vertrekt**: verwijder de persoon, of zet "Zichtbaar" uit om de gegevens te bewaren. Bij verwijderen schuift het team door naar de leidinggevende van wie vertrekt.
- **Foto's**: geüploade foto's staan privé in Vercel Blob en zijn alleen te zien met het wachtwoord. Foto's van de startdata komen van stadstheater.nl.

## Structuur

```
app/(app)/               smoelenboek, organigram, zoeken en beheer
app/actions.ts           inloggen, pincode en alle wijzigingen (server-acties)
app/api/foto/            geüploade foto's, achter het wachtwoord
app/api/upload/          ondertekende links om foto's direct naar Vercel Blob te uploaden (alleen beheer)
app/api/export/          CSV en JSON-back-up (alleen beheer)
components/shell/        zijbalk, topbalk met zoekveld, mobiele navigatie, pincode, meldingen
components/beheer/       formulieren en schermen van het beheer
lib/zoeken/              de zoekmachine: normaliseren, zoekregel lezen, scoren, standaard zoekwoorden
lib/data.ts              alle bewerkingen op personen, afdelingen en zoekwoorden
lib/opslag.ts            gegevens in Vercel Blob (data/smoelenboek.json), met bescherming tegen gelijktijdig schrijven
lib/startdata.ts         eerste vulling uit stadstheater.nl
lib/hierarchie.ts        organigram, team, keten en controle op rondjes
proxy.ts                 wachtwoord voor alles, pincode voor /beheer
thema/                   licht en donker thema in de huisstijl
tests/                   vitest
```
