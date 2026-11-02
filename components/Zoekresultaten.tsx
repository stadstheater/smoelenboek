"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, Mail, Search, SearchX, Sparkles, X } from "lucide-react";
import { Markeer } from "@/components/Markeer";
import { Portret } from "@/components/Portret";
import { useShell } from "@/components/shell/AppShell";
import { meervoud } from "@/lib/format";
import { afdelingenInVolgorde } from "@/lib/hierarchie";
import { DAGEN } from "@/lib/types";
import { zetParams } from "@/lib/url";
import { redenTekst } from "@/lib/zoeken";

const VOORBEELDEN = [
  { q: "Bij wie moet ik zijn voor een bedrijfsborrel?", uitleg: "Een hele vraag mag; vraagwoorden worden genegeerd" },
  { q: "laptop kapot", uitleg: "Zoekwoorden vinden ook verwante woorden, zoals ICT" },
  { q: "charels", uitleg: "Typfouten zijn geen probleem" },
  { q: "licht geluid", uitleg: "Wie alle woorden raakt, staat bovenaan" },
  { q: "7060", uitleg: "Een stuk van een telefoonnummer" },
  { q: "cd", uitleg: "Initialen" },
];

const SYNTAX = [
  { code: "afdeling:techniek", uitleg: "alleen mensen van een afdeling" },
  { code: "functie:manager", uitleg: "op functietitel" },
  { code: "dag:vrijdag", uitleg: "wie werkt er op vrijdag" },
  { code: '"online marketing"', uitleg: "letterlijk deze woorden" },
  { code: "-stagiaire", uitleg: "zonder dit woord" },
];

