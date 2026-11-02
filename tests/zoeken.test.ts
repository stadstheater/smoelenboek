import { describe, expect, it } from "vitest";
import { startData } from "@/lib/startdata";
import { maakZoeker } from "@/lib/zoeken";
import { afstand, normaliseer, stam } from "@/lib/zoeken/normaliseer";
import { parseZoekvraag } from "@/lib/zoeken/parse";

const data = startData();
const zoek = maakZoeker(data);
const namen = (q: string, n = 50) => zoek(q).personen.slice(0, n).map((r) => r.persoon.naam);

describe("normaliseren", () => {
  it("haalt accenten en hoofdletters weg", () => {
    expect(normaliseer("Léon Molendijk")).toBe("leon molendijk");
    expect(normaliseer("Coördinator Educatie & Participatie")).toBe("coordinator educatie en participatie");
  });
  it("stamt meervoud en verkleinwoord", () => {
    expect(stam("kaarten")).toBe(stam("kaart"));
    expect(stam("tickets")).toBe(stam("ticket"));
    expect(stam("kaartjes")).toBe("kaar");
  });
  it("telt omgewisselde letters als één fout", () => {
    expect(afstand("charels", "charles")).toBe(1);
  });
});

describe("zoekregel lezen", () => {
  it("haalt vraagwoorden weg", () => {
    expect(parseZoekvraag("Wie gaat over de nieuwsbrief?").woorden).toEqual(["nieuwsbrief"]);
  });
  it("leest filters, zinnen en uitsluitingen", () => {
    const v = parseZoekvraag('marketing afdeling:"marketing & communicatie" -stagiaire "online marketing" dag:vr');
    expect(v.woorden).toEqual(["marketing"]);
    expect(v.afdeling).toEqual(["marketing en communicatie"]);
    expect(v.zonder).toEqual(["stagiaire"]);
    expect(v.zinnen).toEqual(["online marketing"]);
    expect(v.dag).toEqual(["vr"]);
  });
});

describe("zoeken", () => {
  it("vindt een naam zonder accent", () => {
    expect(namen("leon", 1)).toEqual(["Léon Molendijk"]);
  });
  it("vindt een naam met een typfout", () => {
    expect(namen("charels", 1)).toEqual(["Charles Droste"]);
    expect(namen("jefrey", 1)).toEqual(["Jeffrey van Dijk"]);
  });
  it("vindt iemand terwijl je nog typt", () => {
    expect(namen("anou", 1)).toEqual(["Anouk van der Ploeg"]);
  });
  it("vindt aan elkaar getypte namen", () => {
    expect(namen("vanderploeg", 1)).toEqual(["Anouk van der Ploeg"]);
  });
  it("vindt initialen", () => {
    expect(namen("cd", 1)).toEqual(["Charles Droste"]);
  });
  it("vindt zaalhuur bij zakelijk", () => {
    expect(namen("zaalhuur", 1)).toEqual(["Anouk van der Ploeg"]);
    expect(namen("zaalhuur", 3)).toEqual(expect.arrayContaining(["Jeffrey van Dijk", "Kerstin Teunissen"]));
  });
  it("begrijpt een hele vraag over een bedrijfsborrel", () => {
    const top = namen("Bij wie moet ik zijn voor een bedrijfsborrel?", 2);
    expect(top).toEqual(expect.arrayContaining(["Anouk van der Ploeg", "Jeffrey van Dijk"]));
  });
  it("vindt de nieuwsbrief bij marketing", () => {
    const r = zoek("wie gaat over de nieuwsbrief");
    expect(r.personen[0].persoon.naam).toBe("Scottey Mouris");
    expect(r.personen.every((x) => x.persoon.afdeling_id === "afd-marketing-communicatie")).toBe(true);
  });
  it("vindt licht bij techniek, met het hoofd eerst", () => {
    expect(namen("licht", 2)).toEqual(["Tommy Everts", "Sandra Schenke"]);
  });
  it("vindt via synoniemen: kaartjes bij de servicebalie", () => {
    const top = namen("kaartjes", 3);
    expect(top[0]).toBe("Jolanda van Soest");
    expect(top).toEqual(expect.arrayContaining(["Anita Savans", "Daphne de Wilde-Hogeboom"]));
  });
  it("vindt een stuk van een telefoonnummer", () => {
    expect(namen("7060", 1)).toEqual(["Anouk van der Ploeg"]);
  });
  it("filtert op afdeling", () => {
    expect(namen("afdeling:techniek")).toEqual(["Tommy Everts", "Sandra Schenke"]);
  });
  it("filtert op functie", () => {
    expect(namen("functie:manager").sort()).toEqual(["Jeffrey van Dijk", "Karin Beukers", "Tommy Everts"]);
  });
  it("sluit woorden uit", () => {
    const r = namen("marketing -assistent -stagiaire");
    expect(r).not.toContain("Maya Mengerink");
    expect(r).not.toContain("Lieke van der Meer");
    expect(r).toContain("Lotte van Gaalen");
  });
  it("geeft uitleg waarom iemand gevonden is", () => {
    const r = zoek("bedrijfsborrel").personen.find((x) => x.persoon.naam === "Anouk van der Ploeg")!;
    expect(r.redenen[0].via).toBe("bedrijfsborrel");
  });
  it("toont afdelingen, ook zonder mensen", () => {
    const r = zoek("laptop kapot");
    expect(r.afdelingen[0].afdeling.naam).toBe("ICT & gebouwbeheer");
    expect(r.afdelingen[0].aantal).toBe(0);
  });
  it("vindt facturen bij de financiële administratie", () => {
    expect(namen("factuur", 1)).toEqual(["Léon Molendijk"]);
  });
  it("stelt een correctie voor als er niets is", () => {
    const r = zoek("vrijwiligerz");
    expect(r.personen[0]?.persoon.naam ?? r.suggestie).toBeTruthy();
    expect(zoek("qqqqzzzz").personen).toEqual([]);
  });
  it("vindt niemand bij onzin", () => {
    expect(zoek("xyzxyz").personen).toEqual([]);
  });
});
