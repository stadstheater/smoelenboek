"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowDownAZ, LayoutList, Plus, UsersRound } from "lucide-react";
import { PersoonKaart } from "@/components/PersoonKaart";
import { useShell } from "@/components/shell/AppShell";
import { meervoud } from "@/lib/format";
import { afdelingenInVolgorde, ledenVan } from "@/lib/hierarchie";
import type { Afdeling, PersoonWeergave } from "@/lib/types";
import { zetParams } from "@/lib/url";

type Groep = { id: string; titel: string; beschrijving: string | null; afdeling?: Afdeling; personen: PersoonWeergave[]; diepte: number };

const RASTER = "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-9";

function voornaamSort(a: PersoonWeergave, b: PersoonWeergave) {
  return a.naam.localeCompare(b.naam, "nl");
}

export function Overzicht() {
  const { gegevens, openPersoon, beheer, afdelingOpId } = useShell();
  const params = useSearchParams();
  const gekozenSlug = params.get("afdeling");
  const sorteer = params.get("sorteer") === "naam" ? "naam" : "afdeling";

  const zichtbaar = useMemo(() => gegevens.personen.filter((p) => p.zichtbaar), [gegevens.personen]);
  const boom = useMemo(() => afdelingenInVolgorde(gegevens.afdelingen), [gegevens.afdelingen]);
  const gekozen = gekozenSlug ? gegevens.afdelingen.find((a) => a.slug === gekozenSlug) : undefined;

  // Bij een gekozen afdeling ook de subafdelingen tonen
  const binnenKeuze = useMemo(() => {
    if (!gekozen) return null;
    const ids = new Set([gekozen.id]);
    let gegroeid = true;
    while (gegroeid) {
      gegroeid = false;
      for (const a of gegevens.afdelingen) {
        if (a.parent_id && ids.has(a.parent_id) && !ids.has(a.id)) {
          ids.add(a.id);
          gegroeid = true;
        }
      }
    }
    return ids;
  }, [gekozen, gegevens.afdelingen]);

  const groepen = useMemo<Groep[]>(() => {
    if (sorteer === "naam") {
      const lijst = zichtbaar
        .filter((p) => !binnenKeuze || [p.afdeling_id, ...p.extra_afdeling_ids].some((id) => id && binnenKeuze.has(id)))
        .sort(voornaamSort);
      const perLetter = new Map<string, PersoonWeergave[]>();
      for (const p of lijst) {
        const letter = p.naam.normalize("NFD")[0]?.toUpperCase() ?? "#";
        perLetter.set(letter, [...(perLetter.get(letter) ?? []), p]);
      }
      return [...perLetter].map(([letter, personen]) => ({ id: `letter-${letter}`, titel: letter, beschrijving: null, personen, diepte: 0 }));
    }
    const uit: Groep[] = [];
    const organisatie = boom.filter(({ afdeling }) => afdeling.soort !== "toezicht");
    const toezicht = boom.filter(({ afdeling }) => afdeling.soort === "toezicht");
    for (const { afdeling, diepte } of [...organisatie, ...toezicht]) {
      if (binnenKeuze && !binnenKeuze.has(afdeling.id)) continue;
      const personen = ledenVan(afdeling, gegevens.personen);
      if (personen.length) uit.push({ id: afdeling.id, titel: afdeling.naam, beschrijving: afdeling.beschrijving, afdeling, personen, diepte });
    }
    if (!binnenKeuze) {
      const zonder = zichtbaar.filter((p) => !p.afdeling_id || !afdelingOpId.has(p.afdeling_id));
      if (zonder.length) uit.push({ id: "zonder", titel: "Zonder afdeling", beschrijving: null, personen: zonder.sort(voornaamSort), diepte: 0 });
    }
    return uit;
  }, [sorteer, zichtbaar, binnenKeuze, boom, gegevens.personen, afdelingOpId]);

  // Bladeren in de pop-up volgt precies wat je hier ziet
  const volgorde = useMemo(() => [...new Set(groepen.flatMap((g) => g.personen.map((p) => p.slug)))], [groepen]);

  const telling = useMemo(() => {
    const t = new Map<string, number>();
    for (const p of zichtbaar) for (const id of new Set([p.afdeling_id, ...p.extra_afdeling_ids])) if (id) t.set(id, (t.get(id) ?? 0) + 1);
    return t;
  }, [zichtbaar]);
  const medewerkers = zichtbaar.filter((p) => afdelingOpId.get(p.afdeling_id ?? "")?.soort !== "toezicht").length;
  const aantalAfdelingen = gegevens.afdelingen.filter((a) => a.soort !== "toezicht" && telling.get(a.id)).length;

  let index = 0;
  let toezichtGetoond = false;

  return (
    <div className="mx-auto max-w-[1800px] px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Stadstheater Zoetermeer</p>
          <h1 className="kop mt-2 text-[clamp(2.6rem,6vw,4.25rem)]">{gekozen ? gekozen.naam : "Smoelenboek"}</h1>
          <p className="mt-2 max-w-2xl text-[14px] text-inkt-3">
            {gekozen
              ? gekozen.beschrijving ?? meervoud(telling.get(gekozen.id) ?? 0, "persoon", "mensen")
              : `${meervoud(medewerkers, "collega", "collega's")} in ${meervoud(aantalAfdelingen, "afdeling", "afdelingen")}. Zoek bovenin op naam, functie of waarvoor je iemand nodig hebt.`}
          </p>
        </div>
        <div role="group" aria-label="Sorteren" className="flex shrink-0 rounded-lg border border-sluier/10 bg-sluier/[0.03] p-0.5">
          {(
            [
              ["afdeling", "Per afdeling", LayoutList],
              ["naam", "A tot Z", ArrowDownAZ],
            ] as const
          ).map(([waarde, label, Icoon]) => {
            const aan = sorteer === waarde;
            return (
              <button
                key={waarde}
                type="button"
                aria-pressed={aan}
                onClick={() => zetParams((p) => (waarde === "naam" ? p.set("sorteer", "naam") : p.delete("sorteer")))}
                className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold transition-colors ${
                  aan ? "bg-sluier/[0.12] text-inkt" : "text-inkt-4 hover:text-inkt"
                }`}
              >
                <Icoon size={15} aria-hidden /> {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Snel filteren op afdeling */}
      <nav aria-label="Afdelingen" className="geen-scrollbar -mx-4 mt-6 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
        <Link
          href={sorteer === "naam" ? "/?sorteer=naam" : "/"}
          scroll={false}
          aria-current={!gekozen ? "true" : undefined}
          className={`chip h-8 shrink-0 px-3 text-[13px] transition-colors ${!gekozen ? "bg-basis-paars! text-white!" : "hover:bg-sluier/[0.12] hover:text-inkt"}`}
        >
          Iedereen
        </Link>
        {boom
          .filter(({ afdeling }) => telling.get(afdeling.id))
          .map(({ afdeling }) => {
            const aan = gekozen?.id === afdeling.id;
            const href = `/?afdeling=${afdeling.slug}${sorteer === "naam" ? "&sorteer=naam" : ""}`;
            return (
              <Link
                key={afdeling.id}
                href={aan ? (sorteer === "naam" ? "/?sorteer=naam" : "/") : href}
                scroll={false}
                aria-current={aan ? "true" : undefined}
                className={`chip h-8 shrink-0 gap-1.5 px-3 text-[13px] transition-colors ${aan ? "bg-basis-paars! text-white!" : "hover:bg-sluier/[0.12] hover:text-inkt"}`}
              >
                {afdeling.naam}
                <span className={`tabular-nums ${aan ? "text-white/70" : "text-inkt-5"}`}>{telling.get(afdeling.id)}</span>
              </Link>
            );
          })}
      </nav>

      {groepen.length === 0 && (
        <div className="kaart mt-10 flex flex-col items-center gap-3 px-6 py-16 text-center">
          <UsersRound size={32} className="text-inkt-4" aria-hidden />
          <p className="text-[15px] font-semibold">Hier staat nog niemand</p>
          {beheer && (
            <Link href="/beheer/medewerkers/nieuw" className="knop knop-vol">
              <Plus size={16} aria-hidden /> Persoon toevoegen
            </Link>
          )}
        </div>
      )}

      <div className="mt-8 space-y-14">
        {groepen.map((groep) => {
          const isToezicht = groep.afdeling?.soort === "toezicht";
          const eersteToezicht = isToezicht && !toezichtGetoond;
          if (isToezicht) toezichtGetoond = true;
          return (
            <section
              key={groep.id}
              id={groep.afdeling ? `afd-${groep.afdeling.slug}` : groep.id}
              aria-labelledby={`kop-${groep.id}`}
              className={`scroll-mt-24 ${eersteToezicht && !gekozen ? "border-t border-sluier/[0.1] pt-12" : ""}`}
            >
              <div className={`mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 ${groep.diepte ? "pl-4" : ""}`}>
                <h2 id={`kop-${groep.id}`} className="kop text-[clamp(1.6rem,3vw,2.1rem)]">
                  {groep.titel}
                </h2>
                <span className="text-[13px] tabular-nums text-inkt-4">{meervoud(groep.personen.length, "persoon", "mensen")}</span>
                {isToezicht && <span className="infoblokje infoblokje-licht">Toezicht, geen medewerkers</span>}
                {groep.beschrijving && sorteer === "afdeling" && !gekozen && <p className="w-full text-[13px] text-inkt-3">{groep.beschrijving}</p>}
              </div>
              <ul className={RASTER}>
                {groep.personen.map((p) => (
                  <li key={p.id}>
                    <PersoonKaart
                      persoon={p}
                      index={index++}
                      leidt={sorteer === "afdeling" && groep.afdeling?.hoofd_id === p.id && groep.personen.length > 1}
                      sub={groep.afdeling && p.afdeling_id !== groep.afdeling.id ? `Ook bij ${afdelingOpId.get(p.afdeling_id ?? "")?.naam ?? "andere afdeling"}` : null}
                      onOpen={() => openPersoon(p.slug, volgorde)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
