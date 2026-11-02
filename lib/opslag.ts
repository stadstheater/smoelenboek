import "server-only";
import { BlobNotFoundError, BlobPreconditionFailedError, del, get, head, put } from "@vercel/blob";
import { isDemo } from "@/lib/config";
import { startData } from "@/lib/startdata";
import type { Smoelenboek } from "@/lib/types";

export type Opslag = Smoelenboek;

const DATA_PAD = "data/smoelenboek.json";

export class ConflictFout extends Error {
  constructor() {
    super("Iemand anders paste tegelijk iets aan. Probeer het nog een keer.");
  }
}

type Backend = {
  lees(): Promise<{ data: Opslag; etag: string | null }>;
  /** Schrijft alleen als de etag nog klopt; anders ConflictFout */
  schrijf(data: Opslag, etag: string | null): Promise<void>;
};

// ---------- Vercel Blob ----------

const blobBackend: Backend = {
  async lees() {
    // De etag komt uit head(): dat is dezelfde bron die put() bij ifMatch vergelijkt.
    // De etag-header van get() wijkt daar in productie van af, waardoor elke schrijfpoging als conflict gold.
    // Eerst head, dan get: verandert het bestand tussendoor, dan faalt de schrijfpoging veilig en proberen we opnieuw.
    const meta = await head(DATA_PAD).catch((e) => {
      if (e instanceof BlobNotFoundError) return null;
      throw e;
    });
    if (!meta) return { data: startData(), etag: null };
    const res = await get(DATA_PAD, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) throw new Error("De opgeslagen gegevens konden niet worden gelezen.");
    const data = (await new Response(res.stream).json()) as Opslag;
    return { data, etag: meta.etag };
  },
  async schrijf(data, etag) {
    try {
      await put(DATA_PAD, JSON.stringify(data), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        cacheControlMaxAge: 60,
        // Eerste keer: alleen aanmaken als hij nog niet bestaat. Daarna: alleen als niemand anders tussendoor schreef.
        ...(etag ? { allowOverwrite: true, ifMatch: etag } : { allowOverwrite: false }),
      });
    } catch (e) {
      if (e instanceof BlobPreconditionFailedError || (!etag && e instanceof Error && /already exists/i.test(e.message))) {
        throw new ConflictFout();
      }
      throw e;
    }
  },
};

// ---------- In het geheugen (demomodus en tests) ----------

export function geheugenBackend(begin: () => Opslag): Backend {
  const g = globalThis as unknown as { __smoelenboekOpslag?: { data: Opslag; versie: number } };
  return {
    async lees() {
      g.__smoelenboekOpslag ??= { data: begin(), versie: 1 };
      return { data: structuredClone(g.__smoelenboekOpslag.data), etag: String(g.__smoelenboekOpslag.versie) };
    },
    async schrijf(data, etag) {
      if (g.__smoelenboekOpslag && etag !== String(g.__smoelenboekOpslag.versie)) throw new ConflictFout();
      g.__smoelenboekOpslag = { data: structuredClone(data), versie: (g.__smoelenboekOpslag?.versie ?? 0) + 1 };
    },
  };
}

let backend: Backend = isDemo ? geheugenBackend(startData) : blobBackend;

/** Alleen voor tests */
export function zetBackend(nieuw: Backend) {
  backend = nieuw;
}

export async function lees(): Promise<Opslag> {
  return (await backend.lees()).data;
}

/**
 * Lezen, aanpassen en terugschrijven. Schreef iemand anders tussendoor,
 * dan opnieuw proberen met de nieuwste versie, zodat er niets verloren gaat.
 */
export async function wijzig<T>(aanpassing: (data: Opslag) => T | Promise<T>): Promise<T> {
  for (let poging = 1; ; poging++) {
    const { data, etag } = await backend.lees();
    const resultaat = await aanpassing(data);
    try {
      await backend.schrijf(data, etag);
      return resultaat;
    } catch (e) {
      if (!(e instanceof ConflictFout) || poging >= 4) throw e;
    }
  }
}

// ---------- Bestanden en beelden ----------

export async function bewaarBestand(pad: string, inhoud: Buffer | Blob, contentType: string) {
  if (isDemo) return;
  await put(pad, inhoud, { access: "private", contentType, addRandomSuffix: false, allowOverwrite: true });
}

export async function haalBestand(pad: string) {
  if (isDemo) return null;
  const res = await get(pad, { access: "private" });
  return res && res.statusCode === 200 ? res : null;
}

export async function verwijderBestanden(paden: (string | null | undefined)[]) {
  const echt = paden.filter((p): p is string => !!p);
  if (isDemo || !echt.length) return;
  await del(echt).catch(() => {});
}
