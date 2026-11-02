"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { Portret } from "@/components/Portret";
import { useShell } from "@/components/shell/AppShell";
import { meervoud } from "@/lib/format";
import { organigram, type Knoop } from "@/lib/hierarchie";
import type { PersoonWeergave } from "@/lib/types";

function telOnder(k: Knoop<PersoonWeergave>): number {
  return k.kinderen.reduce((n, c) => n + 1 + telOnder(c), 0);
}

function Vakje({
  persoon,
  vorm = "rij",
  afdeling,
  onOpen,
}: {
  persoon: PersoonWeergave;
  vorm?: "groot" | "kolom" | "rij" | "klein";
  afdeling?: string;
  onOpen: () => void;
}) {
  if (vorm === "kolom") {
    return (
      <button
        type="button"
        onClick={onOpen}
        title={`${persoon.naam}, ${persoon.functie}`}
        className="group kaart flex w-full flex-col items-center gap-2 px-2 py-3 text-center transition hover:border-oranje/70 hover:bg-sluier/[0.06]"
      >
        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sluier/[0.06]">
          <Portret persoon={persoon} formaat="mini" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13.5px] leading-tight font-semibold">{persoon.naam}</span>
          <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-inkt-3">{persoon.functie}</span>
          {afdeling && <span className="mt-1 block font-display text-[11.5px] font-semibold tracking-wide text-inkt-4 uppercase">{afdeling}</span>}
        </span>
      </button>
    );
  }
  if (vorm === "klein") {
    return (
      <button
        type="button"
        onClick={onOpen}
        title={`${persoon.naam}, ${persoon.functie}`}
        className="group kaart flex w-full items-center gap-2 p-1.5 pr-2 text-left transition hover:border-oranje/70 hover:bg-sluier/[0.06]"
      >
        <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-sluier/[0.06]">
          <Portret persoon={persoon} formaat="mini" />
        </span>
        <span className="min-w-0 flex-1 hyphens-auto [overflow-wrap:anywhere]">
          <span className="block text-[12.5px] leading-tight font-semibold">{persoon.naam}</span>
          <span className="block text-[11.5px] leading-snug text-inkt-3">{persoon.functie}</span>
        </span>
      </button>
    );
  }
  const groot = vorm === "groot";
  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${persoon.naam}, ${persoon.functie}`}
      className={`group kaart flex w-full items-center gap-2.5 p-2 pr-3 text-left transition hover:border-oranje/70 hover:bg-sluier/[0.06] ${groot ? "max-w-xs gap-3" : ""}`}
    >
      <span className={`shrink-0 overflow-hidden rounded-lg bg-sluier/[0.06] ${groot ? "h-14 w-14" : "h-10 w-10"}`}>
        <Portret persoon={persoon} formaat="mini" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block leading-tight font-semibold ${groot ? "text-[15px]" : "text-[13px]"}`}>{persoon.naam}</span>
        <span className="block text-[12px] leading-snug text-inkt-3">{persoon.functie}</span>
        {afdeling && <span className="mt-0.5 block truncate font-display text-[11.5px] font-semibold tracking-wide text-inkt-4 uppercase">{afdeling}</span>}
      </span>
    </button>
  );
}

/** Wie onder een vakje valt, als ingesprongen lijst; dieper dan twee lagen klapt standaard in */
function Lijst({
  knopen,
  diepte,
  onOpen,
  compact = false,
}: {
  knopen: Knoop<PersoonWeergave>[];
  diepte: number;
  onOpen: (p: PersoonWeergave) => void;
  compact?: boolean;
}) {
  return (
    <ul className={`org-lijst mt-2 space-y-2 ${compact ? "org-lijst-compact" : ""}`}>
      {knopen.map((k) => (
        <Tak key={k.persoon.id} knoop={k} diepte={diepte} onOpen={onOpen} compact={compact} />
      ))}
    </ul>
  );
}

function Tak({ knoop, diepte, onOpen, compact }: { knoop: Knoop<PersoonWeergave>; diepte: number; onOpen: (p: PersoonWeergave) => void; compact: boolean }) {
  const [open, setOpen] = useState(diepte < 3);
  return (
    <li>
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <Vakje persoon={knoop.persoon} vorm={compact ? "klein" : "rij"} onOpen={() => onOpen(knoop.persoon)} />
        </div>
        {knoop.kinderen.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="knop knop-ghost h-8 shrink-0 px-2 text-[12px]"
            aria-expanded={open}
            aria-label={open ? `Team van ${knoop.persoon.naam} inklappen` : `Team van ${knoop.persoon.naam} uitklappen`}
          >
            {open ? <Minus size={14} /> : <Plus size={14} />} {telOnder(knoop)}
          </button>
        )}
      </div>
      {open && knoop.kinderen.length > 0 && <Lijst knopen={knoop.kinderen} diepte={diepte + 1} onOpen={onOpen} compact={compact} />}
    </li>
  );
}

