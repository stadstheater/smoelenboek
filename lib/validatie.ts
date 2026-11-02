import { DAGEN, type Afdeling, type AfdelingInvoer, type Dag, type Persoon, type PersoonInvoer, type Smoelenboek, type Zoekwoord } from "@/lib/types";

const DAG_CODES = new Set<string>(DAGEN.map((d) => d.code));

function tekst(waarde: unknown, max = 400): string | null {
  if (typeof waarde !== "string" && typeof waarde !== "number") return null;
  const t = String(waarde).replace(/\s+/g, " ").trim().slice(0, max);
  return t || null;
}

function langeTekst(waarde: unknown, max = 2000): string | null {
  if (typeof waarde !== "string") return null;
  const t = waarde.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
  return t || null;
}

/** Lijst van losse woorden of zinnetjes, zonder dubbele (hoofdletterongevoelig) */
export function lijst(waarde: unknown, max = 40): string[] {
  const ruw = Array.isArray(waarde) ? waarde : typeof waarde === "string" ? waarde.split(/[,;\n]/) : [];
  const uit: string[] = [];
  const gezien = new Set<string>();
  for (const w of ruw) {
    const t = tekst(w, 80);
    if (!t || gezien.has(t.toLowerCase())) continue;
    gezien.add(t.toLowerCase());
    uit.push(t);
    if (uit.length >= max) break;
  }
  return uit;
}

function id(waarde: unknown): string | null {
  const t = tekst(waarde, 80);
  return t && /^[a-z0-9-]+$/i.test(t) ? t : null;
}

function email(waarde: unknown): string | null {
  const t = tekst(waarde, 200)?.toLowerCase().replace(/^mailto:/, "") ?? null;
  if (!t) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) throw new Error(`"${t}" is geen geldig e-mailadres.`);
  return t;
}

function telefoon(waarde: unknown): string | null {
  const t = tekst(waarde, 40);
  if (!t) return null;
  if (!/^[+\d][\d\s()./-]*$/.test(t)) throw new Error(`"${t}" is geen geldig telefoonnummer.`);
  return t.replace(/[–—]/g, " ").replace(/\s+/g, " ");
}

function datum(waarde: unknown): string | null {
  const t = tekst(waarde, 10);
  if (!t) return null;
  if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(t)) throw new Error("Vul de datum in als jjjj-mm-dd, jjjj-mm of jjjj.");
  return t;
}

function url(waarde: unknown): string | null {
  const t = tekst(waarde, 500);
  if (!t) return null;
  if (!/^https:\/\/\S+$/i.test(t)) throw new Error("Een foto-adres moet beginnen met https://");
  return t;
}

export function werkdagen(waarde: unknown): Dag[] {
  const ruw = Array.isArray(waarde) ? waarde : typeof waarde === "string" ? waarde.split(/[,;\s]+/) : [];
  const set = new Set(ruw.map((d) => String(d).trim().toLowerCase().slice(0, 2)).filter((d) => DAG_CODES.has(d)));
  return DAGEN.map((d) => d.code).filter((d) => set.has(d));
}

function getal(waarde: unknown, standaard: number) {
  const n = Number(waarde);
  return Number.isFinite(n) ? Math.round(n) : standaard;
}

/** Alles wat een formulier of import aanlevert, netjes en veilig gemaakt */
export function schoonPersoon(invoer: Record<string, unknown>): PersoonInvoer {
  const naam = tekst(invoer.naam, 120);
  if (!naam) throw new Error("Vul een naam in.");
  const fotoPad = tekst(invoer.foto_pad, 300);
  return {
    slug: tekst(invoer.slug, 80) ?? "",
    naam,
    functie: tekst(invoer.functie, 160) ?? "",
    afdeling_id: id(invoer.afdeling_id),
    extra_afdeling_ids: lijst(invoer.extra_afdeling_ids, 10).filter((x) => id(x)),
    leidinggevende_id: id(invoer.leidinggevende_id),
    foto_pad: fotoPad && fotoPad.startsWith("fotos/") && !fotoPad.includes("..") ? fotoPad : null,
    foto_url: url(invoer.foto_url),
    email: email(invoer.email),
    telefoon: telefoon(invoer.telefoon),
    mobiel: telefoon(invoer.mobiel),
    werkdagen: werkdagen(invoer.werkdagen),
    werkplek: tekst(invoer.werkplek, 120),
    trefwoorden: lijst(invoer.trefwoorden),
    over_mij: langeTekst(invoer.over_mij),
    in_dienst_sinds: datum(invoer.in_dienst_sinds),
    talen: lijst(invoer.talen, 12),
    volgorde: getal(invoer.volgorde, 999),
    zichtbaar: invoer.zichtbaar !== false && invoer.zichtbaar !== "false",
  };
}

