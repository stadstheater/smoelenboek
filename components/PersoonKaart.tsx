"use client";

import { useRef } from "react";
import { Markeer } from "@/components/Markeer";
import { Portret } from "@/components/Portret";
import type { PersoonWeergave } from "@/lib/types";

/** Kaart in het smoelenboek: vierkante foto, naam en functie */
export function PersoonKaart({
  persoon,
  onOpen,
  leidt,
  index = 0,
  gespreid = true,
  markeer,
  sub,
}: {
  persoon: PersoonWeergave;
  /** Krijgt de foto mee, zodat de pop-up vanuit die plek kan openen */
  onOpen: (bron?: HTMLElement) => void;
  leidt?: boolean;
  index?: number;
  /** Gespreid verschijnen, alleen bij binnenkomst op de pagina */
  gespreid?: boolean;
  markeer?: string[];
  sub?: string | null;
}) {
  const foto = useRef<HTMLDivElement>(null);
  return (
    <button
      type="button"
      onClick={() => onOpen(foto.current ?? undefined)}
      className={`group block w-full rounded-xl text-left outline-offset-4 ${gespreid ? "gespreid" : ""}`}
      style={{ "--i": index } as React.CSSProperties}
      aria-label={`${persoon.naam}, ${persoon.functie}`}
    >
      <div
        ref={foto}
        data-foto={persoon.slug}
        className="relative aspect-square overflow-hidden rounded-xl bg-sluier/[0.06] ring-1 ring-sluier/[0.08] transition duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-schaduw/25 group-hover:ring-2 group-hover:ring-oranje group-active:translate-y-0 group-active:scale-[0.98]"
      >
        <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]">
          <Portret persoon={persoon} prioriteit={index < 8} />
        </div>
        {leidt && <span className="infoblokje absolute top-2 left-2 shadow-md shadow-black/20">Leiding</span>}
      </div>
      <p className="mt-2.5 text-[15px] leading-tight font-semibold">
        <Markeer tekst={persoon.naam} woorden={markeer} />
      </p>
      <p className="mt-0.5 text-[13px] leading-snug text-inkt-3">
        <Markeer tekst={persoon.functie} woorden={markeer} />
      </p>
      {sub && <p className="mt-1 text-[12px] leading-snug text-actie">{sub}</p>}
    </button>
  );
}
