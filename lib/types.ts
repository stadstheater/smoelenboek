export type Dag = "ma" | "di" | "wo" | "do" | "vr" | "za" | "zo";

export const DAGEN: { code: Dag; kort: string; lang: string }[] = [
  { code: "ma", kort: "Ma", lang: "maandag" },
  { code: "di", kort: "Di", lang: "dinsdag" },
  { code: "wo", kort: "Wo", lang: "woensdag" },
  { code: "do", kort: "Do", lang: "donderdag" },
  { code: "vr", kort: "Vr", lang: "vrijdag" },
  { code: "za", kort: "Za", lang: "zaterdag" },
  { code: "zo", kort: "Zo", lang: "zondag" },
];

/** "organisatie" zijn de gewone afdelingen; "toezicht" is de Raad van Toezicht, die apart staat */
export type AfdelingSoort = "organisatie" | "toezicht";

export type Afdeling = {
  id: string;
  slug: string;
  naam: string;
  beschrijving: string | null;
  /** Bovenliggende afdeling, voor subafdelingen */
  parent_id: string | null;
  /** Wie de afdeling leidt; staat bovenaan in de afdeling */
  hoofd_id: string | null;
  volgorde: number;
  soort: AfdelingSoort;
  /** Waarvoor kun je bij deze afdeling terecht; telt mee in het zoeken */
  trefwoorden: string[];
};

export type Persoon = {
  id: string;
  slug: string;
  naam: string;
  functie: string;
  /** Hoofdafdeling */
  afdeling_id: string | null;
  /** Afdelingen waar iemand daarnaast voor werkt */
  extra_afdeling_ids: string[];
  leidinggevende_id: string | null;
  /** Geüploade foto in Vercel Blob (privé) */
  foto_pad: string | null;
  /** Foto op een andere plek, bijvoorbeeld stadstheater.nl */
  foto_url: string | null;
  email: string | null;
  telefoon: string | null;
  mobiel: string | null;
  werkdagen: Dag[];
  werkplek: string | null;
  /** Waarvoor kun je bij mij terecht */
  trefwoorden: string[];
  over_mij: string | null;
  /** JJJJ-MM-DD of JJJJ-MM */
  in_dienst_sinds: string | null;
  talen: string[];
  volgorde: number;
  /** Verborgen mensen staan alleen in het beheer */
  zichtbaar: boolean;
  bijgewerkt_op: string;
};

/** Woorden die voor het zoeken hetzelfde betekenen */
export type Zoekwoord = {
  id: string;
  woorden: string[];
};

export type Smoelenboek = {
  versie: 1;
  afdelingen: Afdeling[];
  personen: Persoon[];
  zoekwoorden: Zoekwoord[];
};

export type PersoonInvoer = Omit<Persoon, "id" | "bijgewerkt_op">;
export type AfdelingInvoer = Omit<Afdeling, "id">;

/** Wat de browser van een persoon nodig heeft: alles, plus kant-en-klare foto-adressen */
export type PersoonWeergave = Persoon & {
  foto_klein: string | null;
  foto_groot: string | null;
};

export type Gegevens = {
  afdelingen: Afdeling[];
  personen: PersoonWeergave[];
  zoekwoorden: Zoekwoord[];
};
