const TZ = "Europe/Amsterdam";

export function datumLang(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(
    new Date(iso.length === 10 ? `${iso}T12:00:00` : iso),
  );
}

/** "2021-03" wordt "maart 2021", "2021" blijft "2021" */
export function maandJaar(waarde: string | null) {
  if (!waarde) return null;
  if (/^\d{4}$/.test(waarde)) return waarde;
  const [j, m] = waarde.split("-");
  const datum = new Date(Number(j), Number(m) - 1, 1, 12);
  return new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(datum);
}

/** Hoe lang iemand al in dienst is, in hele jaren */
export function dienstjaren(waarde: string | null, nu = new Date()) {
  if (!waarde) return null;
  const [j, m = "1"] = waarde.split("-");
  const maanden = (nu.getFullYear() - Number(j)) * 12 + (nu.getMonth() + 1 - Number(m));
  if (maanden < 1) return "net begonnen";
  if (maanden < 12) return `${maanden} ${maanden === 1 ? "maand" : "maanden"}`;
  const jaren = Math.floor(maanden / 12);
  return `${jaren} jaar`;
}

/** Telefoonnummer voor een tel:-link: alleen cijfers en een plus */
export function belbaar(nummer: string) {
  const schoon = nummer.replace(/[^\d+]/g, "");
  return schoon.startsWith("0") ? `+31${schoon.slice(1)}` : schoon;
}

export function meervoud(aantal: number, enkel: string, meer: string) {
  return `${aantal} ${aantal === 1 ? enkel : meer}`;
}
