"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { verwijderPersoonActie } from "@/app/actions";
import { Portret } from "@/components/Portret";
import { useShell } from "@/components/shell/AppShell";
import { useToast } from "@/components/shell/Toasts";
import { meervoud } from "@/lib/format";
import { aandachtspunten } from "@/lib/hierarchie";
import { normaliseer } from "@/lib/zoeken/normaliseer";

export function MedewerkersBeheer() {
  const { gegevens, afdelingOpId, persoonOpId, openPersoon } = useShell();
  const router = useRouter();
  const toast = useToast();
  const [zoek, setZoek] = useState("");
  const [afd, setAfd] = useState("");
  const [bezig, startTransition] = useTransition();

  const punten = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of aandachtspunten(gegevens.personen, gegevens.afdelingen)) m.set(p.persoon_id, [...(m.get(p.persoon_id) ?? []), p.tekst]);
    return m;
  }, [gegevens]);

  const lijst = useMemo(() => {
    const q = normaliseer(zoek);
    return [...gegevens.personen]
      .filter((p) => !afd || (afd === "geen" ? !p.afdeling_id : p.afdeling_id === afd || p.extra_afdeling_ids.includes(afd)))
      .filter((p) => !q || normaliseer(`${p.naam} ${p.functie} ${p.email ?? ""} ${afdelingOpId.get(p.afdeling_id ?? "")?.naam ?? ""}`).includes(q))
      .sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  }, [gegevens.personen, zoek, afd, afdelingOpId]);

  function verwijder(id: string, naam: string) {
    if (!confirm(`${naam} uit het smoelenboek halen? Dit kun je niet ongedaan maken (behalve met een back-up).`)) return;
    startTransition(async () => {
      const r = await verwijderPersoonActie(id);
      if (r.fout) toast(r.fout, "fout");
      else {
        toast(`${naam} is verwijderd`);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-inkt-4" aria-hidden />
          <input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Filter op naam, functie of e-mail" className="veld h-10 min-h-0 pl-9 text-[13.5px]" aria-label="Filter" />
        </label>
        <select value={afd} onChange={(e) => setAfd(e.target.value)} className="veld h-10 min-h-0 w-auto py-0 text-[13.5px]" aria-label="Afdeling">
          <option value="">Alle afdelingen</option>
          {gegevens.afdelingen.map((a) => (
            <option key={a.id} value={a.id}>
              {a.naam}
            </option>
          ))}
          <option value="geen">Zonder afdeling</option>
        </select>
        <span className="text-[13px] text-inkt-4">{meervoud(lijst.length, "persoon", "mensen")}</span>
        <Link href="/beheer/medewerkers/nieuw" className="knop knop-vol ml-auto">
          <Plus size={16} aria-hidden /> Persoon toevoegen
        </Link>
      </div>

      <div className="kaart mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-sluier/[0.08] text-[11px] font-semibold tracking-[0.08em] text-inkt-4 uppercase">
              <th className="py-3 pr-3 pl-4 font-semibold">Naam</th>
              <th className="px-3 py-3 font-semibold">Afdeling</th>
              <th className="px-3 py-3 font-semibold">Leidinggevende</th>
              <th className="px-3 py-3 font-semibold">E-mail</th>
              <th className="px-3 py-3 font-semibold">Aandacht</th>
              <th className="py-3 pr-4 pl-3 text-right font-semibold">
                <span className="sr-only">Acties</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lijst.map((p) => {
              const lg = p.leidinggevende_id ? persoonOpId.get(p.leidinggevende_id) : undefined;
              const aandacht = punten.get(p.id) ?? [];
              return (
                <tr key={p.id} className="border-b border-sluier/[0.05] last:border-0 hover:bg-sluier/[0.03]">
                  <td className="py-2 pr-3 pl-4">
                    <button type="button" onClick={() => openPersoon(p.slug)} className="flex items-center gap-3 text-left">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sluier/[0.06]">
                        <Portret persoon={p} formaat="mini" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-semibold hover:underline">
                          {p.naam}
                          {!p.zichtbaar && <EyeOff size={13} className="text-inkt-4" aria-label="Verborgen" />}
                        </span>
                        <span className="block text-[12.5px] text-inkt-3">{p.functie || "Geen functie"}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-2 text-inkt-2">{afdelingOpId.get(p.afdeling_id ?? "")?.naam ?? <span className="text-inkt-5">Geen</span>}</td>
                  <td className="px-3 py-2 text-inkt-2">{lg?.naam ?? <span className="text-inkt-5">Geen</span>}</td>
                  <td className="px-3 py-2 text-inkt-3">{p.email ?? <span className="text-inkt-5">Geen</span>}</td>
                  <td className="px-3 py-2">
                    {aandacht.length ? (
                      <span className="chip text-actie" title={aandacht.join(", ")}>
                        {aandacht.length === 1 ? aandacht[0] : `${aandacht.length} punten`}
                      </span>
                    ) : (
                      <span className="text-[12px] text-groen">Compleet</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 pl-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/beheer/medewerkers/${p.id}`} className="knop knop-ghost knop-icoon" aria-label={`${p.naam} bewerken`} title="Bewerken">
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => verwijder(p.id, p.naam)}
                        disabled={bezig}
                        className="knop knop-ghost knop-icoon hover:text-rood!"
                        aria-label={`${p.naam} verwijderen`}
                        title="Verwijderen"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!lijst.length && <p className="p-6 text-center text-[13px] text-inkt-4">Niemand gevonden.</p>}
      </div>
    </div>
  );
}
