import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { CSV_KOLOMMEN, maakCsv } from "@/lib/csv";
import { fotoAdressen } from "@/lib/foto";
import { bovenliggendeMaaktRondje, leidinggevendeMaaktRondje } from "@/lib/hierarchie";
import { lees as leesOpslag, verwijderBestanden, wijzig, type Opslag } from "@/lib/opslag";
import { uniekeSlug } from "@/lib/slug";
import { DAGEN, type Afdeling, type AfdelingInvoer, type Gegevens, type Persoon, type PersoonInvoer, type Smoelenboek } from "@/lib/types";
import { controleerBackup, lijst, schoonAfdeling, schoonPersoon, schoonZoekwoorden, werkdagen } from "@/lib/validatie";
import { normaliseer } from "@/lib/zoeken/normaliseer";

/** Eén keer lezen per verzoek, ook als meerdere onderdelen de gegevens nodig hebben */
const lees = cache(leesOpslag);

export const haalGegevens = cache(async (): Promise<Gegevens> => {
  await connection();
  const data = await lees();
  return {
    afdelingen: [...data.afdelingen].sort((a, b) => a.volgorde - b.volgorde || a.naam.localeCompare(b.naam, "nl")),
    personen: data.personen.map((p) => ({ ...p, ...fotoAdressen(p) })),
    zoekwoorden: data.zoekwoorden,
  };
});

export async function haalRuw(): Promise<Smoelenboek> {
  await connection();
  return lees();
}

function zoekPersoon(data: Opslag, id: string) {
  const p = data.personen.find((x) => x.id === id);
  if (!p) throw new Error("Deze persoon bestaat niet (meer).");
  return p;
}

function zoekAfdeling(data: Opslag, id: string) {
  const a = data.afdelingen.find((x) => x.id === id);
  if (!a) throw new Error("Deze afdeling bestaat niet (meer).");
  return a;
}

