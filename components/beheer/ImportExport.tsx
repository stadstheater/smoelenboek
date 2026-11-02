"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, FileJson, FileSpreadsheet, Upload } from "lucide-react";
import { backupTerugzettenActie, importActie } from "@/app/actions";
import { useToast } from "@/components/shell/Toasts";
import { CSV_KOLOMMEN, maakCsv } from "@/lib/csv";
import type { ImportVoorstel } from "@/lib/data";

function Sjabloon() {
  function download() {
    const csv = maakCsv(CSV_KOLOMMEN, [
      ["Voornaam Achternaam", "Technicus", "Techniek", "", "Tommy Everts", "naam@stadstheater.nl", "", "06 12 34 56 78", "ma, di, do", "Technische dienst", "licht, geluid", "Engels", "2024-09", "", "ja"],
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "smoelenboek-sjabloon.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button type="button" onClick={download} className="knop knop-ghost">
      <Download size={15} aria-hidden /> Leeg sjabloon
    </button>
  );
}

export function ImportExport() {
  const router = useRouter();
  const toast = useToast();
  const [csv, setCsv] = useState<{ naam: string; tekst: string } | null>(null);
  const [voorstel, setVoorstel] = useState<ImportVoorstel | null>(null);
  const [fout, setFout] = useState("");
  const [bezig, startTransition] = useTransition();

  async function kiesCsv(bestand: File) {
    setFout("");
    setVoorstel(null);
    const tekst = await bestand.text();
    setCsv({ naam: bestand.name, tekst });
    startTransition(async () => {
      const r = await importActie(tekst, false);
      if (r.fout) setFout(r.fout);
      else setVoorstel(r.voorstel ?? null);
    });
  }

  function voerUit() {
    if (!csv) return;
    startTransition(async () => {
      const r = await importActie(csv.tekst, true);
      if (r.fout) return setFout(r.fout);
      const v = r.voorstel!;
      toast(`Import klaar: ${v.nieuw.length} nieuw, ${v.bijgewerkt.length} bijgewerkt`);
      setCsv(null);
      setVoorstel(null);
      router.refresh();
    });
  }

  async function zetTerug(bestand: File) {
    if (!confirm("Alle gegevens in het smoelenboek vervangen door deze back-up? Download eerst een back-up van de huidige stand als je twijfelt.")) return;
    const tekst = await bestand.text();
    startTransition(async () => {
      const r = await backupTerugzettenActie(tekst);
      if (r.fout) toast(r.fout, "fout");
      else {
        toast("Back-up teruggezet");
        router.refresh();
      }
    });
  }

  const niets = voorstel && !voorstel.nieuw.length && !voorstel.bijgewerkt.length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="kaart p-5">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <FileSpreadsheet size={18} className="text-inkt-3" aria-hidden /> Exporteren
        </h2>
        <p className="mt-1 text-[13px] text-inkt-3">Alle mensen als Excel-bestand (CSV), of een volledige back-up met afdelingen, structuur en zoekwoorden.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/api/export?soort=csv" className="knop knop-wit">
            <Download size={15} aria-hidden /> Excel (CSV)
          </a>
          <a href="/api/export?soort=json" className="knop knop-wit">
            <FileJson size={15} aria-hidden /> Back-up (JSON)
          </a>
        </div>
      </section>

      <section className="kaart p-5">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <Upload size={18} className="text-inkt-3" aria-hidden /> Importeren uit Excel
        </h2>
        <p className="mt-1 text-[13px] text-inkt-3">
          Sla een Excel-lijst op als CSV met een kopregel (naam, functie, afdeling, leidinggevende, email, telefoon, mobiel, werkdagen, trefwoorden). Bestaande mensen herken
          ik aan hun naam en werk ik bij; lege cellen laten bestaande gegevens staan. Je ziet eerst wat er verandert.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="knop knop-wit cursor-pointer">
            <Upload size={15} aria-hidden /> CSV kiezen
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) kiesCsv(f);
                e.target.value = "";
              }}
            />
          </label>
          <Sjabloon />
        </div>

        {fout && (
          <p role="alert" className="mt-4 text-[13px] font-semibold text-rood">
            {fout}
          </p>
        )}
        {bezig && !voorstel && <p className="mt-4 text-[13px] text-inkt-4">Bezig met lezen</p>}

        {voorstel && csv && (
          <div className="mt-5 space-y-3 border-t border-sluier/[0.08] pt-4 text-[13px]">
            <p className="font-semibold">Voorstel voor {csv.naam}</p>
            {voorstel.nieuw.length > 0 && (
              <div>
                <p className="text-inkt-3">Nieuw ({voorstel.nieuw.length})</p>
                <ul className="mt-1 list-disc pl-5">
                  {voorstel.nieuw.slice(0, 30).map((n) => (
                    <li key={n.naam}>
                      {n.naam}
                      {n.functie ? `, ${n.functie}` : ""}
                      {n.afdeling ? ` (${n.afdeling})` : ""}
                    </li>
                  ))}
                  {voorstel.nieuw.length > 30 && <li>en nog {voorstel.nieuw.length - 30}</li>}
                </ul>
              </div>
            )}
            {voorstel.bijgewerkt.length > 0 && (
              <div>
                <p className="text-inkt-3">Bijgewerkt ({voorstel.bijgewerkt.length})</p>
                <ul className="mt-1 list-disc pl-5">
                  {voorstel.bijgewerkt.slice(0, 30).map((b) => (
                    <li key={b.naam}>
                      {b.naam}: {b.velden.join(", ").replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {voorstel.nieuweAfdelingen.length > 0 && <p className="text-inkt-3">Nieuwe afdelingen: {voorstel.nieuweAfdelingen.join(", ")}</p>}
            {voorstel.fouten.length > 0 && (
              <ul className="list-disc pl-5 text-actie">
                {voorstel.fouten.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
            {niets ? (
              <p className="text-inkt-3">Er verandert niets.</p>
            ) : (
              <button type="button" onClick={voerUit} disabled={bezig} className="knop knop-vol">
                <Check size={16} aria-hidden /> {bezig ? "Importeren" : "Importeren"}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="kaart p-5 lg:col-span-2">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <FileJson size={18} className="text-inkt-3" aria-hidden /> Back-up terugzetten
        </h2>
        <p className="mt-1 text-[13px] text-inkt-3">Zet een eerder gedownloade back-up (JSON) terug. Dit vervangt alles wat er nu in het smoelenboek staat.</p>
        <label className="knop knop-wit mt-4 cursor-pointer">
          <Upload size={15} aria-hidden /> Back-up kiezen
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) zetTerug(f);
              e.target.value = "";
            }}
          />
        </label>
      </section>
    </div>
  );
}
