import type { Afdeling, Persoon } from "@/lib/types";

type MetId = { id: string };
type PersoonLite = Pick<Persoon, "id" | "naam" | "leidinggevende_id" | "afdeling_id" | "volgorde" | "zichtbaar">;
type AfdelingLite = Pick<Afdeling, "id" | "naam" | "parent_id" | "volgorde" | "hoofd_id" | "soort">;

function opId<T extends MetId>(lijst: T[]) {
  return new Map(lijst.map((x) => [x.id, x]));
}

/** Zou "ouder" boven "kind" komen te staan terwijl kind al (indirect) boven ouder staat? Dan ontstaat een rondje. */
function maaktRondje(ouders: Map<string, string | null>, kind: string, nieuweOuder: string | null) {
  if (!nieuweOuder) return false;
  if (nieuweOuder === kind) return true;
  const gezien = new Set<string>();
  let huidig: string | null = nieuweOuder;
  while (huidig) {
    if (huidig === kind) return true;
    if (gezien.has(huidig)) return true;
    gezien.add(huidig);
    huidig = ouders.get(huidig) ?? null;
  }
  return false;
}

export function leidinggevendeMaaktRondje(personen: PersoonLite[], persoonId: string, leidinggevendeId: string | null) {
  return maaktRondje(new Map(personen.map((p) => [p.id, p.leidinggevende_id])), persoonId, leidinggevendeId);
}

export function bovenliggendeMaaktRondje(afdelingen: AfdelingLite[], afdelingId: string, parentId: string | null) {
  return maaktRondje(new Map(afdelingen.map((a) => [a.id, a.parent_id])), afdelingId, parentId);
}

/** Van direct leidinggevende tot de top */
export function keten<T extends PersoonLite>(personen: T[], persoonId: string): T[] {
  const index = opId(personen);
  const uit: T[] = [];
  const gezien = new Set<string>([persoonId]);
  let huidig = index.get(persoonId)?.leidinggevende_id ?? null;
  while (huidig && !gezien.has(huidig)) {
    const p = index.get(huidig);
    if (!p) break;
    uit.push(p);
    gezien.add(huidig);
    huidig = p.leidinggevende_id;
  }
  return uit;
}

export function sorteerPersonen<T extends Pick<Persoon, "volgorde" | "naam">>(lijst: T[]) {
  return [...lijst].sort((a, b) => a.volgorde - b.volgorde || a.naam.localeCompare(b.naam, "nl"));
}

/** Wie direct onder iemand valt */
export function team<T extends PersoonLite>(personen: T[], persoonId: string): T[] {
  return sorteerPersonen(personen.filter((p) => p.leidinggevende_id === persoonId && p.zichtbaar));
}

/** Leden van een afdeling: het hoofd eerst, daarna op volgorde en naam */
export function ledenVan<T extends PersoonLite & Pick<Persoon, "extra_afdeling_ids">>(
  afdeling: Pick<Afdeling, "id" | "hoofd_id">,
  personen: T[],
  metExtra = true,
): T[] {
  const leden = personen.filter(
    (p) => p.zichtbaar && (p.afdeling_id === afdeling.id || (metExtra && p.extra_afdeling_ids.includes(afdeling.id))),
  );
  return sorteerPersonen(leden).sort((a, b) => Number(b.id === afdeling.hoofd_id) - Number(a.id === afdeling.hoofd_id));
}

export type AfdelingInBoom<T> = { afdeling: T; diepte: number };

