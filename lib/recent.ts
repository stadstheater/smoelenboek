const SLEUTEL = "smoelenboek_recent";

/** Laatst bekeken mensen (slugs), alleen in deze browser */
export function leesRecent(): string[] {
  try {
    const waarde = JSON.parse(localStorage.getItem(SLEUTEL) ?? "[]");
    return Array.isArray(waarde) ? waarde.filter((x) => typeof x === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function onthoudRecent(slug: string) {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify([slug, ...leesRecent().filter((s) => s !== slug)].slice(0, 8)));
  } catch {}
}
