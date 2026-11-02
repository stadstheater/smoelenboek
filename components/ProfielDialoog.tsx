"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Copy, Mail, MapPin, MessageSquare, Pencil, Phone, Smartphone, X } from "lucide-react";
import { Portret } from "@/components/Portret";
import { typtIemand, useShell } from "@/components/shell/AppShell";
import { useToast } from "@/components/shell/Toasts";
import { persoonlijkAdres } from "@/lib/foto";
import { belbaar, datumLang, dienstjaren, maandJaar } from "@/lib/format";
import { keten, ledenVan, team } from "@/lib/hierarchie";
import { onthoudRecent } from "@/lib/recent";
import { FILTER, minderBeweging } from "@/lib/animatie";
import { useDialoog } from "@/lib/useDialoog";
import { vliegFoto } from "@/lib/vlucht";
import { DAGEN, type PersoonWeergave } from "@/lib/types";

function Sectie({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="border-t border-sluier/[0.08] pt-4">
      <h3 className="eyebrow mb-2.5">{titel}</h3>
      {children}
    </section>
  );
}

/** Inhoud van één persoon; de animatie ligt vast zodra hij verschijnt, zodat de vorige inhoud niet opnieuw beweegt */
function Inhoud({ animatie, children }: { animatie: string; children: ReactNode }) {
  const [klasse] = useState(animatie);
  return <div className={`grid gap-6 p-5 sm:grid-cols-[minmax(0,300px)_1fr] sm:gap-8 sm:p-8 ${klasse}`}>{children}</div>;
}

function MiniPersoon({ persoon, onKies, sub }: { persoon: PersoonWeergave; onKies: () => void; sub?: string }) {
  return (
    <button type="button" onClick={onKies} className="group flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-sluier/[0.07]">
      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sluier/[0.06]">
        <Portret persoon={persoon} formaat="mini" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium group-hover:underline group-hover:underline-offset-2">{persoon.naam}</span>
        <span className="block truncate text-[12px] text-inkt-3">{sub ?? persoon.functie}</span>
      </span>
      <ChevronRight size={15} className="shrink-0 text-inkt-5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
    </button>
  );
}

/**
 * De pop-up met alles over één persoon. ← en → bladeren, Esc sluit.
 * Open je hem vanaf een kaart, dan vliegt de foto van de kaart naar de pop-up, en bij sluiten weer terug.
 */
