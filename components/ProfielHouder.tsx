"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProfielDialoog } from "@/components/ProfielDialoog";
import { useShell } from "@/components/shell/AppShell";
import { zetParams } from "@/lib/url";

/** Opent de pop-up als ?p=slug in de URL staat, op elke pagina. Zo is elk profiel deelbaar. */
export function ProfielHouder() {
  const params = useSearchParams();
  const { gegevens, standaardVolgorde, bladerLijst } = useShell();
  const slug = params.get("p");
  const persoon = slug ? gegevens.personen.find((p) => p.slug === slug) : undefined;

  // Na vorige of volgende schuift de inhoud in die richting
  const [stap, setStap] = useState<{ slug: string; richting: number } | null>(null);

  const lijst = bladerLijst?.length ? bladerLijst : standaardVolgorde.map((p) => p.slug);
  const index = persoon ? lijst.indexOf(persoon.slug) : -1;

  const sluit = useCallback(() => {
    zetParams((p) => p.delete("p"));
  }, []);

  function ga(richting: number) {
    if (index < 0) return;
    const volgende = lijst[(index + richting + lijst.length) % lijst.length];
    if (!volgende) return;
    setStap({ slug: volgende, richting });
    zetParams((p) => p.set("p", volgende));
  }

  if (!persoon) return null;
  return (
    <ProfielDialoog
      persoon={persoon}
      onSluit={sluit}
      onVorige={index >= 0 && lijst.length > 1 ? () => ga(-1) : undefined}
      onVolgende={index >= 0 && lijst.length > 1 ? () => ga(1) : undefined}
      richting={stap?.slug === persoon.slug ? stap.richting : 0}
    />
  );
}
