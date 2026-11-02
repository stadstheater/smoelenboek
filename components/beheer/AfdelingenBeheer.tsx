"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { slaAfdelingOpActie, verwijderAfdelingActie, zetVolgordeActie, type FormStatus } from "@/app/actions";
import { TrefwoordInvoer } from "@/components/beheer/TrefwoordInvoer";
import { useShell } from "@/components/shell/AppShell";
import { useToast } from "@/components/shell/Toasts";
import { meervoud } from "@/lib/format";
import { afdelingenInVolgorde, bovenliggendeMaaktRondje } from "@/lib/hierarchie";
import type { Afdeling } from "@/lib/types";

function AfdelingVenster({ afdeling, onSluit }: { afdeling: Afdeling | null; onSluit: () => void }) {
  const { gegevens } = useShell();
  const router = useRouter();
  const toast = useToast();
  const dialoog = useRef<HTMLDialogElement>(null);
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(slaAfdelingOpActie, {});
  const [trefwoorden, setTrefwoorden] = useState<string[]>(afdeling?.trefwoorden ?? []);

  useEffect(() => {
    dialoog.current?.showModal();
  }, []);

  useEffect(() => {
    if (!status.ok) return;
    toast(afdeling ? "Afdeling opgeslagen" : "Afdeling toegevoegd");
    router.refresh();
    dialoog.current?.close();
  }, [status, afdeling, router, toast]);

  const leden = gegevens.personen
    .filter((p) => afdeling && (p.afdeling_id === afdeling.id || p.extra_afdeling_ids.includes(afdeling.id)))
    .sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  const anderen = gegevens.personen.filter((p) => !leden.includes(p)).sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  const ouders = gegevens.afdelingen.filter((a) => !afdeling || (a.id !== afdeling.id && !bovenliggendeMaaktRondje(gegevens.afdelingen, afdeling.id, a.id)));

  return (
    <dialog ref={dialoog} onClose={onSluit} aria-labelledby="afd-titel" className="paneel fixed inset-0 m-0 h-full w-full bg-transparent p-0 text-inkt">
      <div className="flex h-full items-end justify-center sm:items-center sm:p-6" onClick={(e) => e.target === e.currentTarget && dialoog.current?.close()}>
        <form action={actie} className="dunne-scrollbar relative max-h-[92dvh] w-full max-w-2xl animate-pop overflow-y-auto rounded-t-2xl border border-sluier/10 bg-vlak-diep p-6 shadow-2xl shadow-schaduw/50 sm:rounded-2xl">
          <button type="button" onClick={() => dialoog.current?.close()} className="knop knop-ghost knop-icoon absolute top-3 right-3" aria-label="Sluiten">
            <X size={17} />
          </button>
          <h2 id="afd-titel" className="text-[18px] font-semibold">
            {afdeling ? `${afdeling.naam} bewerken` : "Afdeling toevoegen"}
          </h2>
          {afdeling && <input type="hidden" name="id" value={afdeling.id} />}
          {afdeling && <input type="hidden" name="volgorde" value={afdeling.volgorde} />}
          <input type="hidden" name="trefwoorden" value={JSON.stringify(trefwoorden)} />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-inkt-2">Naam</span>
              <input name="naam" required defaultValue={afdeling?.naam ?? ""} className="veld" autoFocus />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-inkt-2">Korte beschrijving</span>
              <textarea name="beschrijving" defaultValue={afdeling?.beschrijving ?? ""} rows={2} className="veld resize-y" placeholder="Waar houdt deze afdeling zich mee bezig?" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-inkt-2">Hoofd of eerste aanspreekpunt</span>
              <select name="hoofd_id" defaultValue={afdeling?.hoofd_id ?? ""} className="veld">
                <option value="">Geen</option>
                {leden.length > 0 && (
                  <optgroup label="In deze afdeling">
                    {leden.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.naam}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Anderen">
                  {anderen.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.naam}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-inkt-2">Valt onder afdeling</span>
              <select name="parent_id" defaultValue={afdeling?.parent_id ?? ""} className="veld">
                <option value="">Geen (hoofdafdeling)</option>
                {ouders.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.naam}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-start gap-3 sm:col-span-2">
              <input name="soort" type="checkbox" value="toezicht" defaultChecked={afdeling?.soort === "toezicht"} className="mt-1 h-4 w-4 accent-[var(--stz-oranje)]" />
              <span>
                <span className="block text-[13.5px] font-medium">Toezicht of bestuur, geen medewerkers</span>
                <span className="block text-[12px] text-inkt-4">Zoals de Raad van Toezicht: apart onderaan in het smoelenboek en los in het organigram.</span>
              </span>
            </label>
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-inkt-2">Waarvoor kun je bij deze afdeling terecht</span>
              <TrefwoordInvoer label="Trefwoorden afdeling" waarden={trefwoorden} onChange={setTrefwoorden} />
              <p className="mt-1 text-[12px] text-inkt-4">Iedereen in de afdeling is via deze woorden te vinden; het hoofd komt dan bovenaan.</p>
            </div>
          </div>

          {status.fout && (
            <p role="alert" className="mt-4 text-[13px] font-semibold text-rood">
              {status.fout}
            </p>
          )}
          <div className="mt-6 flex gap-2">
            <button type="submit" disabled={bezig} className="knop knop-vol h-10 px-5">
              {bezig ? "Opslaan" : "Opslaan"}
            </button>
            <button type="button" onClick={() => dialoog.current?.close()} className="knop knop-ghost h-10">
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export function AfdelingenBeheer() {
  const { gegevens, persoonOpId } = useShell();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState<{ afdeling: Afdeling | null } | null>(null);
  const [bezig, startTransition] = useTransition();
  const boom = useMemo(() => afdelingenInVolgorde(gegevens.afdelingen), [gegevens.afdelingen]);

  function aantal(a: Afdeling) {
    return gegevens.personen.filter((p) => p.afdeling_id === a.id || p.extra_afdeling_ids.includes(a.id)).length;
  }

  /** Een plek omhoog of omlaag tussen afdelingen met dezelfde bovenliggende afdeling */
  function verschuif(a: Afdeling, richting: -1 | 1) {
    const broers = boom.map((x) => x.afdeling).filter((x) => x.parent_id === a.parent_id);
    const i = broers.findIndex((x) => x.id === a.id);
    const j = i + richting;
    if (j < 0 || j >= broers.length) return;
    const nieuw = [...broers];
    [nieuw[i], nieuw[j]] = [nieuw[j], nieuw[i]];
    startTransition(async () => {
      const r = await zetVolgordeActie("afdelingen", nieuw.map((x) => x.id));
      if (r.fout) toast(r.fout, "fout");
      router.refresh();
    });
  }

  function verwijder(a: Afdeling) {
    const n = aantal(a);
    if (!confirm(`Afdeling ${a.naam} verwijderen?${n ? ` ${meervoud(n, "persoon staat", "mensen staan")} daarna zonder deze afdeling.` : ""}`)) return;
    startTransition(async () => {
      const r = await verwijderAfdelingActie(a.id);
      if (r.fout) toast(r.fout, "fout");
      else toast(`${a.naam} is verwijderd`);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] text-inkt-3">De volgorde hier is ook de volgorde in het smoelenboek.</p>
        <button type="button" onClick={() => setOpen({ afdeling: null })} className="knop knop-vol ml-auto">
          <Plus size={16} aria-hidden /> Afdeling toevoegen
        </button>
      </div>
      <ul className="kaart mt-4 divide-y divide-sluier/[0.06]">
        {boom.map(({ afdeling: a, diepte }) => {
          const broers = boom.map((x) => x.afdeling).filter((x) => x.parent_id === a.parent_id);
          const plek = broers.findIndex((x) => x.id === a.id);
          const hoofd = a.hoofd_id ? persoonOpId.get(a.hoofd_id) : undefined;
          return (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3" style={{ paddingLeft: `${1 + diepte * 1.5}rem` }}>
              <div className="flex flex-col">
                <button type="button" disabled={bezig || plek === 0} onClick={() => verschuif(a, -1)} className="rounded p-0.5 text-inkt-4 hover:text-inkt disabled:opacity-30" aria-label={`${a.naam} omhoog`}>
                  <ArrowUp size={14} />
                </button>
                <button type="button" disabled={bezig || plek === broers.length - 1} onClick={() => verschuif(a, 1)} className="rounded p-0.5 text-inkt-4 hover:text-inkt disabled:opacity-30" aria-label={`${a.naam} omlaag`}>
                  <ArrowDown size={14} />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[19px] font-semibold tracking-wide uppercase">{a.naam}</span>
                  {a.soort === "toezicht" && <span className="infoblokje infoblokje-licht">Toezicht</span>}
                </p>
                <p className="text-[12.5px] text-inkt-3">
                  {meervoud(aantal(a), "persoon", "mensen")}
                  {hoofd ? `, hoofd ${hoofd.naam}` : ", geen hoofd"}
                  {a.trefwoorden.length ? `, ${meervoud(a.trefwoorden.length, "trefwoord", "trefwoorden")}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => setOpen({ afdeling: a })} className="knop knop-ghost knop-icoon" aria-label={`${a.naam} bewerken`} title="Bewerken">
                <Pencil size={15} />
              </button>
              <button type="button" onClick={() => verwijder(a)} disabled={bezig} className="knop knop-ghost knop-icoon hover:text-rood!" aria-label={`${a.naam} verwijderen`} title="Verwijderen">
                <Trash2 size={15} />
              </button>
            </li>
          );
        })}
      </ul>
      {open && <AfdelingVenster afdeling={open.afdeling} onSluit={() => setOpen(null)} />}
    </div>
  );
}
