"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { uploadPresigned } from "@vercel/blob/client";
import { ArrowLeft, ImageUp, Link2, Save, Trash2, X } from "lucide-react";
import { slaPersoonOpActie, verwijderPersoonActie, type FormStatus } from "@/app/actions";
import { TrefwoordInvoer } from "@/components/beheer/TrefwoordInvoer";
import { PersoonKaart } from "@/components/PersoonKaart";
import { useShell } from "@/components/shell/AppShell";
import { useToast } from "@/components/shell/Toasts";
import { fotoAdressen } from "@/lib/foto";
import { leidinggevendeMaaktRondje } from "@/lib/hierarchie";
import { DAGEN, type Dag, type PersoonWeergave } from "@/lib/types";

const TALEN = ["Nederlands", "Engels", "Duits", "Frans", "Spaans", "Italiaans", "Portugees", "Pools", "Turks", "Arabisch", "Papiaments", "Gebarentaal"];

/** Maakt van elke foto een vierkante JPEG van 800 pixels; bij staande foto's blijft het bovenste deel (het gezicht) staan */
async function maakVierkant(bestand: File): Promise<Blob> {
  const url = URL.createObjectURL(bestand);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const zijde = Math.min(img.naturalWidth, img.naturalHeight);
    const x = (img.naturalWidth - zijde) / 2;
    const y = (img.naturalHeight - zijde) * 0.2;
    const doel = Math.min(800, zijde);
    const canvas = document.createElement("canvas");
    canvas.width = doel;
    canvas.height = doel;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, x, y, zijde, zijde, 0, 0, doel, doel);
    return await new Promise<Blob>((klaar, fout) => canvas.toBlob((b) => (b ? klaar(b) : fout(new Error("Omzetten mislukt"))), "image/jpeg", 0.86));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Veld({ label, hint, children, breed = false }: { label: string; hint?: string; children: React.ReactNode; breed?: boolean }) {
  return (
    <label className={`block ${breed ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-inkt-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-inkt-4">{hint}</span>}
    </label>
  );
}

export function PersoonFormulier({ persoonId, isDemo }: { persoonId: string | null; isDemo: boolean }) {
  const { gegevens, afdelingOpId } = useShell();
  const router = useRouter();
  const toast = useToast();
  const bestaand = persoonId ? gegevens.personen.find((p) => p.id === persoonId) : undefined;
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(slaPersoonOpActie, {});
  const [verwijderen, startVerwijderen] = useTransition();
  const bestandInvoer = useRef<HTMLInputElement>(null);

  const [naam, setNaam] = useState(bestaand?.naam ?? "");
  const [functie, setFunctie] = useState(bestaand?.functie ?? "");
  const [afdelingId, setAfdelingId] = useState(bestaand?.afdeling_id ?? "");
  const [extra, setExtra] = useState<string[]>(bestaand?.extra_afdeling_ids ?? []);
  const [leidinggevendeId, setLeidinggevendeId] = useState(bestaand?.leidinggevende_id ?? "");
  const [werkdagen, setWerkdagen] = useState<Dag[]>(bestaand?.werkdagen ?? []);
  const [trefwoorden, setTrefwoorden] = useState<string[]>(bestaand?.trefwoorden ?? []);
  const [talen, setTalen] = useState<string[]>(bestaand?.talen ?? []);
  const [foto, setFoto] = useState({ pad: bestaand?.foto_pad ?? null, url: bestaand?.foto_url ?? null, voorbeeld: bestaand?.foto_groot ?? null });
  const [toonUrl, setToonUrl] = useState(false);
  const [uploaden, setUploaden] = useState(false);
  const [fout, setFout] = useState("");

  useEffect(() => {
    if (!status.ok) return;
    toast(bestaand ? "Opgeslagen" : `${naam} staat in het smoelenboek`);
    router.push("/beheer");
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Bij een nieuwe persoon in een afdeling: standaard het hoofd als leidinggevende
  function kiesAfdeling(id: string) {
    setAfdelingId(id);
    setExtra((oud) => oud.filter((x) => x !== id));
    const hoofd = afdelingOpId.get(id)?.hoofd_id;
    if (!bestaand && !leidinggevendeId && hoofd) setLeidinggevendeId(hoofd);
  }

  const mogelijkeLeidinggevenden = useMemo(
    () =>
      [...gegevens.personen]
        .filter((p) => p.id !== persoonId && !(persoonId && leidinggevendeMaaktRondje(gegevens.personen, persoonId, p.id)))
        .sort((a, b) => a.naam.localeCompare(b.naam, "nl")),
    [gegevens.personen, persoonId],
  );

  const alleTrefwoorden = useMemo(
    () => [...new Set([...gegevens.personen.flatMap((p) => p.trefwoorden), ...gegevens.afdelingen.flatMap((a) => a.trefwoorden)])].sort((a, b) => a.localeCompare(b, "nl")),
    [gegevens],
  );
  const afdelingTrefwoorden = afdelingOpId.get(afdelingId)?.trefwoorden ?? [];

  async function kiesFoto(bestand: File) {
    setFout("");
    if (!bestand.type.startsWith("image/")) return setFout("Kies een foto (jpg, png of webp).");
    if (bestand.size > 25 * 1024 * 1024) return setFout("Deze foto is te groot (maximaal 25 MB).");
    setUploaden(true);
    try {
      const vierkant = await maakVierkant(bestand);
      const voorbeeld = URL.createObjectURL(vierkant);
      if (isDemo) {
        setFoto({ pad: null, url: foto.url, voorbeeld });
        toast("Demomodus: de foto wordt niet echt opgeslagen");
        return;
      }
      const pad = `fotos/${crypto.randomUUID()}.jpg`;
      await uploadPresigned(pad, vierkant, { access: "private", handleUploadUrl: "/api/upload", contentType: "image/jpeg" });
      setFoto({ pad, url: null, voorbeeld });
    } catch (e) {
      setFout(`Uploaden mislukt: ${e instanceof Error ? e.message : "onbekende fout"}`);
    } finally {
      setUploaden(false);
    }
  }

  function verwijder() {
    if (!bestaand || !confirm(`${bestaand.naam} uit het smoelenboek halen?`)) return;
    startVerwijderen(async () => {
      const r = await verwijderPersoonActie(bestaand.id);
      if (r.fout) return toast(r.fout, "fout");
      toast(`${bestaand.naam} is verwijderd`);
      router.push("/beheer");
      router.refresh();
    });
  }

  const voorbeeld: PersoonWeergave = {
    ...(bestaand ?? {
      id: "nieuw",
      slug: "nieuw",
      email: null,
      telefoon: null,
      mobiel: null,
      werkplek: null,
      over_mij: null,
      in_dienst_sinds: null,
      volgorde: 999,
      zichtbaar: true,
      bijgewerkt_op: "",
      foto_pad: null,
      foto_url: null,
    }),
    naam: naam || "Naam",
    functie: functie || "Functie",
    afdeling_id: afdelingId || null,
    extra_afdeling_ids: extra,
    leidinggevende_id: leidinggevendeId || null,
    werkdagen,
    trefwoorden,
    talen,
    ...(foto.voorbeeld ? { foto_klein: foto.voorbeeld, foto_groot: foto.voorbeeld } : fotoAdressen({ foto_pad: null, foto_url: foto.url })),
  };

  return (
    <form action={actie} className="grid gap-8 pb-10 lg:grid-cols-[1fr_260px]">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/beheer" className="knop knop-ghost knop-icoon" aria-label="Terug naar medewerkers">
            <ArrowLeft size={18} />
          </Link>
          <h2 className="text-[20px] font-semibold">{bestaand ? `${bestaand.naam} bewerken` : "Persoon toevoegen"}</h2>
        </div>

        {persoonId && <input type="hidden" name="id" value={persoonId} />}
        <input type="hidden" name="foto_pad" value={foto.pad ?? ""} />
        <input type="hidden" name="trefwoorden" value={JSON.stringify(trefwoorden)} />
        <input type="hidden" name="talen" value={JSON.stringify(talen)} />
        {bestaand && <input type="hidden" name="slug" value={bestaand.slug} />}
        {werkdagen.map((d) => (
          <input key={d} type="hidden" name="werkdagen" value={d} />
        ))}
        {extra.map((a) => (
          <input key={a} type="hidden" name="extra_afdeling_ids" value={a} />
        ))}

        {/* Foto */}
        <section className="kaart p-5">
          <h3 className="eyebrow mb-4">Foto</h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-28 w-28 overflow-hidden rounded-xl bg-sluier/[0.06]">
              <PersoonFotoVoorbeeld persoon={voorbeeld} />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => bestandInvoer.current?.click()} disabled={uploaden} className="knop knop-wit">
                  <ImageUp size={16} aria-hidden /> {uploaden ? "Uploaden" : foto.voorbeeld || foto.url ? "Andere foto" : "Foto uploaden"}
                </button>
                {(foto.pad || foto.url || foto.voorbeeld) && (
                  <button type="button" onClick={() => setFoto({ pad: null, url: null, voorbeeld: null })} className="knop knop-ghost">
                    <X size={16} aria-hidden /> Weghalen
                  </button>
                )}
                <button type="button" onClick={() => setToonUrl(!toonUrl)} className="knop knop-ghost">
                  <Link2 size={16} aria-hidden /> Adres van een foto
                </button>
              </div>
              <p className="text-[12px] text-inkt-4">Elke foto wordt automatisch vierkant gemaakt. Het bovenste deel blijft staan.</p>
              <input
                ref={bestandInvoer}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) kiesFoto(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
          {toonUrl || foto.url ? (
            <div className="mt-4">
              <Veld label="Adres van een foto (https)" hint="Bijvoorbeeld een foto op stadstheater.nl. Een geüploade foto gaat voor.">
                <input
                  name="foto_url"
                  value={foto.url ?? ""}
                  onChange={(e) => setFoto((f) => ({ ...f, url: e.target.value || null, voorbeeld: f.pad ? f.voorbeeld : null }))}
                  className="veld"
                  placeholder="https://"
                />
              </Veld>
            </div>
          ) : (
            <input type="hidden" name="foto_url" value="" />
          )}
          {fout && (
            <p role="alert" className="mt-3 text-[13px] font-semibold text-rood">
              {fout}
            </p>
          )}
        </section>

        {/* Basis */}
        <section className="kaart grid gap-4 p-5 sm:grid-cols-2">
          <h3 className="eyebrow sm:col-span-2">Basis</h3>
          <Veld label="Naam">
            <input name="naam" required value={naam} onChange={(e) => setNaam(e.target.value)} className="veld" autoComplete="off" autoFocus={!bestaand} />
          </Veld>
          <Veld label="Functie">
            <input name="functie" value={functie} onChange={(e) => setFunctie(e.target.value)} className="veld" autoComplete="off" />
          </Veld>
          <Veld label="Afdeling">
            <select name="afdeling_id" value={afdelingId} onChange={(e) => kiesAfdeling(e.target.value)} className="veld">
              <option value="">Geen afdeling</option>
              {gegevens.afdelingen.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.naam}
                </option>
              ))}
            </select>
          </Veld>
          <Veld label="Leidinggevende" hint="Hiermee bouw je het organigram.">
            <select name="leidinggevende_id" value={leidinggevendeId} onChange={(e) => setLeidinggevendeId(e.target.value)} className="veld">
              <option value="">Geen leidinggevende</option>
              {mogelijkeLeidinggevenden.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.naam}
                  {p.functie ? `, ${p.functie}` : ""}
                </option>
              ))}
            </select>
          </Veld>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-medium text-inkt-2">Werkt ook voor</span>
            <div className="flex flex-wrap gap-1.5">
              {gegevens.afdelingen
                .filter((a) => a.id !== afdelingId)
                .map((a) => {
                  const aan = extra.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={aan}
                      onClick={() => setExtra(aan ? extra.filter((x) => x !== a.id) : [...extra, a.id])}
                      className={`chip h-8 px-3 text-[13px] transition-colors ${aan ? "bg-basis-paars! text-white!" : "hover:bg-sluier/[0.12]"}`}
                    >
                      {a.naam}
                    </button>
                  );
                })}
            </div>
          </div>
        </section>

        {/* Zoeken */}
        <section className="kaart space-y-4 p-5">
          <div>
            <h3 className="eyebrow">Waarvoor kun je bij mij terecht</h3>
            <p className="mt-1 text-[12.5px] text-inkt-4">
              Deze trefwoorden wegen zwaar in het zoeken. Denk aan wat collega&apos;s zouden typen: zaalhuur, facturen, licht, nieuwsbrief.
            </p>
          </div>
          <TrefwoordInvoer label="Trefwoorden" waarden={trefwoorden} onChange={setTrefwoorden} suggesties={alleTrefwoorden} />
          {afdelingTrefwoorden.length > 0 && (
            <p className="text-[12px] text-inkt-4">
              De afdeling heeft al: {afdelingTrefwoorden.join(", ")}. Die tellen ook mee, dus die hoef je hier niet te herhalen.
            </p>
          )}
        </section>

        {/* Contact */}
        <section className="kaart grid gap-4 p-5 sm:grid-cols-2">
          <h3 className="eyebrow sm:col-span-2">Contact</h3>
          <Veld label="E-mail" breed>
            <input name="email" type="email" defaultValue={bestaand?.email ?? ""} className="veld" autoComplete="off" placeholder="naam@stadstheater.nl" />
          </Veld>
          <Veld label="Telefoon">
            <input name="telefoon" type="tel" defaultValue={bestaand?.telefoon ?? ""} className="veld" placeholder="088 220 70 10" />
          </Veld>
          <Veld label="Mobiel">
            <input name="mobiel" type="tel" defaultValue={bestaand?.mobiel ?? ""} className="veld" placeholder="06 12 34 56 78" />
          </Veld>
          <Veld label="Werkplek" hint="Bijvoorbeeld kantoor 1e verdieping of technische dienst." breed>
            <input name="werkplek" defaultValue={bestaand?.werkplek ?? ""} className="veld" />
          </Veld>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-medium text-inkt-2">Werkdagen</span>
            <div role="group" aria-label="Werkdagen" className="flex flex-wrap gap-1.5">
              {DAGEN.map((d) => {
                const aan = werkdagen.includes(d.code);
                return (
                  <button
                    key={d.code}
                    type="button"
                    aria-pressed={aan}
                    title={d.lang}
                    onClick={() => setWerkdagen(aan ? werkdagen.filter((x) => x !== d.code) : DAGEN.map((x) => x.code).filter((c) => c === d.code || werkdagen.includes(c)))}
                    className={`h-10 w-12 rounded-lg font-display text-[16px] font-semibold uppercase transition-colors ${
                      aan ? "bg-basis-paars text-white" : "bg-sluier/[0.06] text-inkt-4 hover:bg-sluier/[0.12] hover:text-inkt"
                    }`}
                  >
                    {d.kort}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Extra */}
        <section className="kaart grid gap-4 p-5 sm:grid-cols-2">
          <h3 className="eyebrow sm:col-span-2">Extra</h3>
          <Veld label="Over mij" breed>
            <textarea name="over_mij" defaultValue={bestaand?.over_mij ?? ""} rows={4} className="veld resize-y" placeholder="Een paar zinnen, bijvoorbeeld waar iemand aan werkt of wat handig is om te weten." />
          </Veld>
          <Veld label="In dienst sinds" hint="Maand en jaar.">
            <input name="in_dienst_sinds" type="month" defaultValue={bestaand?.in_dienst_sinds?.slice(0, 7) ?? ""} className="veld" />
          </Veld>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-inkt-2">Talen</span>
            <TrefwoordInvoer label="Talen" waarden={talen} onChange={setTalen} suggesties={TALEN} placeholder="Bijvoorbeeld Engels" />
          </div>
          <Veld label="Volgorde" hint="Lager staat eerder in de afdeling. Het hoofd staat altijd bovenaan.">
            <input name="volgorde" type="number" defaultValue={bestaand?.volgorde ?? 999} className="veld" />
          </Veld>
          <label className="flex items-start gap-3 self-end rounded-lg p-2">
            <input name="zichtbaar" type="checkbox" defaultChecked={bestaand?.zichtbaar ?? true} className="mt-1 h-4 w-4 accent-[var(--stz-oranje)]" />
            <span>
              <span className="block text-[13.5px] font-medium">Zichtbaar in het smoelenboek</span>
              <span className="block text-[12px] text-inkt-4">Uitzetten verbergt iemand zonder de gegevens weg te gooien, bijvoorbeeld bij verlof.</span>
            </span>
          </label>
        </section>

        {status.fout && (
          <p role="alert" className="rounded-lg border border-rood/40 bg-rood/10 px-4 py-3 text-[13.5px] font-semibold text-rood">
            {status.fout}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={bezig || uploaden} className="knop knop-vol h-11 px-5">
            <Save size={16} aria-hidden /> {bezig ? "Opslaan" : bestaand ? "Wijzigingen opslaan" : "Toevoegen"}
          </button>
          <Link href="/beheer" className="knop knop-ghost h-11">
            Annuleren
          </Link>
          {bestaand && (
            <button type="button" onClick={verwijder} disabled={verwijderen} className="knop knop-ghost ml-auto h-11 hover:text-rood!">
              <Trash2 size={16} aria-hidden /> Verwijderen
            </button>
          )}
        </div>
      </div>

      {/* Live voorbeeld */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="eyebrow mb-3">Zo ziet het eruit</p>
          <div className="pointer-events-none" inert>
            <PersoonKaart persoon={voorbeeld} onOpen={() => {}} />
          </div>
          {trefwoorden.length > 0 && <p className="mt-3 text-[12px] text-inkt-4">Vindbaar op: {trefwoorden.join(", ")}</p>}
        </div>
      </aside>
    </form>
  );
}

function PersoonFotoVoorbeeld({ persoon }: { persoon: PersoonWeergave }) {
  if (persoon.foto_groot) {
    // Voorbeeld van een net gekozen foto
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={persoon.foto_groot} alt="" className="h-full w-full object-cover object-top" />;
  }
  return <div className="flex h-full w-full items-center justify-center text-[12px] text-inkt-4">Geen foto</div>;
}
