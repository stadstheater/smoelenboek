/** CSV voor Excel: puntkomma als scheidingsteken en een BOM, zodat Excel de accenten goed leest */
export function maakCsv(kolommen: string[], rijen: (string | number | null | undefined)[][]) {
  const cel = (w: string | number | null | undefined) => {
    const t = w === null || w === undefined ? "" : String(w);
    return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return "﻿" + [kolommen, ...rijen].map((r) => r.map(cel).join(";")).join("\r\n") + "\r\n";
}

/** Leest CSV met puntkomma, komma of tab; herkent het scheidingsteken aan de kopregel */
export function leesCsv(invoer: string): Record<string, string>[] {
  const tekst = invoer.replace(/^﻿/, "");
  const eersteRegel = tekst.split(/\r?\n/, 1)[0] ?? "";
  const telling = [";", ",", "\t"].map((s) => [s, eersteRegel.split(s).length] as const);
  const scheiding = telling.sort((a, b) => b[1] - a[1])[0][0];

  const rijen: string[][] = [];
  let rij: string[] = [];
  let cel = "";
  let tussenAanhalingstekens = false;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (tussenAanhalingstekens) {
      if (c === '"' && tekst[i + 1] === '"') {
        cel += '"';
        i++;
      } else if (c === '"') tussenAanhalingstekens = false;
      else cel += c;
    } else if (c === '"') tussenAanhalingstekens = true;
    else if (c === scheiding) {
      rij.push(cel);
      cel = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && tekst[i + 1] === "\n") i++;
      rij.push(cel);
      rijen.push(rij);
      rij = [];
      cel = "";
    } else cel += c;
  }
  if (cel || rij.length) {
    rij.push(cel);
    rijen.push(rij);
  }

  const [kop, ...rest] = rijen.filter((r) => r.some((c) => c.trim()));
  if (!kop) return [];
  const sleutels = kop.map((k) =>
    k
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, ""),
  );
  return rest.map((r) => Object.fromEntries(sleutels.map((k, i) => [k, (r[i] ?? "").trim()])));
}

/** De kolommen van de export; de import leest dezelfde namen (en een paar varianten) */
export const CSV_KOLOMMEN = [
  "naam",
  "functie",
  "afdeling",
  "extra afdelingen",
  "leidinggevende",
  "email",
  "telefoon",
  "mobiel",
  "werkdagen",
  "werkplek",
  "trefwoorden",
  "talen",
  "in dienst sinds",
  "over mij",
  "zichtbaar",
];
