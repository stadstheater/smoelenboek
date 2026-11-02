"use client";

import { huidigThema, zetThema } from "./thema";

/**
 * Wisselt tussen licht en donker. Welk icoon je ziet regelt de CSS (bij-licht, bij-donker),
 * dus de knop klopt al voordat React geladen is.
 */
export function ThemaKnop({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => zetThema(huidigThema() === "licht" ? "donker" : "licht")}
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
