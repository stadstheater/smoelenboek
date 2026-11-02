"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useShell } from "@/components/shell/AppShell";
import { Logo } from "@/components/shell/Logo";
import { Zoekbalk } from "@/components/shell/Zoekbalk";
import { ThemaKnop } from "@/thema/ThemaKnop";

export function Topbalk() {
  const pad = usePathname();
  const { beheer, openMobielZoeken } = useShell();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-sluier/[0.07] bg-vlak/85 px-4 backdrop-blur-md lg:px-6">
      <Link href="/" className="shrink-0 lg:hidden" aria-label="Naar het smoelenboek">
        <Logo width={110} height={23} />
      </Link>

      <div className="hidden min-w-0 flex-1 justify-center md:flex">
        <Zoekbalk />
      </div>

      <button type="button" onClick={openMobielZoeken} className="knop knop-ghost knop-icoon ml-auto shrink-0 md:hidden" aria-label="Zoeken">
        <Search size={18} />
      </button>

      <ThemaKnop className="knop knop-ghost knop-icoon shrink-0" />

      {beheer && !pad.startsWith("/beheer/medewerkers/") && (
        <Link href="/beheer/medewerkers/nieuw" className="knop knop-vol hidden shrink-0 sm:inline-flex">
          <Plus size={16} aria-hidden /> Persoon toevoegen
        </Link>
      )}
    </header>
  );
}
