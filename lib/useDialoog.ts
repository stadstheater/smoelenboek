"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { minderBeweging, SLUITDUUR } from "@/lib/animatie";

/**
 * Native <dialog> als modaal venster dat net zo zacht dichtgaat als het opengaat.
 * Esc, klikken naast het venster en sluit() spelen eerst de sluitanimatie af (CSS: dialog.paneel[data-sluit])
 * en sluiten dan echt. voorSluiten kan een eigen animatie toevoegen, bijvoorbeeld de foto terug naar de kaart.
 */
export function useDialoog(voorSluiten?: (dialoog: HTMLDialogElement) => Promise<unknown> | void) {
  const ref = useRef<HTMLDialogElement>(null);
  const bezig = useRef(false);
  const voor = useRef(voorSluiten);

  useEffect(() => {
    voor.current = voorSluiten;
  });

  // Openen voordat de browser tekent, zodat animaties de echte plek in het venster kunnen meten
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  const sluit = useCallback(async () => {
    const el = ref.current;
    if (!el?.open || bezig.current) return;
    if (minderBeweging()) return el.close();
    bezig.current = true;
    el.setAttribute("data-sluit", "");
    await Promise.all([Promise.resolve(voor.current?.(el)).catch(() => {}), new Promise((klaar) => setTimeout(klaar, SLUITDUUR))]);
    el.close();
    el.removeAttribute("data-sluit");
    bezig.current = false;
  }, []);

  // Esc: eerst de animatie, dan dicht
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const annuleer = (e: Event) => {
      e.preventDefault();
      sluit();
    };
    el.addEventListener("cancel", annuleer);
    return () => el.removeEventListener("cancel", annuleer);
  }, [sluit]);

  return { ref, sluit };
}
