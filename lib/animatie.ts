/**
 * Soorten overgangen (React transition types). Een ViewTransition beweegt alleen bij het type dat erbij hoort,
 * zodat bijvoorbeeld kaarten niet gaan schuiven als je naar een andere pagina gaat.
 */

/** Filteren en sorteren in het smoelenboek: kaarten glijden naar hun nieuwe plek */
export const FILTER = ["filter"];

/** Volgorde wijzigen in het beheer: rijen glijden naar hun nieuwe plek */
export const VOLGORDE = "volgorde";

/** Duur van de sluitanimatie van vensters, gelijk aan de CSS in globals.css */
export const SLUITDUUR = 220;

export function minderBeweging() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Nieuwe plekken voor een herschikte groep, op dezelfde manier als de server ze bewaart (lib/data.ts, zetVolgorde) */
export function nieuwePlekken<T extends { id: string; volgorde: number }>(nieuw: T[]): Record<string, number> {
  const plekken = nieuw.map((x) => x.volgorde).sort((a, b) => a - b);
  const uniek = new Set(plekken).size === plekken.length;
  return Object.fromEntries(nieuw.map((x, i) => [x.id, uniek ? plekken[i] : (plekken[0] ?? 0) + i]));
}
