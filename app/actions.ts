"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { pincode } from "@/lib/config";
import { leesCsv } from "@/lib/csv";
import * as data from "@/lib/data";
import { vereisBeheer, vereisToegang } from "@/lib/toegang";
import {
  BEHEER_COOKIE,
  BEHEER_DUUR,
  beheerWaarde,
  juistePincode,
  juistWachtwoord,
  SESSIE_COOKIE,
  SESSIE_DUUR,
  sessieWaarde,
} from "@/lib/wachtwoord";

export type FormStatus = { fout?: string; ok?: boolean; id?: string; slug?: string };

function ververs() {
  revalidatePath("/", "layout");
}

function foutTekst(e: unknown) {
  return e instanceof Error ? e.message : "Er ging iets mis. Probeer het nog een keer.";
}

const cookieOpties = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

// ---------- Inloggen met het teamwachtwoord ----------

export async function loginActie(_vorige: FormStatus, formData: FormData): Promise<FormStatus> {
  const invoer = String(formData.get("wachtwoord") ?? "");
  if (!juistWachtwoord(invoer)) {
    // Even wachten maakt raden onaantrekkelijk
    await new Promise((r) => setTimeout(r, 1_000));
    return { fout: "Dat wachtwoord klopt niet." };
  }
  (await cookies()).set(SESSIE_COOKIE, await sessieWaarde(), { ...cookieOpties, maxAge: SESSIE_DUUR });
  redirect("/");
}

export async function uitloggenActie() {
  const jar = await cookies();
  jar.delete(SESSIE_COOKIE);
  jar.delete(BEHEER_COOKIE);
  redirect("/login");
}

// ---------- Pincode voor het beheer ----------

/** Foute pogingen per IP-adres. Na 5 fouten is de pincode 15 minuten dicht voor dat adres. */
const pogingen = new Map<string, { aantal: number; tot: number }>();
const MAX_POGINGEN = 5;
const BLOKKADE = 15 * 60 * 1000;

async function bezoeker() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "onbekend";
}

export async function pincodeActie(_vorige: FormStatus, formData: FormData): Promise<FormStatus> {
  await vereisToegang();
  if (!pincode) return { fout: "Het beheer is nog niet ingesteld. Zet BEHEER_PINCODE in Vercel." };

  const ip = await bezoeker();
  const nu = Date.now();
  const stand = pogingen.get(ip);
  if (stand && stand.aantal >= MAX_POGINGEN && stand.tot > nu) {
    const minuten = Math.ceil((stand.tot - nu) / 60_000);
    return { fout: `Te vaak een verkeerde pincode. Probeer het over ${minuten} ${minuten === 1 ? "minuut" : "minuten"} opnieuw.` };
  }

  if (!juistePincode(String(formData.get("pincode") ?? ""))) {
    await new Promise((r) => setTimeout(r, 800));
    const aantal = (stand && stand.tot > nu ? stand.aantal : 0) + 1;
    pogingen.set(ip, { aantal, tot: nu + BLOKKADE });
    const over = MAX_POGINGEN - aantal;
    return { fout: over > 0 ? `Die pincode klopt niet. Nog ${over} ${over === 1 ? "poging" : "pogingen"}.` : "Die pincode klopt niet. Het beheer is 15 minuten dicht." };
  }

  pogingen.delete(ip);
  (await cookies()).set(BEHEER_COOKIE, await beheerWaarde(), { ...cookieOpties, maxAge: BEHEER_DUUR });
  ververs();
  const naar = String(formData.get("naar") ?? "");
  return { ok: true, slug: naar.startsWith("/beheer") ? naar : "" };
}

export async function beheerVerlatenActie() {
  (await cookies()).delete(BEHEER_COOKIE);
  ververs();
  redirect("/");
}

// ---------- Personen ----------

function persoonUitFormulier(formData: FormData): Record<string, unknown> {
  const json = (veld: string) => {
    try {
      return JSON.parse(String(formData.get(veld) ?? "[]"));
    } catch {
      return [];
    }
  };
  return {
    naam: formData.get("naam"),
    slug: formData.get("slug"),
    functie: formData.get("functie"),
    afdeling_id: formData.get("afdeling_id"),
    extra_afdeling_ids: formData.getAll("extra_afdeling_ids"),
    leidinggevende_id: formData.get("leidinggevende_id"),
    foto_pad: formData.get("foto_pad"),
    foto_url: formData.get("foto_url"),
    email: formData.get("email"),
    telefoon: formData.get("telefoon"),
    mobiel: formData.get("mobiel"),
    werkdagen: formData.getAll("werkdagen"),
    werkplek: formData.get("werkplek"),
    trefwoorden: json("trefwoorden"),
    over_mij: formData.get("over_mij"),
    in_dienst_sinds: formData.get("in_dienst_sinds"),
    talen: json("talen"),
    volgorde: formData.get("volgorde"),
    zichtbaar: formData.get("zichtbaar") === "on",
  };
}