export function schoonAfdeling(invoer: Record<string, unknown>): AfdelingInvoer {
  const naam = tekst(invoer.naam, 120);
  if (!naam) throw new Error("Vul een naam voor de afdeling in.");
  return {
    slug: tekst(invoer.slug, 80) ?? "",
    naam,
    beschrijving: langeTekst(invoer.beschrijving, 600),
    parent_id: id(invoer.parent_id),
    hoofd_id: id(invoer.hoofd_id),
    volgorde: getal(invoer.volgorde, 999),
    soort: invoer.soort === "toezicht" ? "toezicht" : "organisatie",
    trefwoorden: lijst(invoer.trefwoorden, 60),
  };
}

export function schoonZoekwoorden(groepen: unknown): Zoekwoord[] {
  if (!Array.isArray(groepen)) throw new Error("Ongeldige zoekwoorden.");
  return groepen
    .map((g, i) => ({
      id: id((g as Zoekwoord)?.id) ?? `zw-${Date.now().toString(36)}-${i}`,
      woorden: lijst(Array.isArray(g) ? g : (g as Zoekwoord)?.woorden, 30),
    }))
    .filter((g) => g.woorden.length >= 2)
    .slice(0, 500);
}

/** Controleert een back-up voordat hij teruggezet wordt; verwijzingen die nergens heen wijzen worden leeg */
export function controleerBackup(data: unknown): Smoelenboek {
  const d = data as Partial<Smoelenboek> | null;
  if (!d || typeof d !== "object" || !Array.isArray(d.personen) || !Array.isArray(d.afdelingen)) {
    throw new Error("Dit is geen back-up van het smoelenboek.");
  }
  const afdelingen: Afdeling[] = d.afdelingen.map((a, i) => {
    const schoon = schoonAfdeling(a as Record<string, unknown>);
    return { ...schoon, id: id((a as Afdeling).id) ?? `afd-${i + 1}`, slug: schoon.slug || `afdeling-${i + 1}` };
  });
  const personen: Persoon[] = d.personen.map((p, i) => {
    const schoon = schoonPersoon(p as Record<string, unknown>);
    return {
      ...schoon,
      id: id((p as Persoon).id) ?? `p-${i + 1}`,
      slug: schoon.slug || `persoon-${i + 1}`,
      bijgewerkt_op: tekst((p as Persoon).bijgewerkt_op, 40) ?? new Date().toISOString(),
    };
  });
  const afdIds = new Set(afdelingen.map((a) => a.id));
  const persIds = new Set(personen.map((p) => p.id));
  if (afdIds.size !== afdelingen.length || persIds.size !== personen.length) throw new Error("De back-up bevat dubbele id's.");
  for (const a of afdelingen) {
    if (a.parent_id && !afdIds.has(a.parent_id)) a.parent_id = null;
    if (a.hoofd_id && !persIds.has(a.hoofd_id)) a.hoofd_id = null;
  }
  for (const p of personen) {
    if (p.afdeling_id && !afdIds.has(p.afdeling_id)) p.afdeling_id = null;
    p.extra_afdeling_ids = p.extra_afdeling_ids.filter((x) => afdIds.has(x) && x !== p.afdeling_id);
    if (p.leidinggevende_id && !persIds.has(p.leidinggevende_id)) p.leidinggevende_id = null;
  }
  return { versie: 1, afdelingen, personen, zoekwoorden: schoonZoekwoorden(d.zoekwoorden ?? []) };
}
