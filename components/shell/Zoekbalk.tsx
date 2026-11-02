"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, CornerDownLeft, History, Search, Sparkles, X } from "lucide-react";
import { Markeer } from "@/components/Markeer";
import { Portret } from "@/components/Portret";
import { useShell } from "@/components/shell/AppShell";
import { meervoud } from "@/lib/format";
import { leesRecent } from "@/lib/recent";
import type { PersoonWeergave } from "@/lib/types";
import { redenTekst, type PersoonResultaat } from "@/lib/zoeken";

const VOORBEELDEN = ["zaalhuur", "licht en geluid", "factuur", "kaartjes", "nieuwsbrief", "afdeling:techniek"];

type Item =
  | { soort: "persoon"; id: string; r: PersoonResultaat<PersoonWeergave> }
  | { soort: "recent"; id: string; p: PersoonWeergave }
  | { soort: "afdeling"; id: string; slug: string; naam: string; aantal: number; uitleg: string }
  | { soort: "suggestie"; id: string; tekst: string }
  | { soort: "voorbeeld"; id: string; tekst: string }
  | { soort: "alles"; id: string; tekst: string };

/** Eerste reden die niet al zichtbaar is in naam of functie */
export function uitlegVoor(r: PersoonResultaat<PersoonWeergave>) {
  const reden = r.redenen.find((x) => x.veld !== "naam" && x.veld !== "functie") ?? r.redenen.find((x) => x.via);
  return reden ? redenTekst(reden) : null;
}

/**
 * Het zoekveld in de topbalk. Zoekt bij elke toets in de browser en toont direct mensen en afdelingen.
 * Enter opent de bovenste persoon; "Alle resultaten" gaat naar de zoekpagina met filters en uitleg.
 */
