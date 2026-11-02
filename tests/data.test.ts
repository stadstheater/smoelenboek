import { beforeEach, describe, expect, it } from "vitest";
import * as data from "@/lib/data";
import { lees } from "@/lib/opslag";
import { leesCsv } from "@/lib/csv";
import { aandachtspunten, keten, ledenVan, leidinggevendeMaaktRondje, organigram, team } from "@/lib/hierarchie";
import { startData } from "@/lib/startdata";
import { controleerBackup } from "@/lib/validatie";

beforeEach(() => {
  delete (globalThis as { __smoelenboekOpslag?: unknown }).__smoelenboekOpslag;
});

describe("hiërarchie", () => {
  const d = startData();
  it("weigert rondjes", () => {
    expect(leidinggevendeMaaktRondje(d.personen, "p-charles-droste", "p-sandra-schenke")).toBe(true);
    expect(leidinggevendeMaaktRondje(d.personen, "p-sandra-schenke", "p-sandra-schenke")).toBe(true);
    expect(leidinggevendeMaaktRondje(d.personen, "p-sandra-schenke", "p-karin-beukers")).toBe(false);
  });
  it("geeft keten en team", () => {
    expect(keten(d.personen, "p-sandra-schenke").map((p) => p.id)).toEqual(["p-tommy-everts", "p-charles-droste"]);
    expect(team(d.personen, "p-tommy-everts").map((p) => p.id)).toEqual(["p-sandra-schenke"]);
  });
  it("zet het hoofd bovenaan in de afdeling", () => {
    const afd = d.afdelingen.find((a) => a.slug === "marketing-communicatie")!;
    expect(ledenVan(afd, d.personen)[0].id).toBe("p-karin-beukers");
  });
  it("bouwt een organigram met de directeur en de RvT los", () => {
    const wortels = organigram(d.personen);
    expect(wortels.map((k) => k.persoon.id)).toContain("p-charles-droste");
    const charles = wortels.find((k) => k.persoon.id === "p-charles-droste")!;
    expect(charles.kinderen.map((k) => k.persoon.id)).toContain("p-tommy-everts");
  });
  it("noemt aandachtspunten", () => {
    const punten = aandachtspunten(d.personen, d.afdelingen);
    expect(punten.some((p) => p.persoon_id === "p-tommy-everts" && p.tekst === "heeft geen foto")).toBe(true);
    expect(punten.some((p) => p.persoon_id === "p-deen-sonneveldt" && p.tekst === "heeft geen leidinggevende")).toBe(false);
  });
});

describe("gegevens wijzigen", () => {
  it("voegt een persoon toe met een unieke slug", async () => {
    const p = await data.slaPersoonOp({ naam: "Anita Savans", functie: "Test", afdeling_id: "afd-techniek", leidinggevende_id: "p-tommy-everts", zichtbaar: true });
    expect(p.slug).toBe("anita-savans-2");
    expect((await lees()).personen.some((x) => x.id === p.id)).toBe(true);
  });
  it("weigert een rondje bij opslaan", async () => {
    await expect(data.slaPersoonOp({ naam: "Charles Droste", functie: "Directeur", leidinggevende_id: "p-sandra-schenke", zichtbaar: true }, "p-charles-droste")).rejects.toThrow(/leidinggevende/);
  });
  it("laat het team doorschuiven als iemand vertrekt", async () => {
    await data.verwijderPersoon("p-tommy-everts");
    const d = await lees();
    expect(d.personen.find((p) => p.id === "p-sandra-schenke")!.leidinggevende_id).toBe("p-charles-droste");
    expect(d.afdelingen.find((a) => a.id === "afd-techniek")!.hoofd_id).toBeNull();
  });
  it("haalt een afdeling weg zonder losse verwijzingen", async () => {
    await data.verwijderAfdeling("afd-techniek");
    const d = await lees();
    expect(d.personen.find((p) => p.id === "p-sandra-schenke")!.afdeling_id).toBeNull();
  });
  it("controleert e-mailadressen", async () => {
    await expect(data.slaPersoonOp({ naam: "X", email: "geen-mail", zichtbaar: true })).rejects.toThrow(/e-mailadres/);
  });
  it("zet de volgorde", async () => {
    await data.zetVolgorde("personen", ["p-sandra-schenke", "p-tommy-everts"]);
    const d = await lees();
    const s = d.personen.find((p) => p.id === "p-sandra-schenke")!;
    const t = d.personen.find((p) => p.id === "p-tommy-everts")!;
    expect(s.volgorde).toBeLessThan(t.volgorde);
  });
});