function nieuwId(voorvoegsel: string) {
  return `${voorvoegsel}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Controleert verwijzingen van een persoon tegen de huidige gegevens */
function controleerPersoon(data: Opslag, invoer: PersoonInvoer, id: string | undefined) {
  if (invoer.afdeling_id) zoekAfdeling(data, invoer.afdeling_id);
  invoer.extra_afdeling_ids = invoer.extra_afdeling_ids.filter((a) => a !== invoer.afdeling_id && data.afdelingen.some((x) => x.id === a));
  if (invoer.leidinggevende_id) {
    zoekPersoon(data, invoer.leidinggevende_id);
    if (id && leidinggevendeMaaktRondje(data.personen, id, invoer.leidinggevende_id)) {
      throw new Error("Dan zou iemand indirect zijn eigen leidinggevende worden. Kies een andere leidinggevende.");
    }
    if (invoer.leidinggevende_id === id) throw new Error("Iemand kan niet zijn eigen leidinggevende zijn.");
  }
}

// ---------- Personen ----------

export async function slaPersoonOp(ruw: Record<string, unknown>, id?: string): Promise<Persoon> {
  const invoer = schoonPersoon(ruw);
  let weg: string | null = null;
  const resultaat = await wijzig((data) => {
    weg = null;
    controleerPersoon(data, invoer, id);
    const anderen = data.personen.filter((p) => p.id !== id).map((p) => p.slug);
    const slug = uniekeSlug(invoer.slug || invoer.naam, anderen);
    const nu = new Date().toISOString();
    if (id) {
      const p = zoekPersoon(data, id);
      if (p.foto_pad && p.foto_pad !== invoer.foto_pad) weg = p.foto_pad;
      Object.assign(p, invoer, { slug, bijgewerkt_op: nu });
      return { ...p };
    }
    const nieuw: Persoon = { ...invoer, id: nieuwId("p"), slug, bijgewerkt_op: nu };
    if (nieuw.volgorde === 999) nieuw.volgorde = Math.max(0, ...data.personen.map((p) => p.volgorde)) + 1;
    data.personen.push(nieuw);
    return { ...nieuw };
  });
  await verwijderBestanden([weg]);
  return resultaat;
}

export async function verwijderPersoon(id: string) {
  const foto = await wijzig((data) => {
    const p = zoekPersoon(data, id);
    data.personen = data.personen.filter((x) => x.id !== id);
    // Het team schuift door naar de leidinggevende van wie vertrekt
    for (const x of data.personen) if (x.leidinggevende_id === id) x.leidinggevende_id = p.leidinggevende_id;
    for (const a of data.afdelingen) if (a.hoofd_id === id) a.hoofd_id = null;
    return p.foto_pad;
  });
  await verwijderBestanden([foto]);
}

/** Wijzigingen vanuit het tabblad Structuur: leidinggevende, afdeling of zichtbaarheid */
export async function wijzigPlaats(
  id: string,
  wijziging: { leidinggevende_id?: string | null; afdeling_id?: string | null; zichtbaar?: boolean },
) {
  await wijzig((data) => {
    const p = zoekPersoon(data, id);
    if (wijziging.leidinggevende_id !== undefined) {
      const nieuw = wijziging.leidinggevende_id || null;
      if (nieuw) zoekPersoon(data, nieuw);
      if (nieuw === id || leidinggevendeMaaktRondje(data.personen, id, nieuw)) {
        throw new Error("Dan zou iemand indirect zijn eigen leidinggevende worden.");
      }
      p.leidinggevende_id = nieuw;
    }
    if (wijziging.afdeling_id !== undefined) {
      const nieuw = wijziging.afdeling_id || null;
      if (nieuw) zoekAfdeling(data, nieuw);
      p.afdeling_id = nieuw;
      p.extra_afdeling_ids = p.extra_afdeling_ids.filter((a) => a !== nieuw);
    }
    if (wijziging.zichtbaar !== undefined) p.zichtbaar = wijziging.zichtbaar;
    p.bijgewerkt_op = new Date().toISOString();
  });
}

/** Zet de volgorde van een groep personen of afdelingen zoals de lijst aangeeft */
export async function zetVolgorde(soort: "personen" | "afdelingen", ids: string[]) {
  await wijzig((data) => {
    const lijst: { id: string; volgorde: number }[] = soort === "personen" ? data.personen : data.afdelingen;
    // De groep houdt de plekken die hij al had, alleen in een nieuwe volgorde
    const plekken = ids
      .map((id) => lijst.find((x) => x.id === id)?.volgorde)
      .filter((v): v is number => v !== undefined)
      .sort((a, b) => a - b);
    const uniek = plekken.every((v, i) => i === 0 || v !== plekken[i - 1]);
    ids.forEach((id, i) => {
      const x = lijst.find((y) => y.id === id);
      if (x) x.volgorde = uniek ? plekken[i] : (plekken[0] ?? 0) + i;
    });
  });
}

// ---------- Afdelingen ----------

export async function slaAfdelingOp(ruw: Record<string, unknown>, id?: string): Promise<Afdeling> {
  const invoer: AfdelingInvoer = schoonAfdeling(ruw);
  return wijzig((data) => {
    if (invoer.parent_id) {
      zoekAfdeling(data, invoer.parent_id);
      if (id && bovenliggendeMaaktRondje(data.afdelingen, id, invoer.parent_id)) {
        throw new Error("Een afdeling kan niet onder zichzelf of onder een eigen subafdeling vallen.");
      }
    }
    if (invoer.hoofd_id) zoekPersoon(data, invoer.hoofd_id);
    const slug = uniekeSlug(invoer.slug || invoer.naam, data.afdelingen.filter((a) => a.id !== id).map((a) => a.slug));
    if (id) {
      const a = zoekAfdeling(data, id);
      Object.assign(a, invoer, { slug });
      return { ...a };
    }
    const nieuw: Afdeling = { ...invoer, id: nieuwId("afd"), slug };
    if (nieuw.volgorde === 999) nieuw.volgorde = Math.max(0, ...data.afdelingen.map((a) => a.volgorde)) + 1;
    data.afdelingen.push(nieuw);
    return { ...nieuw };
  });
}

export async function verwijderAfdeling(id: string) {
  await wijzig((data) => {
    const a = zoekAfdeling(data, id);
    data.afdelingen = data.afdelingen.filter((x) => x.id !== id);
    for (const sub of data.afdelingen) if (sub.parent_id === id) sub.parent_id = a.parent_id;
    for (const p of data.personen) {
      if (p.afdeling_id === id) p.afdeling_id = null;
      p.extra_afdeling_ids = p.extra_afdeling_ids.filter((x) => x !== id);
    }
  });
}

// ---------- Zoekwoorden ----------

export async function slaZoekwoordenOp(groepen: unknown) {
  const schoon = schoonZoekwoorden(groepen);
  await wijzig((data) => {
    data.zoekwoorden = schoon;
  });
}

// ---------- Back-up, export en import ----------

export async function zetBackupTerug(json: unknown) {
  const nieuw = controleerBackup(json);
  const weg = await wijzig((data) => {
    const oudeFotos = data.personen.map((p) => p.foto_pad).filter((x): x is string => !!x);
    const nieuweFotos = new Set(nieuw.personen.map((p) => p.foto_pad));
    data.afdelingen = nieuw.afdelingen;
    data.personen = nieuw.personen;
    data.zoekwoorden = nieuw.zoekwoorden;
    return oudeFotos.filter((f) => !nieuweFotos.has(f));
  });
  await verwijderBestanden(weg);
}

export async function exportCsv() {
  const data = await haalRuw();
  const afd = new Map(data.afdelingen.map((a) => [a.id, a.naam]));
  const pers = new Map(data.personen.map((p) => [p.id, p.naam]));
  const dagen = new Map(DAGEN.map((d) => [d.code, d.lang]));
  const rijen = [...data.personen]
    .sort((a, b) => a.naam.localeCompare(b.naam, "nl"))
    .map((p) => [
      p.naam,
      p.functie,
      p.afdeling_id ? afd.get(p.afdeling_id) : "",
      p.extra_afdeling_ids.map((x) => afd.get(x)).filter(Boolean).join(", "),
      p.leidinggevende_id ? pers.get(p.leidinggevende_id) : "",
      p.email,
      p.telefoon,
      p.mobiel,
      p.werkdagen.map((d) => dagen.get(d)).join(", "),
      p.werkplek,
      p.trefwoorden.join(", "),
      p.talen.join(", "),
      p.in_dienst_sinds,
      p.over_mij,
      p.zichtbaar ? "ja" : "nee",
    ]);
  return maakCsv(CSV_KOLOMMEN, rijen);
}

export type ImportVoorstel = {
  nieuw: { naam: string; functie: string; afdeling: string }[];
  bijgewerkt: { naam: string; velden: string[] }[];
  nieuweAfdelingen: string[];
  fouten: string[];
};

const VELD_ALIASSEN: Record<string, string[]> = {
  naam: ["naam", "name", "volledige_naam"],
  functie: ["functie", "functietitel", "functie_titel", "rol", "titel"],
  afdeling: ["afdeling", "team", "afdelingsnaam"],
  extra_afdelingen: ["extra_afdelingen", "ook_in"],
  leidinggevende: ["leidinggevende", "manager", "valt_onder"],
  email: ["email", "e_mail", "e_mailadres", "emailadres", "mail"],
  telefoon: ["telefoon", "telefoonnummer", "tel", "vast"],
  mobiel: ["mobiel", "mobiel_nummer", "gsm", "06"],
  werkdagen: ["werkdagen", "dagen"],
  werkplek: ["werkplek", "locatie", "kantoor"],
  trefwoorden: ["trefwoorden", "expertise", "waarvoor_kun_je_bij_mij_terecht"],
  talen: ["talen", "taal"],
  in_dienst_sinds: ["in_dienst_sinds", "in_dienst", "startdatum"],
  over_mij: ["over_mij", "bio", "omschrijving"],
  zichtbaar: ["zichtbaar"],
};

function veld(rij: Record<string, string>, naam: string) {
  for (const sleutel of VELD_ALIASSEN[naam] ?? [naam]) if (rij[sleutel] !== undefined && rij[sleutel] !== "") return rij[sleutel];
  return undefined;
}

const DAG_NAAR_CODE = new Map(DAGEN.flatMap((d) => [[d.lang, d.code] as const, [d.code, d.code] as const]));

/**
 * Importeert rijen uit een CSV. Bestaande mensen worden herkend aan hun naam, of aan hun e-mailadres als
 * dat adres maar bij één persoon hoort (dus niet servicebalie@). Lege cellen laten bestaande gegevens staan.
 * Met uitvoeren=false wordt er niets opgeslagen en krijg je alleen het voorstel.
 */
export async function importeer(rijen: Record<string, string>[], uitvoeren: boolean): Promise<ImportVoorstel> {
  const voorstel: ImportVoorstel = { nieuw: [], bijgewerkt: [], nieuweAfdelingen: [], fouten: [] };
  const verwerk = (data: Opslag) => {
    voorstel.nieuw = [];
    voorstel.bijgewerkt = [];
    voorstel.nieuweAfdelingen = [];
    voorstel.fouten = [];
    const opNaam = <T extends { naam: string }>(lijst: T[], naam: string) => lijst.find((x) => normaliseer(x.naam) === normaliseer(naam));
    const afdelingVoor = (naam: string | undefined) => {
      if (!naam) return undefined;
      const bestaand = opNaam(data.afdelingen, naam);
      if (bestaand) return bestaand.id;
      const nieuw: Afdeling = {
        id: nieuwId("afd"),
        slug: uniekeSlug(naam, data.afdelingen.map((a) => a.slug)),
        naam: naam.trim(),
        beschrijving: null,
        parent_id: null,
        hoofd_id: null,
        volgorde: Math.max(0, ...data.afdelingen.map((a) => a.volgorde)) + 1,
        soort: "organisatie",
        trefwoorden: [],
      };
      data.afdelingen.push(nieuw);
      voorstel.nieuweAfdelingen.push(nieuw.naam);
      return nieuw.id;
    };
    const emailTelling = new Map<string, number>();
    for (const p of data.personen) if (p.email) emailTelling.set(p.email, (emailTelling.get(p.email) ?? 0) + 1);

    const leidinggevenden: [Persoon, string][] = [];
    rijen.forEach((rij, i) => {
      const regel = i + 2;
      const naam = veld(rij, "naam");
      if (!naam) {
        voorstel.fouten.push(`Regel ${regel}: geen naam, overgeslagen.`);
        return;
      }
      const email = veld(rij, "email")?.toLowerCase();
      const bestaand =
        opNaam(data.personen, naam) ?? (email && emailTelling.get(email) === 1 ? data.personen.find((p) => p.email === email) : undefined);
      const wijziging: Record<string, unknown> = {};
      const zet = (sleutel: string, waarde: unknown) => {
        if (waarde !== undefined) wijziging[sleutel] = waarde;
      };
      zet("functie", veld(rij, "functie"));
      zet("email", email);
      zet("telefoon", veld(rij, "telefoon"));
      zet("mobiel", veld(rij, "mobiel"));
      zet("werkplek", veld(rij, "werkplek"));
      zet("over_mij", veld(rij, "over_mij"));
      zet("in_dienst_sinds", veld(rij, "in_dienst_sinds"));
      const dagen = veld(rij, "werkdagen");
      if (dagen) zet("werkdagen", werkdagen(lijst(dagen).map((d) => DAG_NAAR_CODE.get(d.toLowerCase()) ?? d)));
      const tref = veld(rij, "trefwoorden");
      if (tref) zet("trefwoorden", lijst(tref));
      const talen = veld(rij, "talen");
      if (talen) zet("talen", lijst(talen));
      const zichtbaar = veld(rij, "zichtbaar");
      if (zichtbaar) zet("zichtbaar", !/^(nee|no|0|false|verborgen)$/i.test(zichtbaar));
      const afdelingId = afdelingVoor(veld(rij, "afdeling"));
      if (afdelingId) zet("afdeling_id", afdelingId);
      const extra = veld(rij, "extra_afdelingen");
      if (extra) zet("extra_afdeling_ids", lijst(extra).map((n) => afdelingVoor(n)).filter(Boolean));

      try {
        if (bestaand) {
          const velden = Object.keys(wijziging).filter((k) => JSON.stringify(wijziging[k]) !== JSON.stringify((bestaand as Record<string, unknown>)[k]));
          const schoon = schoonPersoon({ ...bestaand, ...wijziging });
          if (velden.length) {
            Object.assign(bestaand, schoon, { slug: bestaand.slug, bijgewerkt_op: new Date().toISOString() });
            voorstel.bijgewerkt.push({ naam: bestaand.naam, velden });
          }
          const lg = veld(rij, "leidinggevende");
          if (lg) leidinggevenden.push([bestaand, lg]);
        } else {
          const schoon = schoonPersoon({ naam, functie: "", ...wijziging });
          const nieuw: Persoon = {
            ...schoon,
            id: nieuwId("p"),
            slug: uniekeSlug(naam, data.personen.map((p) => p.slug)),
            volgorde: Math.max(0, ...data.personen.map((p) => p.volgorde)) + 1,
            bijgewerkt_op: new Date().toISOString(),
          };
          data.personen.push(nieuw);
          voorstel.nieuw.push({
            naam: nieuw.naam,
            functie: nieuw.functie,
            afdeling: data.afdelingen.find((a) => a.id === nieuw.afdeling_id)?.naam ?? "",
          });
          const lg = veld(rij, "leidinggevende");
          if (lg) leidinggevenden.push([nieuw, lg]);
        }
      } catch (e) {
        voorstel.fouten.push(`Regel ${regel} (${naam}): ${e instanceof Error ? e.message : "onbekende fout"}`);
      }
    });

    // Leidinggevenden pas na alle rijen, zodat ze ook naar nieuwe mensen kunnen wijzen
    for (const [p, naam] of leidinggevenden) {
      const lg = opNaam(data.personen, naam);
      if (!lg) voorstel.fouten.push(`${p.naam}: leidinggevende "${naam}" niet gevonden.`);
      else if (lg.id === p.id || leidinggevendeMaaktRondje(data.personen, p.id, lg.id)) voorstel.fouten.push(`${p.naam}: "${naam}" als leidinggevende maakt een rondje.`);
      else if (p.leidinggevende_id !== lg.id) {
        p.leidinggevende_id = lg.id;
        const bij = voorstel.bijgewerkt.find((b) => b.naam === p.naam);
        if (bij) bij.velden.push("leidinggevende");
        else if (!voorstel.nieuw.some((n) => n.naam === p.naam)) voorstel.bijgewerkt.push({ naam: p.naam, velden: ["leidinggevende"] });
      }
    }
  };

  if (uitvoeren) await wijzig(verwerk);
  else verwerk(structuredClone(await leesOpslag()));
  return voorstel;
}
