"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { slaZoekwoordenOpActie } from "@/app/actions";
import { TrefwoordInvoer } from "@/components/beheer/TrefwoordInvoer";
import { Portret } from "@/components/Portret";
import { useShell } from "@/components/shell/AppShell";
import { useToast } from "@/components/shell/Toasts";
import { meervoud } from "@/lib/format";
import type { Zoekwoord } from "@/lib/types";
import { maakZoeker, redenTekst } from "@/lib/zoeken";
import { STANDAARD_ZOEKWOORDEN } from "@/lib/zoeken/begrippen";

export function ZoekwoordenBeheer() {
  const { gegevens } = useShell();
  const router = useRouter();
  const toast = useToast();
  const [groepen, setGroepen] = useState<Zoekwoord[]>(gegevens.zoekwoorden);
  const [filter, setFilter] = useState("");
  const [test, setTest] = useState("");
  const [bezig, startTransition] = useTransition();

  const gewijzigd = JSON.stringify(groepen.filter((g) => g.woorden.length)) !== JSON.stringify(gegevens.zoekwoorden);

  // Proberen met de zoekwoorden zoals ze nu op het scherm staan, ook voor het opslaan
  const zoek = useMemo(() => maakZoeker({ ...gegevens, zoekwoorden: groepen }), [gegevens, groepen]);
  const resultaat = test.trim() ? zoek(test) : null;

  const zichtbaar = groepen.filter((g) => !filter || g.woorden.some((w) => w.toLowerCase().includes(filter.toLowerCase())));

  function opslaan() {
    const schoon = groepen.filter((g) => g.woorden.length >= 2);
    startTransition(async () => {
      const r = await slaZoekwoordenOpActie(schoon);
      if (r.fout) return toast(r.fout, "fout");
      toast("Zoekwoorden opgeslagen");
      setGroepen(schoon);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
      <div>
        <p className="max-w-3xl text-[13px] text-inkt-3">
          Woorden in één groep betekenen voor het zoeken hetzelfde. Zoekt iemand op <strong className="text-inkt">kaartjes</strong>, dan vindt het smoelenboek ook wie
          bij <strong className="text-inkt">tickets</strong> of <strong className="text-inkt">kaartverkoop</strong> staat. Een groep heeft minstens twee woorden nodig.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Zoek een woord" className="veld h-10 min-h-0 max-w-xs text-[13.5px]" aria-label="Groepen filteren" />
          <span className="text-[13px] text-inkt-4">{meervoud(groepen.length, "groep", "groepen")}</span>
          <button type="button" onClick={() => setGroepen([{ id: `zw-${Date.now().toString(36)}`, woorden: [] }, ...groepen])} className="knop knop-wit ml-auto">
            <Plus size={16} aria-hidden /> Groep toevoegen
          </button>
          <button type="button" onClick={opslaan} disabled={!gewijzigd || bezig} className="knop knop-vol">
            <Save size={16} aria-hidden /> {bezig ? "Opslaan" : "Opslaan"}
          </button>
        </div>

        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {zichtbaar.map((g) => (
            <li key={g.id} className="kaart p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <TrefwoordInvoer
                    label="Woorden in deze groep"
                    waarden={g.woorden}
                    onChange={(woorden) => setGroepen((oud) => oud.map((x) => (x.id === g.id ? { ...x, woorden } : x)))}
                    placeholder="Woord toevoegen"
                  />
                  {g.woorden.length === 1 && <p className="mt-1 text-[12px] text-actie">Voeg nog een woord toe, anders wordt deze groep niet bewaard.</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setGroepen((oud) => oud.filter((x) => x.id !== g.id))}
                  className="knop knop-ghost knop-icoon hover:text-rood!"
                  aria-label="Groep verwijderen"
                  title="Groep verwijderen"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            if (confirm("De standaard zoekwoorden terugzetten? Je eigen groepen blijven staan; ontbrekende standaardgroepen komen erbij.")) {
              const bestaand = new Set(groepen.flatMap((g) => g.woorden.map((w) => w.toLowerCase())));
              const erbij = STANDAARD_ZOEKWOORDEN.filter((w) => !w.some((x) => bestaand.has(x.toLowerCase()))).map((woorden, i) => ({
                id: `zw-std-${Date.now().toString(36)}-${i}`,
                woorden: [...woorden],
              }));
              setGroepen([...groepen, ...erbij]);
              toast(erbij.length ? `${meervoud(erbij.length, "groep", "groepen")} toegevoegd. Vergeet niet op te slaan.` : "Alle standaardgroepen staan er al");
            }
          }}
          className="knop knop-ghost mt-4"
        >
          <RotateCcw size={15} aria-hidden /> Standaardgroepen aanvullen
        </button>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="kaart p-4">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            <FlaskConical size={16} className="text-inkt-3" aria-hidden /> Probeer het uit
          </h2>
          <p className="mt-1 text-[12.5px] text-inkt-4">Zoekt met de groepen zoals ze hier staan, ook voordat je opslaat.</p>
          <input value={test} onChange={(e) => setTest(e.target.value)} placeholder="Bijvoorbeeld: laptop kapot" className="veld mt-3 h-10 min-h-0 text-[13.5px]" aria-label="Testzoekopdracht" />
          {resultaat && (
            <ul className="mt-3 space-y-1">
              {resultaat.personen.slice(0, 6).map((r) => (
                <li key={r.persoon.id} className="flex items-center gap-2.5 rounded-md p-1.5">
                  <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-sluier/[0.06]">
                    <Portret persoon={r.persoon} formaat="mini" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{r.persoon.naam}</span>
                    <span className="block truncate text-[11.5px] text-actie">{r.redenen[0] ? redenTekst(r.redenen[0]) : ""}</span>
                  </span>
                </li>
              ))}
              {!resultaat.personen.length && (
                <li className="text-[12.5px] text-inkt-4">
                  Niemand gevonden.
                  {resultaat.afdelingen[0] ? ` Wel de afdeling ${resultaat.afdelingen[0].afdeling.naam}.` : ""}
                </li>
              )}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
