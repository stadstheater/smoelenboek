"use client";

import { Suspense, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LockKeyhole, LogOut, Network, PanelLeftClose, PanelLeftOpen, Search, Settings, UsersRound, type LucideIcon } from "lucide-react";
import { beheerVerlatenActie, uitloggenActie } from "@/app/actions";
import { useShell } from "@/components/shell/AppShell";
import { Logo } from "@/components/shell/Logo";
import { FILTER } from "@/lib/animatie";
import { afdelingenInVolgorde } from "@/lib/hierarchie";

const SLEUTEL = "smoelenboek_zijbalk_ingeklapt";
const luisteraars = new Set<() => void>();

function leesIngeklapt() {
  try {
    return localStorage.getItem(SLEUTEL) === "1";
  } catch {
    return false;
  }
}

function zetIngeklapt(waarde: boolean) {
  try {
    localStorage.setItem(SLEUTEL, waarde ? "1" : "0");
  } catch {}
  luisteraars.forEach((cb) => cb());
}

type NavItem = { href: string; label: string; icon: LucideIcon; actief: (p: string) => boolean; aantal?: number };

function AfdelingenLijst() {
  const { gegevens } = useShell();
  const pad = usePathname();
  const params = useSearchParams();
  const gekozen = pad === "/" ? params.get("afdeling") : null;
  const telling = new Map<string, number>();
  for (const p of gegevens.personen) {
    if (!p.zichtbaar) continue;
    for (const id of new Set([p.afdeling_id, ...p.extra_afdeling_ids])) if (id) telling.set(id, (telling.get(id) ?? 0) + 1);
  }
  const afdelingen = afdelingenInVolgorde(gegevens.afdelingen).filter(({ afdeling }) => telling.get(afdeling.id));

  return (
    <div>
      <p className="eyebrow px-2.5 pb-1.5">Afdelingen</p>
      <ul className="space-y-0.5">
        {afdelingen.map(({ afdeling, diepte }) => {
          const aan = gekozen === afdeling.slug;
          return (
            <li key={afdeling.id}>
              <Link
                href={aan ? "/" : `/?afdeling=${afdeling.slug}`}
                scroll={false}
                transitionTypes={pad === "/" ? FILTER : undefined}
                aria-current={aan ? "true" : undefined}
                className={`flex h-8 items-center gap-2 rounded-lg px-2.5 text-[13px] transition-colors ${
                  aan ? "bg-sluier/[0.09] font-medium text-inkt" : "text-inkt-3 hover:bg-sluier/[0.06] hover:text-inkt"
                }`}
                style={{ paddingLeft: `${0.625 + diepte * 0.75}rem` }}
              >
                <span className="min-w-0 flex-1 truncate">{afdeling.naam}</span>
                <span className="text-[12px] tabular-nums text-inkt-5">{telling.get(afdeling.id)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Zijbalk() {
  const pad = usePathname();
  const { gegevens, beheer, openPincode } = useShell();
  const ingeklapt = useSyncExternalStore(
    (cb) => {
      luisteraars.add(cb);
      return () => luisteraars.delete(cb);
    },
    leesIngeklapt,
    () => false,
  );

  const nav: NavItem[] = [
    { href: "/", label: "Smoelenboek", icon: UsersRound, actief: (p) => p === "/", aantal: gegevens.personen.filter((p) => p.zichtbaar).length },
    { href: "/organigram", label: "Organigram", icon: Network, actief: (p) => p.startsWith("/organigram") },
    { href: "/zoeken", label: "Zoeken", icon: Search, actief: (p) => p.startsWith("/zoeken") },
  ];
  if (beheer) nav.push({ href: "/beheer", label: "Beheer", icon: Settings, actief: (p) => p.startsWith("/beheer") });

  const knop = `flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium text-inkt-3 transition-colors hover:bg-sluier/[0.07] hover:text-inkt ${
    ingeklapt ? "justify-center px-0" : ""
  }`;

  return (
    <aside
      className={`sticky top-0 z-40 hidden h-dvh shrink-0 flex-col border-r border-sluier/[0.07] bg-vlak-diep/80 backdrop-blur transition-[width] duration-200 lg:flex ${
        ingeklapt ? "w-16" : "w-[248px]"
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center border-b border-sluier/[0.07] ${ingeklapt ? "justify-center" : "justify-between pr-2 pl-4"}`}>
        {!ingeklapt && (
          <Link href="/" className="flex items-center gap-2.5" aria-label="Naar het smoelenboek">
            <Logo width={118} height={25} />
          </Link>
        )}
        <button
          type="button"
          onClick={() => zetIngeklapt(!ingeklapt)}
          className="knop knop-ghost knop-icoon h-8 w-8"
          aria-label={ingeklapt ? "Zijbalk uitklappen" : "Zijbalk inklappen"}
          title={ingeklapt ? "Uitklappen" : "Inklappen"}
        >
          {ingeklapt ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      <nav aria-label="Hoofdmenu" className="space-y-0.5 p-2">
        {nav.map(({ href, label, icon: Icoon, actief, aantal }) => {
          const aan = actief(pad);
          return (
            <Link
              key={href}
              href={href}
              aria-current={aan ? "page" : undefined}
              title={ingeklapt ? label : undefined}
              className={`relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${
                aan ? "bg-sluier/[0.09] text-inkt" : "text-inkt-3 hover:bg-sluier/[0.06] hover:text-inkt"
              } ${ingeklapt ? "justify-center px-0" : ""}`}
            >
              {aan && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r bg-oranje" aria-hidden />}
              <Icoon size={17} className="shrink-0" aria-hidden />
              {!ingeklapt && (
                <>
                  <span className="flex-1">{label}</span>
                  {aantal !== undefined && <span className="text-[12px] tabular-nums text-inkt-5">{aantal}</span>}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="dunne-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-3">{!ingeklapt && (
          <Suspense fallback={null}>
            <AfdelingenLijst />
          </Suspense>
        )}</div>

      <div className="space-y-0.5 border-t border-sluier/[0.07] p-2">
        {beheer ? (
          <form action={beheerVerlatenActie}>
            <button type="submit" title={ingeklapt ? "Beheer verlaten" : undefined} className={knop}>
              <LockKeyhole size={17} className="shrink-0" aria-hidden />
              {!ingeklapt && "Beheer verlaten"}
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => openPincode()} title={ingeklapt ? "Beheer" : undefined} className={knop}>
            <Settings size={17} className="shrink-0" aria-hidden />
            {!ingeklapt && "Beheer"}
          </button>
        )}
        <form action={uitloggenActie}>
          <button type="submit" title={ingeklapt ? "Uitloggen" : undefined} className={knop}>
            <LogOut size={17} className="shrink-0" aria-hidden />
            {!ingeklapt && "Uitloggen"}
          </button>
        </form>
      </div>
    </aside>
  );
}
