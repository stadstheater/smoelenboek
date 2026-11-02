import type { Afdeling, Dag, Persoon, Zoekwoord } from "@/lib/types";
import { DAGEN } from "@/lib/types";
import { afstand, normaliseer, stam, woorden as splitsWoorden } from "@/lib/zoeken/normaliseer";
import { parseZoekvraag, type Zoekvraag } from "@/lib/zoeken/parse";

/**
 * De zoekmachine van het smoelenboek. Draait in de browser, bij elke toets.
 *
 * Per persoon maken we een lijst "termen": naam, functie, trefwoorden, afdeling, e-mail enzovoort, elk met een gewicht.
 * Elk zoekwoord zoekt de best passende term: exact, zelfde stam, begin van een woord, deel van een samengesteld woord,
 * typfout of via een zoekwoord uit het beheer (synoniem). De punten tellen op; wie alle zoekwoorden raakt, krijgt een bonus.
 */

export type Veld =
  | "naam"
  | "functie"
  | "trefwoord"
  | "afdeling"
  | "afdeling-trefwoord"
  | "email"
  | "telefoon"
  | "werkplek"
  | "over"
  | "taal"
  | "initialen";

const GEWICHT: Record<Veld, number> = {
  naam: 10,
  trefwoord: 8,
  functie: 6,
  afdeling: 5,
  "afdeling-trefwoord": 4,
  email: 3,
  telefoon: 3,
  werkplek: 2,
  over: 2,
  taal: 2,
  initialen: 9,
};

export type Reden = {
  veld: Veld;
  /** De term zoals hij in het smoelenboek staat, bijvoorbeeld het trefwoord "zaalhuur" */
  tekst: string;
  /** Bij een afdelingstrefwoord: de naam van de afdeling */
  afdeling?: string;
  /** Gevonden via een ander woord (synoniem): het woord dat je typte */
  via?: string;
  /** Het zoekwoord dat deze reden opleverde */
  zoekwoord: string;
  punten: number;
};

type Term = {
  veld: Veld;
  tekst: string;
  afdeling?: string;
  genormaliseerd: string;
  compact: string;
  woorden: string[];
  stammen: string[];
};

export type ZoekPersoon = Pick<
  Persoon,
  | "id"
  | "naam"
  | "functie"
  | "afdeling_id"
  | "extra_afdeling_ids"
  | "email"
  | "telefoon"
  | "mobiel"
  | "werkdagen"
  | "werkplek"
  | "trefwoorden"
  | "over_mij"
  | "talen"
  | "volgorde"
  | "zichtbaar"
>;
export type ZoekAfdeling = Pick<Afdeling, "id" | "slug" | "naam" | "beschrijving" | "trefwoorden" | "hoofd_id" | "volgorde">;

export type PersoonResultaat<P> = {
  persoon: P;
  score: number;
  redenen: Reden[];
  /** Genormaliseerde woorden die in naam en functie gemarkeerd mogen worden */
  markeer: string[];
  /** Raakt alle zoekwoorden */
  volledig: boolean;
};

export type AfdelingResultaat<A> = { afdeling: A; score: number; redenen: Reden[]; aantal: number };

export type Zoekresultaat<P, A> = {
  vraag: Zoekvraag;
  personen: PersoonResultaat<P>[];
  afdelingen: AfdelingResultaat<A>[];
  /** "Bedoelde je ...?" als er niets gevonden is */
  suggestie: string | null;
};

function maakTerm(veld: Veld, tekst: string, afdeling?: string): Term | null {
  const genormaliseerd = normaliseer(tekst);
  if (!genormaliseerd) return null;
  const woorden = genormaliseerd.split(" ");
  return { veld, tekst, afdeling, genormaliseerd, compact: woorden.join(""), woorden, stammen: woorden.map(stam) };
}

type Uitbreiding = { woord: string; gewicht: number; via?: string };

