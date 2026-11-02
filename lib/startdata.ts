import { STANDAARD_ZOEKWOORDEN } from "@/lib/zoeken/begrippen";
import type { Afdeling, Persoon, Smoelenboek } from "@/lib/types";

/**
 * Eerste vulling van het smoelenboek, overgenomen van stadstheater.nl/over-ons/organisatie (november 2026).
 * Hoofden en leidinggevenden zijn een voorstel op basis van de functietitels: controleer ze in het beheer.
 */

const BEGIN = "2026-11-02T00:00:00.000Z";

function afd(slug: string, naam: string, volgorde: number, extra: Partial<Afdeling> = {}): Afdeling {
  return {
    id: `afd-${slug}`,
    slug,
    naam,
    beschrijving: null,
    parent_id: null,
    hoofd_id: null,
    volgorde,
    soort: "organisatie",
    trefwoorden: [],
    ...extra,
  };
}

const AFDELINGEN: Afdeling[] = [
  afd("directie", "Directie", 1, {
    hoofd_id: "p-charles-droste",
    beschrijving: "Leiding van het theater, programmering en beleid.",
    trefwoorden: ["directie", "beleid", "strategie", "programmering", "voorstellingen boeken"],
  }),
  afd("personeelszaken", "Personeelszaken", 2, {
    beschrijving: "Alles rond werken bij het theater: contracten, verlof en verzuim.",
    trefwoorden: ["hr", "contract", "verlof", "ziekmelding", "salaris", "vacature", "sollicitatie", "personeelsdossier"],
  }),
  afd("servicebalie", "Servicebalie", 3, {
    hoofd_id: "p-jolanda-van-soest",
    beschrijving: "Eerste aanspreekpunt voor bezoekers: kaartverkoop, abonnementen en vragen.",
    trefwoorden: [
      "kaartverkoop",
      "tickets",
      "reserveren",
      "abonnement",
      "cadeaubon",
      "annuleren",
      "terugbetalen",
      "rolstoelplaats",
      "toegankelijkheid",
      "klantvragen",
    ],
  }),
  afd("financiele-administratie", "Financiële administratie", 4, {
    hoofd_id: "p-kristel-thomaes",
    beschrijving: "Facturen, betalingen, declaraties en de begroting.",
    trefwoorden: ["financien", "facturen", "declaraties", "betalingen", "inkoop", "budget", "begroting", "jaarrekening"],
  }),
  afd("marketing-communicatie", "Marketing & communicatie", 5, {
    hoofd_id: "p-karin-beukers",
    beschrijving: "Publiek bereiken: campagnes, website, nieuwsbrief, social media, pers en drukwerk.",
    trefwoorden: [
      "marketing",
      "communicatie",
      "website",
      "nieuwsbrief",
      "social media",
      "pers",
      "persbericht",
      "campagne",
      "advertenties",
      "brochure",
      "drukwerk",
      "poster",
      "fotografie",
      "narrowcasting",
      "huisstijl",
    ],
  }),
  afd("educatie", "Educatie", 6, {
    hoofd_id: "p-lobke-spies",
    beschrijving: "Theater voor en met scholen, jongeren en de stad.",
    trefwoorden: ["educatie", "scholen", "onderwijs", "schoolvoorstellingen", "workshops", "cursussen", "participatie", "cultuuronderwijs"],
  }),
  afd("horeca-sales-events", "Horeca, sales & events", 7, {
    hoofd_id: "p-jeffrey-van-dijk",
    beschrijving: "Horeca, zakelijke verhuur, evenementen en vrijwilligers.",
    trefwoorden: [
      "horeca",
      "foyer",
      "bar",
      "catering",
      "zaalhuur",
      "verhuur",
      "zakelijk",
      "vergaderen",
      "bedrijfsfeest",
      "evenementen",
      "borrel",
      "arrangementen",
      "vrijwilligers",
    ],
  }),
  afd("ict-gebouwbeheer", "ICT & gebouwbeheer", 8, {
    beschrijving: "Computers, netwerk en het gebouw.",
    trefwoorden: ["ict", "laptop", "wifi", "printer", "account", "gebouw", "onderhoud", "storing", "sleutels", "toegangspas", "beveiliging"],
  }),
  afd("techniek", "Techniek", 9, {
    hoofd_id: "p-tommy-everts",
    beschrijving: "Licht, geluid, podium en de technische planning van voorstellingen.",
    trefwoorden: ["techniek", "licht", "geluid", "podium", "decor", "rider", "technische lijst", "video", "inladen", "opbouw"],
  }),
  afd("raad-van-toezicht", "Raad van Toezicht", 10, {
    hoofd_id: "p-deen-sonneveldt",
    soort: "toezicht",
    beschrijving: "Houdt toezicht op het bestuur van het theater.",
    trefwoorden: ["toezicht", "governance"],
  }),
];

