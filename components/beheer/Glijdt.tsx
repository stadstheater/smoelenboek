"use client";

import { addTransitionType, startTransition, ViewTransition, type ReactNode } from "react";
import { VOLGORDE } from "@/lib/animatie";

/** Een rij die naar zijn nieuwe plek glijdt als de volgorde verandert */
export function Glijdt({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ViewTransition
      name={name}
      update={{ [VOLGORDE]: "kaart-verplaats", default: "none" }}
      share={{ [VOLGORDE]: "kaart-verplaats", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

/** Voert een wijziging in de volgorde uit als overgang, zodat de rijen gaan glijden */
export function metVolgorde(wijziging: () => void) {
  startTransition(() => {
    addTransitionType(VOLGORDE);
    wijziging();
  });
}