/** Afdelingen in boomvolgorde: eerst de bovenste, daaronder hun subafdelingen */
export function afdelingenInVolgorde<T extends AfdelingLite>(afdelingen: T[]): AfdelingInBoom<T>[] {
  const ids = new Set(afdelingen.map((a) => a.id));
  const kinderen = new Map<string | null, T[]>();
  for (const a of afdelingen) {
    const ouder = a.parent_id && ids.has(a.parent_id) ? a.parent_id : null;
    kinderen.set(ouder, [...(kinderen.get(ouder) ?? []), a]);
  }
  for (const lijst of kinderen.values()) lijst.sort((a, b) => a.volgorde - b.volgorde || a.naam.localeCompare(b.naam, "nl"));
  const uit: AfdelingInBoom<T>[] = [];
  const gezien = new Set<string>();
  function loop(ouder: string | null, diepte: number) {
    for (const a of kinderen.get(ouder) ?? []) {
      if (gezien.has(a.id)) continue;
      gezien.add(a.id);
      uit.push({ afdeling: a, diepte });
      loop(a.id, diepte + 1);
    }
  }
  loop(null, 0);
  // Afdelingen in een rondje (zou niet mogen) toch tonen
  for (const a of afdelingen) if (!gezien.has(a.id)) uit.push({ afdeling: a, diepte: 0 });
  return uit;
}

export type Knoop<T> = { persoon: T; kinderen: Knoop<T>[] };

/** Organigram: bomen vanaf wie geen (bekende) leidinggevende heeft */
export function organigram<T extends PersoonLite>(personen: T[]): Knoop<T>[] {
  const zichtbaar = personen.filter((p) => p.zichtbaar);
  const ids = new Set(zichtbaar.map((p) => p.id));
  const onder = new Map<string | null, T[]>();
  for (const p of zichtbaar) {
    const ouder = p.leidinggevende_id && ids.has(p.leidinggevende_id) ? p.leidinggevende_id : null;
    onder.set(ouder, [...(onder.get(ouder) ?? []), p]);
  }
  const gezien = new Set<string>();
  function bouw(p: T): Knoop<T> {
    gezien.add(p.id);
    const kinderen = sorteerPersonen(onder.get(p.id) ?? []).filter((k) => !gezien.has(k.id));
    // Wie zelf een team heeft eerst, zodat de structuur bovenaan staat
    kinderen.sort((a, b) => Number(onder.has(b.id)) - Number(onder.has(a.id)));
    return { persoon: p, kinderen: kinderen.map(bouw) };
  }
  const wortels = sorteerPersonen(onder.get(null) ?? []).map(bouw);
  // Iemand in een rondje toch tonen
  for (const p of zichtbaar) if (!gezien.has(p.id)) wortels.push(bouw(p));
  return wortels;
}

export type Aandachtspunt = { persoon_id: string; tekst: string };

/** Wat er nog ontbreekt, voor het tabblad Structuur in het beheer */
export function aandachtspunten(
  personen: (PersoonLite & Pick<Persoon, "foto_pad" | "foto_url" | "trefwoorden" | "email">)[],
  afdelingen: AfdelingLite[],
): Aandachtspunt[] {
  const afd = opId(afdelingen);
  const ids = new Set(personen.map((p) => p.id));
  const uit: Aandachtspunt[] = [];
  for (const p of personen) {
    const a = p.afdeling_id ? afd.get(p.afdeling_id) : undefined;
    if (!a) uit.push({ persoon_id: p.id, tekst: "zit in geen afdeling" });
    const toezicht = a?.soort === "toezicht";
    if (!toezicht && !p.leidinggevende_id && personen.some((x) => x.leidinggevende_id === null && x.id !== p.id && afd.get(x.afdeling_id ?? "")?.soort !== "toezicht")) {
      uit.push({ persoon_id: p.id, tekst: "heeft geen leidinggevende" });
    }
    if (p.leidinggevende_id && !ids.has(p.leidinggevende_id)) uit.push({ persoon_id: p.id, tekst: "leidinggevende bestaat niet meer" });
    if (!p.foto_pad && !p.foto_url) uit.push({ persoon_id: p.id, tekst: "heeft geen foto" });
    if (!toezicht && !p.trefwoorden.length) uit.push({ persoon_id: p.id, tekst: "heeft geen trefwoorden" });
    if (!toezicht && !p.email) uit.push({ persoon_id: p.id, tekst: "heeft geen e-mailadres" });
  }
  return uit;
}
