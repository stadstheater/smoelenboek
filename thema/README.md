# Thema: licht en donker

Herbruikbaar licht en donker thema in de huisstijl van Stadstheater Zoetermeer (design system "Stadstheater Zoetermeer", Huisstijl Handboek 2025). Kopieer deze map naar een ander project en de keuze van de gebruiker wordt in een cookie bewaard.

## Wat zit erin

| Bestand | Wat |
| --- | --- |
| `thema.css` | Alle kleuren als CSS-variabelen (`--stz-...`), voor licht en donker. Werkt in elk project, ook zonder Tailwind. |
| `tailwind.css` | Koppeling met Tailwind CSS 4: `bg-vlak`, `text-inkt`, `border-sluier/10`, `text-actie` enzovoort, plus de varianten `licht:` en `donker:`. |
| `thema.ts` | Cookienaam, het script voor in `<head>`, `huidigThema()` en `zetThema()`. |
| `ThemaScript.tsx` | Het script als React-component voor de root-layout. |
| `ThemaKnop.tsx` | Knop met zon en maan om te wisselen. Zonder extra pakketten. |

## Hoe het werkt

- De keuze staat een jaar in de cookie `stz_thema` (`licht` of `donker`).
- Op `stadstheater.app` en alle subdomeinen geldt de cookie voor het hele domein. Kies je licht in de ene app, dan staat de andere app ook op licht.
- Zonder cookie volgt de pagina de systeeminstelling van de computer of telefoon.
- Een klein script in `<head>` zet `data-thema` op `<html>` voordat de pagina getekend wordt. Er is dus geen flits van het verkeerde thema.

## Installeren in een Next.js-project

1. Kopieer de map `thema/` naar de root van het project en de twee logo's naar `public/`.
2. In `app/globals.css`, direct na Tailwind:

   ```css
   @import "tailwindcss";
   @import "../thema/thema.css";
   @import "../thema/tailwind.css";

   html,
   body {
     background: var(--stz-vlak);
     color: var(--stz-inkt);
   }
   ```

3. In `app/layout.tsx`:

   ```tsx
   import { ThemaScript } from "@/thema/ThemaScript";

   <html lang="nl" suppressHydrationWarning>
     <head>
       <ThemaScript />
     </head>
     <body>{children}</body>
   </html>
   ```

   `suppressHydrationWarning` is nodig omdat het script `data-thema` op `<html>` zet voordat React laadt.

4. Zet de knop waar je hem wilt hebben, meestal in de topbalk:

   ```tsx
   import { ThemaKnop } from "@/thema/ThemaKnop";

   <ThemaKnop className="knop knop-ghost knop-icoon" />
   ```

## Installeren in een gewone HTML-pagina

Laad `thema.css` en zet het script uit `THEMA_SCRIPT` (in `thema.ts`) als inline `<script>` bovenaan in `<head>`. Een wisselknop:

```html
<button type="button" onclick="wissel()">Licht of donker</button>
<script>
  function wissel() {
    var thema = document.documentElement.dataset.thema === "licht" ? "donker" : "licht";
    document.documentElement.dataset.thema = thema;
    var domein = /(^|\.)stadstheater\.app$/.test(location.hostname) ? "; domain=stadstheater.app" : "";
    document.cookie = "stz_thema=" + thema + "; path=/; max-age=31536000; samesite=lax" + domein;
  }
</script>
```

## De kleuren

Gebruik in componenten altijd de rollen, nooit vaste kleurcodes. Dan klopt alles vanzelf in beide thema's.

| Rol | Donker | Licht | Gebruik |
| --- | --- | --- | --- |
| `vlak` | `#221c42` | `#ffffff` | Achtergrond van de pagina |
| `vlak-diep` | `#1a1534` | `#ffffff` | Zijbalk, panelen, menu's, meldingen |
| `vlak-kaart` | `#29205a` | `#ffffff` | Kaarten en tiles |
| `inkt` | `#ffffff` | `#221c42` (donker-paars) | Hoofdtekst |
| `inkt-2` | `#d6d4e2` | `#2c2558` (semi-donker-paars) | Labels, beschrijvingen |
| `inkt-3` | `#bbb4e4` | `#46398e` (basis-paars) | Ondertitels, menu, iconen |
| `inkt-4` | `#a29bcb` | `#5c538d` | Hulptekst |
| `inkt-5` | `#857eaa` | `#6a6396` | Placeholders, tellers |
| `kop` | `#ffffff` | `#46398e` (basis-paars) | Titels in Barlow Condensed |
| `sluier` | wit | basis-paars | Lijnen, hover-vlakken en randen, altijd met transparantie: `border-sluier/10` |
| `actie` | `#ed6e13` (oranje) | `#ad4d08` | Tekst en iconen die een actie zijn |
| `rood` | `#f0524f` | `#c4312e` | Offline, fouten |
| `groen` | `#3fc48a` | `#12784a` | Live, gelukt |

Daarnaast zijn de vaste huisstijlkleuren beschikbaar, die in beide thema's gelijk blijven: `basis-paars`, `medium-paars`, `licht-paars`, `semi-donker-paars`, `donker-paars`, `oranje`, `oranje-hover` en `geel`.

### Huisstijlregels in het licht thema

- `wit` als ondergrond, titels in `basis-paars`, logo in `basis-paars` op wit.
- Lijnen en hover-vlakken zijn tinten `basis-paars`, dicht bij `licht-paars`. Geen grijs.
- `oranje` alleen voor actie: knoppen, focusrand, actieve menukeuze. Geen decoratieve oranje gloed.
- Alle tekstkleuren halen minimaal 4,5:1 op wit. Oranje tekst haalt op wit maar 3,1:1; daarom is `actie` in het licht thema een donkerder oranje. Knoppen houden het echte oranje.
- Randen van invoervelden zijn `medium-paars` (3,2:1), zodat je ze goed ziet.

## Een stuk altijd donker of licht

Zet `data-thema` op een los element. Alles daarbinnen krijgt de kleuren van dat thema, ongeacht de pagina. Handig voor tekst op een foto of een vast donker beeldvlak:

```tsx
<span data-thema="donker" className="bg-vlak-diep/75">Live</span>
```

## Alleen in één thema tonen

`bij-licht` en `bij-donker` verbergen een element in het andere thema. Zo wissel je bijvoorbeeld het logo:

```tsx
<img src="/logo-stadstheater.svg" alt="Stadstheater Zoetermeer" className="bij-donker" />
<img src="/logo-stadstheater-paars.svg" alt="Stadstheater Zoetermeer" className="bij-licht" />
```

De twee logobestanden staan in `public/`: `logo-stadstheater.svg` (wit, voor donker) en `logo-stadstheater-paars.svg` (basis-paars, voor licht). Zet ze in de map `public/` van je project. Teken het logo nooit na en gebruik geen andere kleuren.

## Het thema op de server lezen

Het script regelt alles in de browser. Wil je het thema toch op de server weten, lees dan de cookie:

```ts
import { cookies } from "next/headers";
import { THEMA_COOKIE } from "@/thema/thema";

const thema = (await cookies()).get(THEMA_COOKIE)?.value; // "licht", "donker" of undefined
```