describe("import en back-up", () => {
  it("leest CSV met puntkomma en aanhalingstekens", () => {
    const rijen = leesCsv('﻿Naam;Functie;E-mail\n"Jan; de Vries";Technicus;jan@stadstheater.nl\n');
    expect(rijen).toEqual([{ naam: "Jan; de Vries", functie: "Technicus", e_mail: "jan@stadstheater.nl" }]);
  });
  it("doet eerst een voorstel en slaat pas op bij uitvoeren", async () => {
    const rijen = leesCsv(
      "naam;functie;afdeling;leidinggevende;email;werkdagen;trefwoorden\n" +
        "Piet Licht;Technicus;Techniek;Tommy Everts;piet@stadstheater.nl;ma, di, vrijdag;licht, geluid\n" +
        "Anouk van der Ploeg;Contactpersoon zakelijk;;;;;zaalhuur, vergaderen, catering\n" +
        "Nieuwe Collega;ICT-medewerker;ICT & gebouwbeheer;;;;\n",
    );
    const voorstel = await data.importeer(rijen, false);
    expect(voorstel.nieuw.map((n) => n.naam)).toEqual(["Piet Licht", "Nieuwe Collega"]);
    expect(voorstel.bijgewerkt.map((b) => b.naam)).toEqual(["Anouk van der Ploeg"]);
    expect((await lees()).personen.some((p) => p.naam === "Piet Licht")).toBe(false);

    await data.importeer(rijen, true);
    const d = await lees();
    const piet = d.personen.find((p) => p.naam === "Piet Licht")!;
    expect(piet.leidinggevende_id).toBe("p-tommy-everts");
    expect(piet.werkdagen).toEqual(["ma", "di", "vr"]);
    expect(d.personen.find((p) => p.naam === "Anouk van der Ploeg")!.trefwoorden).toContain("catering");
  });
  it("controleert een back-up", () => {
    expect(() => controleerBackup({ hallo: 1 })).toThrow(/back-up/);
    const b = controleerBackup(JSON.parse(JSON.stringify(startData())));
    expect(b.personen.length).toBe(27);
  });
});

import { fotoAdressen, persoonlijkAdres } from "@/lib/foto";

describe("foto en e-mail", () => {
  it("herkent persoonlijke en gedeelde adressen", () => {
    expect(persoonlijkAdres("cdroste@stadstheater.nl", "Charles Droste")).toBe(true);
    expect(persoonlijkAdres("lvangaalen@stadstheater.nl", "Lotte van Gaalen")).toBe(true);
    expect(persoonlijkAdres("sales@stadstheater.nl", "Anouk van der Ploeg")).toBe(false);
    expect(persoonlijkAdres("servicebalie@stadstheater.nl", "Anita Savans")).toBe(false);
  });
  it("kiest de juiste maat van een websitefoto", () => {
    const f = fotoAdressen({ foto_pad: null, foto_url: "https://stadstheater.nl/assets/uploads/2025/12/Charles-Droste-vierkant-LR-768x768.jpg" });
    expect(f.foto_klein).toMatch(/-300x300\.jpg$/);
    expect(f.foto_groot).toMatch(/-768x768\.jpg$/);
    expect(fotoAdressen({ foto_pad: "fotos/abc.jpg", foto_url: null }).foto_klein).toBe("/api/foto/fotos/abc.jpg");
  });
});
