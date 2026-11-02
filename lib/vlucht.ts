/**
 * Laat een kopie van een foto van de ene plek naar de andere vliegen (de FLIP-techniek):
 * de kopie staat al op de eindplek en begint verschoven en geschaald op de beginplek.
 * Zo animeert alleen transform, en dat loopt soepel, ook op een telefoon.
 */
export function vliegFoto({
  kopie,
  van,
  naar,
  ouder,
  duur,
  rondingVan,
  rondingNaar,
}: {
  kopie: HTMLElement;
  van: DOMRect;
  naar: DOMRect;
  ouder: HTMLElement;
  duur: number;
  rondingVan: number;
  rondingNaar: number;
}) {
  const geest = kopie.cloneNode(true) as HTMLElement;
  geest.removeAttribute("data-foto");
  geest.setAttribute("aria-hidden", "true");
  // Alleen de foto vliegt, niet de labels die erop staan
  geest.querySelectorAll(".infoblokje").forEach((label) => label.remove());
  Object.assign(geest.style, {
    position: "fixed",
    left: `${naar.left}px`,
    top: `${naar.top}px`,
    width: `${naar.width}px`,
    height: `${naar.height}px`,
    margin: "0",
    transformOrigin: "0 0",
    zIndex: "20",
    pointerEvents: "none",
    overflow: "hidden",
    transition: "none",
    visibility: "visible",
  });
  ouder.appendChild(geest);
  const sx = van.width / naar.width;
  const sy = van.height / naar.height;
  const anim = geest.animate(
    [
      // De ronding schaalt mee, dus omrekenen zodat hij er aan het begin net zo uitziet als op de beginplek
      { transform: `translate(${van.left - naar.left}px, ${van.top - naar.top}px) scale(${sx}, ${sy})`, borderRadius: `${rondingVan / sx}px` },
      { transform: "none", borderRadius: `${rondingNaar}px` },
    ],
    { duration: duur, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" },
  );
  return { geest, anim };
}
