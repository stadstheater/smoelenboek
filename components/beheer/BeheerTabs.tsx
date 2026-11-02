"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileSpreadsheet, GitFork, Tags, UsersRound } from "lucide-react";

const TABS = [
  { href: "/beheer", label: "Medewerkers", icon: UsersRound, actief: (p: string) => p === "/beheer" || p.startsWith("/beheer/medewerkers") },
  { href: "/beheer/afdelingen", label: "Afdelingen", icon: Building2, actief: (p: string) => p.startsWith("/beheer/afdelingen") },
  { href: "/beheer/structuur", label: "Structuur", icon: GitFork, actief: (p: string) => p.startsWith("/beheer/structuur") },
  { href: "/beheer/zoekwoorden", label: "Zoekwoorden", icon: Tags, actief: (p: string) => p.startsWith("/beheer/zoekwoorden") },
  { href: "/beheer/import", label: "Import en export", icon: FileSpreadsheet, actief: (p: string) => p.startsWith("/beheer/import") },
];

export function BeheerTabs() {
  const pad = usePathname();
  return (
    <nav aria-label="Beheer" className="geen-scrollbar -mx-4 mt-5 overflow-x-auto border-b border-sluier/[0.1] px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1">
        {TABS.map(({ href, label, icon: Icoon, actief }) => {
          const aan = actief(pad);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={aan ? "page" : undefined}
                className={`relative flex h-11 items-center gap-2 px-3 text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                  aan ? "text-inkt" : "text-inkt-4 hover:text-inkt"
                }`}
              >
                <Icoon size={16} aria-hidden /> {label}
                {aan && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t bg-oranje" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
