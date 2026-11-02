import { normaliseer, STOPWOORDEN, woorden } from "@/lib/zoeken/normaliseer";

export type Zoekvraag = {
  /** De woorden waarop gezocht wordt, zonder vraagwoorden */
  woorden: string[];
  /** Alle woorden zoals getypt (genormaliseerd), voor als er na het filteren niets overblijft */
  alleWoorden: string[];
  /** Tussen aanhalingstekens: moet letterlijk ergens voorkomen */
  zinnen: string[];
  /** Met een min ervoor: mag nergens voorkomen */
  zonder: string[];
  afdeling: string[];
  functie: string[];
  dag: string[];
  taal: string[];
  /** Is er iets om op te zoeken of te filteren? */
  leeg: boolean;
};

const SLEUTELS: Record<string, "afdeling" | "functie" | "dag" | "taal"> = {
  afdeling: "afdeling",
  afd: "afdeling",
  team: "afdeling",
  functie: "functie",
  rol: "functie",
  dag: "dag",
  werkt: "dag",
  taal: "taal",
  spreekt: "taal",
};

/**
 * Leest een zoekregel als: wie regelt "zaal huren" afdeling:horeca -stagiaire dag:vrijdag
 * Waarden met spaties mogen tussen aanhalingstekens: afdeling:"sales & events"
 */
export function parseZoekvraag(invoer: string): Zoekvraag {
  const vraag: Zoekvraag = { woorden: [], alleWoorden: [], zinnen: [], zonder: [], afdeling: [], functie: [], dag: [], taal: [], leeg: true };
  const delen = invoer.match(/(-?[a-z]+:"[^"]*"?|-?"[^"]*"?|\S+)/gi) ?? [];

  for (const deel of delen) {
    const sleutelMatch = deel.match(/^([a-z]+):(.*)$/i);
    if (sleutelMatch && SLEUTELS[sleutelMatch[1].toLowerCase()]) {
      const waarde = normaliseer(sleutelMatch[2].replace(/"/g, ""));
      if (waarde) vraag[SLEUTELS[sleutelMatch[1].toLowerCase()]].push(waarde);
      continue;
    }
    if (deel.startsWith('"') || deel.startsWith('-"')) {
      const zin = normaliseer(deel.replace(/^-/, "").replace(/"/g, ""));
      if (!zin) continue;
      if (deel.startsWith("-")) vraag.zonder.push(zin);
      else vraag.zinnen.push(zin);
      continue;
    }
    if (deel.startsWith("-") && deel.length > 1) {
      const w = normaliseer(deel.slice(1));
      if (w) vraag.zonder.push(w);
      continue;
    }
    vraag.alleWoorden.push(...woorden(deel));
  }

  vraag.woorden = vraag.alleWoorden.filter((w) => !STOPWOORDEN.has(w));
  // Alleen vulwoorden getypt? Zoek dan toch op wat er staat
  if (!vraag.woorden.length && !vraag.zinnen.length) vraag.woorden = vraag.alleWoorden.filter((w) => w.length > 1);
  vraag.woorden = [...new Set(vraag.woorden)];
  vraag.leeg =
    !vraag.woorden.length &&
    !vraag.zinnen.length &&
    !vraag.zonder.length &&
    !vraag.afdeling.length &&
    !vraag.functie.length &&
    !vraag.dag.length &&
    !vraag.taal.length;
  return vraag;
}
