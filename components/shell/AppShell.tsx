"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MobielNav } from "@/components/shell/MobielNav";
import { PincodeDialoog } from "@/components/shell/PincodeDialoog";
import { ProfielHouder } from "@/components/ProfielHouder";
import { Topbalk } from "@/components/shell/Topbalk";
import { Zijbalk } from "@/components/shell/Zijbalk";
import { MobielZoeken } from "@/components/shell/Zoekbalk";
import { afdelingenInVolgorde, ledenVan } from "@/lib/hierarchie";
import type { Afdeling, Gegevens, PersoonWeergave } from "@/lib/types";
import { zetParams } from "@/lib/url";
import { maakZoeker, type Zoeker } from "@/lib/zoeken";

type Shell = {
  gegevens: Gegevens;
  beheer: boolean;
  isDemo: boolean;
  zoek: Zoeker<PersoonWeergave, Afdeling>;
  persoonOpId: Map<string, PersoonWeergave>;
  afdelingOpId: Map<string, Afdeling>;
  /** Iedereen in de volgorde van het smoelenboek: per afdeling, het hoofd eerst */
  standaardVolgorde: PersoonWeergave[];
  openPersoon: (slug: string, lijst?: string[]) => void;
  /** Volgorde om met ← en → door te bladeren in de pop-up */
  bladerLijst: string[] | null;
  openPincode: (naar?: string) => void;
  openMobielZoeken: () => void;
  registreerZoekveld: (el: HTMLInputElement | null) => void;
};

const ShellContext = createContext<Shell | null>(null);

export function useShell() {
  const shell = useContext(ShellContext);
  if (!shell) throw new Error("useShell buiten AppShell");
  return shell;
}

export function typtIemand(doel: EventTarget | null) {
  const el = doel as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export function AppShell({
  gegevens,
  beheer,
  isDemo,
  children,
}: {
  gegevens: Gegevens;
  beheer: boolean;
  isDemo: boolean;
  children: ReactNode;
}) {
  const zoekveld = useRef<HTMLInputElement | null>(null);
  const [pincode, setPincode] = useState<{ naar: string } | null>(null);
  const [mobielZoeken, setMobielZoeken] = useState(false);
  const [bladerLijst, setBladerLijst] = useState<string[] | null>(null);

  const zoek = useMemo(() => maakZoeker(gegevens), [gegevens]);
  const persoonOpId = useMemo(() => new Map(gegevens.personen.map((p) => [p.id, p])), [gegevens.personen]);
  const afdelingOpId = useMemo(() => new Map(gegevens.afdelingen.map((a) => [a.id, a])), [gegevens.afdelingen]);
  const standaardVolgorde = useMemo(() => {
    const gezien = new Set<string>();
    const uit: PersoonWeergave[] = [];
    for (const { afdeling } of afdelingenInVolgorde(gegevens.afdelingen)) {
      for (const p of ledenVan(afdeling, gegevens.personen, false)) {
        if (!gezien.has(p.id)) {
          gezien.add(p.id);
          uit.push(p);
        }
      }
    }
    for (const p of gegevens.personen) if (p.zichtbaar && !gezien.has(p.id)) uit.push(p);
    return uit;
  }, [gegevens]);

  const openPersoon = useCallback((slug: string, lijst?: string[]) => {
    setBladerLijst(lijst ?? null);
    const al = new URLSearchParams(window.location.search).get("p");
    zetParams((p) => p.set("p", slug), al ? "replace" : "push");
  }, []);

  const openPincode = useCallback((naar = "/beheer") => setPincode({ naar }), []);
  const openMobielZoeken = useCallback(() => setMobielZoeken(true), []);
  const registreerZoekveld = useCallback((el: HTMLInputElement | null) => {
    zoekveld.current = el;
  }, []);

  // Zoeken: Ctrl+K of Cmd+K, of "/" als je niet aan het typen bent
  useEffect(() => {
    function toets(e: KeyboardEvent) {
      const sneltoets = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      const slash = e.key === "/" && !typtIemand(e.target) && !document.querySelector("dialog[open]");
      if (!sneltoets && !slash) return;
      e.preventDefault();
      const veld = zoekveld.current;
      if (veld && veld.offsetParent !== null) {
        veld.focus();
        veld.select();
      } else setMobielZoeken(true);
    }
    window.addEventListener("keydown", toets);
    return () => window.removeEventListener("keydown", toets);
  }, []);

  // ?pincode=/beheer/... opent het pincodevenster (de proxy stuurt je hierheen zonder beheercookie)
  useEffect(() => {
    const naar = new URLSearchParams(window.location.search).get("pincode");
    if (naar !== null) {
      // Eenmalig bij binnenkomst uit de URL
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPincode({ naar: naar.startsWith("/beheer") ? naar : "/beheer" });
      zetParams((p) => p.delete("pincode"));
    }
  }, []);

  const waarde: Shell = {
    gegevens,
    beheer,
    isDemo,
    zoek,
    persoonOpId,
    afdelingOpId,
    standaardVolgorde,
    openPersoon,
    bladerLijst,
    openPincode,
    openMobielZoeken,
    registreerZoekveld,
  };

  return (
    <ShellContext value={waarde}>
      <div className="relative flex min-h-dvh">
        <Zijbalk />

        <div className="flex min-w-0 flex-1 flex-col">
          {isDemo && (
            <div className="border-b border-oranje/30 bg-oranje/10 px-4 py-1.5 text-center text-[12px] text-actie lg:px-6">
              Demomodus: wijzigingen staan alleen in het geheugen. Koppel Vercel Blob om ze te bewaren.
              {beheer ? "" : " De pincode voor het beheer is lokaal 1234."}
            </div>
          )}
          <Topbalk />
          <main className="flex-1 pb-24 lg:pb-12">{children}</main>
        </div>

        <MobielNav />
      </div>

      <Suspense fallback={null}>
        <ProfielHouder />
      </Suspense>
      {pincode && <PincodeDialoog naar={pincode.naar} onSluit={() => setPincode(null)} />}
      {mobielZoeken && <MobielZoeken onSluit={() => setMobielZoeken(false)} />}
    </ShellContext>
  );
}