type Rij = {
  slug: string;
  naam: string;
  functie: string;
  afd: string;
  email?: string;
  telefoon?: string;
  foto?: string;
  trefwoorden?: string[];
};

const FOTO = "https://stadstheater.nl/assets/uploads";

const RIJEN: Rij[] = [
  {
    slug: "charles-droste",
    naam: "Charles Droste",
    functie: "Directeur & programmeur",
    afd: "directie",
    email: "cdroste@stadstheater.nl",
    foto: `${FOTO}/2025/12/Charles-Droste-vierkant-LR-768x768.jpg`,
    trefwoorden: ["directie", "programmering", "voorstellingen boeken"],
  },
  {
    slug: "jolanda-van-soest",
    naam: "Jolanda van Soest",
    functie: "Coördinator servicebalie",
    afd: "servicebalie",
    email: "servicebalie@stadstheater.nl",
    foto: `${FOTO}/2025/12/Jolanda-van-Soest-vierkant-LR-768x768.jpg`,
    trefwoorden: ["servicebalie", "kaartverkoop"],
  },
  {
    slug: "anita-savans",
    naam: "Anita Savans",
    functie: "Medewerker servicebalie",
    afd: "servicebalie",
    email: "servicebalie@stadstheater.nl",
    foto: `${FOTO}/2026/01/Anita-Savans-vierkant-LR-768x768.jpg`,
    trefwoorden: ["kaartverkoop"],
  },
  {
    slug: "daphne-de-wilde-hogeboom",
    naam: "Daphne de Wilde-Hogeboom",
    functie: "Medewerker servicebalie",
    afd: "servicebalie",
    email: "servicebalie@stadstheater.nl",
    foto: `${FOTO}/2026/01/Daphne-de-Wilde-vierkant-LR-1-768x768.jpg`,
    trefwoorden: ["kaartverkoop"],
  },
  {
    slug: "kristel-thomaes",
    naam: "Kristel Thomaes",
    functie: "Financial controller",
    afd: "financiele-administratie",
    email: "kthomaes@stadstheater.nl",
    foto: `${FOTO}/2025/12/Kristel-Thomaes-voorkeur-Vierkant-Lr-2-768x768.jpg`,
    trefwoorden: ["begroting", "budget", "financien"],
  },
  {
    slug: "leon-molendijk",
    naam: "Léon Molendijk",
    functie: "Financieel administrateur",
    afd: "financiele-administratie",
    email: "administratie@stadstheater.nl",
    foto: `${FOTO}/2025/12/Leon-Molendijk-vierkant-LR-768x768.jpg`,
    trefwoorden: ["facturen", "declaraties", "betalingen"],
  },
  {
    slug: "karin-beukers",
    naam: "Karin Beukers",
    functie: "Manager programma & publiek",
    afd: "marketing-communicatie",
    email: "karin@stadstheater.nl",
    foto: `${FOTO}/2022/04/Karin-Beukers-vierkant-LR-2-768x768.jpg`,
    trefwoorden: ["programma", "publiek"],
  },
  {
    slug: "lotte-van-gaalen",
    naam: "Lotte van Gaalen",
    functie: "Coördinator marketing",
    afd: "marketing-communicatie",
    email: "lvangaalen@stadstheater.nl",
    foto: `${FOTO}/2025/12/Lotte-van-Gaalen-vierkant-LR-768x768.jpg`,
    trefwoorden: ["marketing", "campagne", "planning"],
  },
  {
    slug: "colin-coert",
    naam: "Colin Coert",
    functie: "Marketeer",
    afd: "marketing-communicatie",
    email: "ccoert@stadstheater.nl",
    foto: `${FOTO}/2025/12/Colin-Coert-Vierkant-LR-768x768.jpg`,
    trefwoorden: ["marketing", "campagne"],
  },
  {
    slug: "scottey-mouris",
    naam: "Scottey Mouris",
    functie: "Online marketeer",
    afd: "marketing-communicatie",
    email: "smouris@stadstheater.nl",
    trefwoorden: ["online marketing", "website", "nieuwsbrief", "social media", "advertenties"],
  },
  {
    slug: "austin-schrader",
    naam: "Austin Schrader",
    functie: "Junior online marketeer",
    afd: "marketing-communicatie",
    email: "aschrader@stadstheater.nl",
    trefwoorden: ["online marketing", "social media"],
  },
  {
    slug: "maya-mengerink",
    naam: "Maya Mengerink",
    functie: "Marketingassistent",
    afd: "marketing-communicatie",
    email: "mmengerink@stadstheater.nl",
    trefwoorden: ["marketing"],
  },
  {
    slug: "naomi-celina-vrancken",
    naam: "Naomi Celina Vrancken",
    functie: "Marketingassistent",
    afd: "marketing-communicatie",
    email: "nvrancken@stadstheater.nl",
    foto: `${FOTO}/2025/12/Naomi-Celina-Vrancken-vierkant-LR-EDIT-768x768.jpg`,
    trefwoorden: ["marketing"],
  },
  {
    slug: "nerena-lobel",
    naam: "Nerena Lobel",
    functie: "Marketingassistent",
    afd: "marketing-communicatie",
    email: "nlobel@stadstheater.nl",
    foto: `${FOTO}/2025/12/Nerena-Lobel-vierkant-LR-768x768.jpg`,
    trefwoorden: ["marketing"],
  },
  {
    slug: "lieke-van-der-meer",
    naam: "Lieke van der Meer",
    functie: "Stagiaire marketing",
    afd: "marketing-communicatie",
    email: "marketing@stadstheater.nl",
    trefwoorden: ["stage"],
  },
  {
    slug: "lobke-spies",
    naam: "Lobke Spies",
    functie: "Coördinator educatie en participatie",
    afd: "educatie",
    email: "lspies@stadstheater.nl",
    trefwoorden: ["educatie", "participatie", "scholen"],
  },
  {
    slug: "zayira-graves",
    naam: "Zayira Graves",
    functie: "Medewerker educatie",
    afd: "educatie",
    email: "zgraves@stadstheater.nl",
    foto: `${FOTO}/2025/12/Zayira-Graves-vierkant-LR-768x768.jpg`,
    trefwoorden: ["educatie", "scholen"],
  },
  {
    slug: "jeffrey-van-dijk",
    naam: "Jeffrey van Dijk",
    functie: "Operationeel manager",
    afd: "horeca-sales-events",
    email: "horeca@stadstheater.nl",
    foto: `${FOTO}/2025/12/Jeffrey-van-Dijk-vierkant-LR-768x768.jpg`,
    trefwoorden: ["horeca", "operatie"],
  },
  {
    slug: "anouk-van-der-ploeg",
    naam: "Anouk van der Ploeg",
    functie: "Contactpersoon zakelijk",
    afd: "horeca-sales-events",
    email: "sales@stadstheater.nl",
    telefoon: "088 220 70 60",
    foto: `${FOTO}/2022/07/Anouk-van-der-Ploeg-Vierkant-LR-2-768x768.jpg`,
    trefwoorden: ["zakelijke verhuur", "zaalhuur", "vergaderen", "bedrijfsevenementen"],
  },
  {
    slug: "kerstin-teunissen",
    naam: "Kerstin Teunissen",
    functie: "Coördinator vrijwilligers en culturele verhuur",
    afd: "horeca-sales-events",
    email: "kerstin@stadstheater.nl",
    foto: `${FOTO}/2025/12/Kerstin-Teunissen-Vierkant-LR-3-768x768.jpg`,
    trefwoorden: ["vrijwilligers", "culturele verhuur"],
  },
  {
    slug: "tommy-everts",
    naam: "Tommy Everts",
    functie: "Manager techniek",
    afd: "techniek",
    email: "teverts@stadstheater.nl",
    trefwoorden: ["techniek"],
  },
  {
    slug: "sandra-schenke",
    naam: "Sandra Schenke",
    functie: "Planner techniek",
    afd: "techniek",
    email: "sschenke@stadstheater.nl",
    trefwoorden: ["technische planning", "rooster techniek"],
  },
  {
    slug: "deen-sonneveldt",
    naam: "Deen Sonneveldt",
    functie: "Voorzitter Raad van Toezicht",
    afd: "raad-van-toezicht",
    foto: `${FOTO}/2026/01/Deen-vierkant-LR-768x768.jpg`,
  },
  {
    slug: "kishan-shantiprekash",
    naam: "Kishan Shantiprekash",
    functie: "Lid Raad van Toezicht",
    afd: "raad-van-toezicht",
    foto: `${FOTO}/2026/01/Kishan-Shantiprekash-vierkant-LR-768x768.jpg`,
  },
  {
    slug: "lars-blommers",
    naam: "Lars Blommers",
    functie: "Lid Raad van Toezicht",
    afd: "raad-van-toezicht",
    foto: `${FOTO}/2026/01/Lars-Blommers-vierkant-LR-768x768.jpg`,
  },
  {
    slug: "mechteld-bannier",
    naam: "Mechteld Bannier",
    functie: "Lid Raad van Toezicht",
    afd: "raad-van-toezicht",
    foto: `${FOTO}/2026/01/Mechteld-Bannier-vierkant-LR-768x768.jpg`,
  },
  {
    slug: "saar-spanjaard",
    naam: "Saar Spanjaard",
    functie: "Lid Raad van Toezicht",
    afd: "raad-van-toezicht",
    foto: `${FOTO}/2026/01/Saar-Spanjaard-vierkant-LR-1-768x768.jpg`,
  },
];