function Zoekveld({ variant, onKlaar }: { variant: "topbalk" | "volledig"; onKlaar?: () => void }) {
  const { zoek, openPersoon, registreerZoekveld, persoonOpId, gegevens } = useShell();
  const router = useRouter();
  const lijstId = useId();
  const invoer = useRef<HTMLInputElement>(null);
  const lijst = useRef<HTMLUListElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(variant === "volledig");
  const [actief, setActief] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (variant === "topbalk") registreerZoekveld(invoer.current);
    return () => {
      if (variant === "topbalk") registreerZoekveld(null);
    };
  }, [variant, registreerZoekveld]);

  const resultaat = useMemo(() => (q.trim() ? zoek(q) : null), [q, zoek]);

  const items = useMemo<Item[]>(() => {
    if (!resultaat) {
      const bySlug = new Map(gegevens.personen.map((p) => [p.slug, p]));
      const recenten = recent
        .map((s) => bySlug.get(s))
        .filter((p): p is PersoonWeergave => !!p && p.zichtbaar)
        .slice(0, 5)
        .map((p) => ({ soort: "recent" as const, id: `r-${p.id}`, p }));
      return [...recenten, ...VOORBEELDEN.map((tekst) => ({ soort: "voorbeeld" as const, id: `v-${tekst}`, tekst }))];
    }
    const uit: Item[] = resultaat.personen.slice(0, 7).map((r) => ({ soort: "persoon", id: `p-${r.persoon.id}`, r }));
    for (const a of resultaat.afdelingen.slice(0, 3)) {
      const hoofd = a.afdeling.hoofd_id ? persoonOpId.get(a.afdeling.hoofd_id) : undefined;
      uit.push({
        soort: "afdeling",
        id: `a-${a.afdeling.id}`,
        slug: a.afdeling.slug,
        naam: a.afdeling.naam,
        aantal: a.aantal,
        uitleg: a.aantal
          ? `${meervoud(a.aantal, "persoon", "mensen")}${hoofd ? `, eerste aanspreekpunt ${hoofd.naam}` : ""}`
          : "Nog niemand in het smoelenboek",
      });
    }
    if (resultaat.suggestie) uit.push({ soort: "suggestie", id: "s", tekst: resultaat.suggestie });
    uit.push({ soort: "alles", id: "alles", tekst: q.trim() });
    return uit;
  }, [resultaat, recent, gegevens.personen, persoonOpId, q]);

  useEffect(() => {
    lijst.current?.querySelector(`[data-index="${actief}"]`)?.scrollIntoView({ block: "nearest" });
  }, [actief]);

  function sluit() {
    setOpen(false);
    if (variant === "topbalk") invoer.current?.blur();
    onKlaar?.();
  }

  function kies(item: Item | undefined) {
    if (!item) return;
    switch (item.soort) {
      case "persoon":
        openPersoon(item.r.persoon.slug, resultaat?.personen.map((r) => r.persoon.slug));
        sluit();
        break;
      case "recent":
        openPersoon(item.p.slug);
        sluit();
        break;
      case "afdeling":
        router.push(`/?afdeling=${item.slug}`);
        sluit();
        break;
      case "suggestie":
      case "voorbeeld":
        setQ(item.tekst);
        setActief(0);
        invoer.current?.focus();
        break;
      case "alles":
        router.push(`/zoeken?q=${encodeURIComponent(item.tekst)}`);
        sluit();
        break;
    }
  }

  function toets(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActief((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActief((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey && q.trim()) kies({ soort: "alles", id: "alles", tekst: q.trim() });
      else kies(items[actief]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (q && variant === "topbalk") {
        setQ("");
        setActief(0);
      } else sluit();
    }
  }

  const kopVoor = (item: Item) =>
    ({ persoon: "Mensen", recent: "Recent bekeken", afdeling: "Afdelingen", suggestie: "Bedoelde je", voorbeeld: "Probeer bijvoorbeeld", alles: "" })[
      item.soort
    ];

  const toonLijst = open && (variant === "volledig" || items.length > 0);
  const geenMensen = resultaat && !resultaat.personen.length;

  return (
    <div className={`relative ${variant === "topbalk" ? "w-full max-w-xl" : "flex h-full flex-col"}`}>
      <div
        className={`flex items-center gap-2.5 ${
          variant === "topbalk"
            ? "h-10 rounded-lg border border-sluier/10 bg-sluier/[0.04] px-3 transition-colors focus-within:border-oranje focus-within:bg-sluier/[0.06] focus-within:shadow-[0_0_0_3px_rgb(237_110_19/0.18)] hover:border-sluier/20"
            : "h-16 shrink-0 border-b border-sluier/[0.08] px-3"
        }`}
      >
        {variant === "volledig" ? (
          <button type="button" onClick={sluit} className="knop knop-ghost knop-icoon shrink-0" aria-label="Zoeken sluiten">
            <ArrowLeft size={18} />
          </button>
        ) : (
          <Search size={16} className="shrink-0 text-inkt-3" aria-hidden />
        )}
        <input
          ref={invoer}
          type="search"
          value={q}
          autoFocus={variant === "volledig"}
          onChange={(e) => {
            setQ(e.target.value);
            setActief(0);
            setOpen(true);
          }}
          onFocus={() => {
            setRecent(leesRecent());
            setOpen(true);
          }}
          onBlur={() => variant === "topbalk" && setTimeout(() => setOpen(false), 120)}
          onKeyDown={toets}
          placeholder="Zoek op naam, functie of waarvoor je iemand nodig hebt"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-inkt-5 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          role="combobox"
          aria-expanded={toonLijst}
          aria-controls={lijstId}
          aria-autocomplete="list"
          aria-activedescendant={toonLijst && items[actief] ? `${lijstId}-${items[actief].id}` : undefined}
          aria-label="Zoeken in het smoelenboek"
          enterKeyHint="search"
        />
        {q ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQ("");
              setActief(0);
              invoer.current?.focus();
            }}
            className="rounded-md p-1 text-inkt-4 hover:bg-sluier/10 hover:text-inkt"
            aria-label="Zoekveld leegmaken"
          >
            <X size={15} />
          </button>
        ) : (
          variant === "topbalk" && (
            <kbd className="hidden rounded border border-sluier/15 px-1.5 py-0.5 font-sans text-[11px] text-inkt-4 sm:block">Ctrl K</kbd>
          )
        )}
      </div>

      {toonLijst && (
        <div
          className={
            variant === "topbalk"
              ? "absolute inset-x-0 top-[calc(100%+6px)] z-50 animate-pop overflow-hidden rounded-xl border border-sluier/10 bg-vlak-diep shadow-2xl shadow-schaduw/40"
              : "min-h-0 flex-1 overflow-hidden"
          }
          onMouseDown={(e) => e.preventDefault()}
        >
          {geenMensen && (
            <p className="px-4 pt-3 text-[13px] text-inkt-3">
              Niemand gevonden voor <strong className="text-inkt">{q.trim()}</strong>.
              {resultaat.afdelingen.length ? " Misschien helpt een van deze afdelingen:" : ""}
            </p>
          )}
          <ul
            id={lijstId}
            ref={lijst}
            role="listbox"
            className={`dunne-scrollbar overflow-y-auto p-2 ${variant === "topbalk" ? "max-h-[min(70vh,560px)]" : "h-full"}`}
          >
            {items.map((item, i) => {
              const kop = kopVoor(item);
              const toonKop = kop && (i === 0 || kopVoor(items[i - 1]) !== kop);
              const aan = i === actief;
              const basis = `flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${aan ? "bg-sluier/[0.09]" : ""}`;
              return (
                <li key={item.id} role="presentation">
                  {toonKop && <p className="eyebrow px-2.5 pt-2 pb-1.5">{kop}</p>}
                  {item.soort === "voorbeeld" ? (
                    <button
                      id={`${lijstId}-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={aan}
                      data-index={i}
                      onMouseMove={() => setActief(i)}
                      onClick={() => kies(item)}
                      className={`${basis} py-1.5`}
                    >
                      <Search size={14} className="ml-1 shrink-0 text-inkt-4" aria-hidden />
                      <span className="text-[13px] text-inkt-2">{item.tekst}</span>
                    </button>
                  ) : (
                    <button
                      id={`${lijstId}-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={aan}
                      data-index={i}
                      onMouseMove={() => setActief(i)}
                      onClick={() => kies(item)}
                      className={basis}
                    >
                      {item.soort === "persoon" || item.soort === "recent" ? (
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sluier/[0.06]">
                          <Portret persoon={item.soort === "persoon" ? item.r.persoon : item.p} formaat="mini" />
                        </span>
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sluier/[0.06] text-inkt-3">
                          {item.soort === "afdeling" ? <Building2 size={18} /> : item.soort === "suggestie" ? <Sparkles size={17} /> : <Search size={17} />}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        {item.soort === "persoon" && (
                          <>
                            <span className="block truncate text-[14px] font-medium">
                              <Markeer tekst={item.r.persoon.naam} woorden={item.r.markeer} />
                            </span>
                            <span className="block truncate text-[12px] text-inkt-3">
                              <Markeer tekst={item.r.persoon.functie} woorden={item.r.markeer} />
                            </span>
                            {uitlegVoor(item.r) && <span className="block truncate text-[11.5px] text-actie">{uitlegVoor(item.r)}</span>}
                          </>
                        )}
                        {item.soort === "recent" && (
                          <>
                            <span className="block truncate text-[14px] font-medium">{item.p.naam}</span>
                            <span className="block truncate text-[12px] text-inkt-3">{item.p.functie}</span>
                          </>
                        )}
                        {item.soort === "afdeling" && (
                          <>
                            <span className="block truncate text-[14px] font-medium">{item.naam}</span>
                            <span className="block truncate text-[12px] text-inkt-3">{item.uitleg}</span>
                          </>
                        )}
                        {item.soort === "suggestie" && <span className="block truncate text-[14px] font-medium">{item.tekst}</span>}
                        {item.soort === "alles" && (
                          <span className="block truncate text-[13px] font-medium text-inkt-2">
                            Alle resultaten voor &ldquo;{item.tekst}&rdquo;
                          </span>
                        )}
                      </span>
                      {aan &&
                        (item.soort === "alles" || item.soort === "suggestie" ? (
                          <CornerDownLeft size={15} className="shrink-0 text-inkt-4" />
                        ) : item.soort === "recent" ? (
                          <History size={15} className="shrink-0 text-inkt-4" />
                        ) : (
                          <ArrowRight size={15} className="shrink-0 text-inkt-4" />
                        ))}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="hidden gap-4 border-t border-sluier/[0.08] px-4 py-2 text-[11px] text-inkt-4 sm:flex">
            <span>↑↓ kiezen</span>
            <span>Enter openen</span>
            <span>Shift Enter alle resultaten</span>
            <span className="ml-auto">Tip: afdeling:techniek, dag:vrijdag, -stagiaire</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function Zoekbalk() {
  return <Zoekveld variant="topbalk" />;
}

/** Op de telefoon: zoeken over het hele scherm */
export function MobielZoeken({ onSluit }: { onSluit: () => void }) {
  const dialoog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialoog.current?.showModal();
  }, []);
  return (
    <dialog ref={dialoog} onClose={onSluit} aria-label="Zoeken" className="paneel fixed inset-0 m-0 h-dvh w-full bg-vlak-diep p-0 text-inkt">
      <Zoekveld variant="volledig" onKlaar={() => dialoog.current?.close()} />
    </dialog>
  );
}
