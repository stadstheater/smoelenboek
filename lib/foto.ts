import type { Persoon } from "@/lib/types";

/** Geüploade foto's zijn privé en lopen via onze eigen route, achter het wachtwoord */
export function fotoRoute(pad: string) {
  return `/api/foto/${pad.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Een klein en een groot adres voor de foto. Bij foto's van stadstheater.nl (WordPress) gebruiken we
 * voor kaarten de versie van 300 pixels en voor de pop-up die van 768 pixels.
 */
export function fotoAdressen(p: Pick<Persoon, "foto_pad" | "foto_url">) {
  if (p.foto_pad) {
    const url = fotoRoute(p.foto_pad);
    return { foto_klein: url, foto_groot: url };
  }
  if (p.foto_url) {
    const wp = /^(https:\/\/stadstheater\.nl\/assets\/uploads\/.+?)-\d+x\d+(\.(?:jpe?g|png|webp))$/i.exec(p.foto_url);
    if (wp) return { foto_klein: `${wp[1]}-300x300${wp[2]}`, foto_groot: `${wp[1]}-768x768${wp[2]}` };
    return { foto_klein: p.foto_url, foto_groot: p.foto_url };
  }
  return { foto_klein: null, foto_groot: null };
}

/**
 * Is dit een persoonlijk adres? Een gedeeld adres als servicebalie@ of sales@ heeft geen Teams-account.
 * Persoonlijk als het deel voor de @ een stuk van de naam bevat (cdroste, lvangaalen, karin).
 */
export function persoonlijkAdres(email: string | null, naam: string) {
  if (!email) return false;
  const lokaal = email.split("@")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  const delen = naam
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z]+/)
    .filter((d) => d.length >= 3 && !["van", "der", "den", "de", "het", "ter", "ten"].includes(d));
  return delen.some((d) => lokaal.includes(d));
}