export function Zoekresultaten() {
  const { zoek, gegevens, openPersoon, persoonOpId, afdelingOpId } = useShell();
  const params = useSearchParams();
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [afd, setAfd] = useState(() => params.get("afd") ?? "");
  const [dag, setDag] = useState(() => params.get("dag") ?? "");
  const invoer = useRef<HTMLInputElement>(null);

  // De zoekbalk bovenin stuurt hierheen met een nieuwe ?q
  const urlQ = params.get("q") ?? "";
  const [vorigeUrlQ, setVorigeUrlQ] = useState(urlQ);
  if (urlQ !== vorigeUrlQ) {
    setVorigeUrlQ(urlQ);
    setQ(urlQ);
  }

  useEffect(() => {
    zetParams((p) => {
      if (q) p.set("q", q);
      else p.delete("q");
      if (afd) p.set("afd", afd);
      else p.delete("afd");
      if (dag) p.set("dag", dag);
      else p.delete("dag");
    });
  }, [q, afd, dag]);

  const gekozenAfdeling = afd ? gegevens.afdelingen.find((a) => a.slug === afd) : undefined;
  const volledig = [q, gekozenAfdeling ? `afdeling:"${gekozenAfdeling.naam}"` : "", dag ? `dag:${dag}` : ""].filter(Boolean).join(" ");
  const resultaat = useMemo(() => (volledig.trim() ? zoek(volledig) : null), [volledig, zoek]);
  const volgorde = resultaat?.personen.map((r) => r.persoon.slug) ?? [];
  const afdelingen = afdelingenInVolgorde(gegevens.afdelingen).filter(({ afdeling }) =>
    gegevens.personen.some((p) => p.zichtbaar && (p.afdeling_id === afdeling.id || p.extra_afdeling_ids.includes(afdeling.id))),
  );
  const heeftWerkdagen = gegevens.personen.some((p) => p.werkdagen.length);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <p className="eyebrow">Smoelenboek</p>
      <h1 className="kop mt-2 text-[clamp(2.4rem,5vw,3.6rem)]">Wie heb je nodig?</h1>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (resultaat?.personen[0]) openPersoon(resultaat.personen[0].persoon.slug, volgorde);
        }}
        className="mt-5"
      >
        <label className="flex h-14 items-center gap-3 rounded-xl border border-[var(--stz-veld-rand)] bg-sluier/[0.04] px-4 transition focus-within:border-oranje focus-within:shadow-[0_0_0_3px_rgb(237_110_19/0.18)]">
          <Search size={20} className="shrink-0 text-inkt-3" aria-hidden />
          <input
            ref={invoer}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            type="search"
            enterKeyHint="search"
            placeholder="Typ een naam, functie, onderwerp of hele vraag"
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-inkt-5 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
            aria-label="Zoekvraag"
          />
          {q && (
            <button type="button" onClick={() => (setQ(""), invoer.current?.focus())} className="rounded-md p-1 text-inkt-4 hover:bg-sluier/10 hover:text-inkt" aria-label="Leegmaken">
              <X size={16} />
            </button>
          )}
        </label>
      </form>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={afd} onChange={(e) => setAfd(e.target.value)} className="veld h-9 min-h-0 w-auto py-0 text-[13px]" aria-label="Afdeling">
          <option value="">Alle afdelingen</option>
          {afdelingen.map(({ afdeling, diepte }) => (
            <option key={afdeling.id} value={afdeling.slug}>
              {"  ".repeat(diepte)}
              {afdeling.naam}
            </option>
          ))}
        </select>
        {heeftWerkdagen && (
          <div role="group" aria-label="Werkt op" className="flex rounded-lg border border-sluier/10 bg-sluier/[0.03] p-0.5">
            {DAGEN.slice(0, 5).map((d) => (
              <button
                key={d.code}
                type="button"
                aria-pressed={dag === d.code}
                onClick={() => setDag(dag === d.code ? "" : d.code)}
                title={`Werkt op ${d.lang}`}
                className={`h-7 rounded-md px-2.5 text-[12px] font-semibold transition-colors ${dag === d.code ? "bg-basis-paars text-white" : "text-inkt-4 hover:text-inkt"}`}
              >
                {d.kort}
              </button>
            ))}
          </div>
        )}
        {(afd || dag) && (
          <button type="button" onClick={() => (setAfd(""), setDag(""))} className="knop knop-ghost h-8 text-[12px]">
            <X size={14} /> Filters wissen
          </button>
        )}
        {resultaat && (
          <p className="ml-auto text-[13px] text-inkt-4" aria-live="polite">
            {meervoud(resultaat.personen.length, "persoon", "mensen")} gevonden
          </p>
        )}
      </div>

      {!resultaat && (
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="eyebrow mb-3">Probeer eens</h2>
            <ul className="space-y-1.5">
              {VOORBEELDEN.map((v) => (
                <li key={v.q}>
                  <button type="button" onClick={() => setQ(v.q)} className="group w-full rounded-lg p-2.5 text-left transition-colors hover:bg-sluier/[0.06]">
                    <span className="block text-[14px] font-medium text-actie group-hover:underline">{v.q}</span>
                    <span className="block text-[12.5px] text-inkt-4">{v.uitleg}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="eyebrow mb-3">Zo zoek je nog preciezer</h2>
            <dl className="kaart divide-y divide-sluier/[0.07]">
              {SYNTAX.map((s) => (
                <div key={s.code} className="flex items-center gap-3 px-4 py-2.5">
                  <dt>
                    <button type="button" onClick={() => setQ((oud) => `${oud} ${s.code}`.trim())} className="chip font-mono text-[12px] hover:bg-sluier/[0.14]">
                      {s.code}
                    </button>
                  </dt>
                  <dd className="text-[13px] text-inkt-3">{s.uitleg}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[12.5px] text-inkt-4">
              Het zoeken kijkt naar naam, functie, afdeling, e-mail, telefoon en de trefwoorden &ldquo;waarvoor kun je bij mij terecht&rdquo;. Woorden die hetzelfde betekenen
              (zoals kaartjes en tickets) beheer je in Beheer, Zoekwoorden.
            </p>
          </section>
        </div>
      )}

      {resultaat && (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
          <section aria-label="Mensen">
            {resultaat.personen.length === 0 ? (
              <div className="kaart flex flex-col items-center gap-2 px-6 py-14 text-center">
                <SearchX size={30} className="text-inkt-4" aria-hidden />
                <p className="text-[15px] font-semibold">Niemand gevonden</p>
                {resultaat.suggestie ? (
                  <button type="button" onClick={() => setQ(resultaat.suggestie!)} className="flex items-center gap-1.5 text-[14px] text-actie hover:underline">
                    <Sparkles size={15} aria-hidden /> Bedoelde je &ldquo;{resultaat.suggestie}&rdquo;?
                  </button>
                ) : (
                  <p className="max-w-sm text-[13px] text-inkt-4">Probeer een ander woord, of kijk bij de afdelingen hiernaast.</p>
                )}
              </div>
            ) : (
              <ul className="space-y-2">
                {resultaat.personen.map((r, i) => {
                  const p = r.persoon;
                  const afdeling = afdelingOpId.get(p.afdeling_id ?? "");
                  const redenen = r.redenen.filter((x) => (x.veld !== "naam" && x.veld !== "functie") || x.via);
                  return (
                    <li key={p.id} className="gespreid" style={{ "--i": i } as React.CSSProperties}>
                      <div className="kaart flex items-start gap-4 p-3 transition-colors hover:bg-sluier/[0.05]">
                        <button type="button" onClick={() => openPersoon(p.slug, volgorde)} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sluier/[0.06]" aria-label={`${p.naam} openen`}>
                          <Portret persoon={p} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <button type="button" onClick={() => openPersoon(p.slug, volgorde)} className="text-left">
                            <span className="block text-[16px] font-semibold hover:underline hover:underline-offset-2">
                              <Markeer tekst={p.naam} woorden={r.markeer} />
                            </span>
                          </button>
                          <p className="text-[13.5px] text-inkt-2">
                            <Markeer tekst={p.functie} woorden={r.markeer} />
                            {afdeling && <span className="text-inkt-4"> · {afdeling.naam}</span>}
                          </p>
                          {redenen.length > 0 && (
                            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Waarom gevonden">
                              {redenen.slice(0, 4).map((x, j) => (
                                <li key={j} className="chip text-actie">
                                  {redenTekst(x)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {p.email && (
                          <a href={`mailto:${p.email}`} className="knop knop-ghost knop-icoon hidden shrink-0 sm:inline-flex" aria-label={`${p.naam} mailen`} title={p.email}>
                            <Mail size={16} />
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside aria-label="Afdelingen" className="space-y-2">
            {resultaat.afdelingen.length > 0 && <h2 className="eyebrow mb-2">Afdelingen</h2>}
            {resultaat.afdelingen.slice(0, 5).map((a) => {
              const hoofd = a.afdeling.hoofd_id ? persoonOpId.get(a.afdeling.hoofd_id) : undefined;
              return (
                <Link key={a.afdeling.id} href={`/?afdeling=${a.afdeling.slug}`} className="kaart block p-4 transition-colors hover:bg-sluier/[0.05]">
                  <span className="flex items-center gap-2">
                    <Building2 size={16} className="text-inkt-3" aria-hidden />
                    <span className="font-display text-[18px] font-semibold tracking-wide uppercase">{a.afdeling.naam}</span>
                  </span>
                  <span className="mt-1 block text-[12.5px] text-inkt-3">
                    {a.aantal ? meervoud(a.aantal, "persoon", "mensen") : "Nog niemand in het smoelenboek"}
                    {hoofd ? `, eerste aanspreekpunt ${hoofd.naam}` : ""}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1">
                    {a.redenen.slice(0, 3).map((x, j) => (
                      <span key={j} className="chip text-[11.5px]">
                        {x.tekst}
                      </span>
                    ))}
                  </span>
                </Link>
              );
            })}
          </aside>
        </div>
      )}
    </div>
  );
}