export function ProfielDialoog({
  persoon,
  onSluit,
  onVorige,
  onVolgende,
  richting = 0,
}: {
  persoon: PersoonWeergave;
  onSluit: () => void;
  onVorige?: () => void;
  onVolgende?: () => void;
  /** 1 na "volgende", -1 na "vorige", 0 bij openen of springen naar iemand anders */
  richting?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const { gegevens, afdelingOpId, openPersoon, beheer, vlucht, wisVlucht } = useShell();
  const [gekopieerdVoor, setGekopieerdVoor] = useState<string | null>(null);
  const gekopieerd = gekopieerdVoor === persoon.slug;
  const foto = useRef<HTMLDivElement>(null);

  // Bij sluiten vliegt de foto terug naar de kaart, als die kaart in beeld is
  const { ref: dialoog, sluit } = useDialoog((dlg) => {
    const el = foto.current;
    if (!el || minderBeweging() || !window.matchMedia("(min-width: 640px)").matches) return;
    const kaart = Array.from(document.querySelectorAll<HTMLElement>(`[data-foto="${CSS.escape(persoon.slug)}"]`)).find((k) => !dlg.contains(k));
    const naar = kaart?.getBoundingClientRect();
    if (!naar || !naar.width || naar.bottom < 0 || naar.top > window.innerHeight) return;
    const { anim } = vliegFoto({ kopie: el, van: el.getBoundingClientRect(), naar, ouder: dlg, duur: 320, rondingVan: 16, rondingNaar: 12 });
    el.style.visibility = "hidden";
    return anim.finished;
  });

  // Openen vanaf een kaart: de foto vliegt van de kaart naar zijn plek in de pop-up
  // Op de telefoon schuift het paneel van onderen omhoog, zoals in apps; daar vliegt de foto niet
  const [metVlucht] = useState(
    () => !!vlucht && vlucht.slug === persoon.slug && vlucht.van.width > 0 && !minderBeweging() && window.matchMedia("(min-width: 640px)").matches,
  );
  const gevlogen = useRef(false);
  useLayoutEffect(() => {
    if (gevlogen.current) return;
    gevlogen.current = true;
    const el = foto.current;
    const dlg = dialoog.current;
    if (!metVlucht || !vlucht || !el || !dlg) return;
    const naar = el.getBoundingClientRect();
    if (!naar.width) return;
    const { geest, anim } = vliegFoto({ kopie: vlucht.kopie, van: vlucht.van, naar, ouder: dlg, duur: 480, rondingVan: 12, rondingNaar: 16 });
    el.style.visibility = "hidden";
    anim.finished
      .then(() => {
        el.style.visibility = "";
        return geest.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).finished;
      })
      .catch(() => {})
      .finally(() => geest.remove());
    wisVlucht();
  }, [metVlucht, vlucht, wisVlucht, dialoog]);

  // Bij bladeren schuift de inhoud in de richting waarin je bladert
  const [eersteId] = useState(persoon.id);
  const inhoudAnimatie =
    richting > 0 ? "animate-profiel-volgende" : richting < 0 ? "animate-profiel-vorige" : persoon.id === eersteId ? "" : "animate-profiel-wissel";

  useEffect(() => {
    onthoudRecent(persoon.slug);
    dialoog.current?.querySelector("[data-scroll]")?.scrollTo({ top: 0 });
  }, [persoon.slug, dialoog]);

  useEffect(() => {
    function toets(e: KeyboardEvent) {
      if (typtIemand(e.target)) return;
      if ((e.key === "ArrowLeft" || e.key.toLowerCase() === "k") && onVorige) {
        e.preventDefault();
        onVorige();
      } else if ((e.key === "ArrowRight" || e.key.toLowerCase() === "j") && onVolgende) {
        e.preventDefault();
        onVolgende();
      }
    }
    window.addEventListener("keydown", toets);
    return () => window.removeEventListener("keydown", toets);
  }, [onVorige, onVolgende]);

  const afdeling = persoon.afdeling_id ? afdelingOpId.get(persoon.afdeling_id) : undefined;
  const extra = persoon.extra_afdeling_ids.map((id) => afdelingOpId.get(id)).filter((a) => !!a);
  const isHoofd = !!afdeling && afdeling.hoofd_id === persoon.id;

  const { leidinggevende, hogerOp, teamleden, collegas } = useMemo(() => {
    const k = keten(gegevens.personen, persoon.id).filter((p) => p.zichtbaar);
    return {
      leidinggevende: k[0],
      hogerOp: k.slice(1),
      teamleden: team(gegevens.personen, persoon.id),
      collegas: afdeling ? ledenVan(afdeling, gegevens.personen).filter((p) => p.id !== persoon.id) : [],
    };
  }, [gegevens.personen, persoon.id, afdeling]);

  // Een gedeeld adres (servicebalie@, sales@) is geen persoonlijk Teams-account
  const eigenAdres =
    persoonlijkAdres(persoon.email, persoon.naam) && gegevens.personen.filter((p) => p.email === persoon.email).length === 1;

  function naarPersoon(p: PersoonWeergave) {
    openPersoon(p.slug);
  }

  function zoekOp(trefwoord: string) {
    sluit();
    router.push(`/zoeken?q=${encodeURIComponent(trefwoord)}`);
  }

  async function kopieer() {
    if (!persoon.email) return;
    try {
      await navigator.clipboard.writeText(persoon.email);
      setGekopieerdVoor(persoon.slug);
      toast("E-mailadres gekopieerd");
    } catch {
      toast("Kopiëren lukte niet", "fout");
    }
  }

  const inDienst = maandJaar(persoon.in_dienst_sinds);

  return (
    <dialog
      ref={dialoog}
      onClose={onSluit}
      onClick={(e) => e.target === e.currentTarget && sluit()}
      aria-labelledby="profiel-naam"
      className="paneel fixed inset-0 m-0 h-full w-full bg-transparent p-0 text-inkt"
    >
      <div
        className="flex h-full items-end justify-center sm:items-center sm:p-6"
        onClick={(e) => e.target === e.currentTarget && sluit()}
      >
        <div
          data-paneel="sheet"
          className={`relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-sluier/10 bg-vlak-diep shadow-2xl shadow-schaduw/50 sm:max-h-[min(88dvh,820px)] sm:rounded-2xl ${
            metVlucht ? "animate-fade" : "animate-sheet sm:animate-pop"
          }`}
        >
          {/* Knoppen rechtsboven */}
          <div className="z-10 flex shrink-0 items-center justify-end gap-1 border-b border-sluier/[0.07] px-2 py-1.5 sm:absolute sm:top-3 sm:right-3 sm:border-0 sm:p-0">
            {beheer && (
              <Link href={`/beheer/medewerkers/${persoon.id}`} className="knop knop-wit h-9" onClick={() => sluit()}>
                <Pencil size={14} aria-hidden /> Bewerken
              </Link>
            )}
            {onVorige && (
              <button type="button" onClick={onVorige} className="knop knop-ghost knop-icoon" aria-label="Vorige persoon" title="Vorige (←)">
                <ChevronLeft size={18} />
              </button>
            )}
            {onVolgende && (
              <button type="button" onClick={onVolgende} className="knop knop-ghost knop-icoon" aria-label="Volgende persoon" title="Volgende (→)">
                <ChevronRight size={18} />
              </button>
            )}
            <button type="button" onClick={() => sluit()} className="knop knop-ghost knop-icoon" aria-label="Sluiten" title="Sluiten (Esc)">
              <X size={18} />
            </button>
          </div>

          <div data-scroll tabIndex={-1} autoFocus className="dunne-scrollbar overflow-y-auto outline-none focus-visible:outline-none">
            <Inhoud key={persoon.id} animatie={inhoudAnimatie}>
              {/* Foto en acties */}
              <div className="space-y-4">
                <div ref={foto} className="relative mx-auto aspect-square w-44 overflow-hidden rounded-2xl bg-sluier/[0.06] sm:w-full">
                  <Portret key={persoon.id} persoon={persoon} formaat="groot" prioriteit />
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col">
                  {persoon.email && (
                    <div className="flex flex-1 basis-full gap-2 sm:flex-none">
                      <a href={`mailto:${persoon.email}`} className="knop knop-vol h-10 flex-1">
                        <Mail size={16} aria-hidden /> Mailen
                      </a>
                      <button type="button" onClick={kopieer} className="knop knop-wit knop-icoon h-10 w-10" aria-label="E-mailadres kopiëren" title="E-mailadres kopiëren">
                        {gekopieerd ? <Check size={16} className="text-groen" /> : <Copy size={16} />}
                      </button>
                    </div>
                  )}
                  {eigenAdres && (
                    <a
                      href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(persoon.email!)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="knop knop-wit h-10 flex-1 sm:flex-none"
                    >
                      <MessageSquare size={16} aria-hidden /> Chatten in Teams
                    </a>
                  )}
                  {(persoon.mobiel || persoon.telefoon) && (
                    <a href={`tel:${belbaar((persoon.mobiel || persoon.telefoon)!)}`} className="knop knop-wit h-10 flex-1 sm:flex-none">
                      <Phone size={16} aria-hidden /> Bellen
                    </a>
                  )}
                </div>
              </div>

              {/* Gegevens */}
              <div className="min-w-0 space-y-5">
                <div className="pr-0 sm:pr-28">
                  <div className="flex flex-wrap gap-1.5">
                    {afdeling && (
                      <Link href={`/?afdeling=${afdeling.slug}`} transitionTypes={FILTER} onClick={() => sluit()} className="infoblokje hover:underline">
                        {afdeling.naam}
                      </Link>
                    )}
                    {extra.map((a) => (
                      <Link key={a.id} href={`/?afdeling=${a.slug}`} transitionTypes={FILTER} onClick={() => sluit()} className="infoblokje infoblokje-licht hover:underline">
                        {a.naam}
                      </Link>
                    ))}
                    {isHoofd && <span className="infoblokje infoblokje-licht">Leidt de afdeling</span>}
                  </div>
                  <h2 id="profiel-naam" className="kop mt-3 text-[clamp(2rem,5vw,2.75rem)] leading-[0.95]">
                    {persoon.naam}
                  </h2>
                  {persoon.functie && <p className="mt-1.5 font-display text-[21px] leading-tight text-inkt-2">{persoon.functie}</p>}
                </div>

                {persoon.trefwoorden.length > 0 && (
                  <Sectie titel="Waarvoor kun je bij mij terecht">
                    <ul className="flex flex-wrap gap-1.5">
                      {persoon.trefwoorden.map((t) => (
                        <li key={t}>
                          <button
                            type="button"
                            onClick={() => zoekOp(t)}
                            className="chip h-7 px-2.5 text-[13px] transition-colors hover:bg-sluier/[0.14] hover:text-inkt"
                            title={`Wie kun je nog meer vragen over ${t}?`}
                          >
                            {t}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Sectie>
                )}

                {(persoon.email || persoon.telefoon || persoon.mobiel || persoon.werkplek) && (
                  <Sectie titel="Contact">
                    <dl className="grid gap-2 text-[14px]">
                      {persoon.email && (
                        <div className="flex items-center gap-2.5">
                          <dt>
                            <Mail size={15} className="text-inkt-4" aria-label="E-mail" />
                          </dt>
                          <dd className="min-w-0 truncate">
                            <a href={`mailto:${persoon.email}`} className="text-actie hover:underline">
                              {persoon.email}
                            </a>
                            {!eigenAdres && <span className="ml-2 text-[12px] text-inkt-4">gedeeld adres</span>}
                          </dd>
                        </div>
                      )}
                      {persoon.telefoon && (
                        <div className="flex items-center gap-2.5">
                          <dt>
                            <Phone size={15} className="text-inkt-4" aria-label="Telefoon" />
                          </dt>
                          <dd>
                            <a href={`tel:${belbaar(persoon.telefoon)}`} className="hover:underline">
                              {persoon.telefoon}
                            </a>
                          </dd>
                        </div>
                      )}
                      {persoon.mobiel && (
                        <div className="flex items-center gap-2.5">
                          <dt>
                            <Smartphone size={15} className="text-inkt-4" aria-label="Mobiel" />
                          </dt>
                          <dd>
                            <a href={`tel:${belbaar(persoon.mobiel)}`} className="hover:underline">
                              {persoon.mobiel}
                            </a>
                          </dd>
                        </div>
                      )}
                      {persoon.werkplek && (
                        <div className="flex items-center gap-2.5">
                          <dt>
                            <MapPin size={15} className="text-inkt-4" aria-label="Werkplek" />
                          </dt>
                          <dd>{persoon.werkplek}</dd>
                        </div>
                      )}
                    </dl>
                  </Sectie>
                )}

                {persoon.werkdagen.length > 0 && (
                  <Sectie titel="Werkdagen">
                    <ul className="flex gap-1.5" aria-label={`Werkt op ${persoon.werkdagen.map((d) => DAGEN.find((x) => x.code === d)?.lang).join(", ")}`}>
                      {DAGEN.slice(0, persoon.werkdagen.some((d) => d === "za" || d === "zo") ? 7 : 5).map((d) => {
                        const aan = persoon.werkdagen.includes(d.code);
                        return (
                          <li
                            key={d.code}
                            aria-hidden
                            className={`flex h-9 w-10 items-center justify-center rounded-lg font-display text-[15px] font-semibold uppercase ${
                              aan ? "bg-basis-paars text-white" : "bg-sluier/[0.05] text-inkt-5 line-through decoration-1"
                            }`}
                          >
                            {d.kort}
                          </li>
                        );
                      })}
                    </ul>
                  </Sectie>
                )}

                {persoon.over_mij && (
                  <Sectie titel="Over mij">
                    <p className="text-[14px] leading-relaxed whitespace-pre-line text-inkt-2">{persoon.over_mij}</p>
                  </Sectie>
                )}

                {(inDienst || persoon.talen.length > 0) && (
                  <Sectie titel="Goed om te weten">
                    <dl className="grid gap-1.5 text-[14px]">
                      {inDienst && (
                        <div className="flex gap-2">
                          <dt className="text-inkt-4">In dienst sinds</dt>
                          <dd>
                            {inDienst} <span className="text-inkt-4">({dienstjaren(persoon.in_dienst_sinds)})</span>
                          </dd>
                        </div>
                      )}
                      {persoon.talen.length > 0 && (
                        <div className="flex gap-2">
                          <dt className="text-inkt-4">Spreekt</dt>
                          <dd>{persoon.talen.join(", ")}</dd>
                        </div>
                      )}
                    </dl>
                  </Sectie>
                )}

                {(leidinggevende || teamleden.length > 0) && (
                  <Sectie titel="Plek in de organisatie">
                    <div className="grid gap-4 md:grid-cols-2">
                      {leidinggevende && (
                        <div>
                          <p className="mb-1 text-[12px] text-inkt-4">Leidinggevende</p>
                          <MiniPersoon persoon={leidinggevende} onKies={() => naarPersoon(leidinggevende)} />
                          {hogerOp.length > 0 && (
                            <p className="mt-1 pl-1.5 text-[12px] text-inkt-4">
                              Daarboven:{" "}
                              {hogerOp.map((p, i) => (
                                <span key={p.id}>
                                  {i > 0 && ", "}
                                  <button type="button" onClick={() => naarPersoon(p)} className="text-inkt-3 hover:text-inkt hover:underline">
                                    {p.naam}
                                  </button>
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                      )}
                      {teamleden.length > 0 && (
                        <div>
                          <p className="mb-1 text-[12px] text-inkt-4">Team ({teamleden.length})</p>
                          <div className="space-y-0.5">
                            {teamleden.slice(0, 8).map((p) => (
                              <MiniPersoon key={p.id} persoon={p} onKies={() => naarPersoon(p)} />
                            ))}
                            {teamleden.length > 8 && <p className="pl-1.5 text-[12px] text-inkt-4">en nog {teamleden.length - 8}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </Sectie>
                )}

                {afdeling && collegas.length > 0 && (
                  <Sectie titel={`Collega's bij ${afdeling.naam}`}>
                    <ul className="flex flex-wrap gap-2">
                      {collegas.slice(0, 16).map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => naarPersoon(p)}
                            className="block h-12 w-12 overflow-hidden rounded-lg bg-sluier/[0.06] ring-offset-2 ring-offset-vlak-diep transition hover:ring-2 hover:ring-oranje"
                            title={`${p.naam}, ${p.functie}`}
                            aria-label={`${p.naam}, ${p.functie}`}
                          >
                            <Portret persoon={p} formaat="mini" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Sectie>
                )}

                <p className="pt-2 text-[11.5px] text-inkt-5">Bijgewerkt op {datumLang(persoon.bijgewerkt_op)}</p>
              </div>
            </Inhoud>
          </div>
        </div>
      </div>
    </dialog>
  );
}