/** Hoe goed past een (uitgebreid) zoekwoord bij een term? 0 is niet, 1 is exact. */
function kwaliteit(w: string, term: Term, streng: boolean): { k: number; woord: string } {
  // Zoekwoord van meer woorden (uit een synoniemgroep): moet als geheel voorkomen
  if (w.includes(" ")) {
    return ` ${term.genormaliseerd} `.includes(` ${w} `) ? { k: 0.95, woord: w } : { k: 0, woord: "" };
  }
  const ws = stam(w);
  let beste = { k: 0, woord: "" };
  const zet = (k: number, woord: string) => {
    if (k > beste.k) beste = { k, woord };
  };
  for (let i = 0; i < term.woorden.length; i++) {
    const t = term.woorden[i];
    // Via een synoniem telt een los woord uit een langere term minder: "media" is niet hetzelfde als "social media"
    const deel = streng && term.woorden.length > 1 ? 0.6 : 1;
    if (t === w) zet(deel, t);
    else if (term.stammen[i] === ws && ws.length >= 3) zet(0.95 * deel, t);
    else if (!streng && t.startsWith(w)) zet(w.length >= 3 ? 0.85 : w.length === 2 ? 0.6 : 0.4, t);
    else if (w.length >= (streng ? 5 : 4) && t.includes(w)) zet(0.62 * deel, t);
    // "bedrijfsborrel" bevat "borrel"; via een synoniem alleen bij langere woorden, anders is het ruis
    else if (t.length >= (streng ? 6 : 4) && w.length > t.length && w.includes(t)) zet(0.55 * deel, t);
    else if (!streng && w.length >= 4) {
      const max = w.length >= 7 ? 2 : 1;
      if (Math.abs(t.length - w.length) <= max) {
        const d = afstand(w, t, max);
        if (d <= max) zet(d === 1 ? 0.62 : 0.45, t);
      }
      // Typfout terwijl je nog typt: "charel" tegen het begin van "charles"
      if (t.length > w.length && afstand(w, t.slice(0, w.length), 1) <= 1) zet(0.5, t);
    }
  }
  // Aan elkaar getypt: "vanderploeg" in "van der ploeg"
  if (!streng && w.length >= 5 && term.woorden.length > 1 && term.compact.includes(w)) zet(0.8, term.woorden[0]);
  return beste;
}

const DAG_CODES = new Map<string, Dag>();
for (const d of DAGEN) {
  for (let n = 2; n <= d.lang.length; n++) if (!DAG_CODES.has(d.lang.slice(0, n))) DAG_CODES.set(d.lang.slice(0, n), d.code);
  DAG_CODES.set(d.code, d.code);
}

function initialen(naam: string) {
  const delen = splitsWoorden(naam).flatMap((w) => w.split("-")).filter(Boolean);
  const hoofdletters = naam.split(/[\s-]+/).filter((w) => /^[A-ZÀ-Ý]/.test(w));
  const opties = new Set<string>();
  opties.add(delen.map((w) => w[0]).join(""));
  if (hoofdletters.length) opties.add(normaliseer(hoofdletters.map((w) => w[0]).join("")));
  if (delen.length > 1) opties.add(delen[0][0] + delen.at(-1)![0]);
  return opties;
}

