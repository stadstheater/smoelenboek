"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Network, Search, Settings, UsersRound } from "lucide-react";
import { useShell } from "@/components/shell/AppShell";

const item = "relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-inkt-3 transition-colors active:text-inkt";

export function MobielNav() {
  const pad = usePathname();
  const { beheer, openMobielZoeken, openPincode } = useShell();

  return (
    <nav
      aria-label="Hoofdmenu"
      className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t border-sluier/[0.08] bg-vlak-diep/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <Link href="/" className={`${item} ${pad === "/" ? "text-inkt" : ""}`} aria-current={pad === "/" ? "page" : undefined}>
        <UsersRound size={20} aria-hidden />
        Smoelenboek
      </Link>
      <button type="button" onClick={openMobielZoeken} className={item}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-oranje text-white shadow-lg shadow-oranje/30">
          <Search size={20} aria-hidden />
        </span>
        <span className="sr-only">Zoeken</span>
      </button>
      <Link
        href="/organigram"
        className={`${item} ${pad.startsWith("/organigram") ? "text-inkt" : ""}`}
        aria-current={pad.startsWith("/organigram") ? "page" : undefined}
      >
        <Network size={20} aria-hidden />
        Organigram
      </Link>
      {beheer ? (
        <Link href="/beheer" className={`${item} ${pad.startsWith("/beheer") ? "text-inkt" : ""}`}>
          <Settings size={20} aria-hidden />
          Beheer
        </Link>
      ) : (
        <button type="button" onClick={() => openPincode()} className={item}>
          <Settings size={20} aria-hidden />
          Beheer
        </button>
      )}
    </nav>
  );
}
