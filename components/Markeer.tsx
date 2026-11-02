import { Fragment } from "react";
import { normaliseer } from "@/lib/zoeken/normaliseer";

/** Zet de gevonden woorden in een tekst in een markering */
export function Markeer({ tekst, woorden }: { tekst: string; woorden?: string[] }) {
  if (!woorden?.length) return <>{tekst}</>;
  const set = new Set(woorden);
  const delen = tekst.split(/(\s+|[-/&,()]+)/);
  return (
    <>
      {delen.map((deel, i) =>
        set.has(normaliseer(deel)) ? (
          <mark key={i} className="raak">
            {deel}
          </mark>
        ) : (
          <Fragment key={i}>{deel}</Fragment>
        ),
      )}
    </>
  );
}
