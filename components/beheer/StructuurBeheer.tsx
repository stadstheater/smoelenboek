"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDown, ArrowUp, CircleCheck, Eye, EyeOff, Network } from "lucide-react";
import { wijzigPlaatsActie, zetVolgordeActie } from "@/app/actions";
import { Portret } from "@/components/Portret";
import { useShell } from "@/components/shell/AppShell";
import { useToast } from "@/components/shell/Toasts";
import { aandachtspunten, afdelingenInVolgorde, leidinggevendeMaaktRondje, sorteerPersonen } from "@/lib/hierarchie";
import type { PersoonWeergave } from "@/lib/types";

/** Hiërarchie per persoon: afdeling, leidinggevende, volgorde en zichtbaarheid. Elke wijziging wordt direct bewaard. */
export function StructuurBeheer() {
  const { gegevens, persoonOpId } = useShell();
  const router = useRouter();
  const toast = useToast();
  const [bezig, startTransition] = useTransition();
  // Direct tonen wat je kiest, ook voordat de server klaar is
  const [lokaal, setLokaal] = useState<Record<string, Partial<PersoonWeergave>>>({});

  const personen = useMemo(() => gegevens.personen.map((p) => ({ ...p, ...lokaal[p.id] })), [gegevens.personen, lokaal]);
  const punten = useMemo(() => aandachtspunten(personen, gegevens.afdelingen), [personen, gegevens.afdelingen]);

  const groepen = useMemo(() => {
    const uit = afdelingenInVolgorde(gegevens.afdelingen).map(({ afdeling, diepte }) => ({
      id: afdeling.id,
      naam: afdeling.naam,
      hoofd: afdeling.hoofd_id,
      diepte,
      leden: sorteerPersonen(personen.filter((p) => p.afdeling_id === afdeling.id)).sort(
        (a, b) => Number(b.id === afdeling.hoofd_id) - Number(a.id === afdeling.hoofd_id),
      ),
    }));
    const zonder = personen.filter((p) => !p.afdeling_id || !gegevens.afdelingen.some((a) => a.id === p.afdeling_id));
    if (zonder.length) uit.push({ id: "zonder", naam: "Zonder afdeling", hoofd: null, diepte: 0, leden: sorteerPersonen(zonder) });
    return uit;
  }, [gegevens.afdelingen, personen]);

  function wijzig(p: PersoonWeergave, wijziging: { leidinggevende_id?: string | null; afdeling_id?: string | null; zichtbaar?: boolean }) {
    setLokaal((oud) => ({ ...oud, [p.id]: { ...oud[p.id], ...wijziging } }));
    startTransition(async () => {
      const r = await wijzigPlaatsActie(p.id, wijziging);
      if (r.fout) {
        toast(r.fout, "fout");
        setLokaal((oud) => {
          const rest = { ...oud };
          delete rest[p.id];
          return rest;
        });
      } else toast(`${p.naam} bijgewerkt`);
      router.refresh();
    });
  }

  function verschuif(leden: PersoonWeergave[], i: number, richting: -1 | 1) {
    const j = i + richting;
    if (j < 0 || j >= leden.length) return;
    const nieuw = [...leden];
    [nieuw[i], nieuw[j]] = [nieuw[j], nieuw[i]];
    startTransition(async () => {
      const r = await zetVolgordeActie("personen", nieuw.map((x) => x.id));
      if (r.fout) toast(r.fout, "fout");
      router.refresh();
    });
  }

  const opties = [...gegevens.personen].sort((a, b) => a.naam.localeCompare(b.naam, "nl"));

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <p className="text-[13px] text-inkt-3">
          Kies per persoon de afdeling en de leidinggevende. Daarmee bouw je het{" "}
          <Link href="/organigram" className="text-actie hover:underline">
            organigram
          </Link>
          . Elke wijziging wordt direct bewaard. Het hoofd van een afdeling stel je in bij Afdelingen.
        </p>
        {groepen.map((g) =>
          g.leden.length === 0 ? null : (
            <section key={g.id} aria-labelledby={`s-${g.id}`} className="kaart overflow-hidden">
              <div className="flex items-end gap-3 border-b border-sluier/[0.07] px-4 py-3">
                <h2 id={`s-${g.id}`} className="min-w-0 flex-1 font-display text-[18px] font-semibold tracking-wide uppercase" style={{ paddingLeft: `${g.diepte}rem` }}>
                  {g.naam}
                </h2>
                <span className="eyebrow hidden w-40 md:block">Afdeling</span>
                <span className="eyebrow hidden w-44 md:block">Valt onder</span>
                <span className="w-9" aria-hidden />
              </div>
              <ul className="divide-y divide-sluier/[0.05]">
                {g.leden.map((p, i) => {
                  const isHoofd = p.id === g.hoofd;
                  return (
                    <li key={p.id} className={`flex flex-wrap items-center gap-3 px-4 py-2.5 ${p.zichtbaar ? "" : "opacity-60"}`}>
                      <div className="flex flex-col">
                        <button type="button" disabled={bezig || i === 0} onClick={() => verschuif(g.leden, i, -1)} className="rounded p-0.5 text-inkt-4 hover:text-inkt disabled:opacity-30" aria-label={`${p.naam} omhoog`}>
                          <ArrowUp size={13} />
                        </button>
                        <button type="button" disabled={bezig || i === g.leden.length - 1} onClick={() => verschuif(g.leden, i, 1)} className="rounded p-0.5 text-inkt-4 hover:text-inkt disabled:opacity-30" aria-label={`${p.naam} omlaag`}>
                          <ArrowDown size={13} />
                        </button>
                      </div>
                      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-sluier/[0.06]">
                        <Portret persoon={p} formaat="mini" />
                      </span>
                      <div className="min-w-[160px] flex-1">
                        <p className="flex items-center gap-2 text-[13.5px] font-semibold">
                          {p.naam} {isHoofd && <span className="infoblokje">Hoofd</span>}
                        </p>
                        <p className="text-[12px] text-inkt-3">{p.functie}</p>
                      </div>
                      <select
                          value={p.afdeling_id ?? ""}
                          onChange={(e) => wijzig(p, { afdeling_id: e.target.value || null })}
                          className="veld h-9 min-h-0 w-40 py-0 text-[13px]"
                          aria-label={`Afdeling van ${p.naam}`}
                        >
                          <option value="">Geen</option>
                          {gegevens.afdelingen.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.naam}
                            </option>
                          ))}
                        </select>
                        <select
                          value={p.leidinggevende_id ?? ""}
                          onChange={(e) => wijzig(p, { leidinggevende_id: e.target.value || null })}
                          className="veld h-9 min-h-0 w-44 py-0 text-[13px]"
                          aria-label={`Leidinggevende van ${p.naam}`}
                        >
                          <option value="">Niemand</option>
                          {opties
                            .filter((x) => x.id !== p.id && !leidinggevendeMaaktRondje(personen, p.id, x.id))
                            .map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.naam}
                              </option>
                            ))}
                        </select>
                      <button
                        type="button"
                        onClick={() => wijzig(p, { zichtbaar: !p.zichtbaar })}
                        className="knop knop-ghost knop-icoon"
                        aria-pressed={!p.zichtbaar}
                        aria-label={p.zichtbaar ? `${p.naam} verbergen` : `${p.naam} weer tonen`}
                        title={p.zichtbaar ? "Zichtbaar; klik om te verbergen" : "Verborgen; klik om te tonen"}
                      >
                        {p.zichtbaar ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
        )}
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="kaart p-4">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            {punten.length ? <AlertTriangle size={16} className="text-actie" aria-hidden /> : <CircleCheck size={16} className="text-groen" aria-hidden />}
            Aandachtspunten
          </h2>
          {punten.length === 0 ? (
            <p className="mt-2 text-[13px] text-inkt-3">Alles is ingevuld.</p>
          ) : (
            <ul className="dunne-scrollbar mt-3 max-h-[60vh] space-y-1 overflow-y-auto">
              {punten.map((pt, i) => {
                const p = persoonOpId.get(pt.persoon_id);
                if (!p) return null;
                return (
                  <li key={i}>
                    <Link href={`/beheer/medewerkers/${p.id}`} className="block rounded-md px-2 py-1.5 text-[12.5px] hover:bg-sluier/[0.06]">
                      <span className="font-semibold">{p.naam}</span> <span className="text-inkt-3">{pt.tekst}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/organigram" className="knop knop-wit mt-4 w-full">
            <Network size={15} aria-hidden /> Organigram bekijken
          </Link>
        </div>
      </aside>
    </div>
  );
}