/** Leden vallen onder het hoofd van hun afdeling, hoofden onder de directeur. De RvT staat erbuiten. */
function leidinggevendeVoor(rij: Rij): string | null {
  const id = `p-${rij.slug}`;
  const afdeling = AFDELINGEN.find((a) => a.slug === rij.afd)!;
  if (afdeling.soort === "toezicht") return null;
  if (afdeling.hoofd_id && afdeling.hoofd_id !== id) return afdeling.hoofd_id;
  return id === "p-charles-droste" ? null : "p-charles-droste";
}

export function startData(): Smoelenboek {
  const personen: Persoon[] = RIJEN.map((rij, i) => ({
    id: `p-${rij.slug}`,
    slug: rij.slug,
    naam: rij.naam,
    functie: rij.functie,
    afdeling_id: `afd-${rij.afd}`,
    extra_afdeling_ids: [],
    leidinggevende_id: leidinggevendeVoor(rij),
    foto_pad: null,
    foto_url: rij.foto ?? null,
    email: rij.email ?? null,
    telefoon: rij.telefoon ?? null,
    mobiel: null,
    werkdagen: [],
    werkplek: null,
    trefwoorden: rij.trefwoorden ?? [],
    over_mij: null,
    in_dienst_sinds: null,
    talen: [],
    volgorde: i + 1,
    zichtbaar: true,
    bijgewerkt_op: BEGIN,
  }));

  return {
    versie: 1,
    afdelingen: structuredClone(AFDELINGEN),
    personen,
    zoekwoorden: STANDAARD_ZOEKWOORDEN.map((woorden, i) => ({ id: `zw-${i + 1}`, woorden: [...woorden] })),
  };
}
