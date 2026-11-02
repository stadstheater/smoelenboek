"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";

/**
 * Chips met een invoerveld en suggesties. Enter of komma voegt toe, Backspace in een leeg veld haalt de laatste weg.
 * Plakken van "a, b, c" voegt alle drie toe.
 */
export function TrefwoordInvoer({
  waarden,
  onChange,
  suggesties = [],
  placeholder = "Typ en druk op Enter",
  label,
}: {
  waarden: string[];
  onChange: (waarden: string[]) => void;
  suggesties?: string[];
  placeholder?: string;
  label: string;
}) {
  const [invoer, setInvoer] = useState("");
  const [open, setOpen] = useState(false);
  const lijstId = useId();

  const gekozen = new Set(waarden.map((w) => w.toLowerCase()));
  const zoek = invoer.trim().toLowerCase();
  const passend = zoek
    ? [...new Set(suggesties)].filter((s) => !gekozen.has(s.toLowerCase()) && s.toLowerCase().includes(zoek)).slice(0, 8)
    : [];

  function voegToe(tekst: string) {
    const nieuw = tekst
      .split(/[,;\n]/)
      .map((t) => t.trim().replace(/\s+/g, " "))
      .filter((t) => t && !gekozen.has(t.toLowerCase()));
    if (nieuw.length) onChange([...waarden, ...new Set(nieuw)]);
    setInvoer("");
  }

  return (
    <div>
      {waarden.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {waarden.map((w) => (
            <li key={w} className="flex h-7 animate-pop items-center gap-1 rounded-md bg-sluier/[0.08] pr-1 pl-2.5 text-[12.5px] font-semibold">
              {w}
              <button
                type="button"
                onClick={() => onChange(waarden.filter((x) => x !== w))}
                className="rounded p-0.5 text-inkt-4 hover:bg-sluier/10 hover:text-inkt"
                aria-label={`${w} verwijderen`}
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <input
          type="text"
          value={invoer}
          onChange={(e) => {
            const t = e.target.value;
            if (/[,;]/.test(t)) voegToe(t);
            else setInvoer(t);
            setOpen(true);
          }}
          onPaste={(e) => {
            const t = e.clipboardData.getData("text");
            if (/[,;\n]/.test(t)) {
              e.preventDefault();
              voegToe(t);
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
            if (invoer.trim()) voegToe(invoer);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              voegToe(invoer);
            } else if (e.key === "Backspace" && !invoer && waarden.length) {
              onChange(waarden.slice(0, -1));
            } else if (e.key === "Escape") {
              e.stopPropagation();
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="veld h-10 min-h-0 py-1.5 text-[13.5px]"
          aria-label={label}
          aria-controls={lijstId}
          aria-expanded={open && passend.length > 0}
          role="combobox"
        />
        {open && (passend.length > 0 || (zoek && !gekozen.has(zoek))) && (
          <ul id={lijstId} role="listbox" className="absolute z-20 mt-1 w-full animate-pop overflow-hidden rounded-lg border border-sluier/10 bg-vlak-diep p-1 text-[13px] shadow-2xl shadow-schaduw/50">
            {passend.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => voegToe(s)}
                  className="w-full rounded-md px-2.5 py-1.5 text-left hover:bg-sluier/[0.08]"
                >
                  {s}
                </button>
              </li>
            ))}
            {zoek && !gekozen.has(zoek) && !passend.some((s) => s.toLowerCase() === zoek) && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => voegToe(invoer)}
                  className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left font-semibold text-actie hover:bg-sluier/[0.08]"
                >
                  <Plus size={14} /> &quot;{invoer.trim()}&quot; toevoegen
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