export function maakZoeker<P extends ZoekPersoon, A extends ZoekAfdeling>(gegevens: {
  personen: P[];
  afdelingen: A[];
  zoekwoorden: Zoekwoord[];
}) {
  const afdelingOpId = new Map(gegevens.afdelingen.map((a) => [a.id, a]));
  const zichtbaar = gegevens.personen.filter((p) => p.zichtbaar);

  // ---------- Synoniemen ----------
  const synoniemen = new Map<string, Set<string>>();
  for (const groep of gegevens.zoekwoorden) {
    const genormaliseerd = [...new Set(groep.woorden.map(normaliseer).filter(Boolean))];
    for (const w of genormaliseerd) {
      const sleutels = w.includes(" ") ? [w] : [w, stam(w)];
      for (const s of sleutels) {
        const set = synoniemen.get(s) ?? new Set<string>();
        for (const ander of genormaliseerd) if (ander !== w) set.add(ander);
        synoniemen.set(s, set);
      }
    }
  }
  const synoniemSleutels = [...synoniemen.keys()].filter((s) => !s.includes(" ") && s.length >= 5);

  function uitbreiden(q: string, volledigeTekst: string): Uitbreiding[] {
    const uit: Uitbreiding[] = [{ woord: q, gewicht: 1 }];
    const gevonden = new Set<string>([q]);
    const voeg = (woord: string, gewicht: number) => {
      if (gevonden.has(woord)) return;
      gevonden.add(woord);
      uit.push({ woord, gewicht, via: q });
    };
    for (const s of [...(synoniemen.get(q) ?? []), ...(synoniemen.get(stam(q)) ?? [])]) voeg(s, 0.75);
    // Typfout in een synoniem: "laptp" vindt toch de groep van "laptop"
    if (uit.length === 1 && q.length >= 5) {
      for (const sleutel of synoniemSleutels) {
        if (afstand(q, sleutel, 1) <= 1) {
          voeg(sleutel, 0.65);
          for (const s of synoniemen.get(sleutel) ?? []) voeg(s, 0.6);
        }
      }
    }
    // Synoniemen van meer woorden die in de hele zoekregel staan ("zaal huren")
    for (const [sleutel, set] of synoniemen) {
      if (sleutel.includes(" ") && ` ${volledigeTekst} `.includes(` ${sleutel} `) && sleutel.split(" ").includes(q)) {
        for (const s of set) voeg(s, 0.75);
      }
    }
    return uit;
  }

  // ---------- Termen per persoon en afdeling ----------
  const termenPersoon = new Map<string, Term[]>();
  const volledigeTekst = new Map<string, string>();
  for (const p of zichtbaar) {
    const termen: (Term | null)[] = [maakTerm("naam", p.naam), maakTerm("functie", p.functie)];
    for (const t of p.trefwoorden) termen.push(maakTerm("trefwoord", t));
    for (const id of [p.afdeling_id, ...p.extra_afdeling_ids]) {
      const a = id ? afdelingOpId.get(id) : undefined;
      if (!a) continue;
      termen.push(maakTerm("afdeling", a.naam, a.naam));
      for (const t of a.trefwoorden) termen.push(maakTerm("afdeling-trefwoord", t, a.naam));
    }
    if (p.email) termen.push(maakTerm("email", p.email.split("@")[0].replace(/[._-]+/g, " ")));
    if (p.werkplek) termen.push(maakTerm("werkplek", p.werkplek));
    if (p.over_mij) termen.push(maakTerm("over", p.over_mij));
    for (const t of p.talen) termen.push(maakTerm("taal", t));
    const echt = termen.filter((t): t is Term => !!t);
    termenPersoon.set(p.id, echt);
    volledigeTekst.set(p.id, ` ${echt.map((t) => t.genormaliseerd).join(" ")} ${normaliseer(p.email ?? "")} `);
  }

  const termenAfdeling = new Map<string, Term[]>();
  for (const a of gegevens.afdelingen) {
    const termen = [maakTerm("afdeling", a.naam, a.naam), ...a.trefwoorden.map((t) => maakTerm("afdeling-trefwoord", t, a.naam))];
    if (a.beschrijving) termen.push(maakTerm("over", a.beschrijving, a.naam));
    termenAfdeling.set(
      a.id,
      termen.filter((t): t is Term => !!t),
    );
  }

  // Woordenschat voor "Bedoelde je ...?"
  const woordenschat = new Set<string>();
  for (const termen of [...termenPersoon.values(), ...termenAfdeling.values()]) {
    for (const t of termen) for (const w of t.woorden) if (w.length >= 3) woordenschat.add(w);
  }
  for (const s of synoniemen.keys()) if (!s.includes(" ") && s.length >= 3) woordenschat.add(s);

  const initialenVan = new Map(zichtbaar.map((p) => [p.id, initialen(p.naam)]));
  const isHoofd = (p: P) =>
    [p.afdeling_id, ...p.extra_afdeling_ids].some((id) => id && afdelingOpId.get(id)?.hoofd_id === p.id);

  function scoorTermen(termen: Term[], woorden: string[], tekst: string, gewichtVoor: (veld: Veld) => number) {
    const redenen: Reden[] = [];
    const markeer = new Set<string>();
    let totaal = 0;
    let geraakt = 0;
    for (const q of woorden) {
      let beste: { punten: number; reden: Reden; woord: string } | null = null;
      for (const u of uitbreiden(q, tekst)) {
        const streng = u.gewicht < 1;
        for (const term of termen) {
          // Losse letters alleen tegen het begin van een naam
          if (q.length === 1 && term.veld !== "naam") continue;
          const { k, woord } = kwaliteit(u.woord, term, streng);
          if (!k) continue;
          const punten = gewichtVoor(term.veld) * k * u.gewicht;
          if (!beste || punten > beste.punten) {
            beste = {
              punten,
              woord,
              reden: { veld: term.veld, tekst: term.tekst, afdeling: term.afdeling, via: u.via, zoekwoord: q, punten },
            };
          }
        }
      }
      if (beste) {
        totaal += beste.punten;
        geraakt++;
        redenen.push(beste.reden);
        markeer.add(beste.woord);
      }
    }
    return { totaal, geraakt, redenen, markeer };
  }

  function voldoetAanFilters(p: P, vraag: Zoekvraag) {
    const afdelingen = [p.afdeling_id, ...p.extra_afdeling_ids].map((id) => (id ? afdelingOpId.get(id) : undefined)).filter((a): a is A => !!a);
    if (vraag.afdeling.length) {
      const past = vraag.afdeling.every((waarde) =>
        afdelingen.some((a) => {
          const naam = normaliseer(a.naam);
          return naam.includes(waarde) || a.slug.startsWith(waarde.replace(/ /g, "-")) || naam.split(" ").some((w) => w.length >= 4 && afstand(w, waarde, 1) <= 1);
        }),
      );
      if (!past) return false;
    }
    if (vraag.functie.length) {
      const functie = normaliseer(p.functie);
      if (!vraag.functie.every((f) => functie.includes(f) || functie.split(" ").some((w) => w.length >= 4 && afstand(w, f, 1) <= 1))) return false;
    }
    if (vraag.dag.length) {
      if (!vraag.dag.every((d) => p.werkdagen.includes(DAG_CODES.get(d) ?? (d as Dag)))) return false;
    }
    if (vraag.taal.length) {
      const talen = p.talen.map(normaliseer);
      if (!vraag.taal.every((t) => talen.some((x) => x.startsWith(t)))) return false;
    }
    const tekst = volledigeTekst.get(p.id) ?? "";
    // Uitsluiten werkt ook binnen samengestelde woorden: -assistent haalt de marketingassistenten weg
    if (vraag.zonder.some((z) => (z.length >= 4 ? tekst.includes(z) : tekst.includes(` ${z}`)))) return false;
    if (vraag.zinnen.some((z) => !tekst.includes(` ${z}`))) return false;
    return true;
  }

  function suggestieVoor(vraag: Zoekvraag) {
    let veranderd = false;
    const nieuw = vraag.woorden.map((q) => {
      if (q.length < 4 || woordenschat.has(q) || /^\d+$/.test(q)) return q;
      const max = q.length >= 8 ? 3 : 2;
      let beste = { woord: q, d: max + 1 };
      for (const w of woordenschat) {
        if (Math.abs(w.length - q.length) > max) continue;
        const d = afstand(q, w, max);
        if (d < beste.d || (d === beste.d && w.length === q.length)) beste = { woord: w, d };
      }
      if (beste.d <= max && beste.woord !== q) {
        veranderd = true;
        return beste.woord;
      }
      return q;
    });
    return veranderd ? nieuw.join(" ") : null;
  }

  return function zoek(invoer: string, opties: { max?: number } = {}): Zoekresultaat<P, A> {
    const vraag = parseZoekvraag(invoer);
    const tekst = normaliseer(invoer);
    const personen: PersoonResultaat<P>[] = [];

    for (const p of zichtbaar) {
      if (!voldoetAanFilters(p, vraag)) continue;

      if (!vraag.woorden.length) {
        if (!vraag.leeg) personen.push({ persoon: p, score: 1, redenen: [], markeer: [], volledig: true });
        continue;
      }

      const { totaal, geraakt, redenen, markeer } = scoorTermen(termenPersoon.get(p.id) ?? [], vraag.woorden, tekst, (v) => GEWICHT[v]);
      let score = totaal;
      let aantalGeraakt = geraakt;

      // Initialen: "cd" is Charles Droste
      if (vraag.woorden.length === 1 && /^[a-z]{2,3}$/.test(vraag.woorden[0]) && initialenVan.get(p.id)?.has(vraag.woorden[0])) {
        score = Math.max(score, GEWICHT.initialen);
        aantalGeraakt = 1;
        if (!redenen.length) redenen.push({ veld: "initialen", tekst: p.naam, zoekwoord: vraag.woorden[0], punten: GEWICHT.initialen });
      }

      // Telefoonnummer: een stuk van de cijfers
      for (const q of vraag.woorden) {
        if (!/^\d{3,}$/.test(q)) continue;
        const nummers = [p.telefoon, p.mobiel].filter(Boolean).map((n) => n!.replace(/\D/g, ""));
        const raak = nummers.find((n) => n.includes(q) || n.replace(/^0/, "31").includes(q));
        if (raak) {
          score += GEWICHT.telefoon;
          if (!redenen.some((r) => r.zoekwoord === q)) aantalGeraakt++;
          redenen.push({ veld: "telefoon", tekst: [p.telefoon, p.mobiel].find((n) => n?.replace(/\D/g, "") === raak) ?? raak, zoekwoord: q, punten: GEWICHT.telefoon });
        }
      }

      if (!aantalGeraakt) continue;
      const dekking = Math.min(1, aantalGeraakt / vraag.woorden.length);
      score *= dekking * dekking;
      const volledig = dekking === 1;
      if (volledig && vraag.woorden.length > 1) score *= 1.3;
      // Het hoofd van de afdeling is het eerste aanspreekpunt als de match via de afdeling loopt
      if (isHoofd(p) && redenen.some((r) => r.veld === "afdeling" || r.veld === "afdeling-trefwoord")) score *= 1.15;
      for (const z of vraag.zinnen) if ((volledigeTekst.get(p.id) ?? "").includes(` ${z}`)) score += 5;

      personen.push({ persoon: p, score, redenen: redenen.sort((a, b) => b.punten - a.punten), markeer: [...markeer], volledig });
    }

    // Wie alle zoekwoorden raakt, staat altijd boven wie maar een deel raakt
    const metVolledig = personen.some((r) => r.volledig);
    personen.sort(
      (a, b) =>
        (metVolledig ? Number(b.volledig) - Number(a.volledig) : 0) ||
        b.score - a.score ||
        Number(isHoofd(b.persoon)) - Number(isHoofd(a.persoon)) ||
        (afdelingOpId.get(a.persoon.afdeling_id ?? "")?.volgorde ?? 999) - (afdelingOpId.get(b.persoon.afdeling_id ?? "")?.volgorde ?? 999) ||
        a.persoon.volgorde - b.persoon.volgorde ||
        a.persoon.naam.localeCompare(b.persoon.naam, "nl"),
    );

    // Een match die veel zwakker is dan de beste is vooral ruis
    const top = personen[0]?.score ?? 0;
    const gefilterd = vraag.woorden.length ? personen.filter((r) => r.score >= top * 0.3) : personen;

    // Afdelingen
    const afdelingen: AfdelingResultaat<A>[] = [];
    if (vraag.woorden.length) {
      const gewichtAfdeling = (v: Veld) => (v === "afdeling" ? 10 : v === "afdeling-trefwoord" ? 6 : 2);
      for (const a of gegevens.afdelingen) {
        const { totaal, geraakt, redenen } = scoorTermen(termenAfdeling.get(a.id) ?? [], vraag.woorden, tekst, gewichtAfdeling);
        if (!geraakt) continue;
        const dekking = geraakt / vraag.woorden.length;
        const score = totaal * dekking;
        if (score < 2) continue;
        const aantal = zichtbaar.filter((p) => p.afdeling_id === a.id || p.extra_afdeling_ids.includes(a.id)).length;
        afdelingen.push({ afdeling: a, score, redenen, aantal });
      }
      afdelingen.sort((a, b) => b.score - a.score || a.afdeling.volgorde - b.afdeling.volgorde);
    }

    const resultaat = opties.max ? gefilterd.slice(0, opties.max) : gefilterd;
    return {
      vraag,
      personen: resultaat,
      afdelingen,
      suggestie: !gefilterd.length && vraag.woorden.length ? suggestieVoor(vraag) : null,
    };
  };
}

export type Zoeker<P extends ZoekPersoon, A extends ZoekAfdeling> = ReturnType<typeof maakZoeker<P, A>>;

/** Beschrijving van een reden voor bij een resultaat, bijvoorbeeld "Trefwoord zaalhuur" */
export function redenTekst(r: Reden) {
  const via = r.via ? ` (je zocht "${r.via}")` : "";
  switch (r.veld) {
    case "trefwoord":
      return `Trefwoord: ${r.tekst}${via}`;
    case "afdeling":
      return `Afdeling ${r.tekst}${via}`;
    case "afdeling-trefwoord":
      return `${r.afdeling}: ${r.tekst}${via}`;
    case "email":
      return `E-mailadres${via}`;
    case "telefoon":
      return `Telefoon ${r.tekst}`;
    case "werkplek":
      return `Werkplek: ${r.tekst}${via}`;
    case "over":
      return `Over mij${via}`;
    case "taal":
      return `Spreekt ${r.tekst}`;
    case "initialen":
      return "Initialen";
    case "functie":
      return r.via ? `Functie${via}` : "Functie";
    case "naam":
      return r.via ? `Naam${via}` : "Naam";
  }
}
