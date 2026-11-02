export function maakSlug(naam: string) {
  return naam
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Een slug die nog niet bestaat: naam, naam-2, naam-3 */
export function uniekeSlug(basis: string, bestaand: Iterable<string>) {
  const set = new Set(bestaand);
  const schoon = maakSlug(basis) || "onbekend";
  if (!set.has(schoon)) return schoon;
  for (let i = 2; ; i++) if (!set.has(`${schoon}-${i}`)) return `${schoon}-${i}`;
}
