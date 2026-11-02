"use client";

import { useCallback } from "react";
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

  const lijst = bladerLijst?.length ? bladerLijst : standaardVolgorde.map((p) => p.slug);
  const index = persoon ? lijst.indexOf(persoon.slug) : -1;

  const sluit = useCallback(() => {
    zetParams((p) => p.delete("p"));
  }, []);

  const ga = useCallback(
    (stap: number) => {
      if (index < 0) return;
      const volgende = lijst[(index + stap + lijst.length) % lijst.length];
      if (volgende) zetParams((p) => p.set("p", volgende));
    },
    [index, lijst],
  );

  if (!persoon) return null;
  return (
    <ProfielDialoog
      persoon={persoon}
      onSluit={sluit}
      onVorige={index >= 0 && lijst.length > 1 ? () => ga(-1) : undefined}
      onVolgende={index >= 0 && lijst.length > 1 ? () => ga(1) : undefined}
    />
  );
}
