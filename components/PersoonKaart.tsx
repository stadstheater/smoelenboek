"use client";

import { Markeer } from "@/components/Markeer";
import { Portret } from "@/components/Portret";
import type { PersoonWeergave } from "@/lib/types";

/** Kaart in het smoelenboek: vierkante foto, naam en functie */
export function PersoonKaart({
  persoon,
  onOpen,
  leidt,
  index = 0,
  markeer,
  sub,
}: {
  persoon: PersoonWeergave;
  onOpen: () => void;
  leidt?: boolean;
  index?: number;
  markeer?: string[];
  sub?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group gespreid block w-full rounded-xl text-left outline-offset-4"
      style={{ "--i": index } as React.CSSProperties}
      aria-label={`${persoon.naam}, ${persoon.functie}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-sluier/[0.06] ring-1 ring-sluier/[0.08] transition duration-300 group-hover:ring-2 group-hover:ring-oranje">
        <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]">
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
