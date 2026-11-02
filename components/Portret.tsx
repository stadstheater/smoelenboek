import type { PersoonWeergave } from "@/lib/types";

/** Drie tinten paars uit de huisstijl voor de initialen, steeds dezelfde per persoon */
const TINTEN = ["bg-basis-paars", "bg-semi-donker-paars", "bg-[#5c4fa8]"];

function tintVoor(sleutel: string) {
  let h = 0;
  for (const c of sleutel) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTEN[h % TINTEN.length];
}

export function initialen(naam: string) {
  const woorden = naam.split(/\s+/).filter((w) => /^[A-ZÀ-Ý]/.test(w));
  const bron = woorden.length ? woorden : naam.split(/\s+/);
  return ((bron[0]?.[0] ?? "?") + (bron.length > 1 ? bron.at(-1)![0] : "")).toUpperCase();
}

/** Foto van een persoon, of initialen op paars als er (nog) geen foto is */
export function Portret({
  persoon,
  formaat = "klein",
  className = "",
  prioriteit = false,
}: {
  persoon: Pick<PersoonWeergave, "naam" | "slug" | "foto_klein" | "foto_groot">;
  formaat?: "klein" | "groot" | "mini";
  className?: string;
  prioriteit?: boolean;
}) {
  const src = formaat === "groot" ? persoon.foto_groot : persoon.foto_klein;
  if (src) {
    return (
      // Foto's komen van stadstheater.nl of uit onze eigen privé-route, dus een gewone img
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        loading={prioriteit ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className={`h-full w-full object-cover object-top ${className}`}
      />
    );
  }
  const tekst = formaat === "mini" ? "text-[13px]" : formaat === "groot" ? "text-[clamp(4rem,10vw,6.5rem)]" : "text-[clamp(2.2rem,5vw,3.2rem)]";
  return (
    <div data-thema="donker" aria-hidden className={`flex h-full w-full items-center justify-center ${tintVoor(persoon.slug)} ${className}`}>
      <span className={`kop text-white/95 ${tekst}`}>{initialen(persoon.naam)}</span>
    </div>
  );
}
