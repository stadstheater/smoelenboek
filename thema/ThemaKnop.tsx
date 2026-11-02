"use client";

import type { MouseEvent } from "react";
import { huidigThema, zetThema } from "./thema";

/** Het nieuwe icoon draait en groeit erin */
const ICOON_IN: Keyframe[] = [
  { transform: "rotate(-90deg) scale(0.4)", opacity: 0 },
  { transform: "none", opacity: 1 },
];

async function wissel(e: MouseEvent<HTMLButtonElement>) {
  const knop = e.currentTarget;
  const vak = knop.getBoundingClientRect();
  await zetThema(huidigThema() === "licht" ? "donker" : "licht", {
    x: vak.left + vak.width / 2,
    y: vak.top + vak.height / 2,
  });

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const icoon = Array.from(knop.querySelectorAll("svg")).find((svg) => svg.getClientRects().length > 0);
  icoon?.animate(ICOON_IN, { duration: 500, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
}

/**
 * Wisselt tussen licht en donker. Welk icoon je ziet regelt de CSS (bij-licht, bij-donker),
 * dus de knop klopt al voordat React geladen is. Het nieuwe thema groeit als cirkel vanuit de knop.
 */
export function ThemaKnop({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={wissel}
      className={className}
      aria-label="Wissel tussen licht en donker thema"
      title="Licht of donker"
    >
      {/* Zon: in het donker thema, klik voor licht */}
      <svg className="bij-donker" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      {/* Maan: in het licht thema, klik voor donker */}
      <svg className="bij-licht" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </button>
  );
}