export function Organigram() {
  const { gegevens, afdelingOpId, openPersoon } = useShell();

  const { toezicht, wortels } = useMemo(() => {
    const isToezicht = (p: PersoonWeergave) => afdelingOpId.get(p.afdeling_id ?? "")?.soort === "toezicht";
    const toezicht = gegevens.personen.filter((p) => p.zichtbaar && isToezicht(p));
    const toezichtAfd = gegevens.afdelingen.find((a) => a.soort === "toezicht");
    toezicht.sort((a, b) => Number(b.id === toezichtAfd?.hoofd_id) - Number(a.id === toezichtAfd?.hoofd_id) || a.volgorde - b.volgorde);
    const wortels = organigram(gegevens.personen.filter((p) => !isToezicht(p)));
    // De grootste boom (meestal de directeur) bovenaan
    wortels.sort((a, b) => telOnder(b) - telOnder(a));
    return { toezicht, wortels };
  }, [gegevens, afdelingOpId]);

  const volgorde = useMemo(() => {
    const uit: string[] = toezicht.map((p) => p.slug);
    const loop = (k: Knoop<PersoonWeergave>) => {
      uit.push(k.persoon.slug);
      k.kinderen.forEach(loop);
    };
    wortels.forEach(loop);
    return uit;
  }, [toezicht, wortels]);

  const open = (p: PersoonWeergave) => openPersoon(p.slug, volgorde);
  const afdelingVan = (p: PersoonWeergave) => afdelingOpId.get(p.afdeling_id ?? "")?.naam;
  const [hoofd, ...losse] = wortels;

  return (
    <div className="mx-auto max-w-[1800px] px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header>
        <p className="eyebrow">Stadstheater Zoetermeer</p>
        <h1 className="kop mt-2 text-[clamp(2.6rem,6vw,4.25rem)]">Organigram</h1>
        <p className="mt-2 max-w-2xl text-[14px] text-inkt-3">Wie valt onder wie. Klik op iemand voor alle details; met de plus en min klap je een team in of uit.</p>
      </header>

      {toezicht.length > 0 && (
        <section aria-label="Raad van Toezicht" className="mx-auto mt-10 max-w-4xl">
          <div className="rounded-2xl border border-dashed border-sluier/20 p-4">
            <p className="eyebrow mb-3 text-center">Raad van Toezicht</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {toezicht.map((p) => (
                <li key={p.id}>
                  <Vakje persoon={p} onOpen={() => open(p)} />
                </li>
              ))}
            </ul>
          </div>
          {hoofd && (
            <div className="flex justify-center" aria-hidden>
              <div className="h-8 border-l border-dashed border-sluier/25" />
            </div>
          )}
        </section>
      )}

      {hoofd && (
        <section aria-label="Organisatie" className={toezicht.length ? "" : "mt-10"}>
          <div className="flex justify-center">
            <div className="w-full max-w-xs">
              <Vakje persoon={hoofd.persoon} vorm="groot" afdeling={afdelingVan(hoofd.persoon)} onOpen={() => open(hoofd.persoon)} />
            </div>
          </div>

          {hoofd.kinderen.length > 0 && (
            <>
              {/* Desktop: klassieke boom met lijnen */}
              <div className="dunne-scrollbar mt-0 hidden overflow-x-auto pb-6 lg:block">
                <div className="org-rij mx-auto w-fit min-w-full">
                  {hoofd.kinderen.map((k) => (
                    <div key={k.persoon.id} className="org-tak max-w-[260px] min-w-[150px] flex-1 basis-0">
                      <Vakje persoon={k.persoon} vorm="kolom" afdeling={afdelingVan(k.persoon)} onOpen={() => open(k.persoon)} />
                      {k.kinderen.length > 0 && <Lijst knopen={k.kinderen} diepte={2} onOpen={open} compact />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Telefoon en tablet: alles onder elkaar */}
              <div className="mx-auto mt-4 max-w-xl lg:hidden">
                <div className="flex justify-center" aria-hidden>
                  <ChevronDown size={18} className="text-inkt-5" />
                </div>
                <Lijst knopen={hoofd.kinderen} diepte={1} onOpen={open} />
              </div>
            </>
          )}
        </section>
      )}

      {losse.length > 0 && (
        <section aria-labelledby="los-kop" className="mt-12 border-t border-sluier/[0.1] pt-8">
          <h2 id="los-kop" className="kop text-[1.6rem]">
            Zonder leidinggevende
          </h2>
          <p className="mt-1 mb-4 text-[13px] text-inkt-3">
            {meervoud(losse.length, "persoon heeft", "mensen hebben")} nog geen leidinggevende. Dat stel je in bij Beheer, Structuur.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {losse.map((k) => (
              <li key={k.persoon.id}>
                <Vakje persoon={k.persoon} afdeling={afdelingVan(k.persoon)} onOpen={() => open(k.persoon)} />
                {k.kinderen.length > 0 && <Lijst knopen={k.kinderen} diepte={2} onOpen={open} />}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