export async function slaPersoonOpActie(_vorige: FormStatus, formData: FormData): Promise<FormStatus> {
  try {
    await vereisBeheer();
    const id = String(formData.get("id") ?? "") || undefined;
    const p = await data.slaPersoonOp(persoonUitFormulier(formData), id);
    ververs();
    return { ok: true, id: p.id, slug: p.slug };
  } catch (e) {
    return { fout: foutTekst(e) };
  }
}

export async function verwijderPersoonActie(id: string): Promise<FormStatus> {
  try {
    await vereisBeheer();
    await data.verwijderPersoon(id);
    ververs();
    return { ok: true };
  } catch (e) {
    return { fout: foutTekst(e) };
  }
}

export async function wijzigPlaatsActie(
  id: string,
  wijziging: { leidinggevende_id?: string | null; afdeling_id?: string | null; zichtbaar?: boolean },
): Promise<FormStatus> {
  try {
    await vereisBeheer();
    await data.wijzigPlaats(id, wijziging);
    ververs();
    return { ok: true };
  } catch (e) {
    return { fout: foutTekst(e) };
  }
}

export async function zetVolgordeActie(soort: "personen" | "afdelingen", ids: string[]): Promise<FormStatus> {
  try {
    await vereisBeheer();
    await data.zetVolgorde(soort, ids.map(String).slice(0, 1000));
    ververs();
    return { ok: true };
  } catch (e) {
    return { fout: foutTekst(e) };
  }
}

// ---------- Afdelingen ----------

export async function slaAfdelingOpActie(_vorige: FormStatus, formData: FormData): Promise<FormStatus> {
  try {
    await vereisBeheer();
    const id = String(formData.get("id") ?? "") || undefined;
    let trefwoorden: unknown = [];
    try {
      trefwoorden = JSON.parse(String(formData.get("trefwoorden") ?? "[]"));
    } catch {}
    const a = await data.slaAfdelingOp(
      {
        naam: formData.get("naam"),
        slug: formData.get("slug"),
        beschrijving: formData.get("beschrijving"),
        parent_id: formData.get("parent_id"),
        hoofd_id: formData.get("hoofd_id"),
        volgorde: formData.get("volgorde"),
        soort: formData.get("soort"),
        trefwoorden,
      },
      id,
    );
    ververs();
    return { ok: true, id: a.id, slug: a.slug };
  } catch (e) {
    return { fout: foutTekst(e) };
  }
}

export async function verwijderAfdelingActie(id: string): Promise<FormStatus> {
  try {
    await vereisBeheer();
    await data.verwijderAfdeling(id);
    ververs();
    return { ok: true };
  } catch (e) {
    return { fout: foutTekst(e) };
  }
}

// ---------- Zoekwoorden ----------

export async function slaZoekwoordenOpActie(groepen: { id: string; woorden: string[] }[]): Promise<FormStatus> {
  try {
    await vereisBeheer();
    await data.slaZoekwoordenOp(groepen);
    ververs();
    return { ok: true };
  } catch (e) {
    return { fout: foutTekst(e) };
  }
}

// ---------- Import en back-up ----------

export async function importActie(csv: string, uitvoeren: boolean): Promise<{ fout?: string; voorstel?: data.ImportVoorstel }> {
  try {
    await vereisBeheer();
    if (csv.length > 2_000_000) return { fout: "Dit bestand is te groot (maximaal 2 MB)." };
    const rijen = leesCsv(csv);
    if (!rijen.length) return { fout: "Geen rijen gevonden. Staat de kopregel (naam;functie;afdeling...) bovenaan?" };
    if (rijen.length > 1000) return { fout: "Maximaal 1000 rijen per keer." };
    const voorstel = await data.importeer(rijen, uitvoeren);
    if (uitvoeren) ververs();
    return { voorstel };
  } catch (e) {
    return { fout: foutTekst(e) };
  }
}

export async function backupTerugzettenActie(json: string): Promise<FormStatus> {
  try {
    await vereisBeheer();
    if (json.length > 5_000_000) return { fout: "Dit bestand is te groot." };
    await data.zetBackupTerug(JSON.parse(json));
    ververs();
    return { ok: true };
  } catch (e) {
    return { fout: e instanceof SyntaxError ? "Dit is geen geldig JSON-bestand." : foutTekst(e) };
  }
}
