/** Kleine letters, zonder accenten en leestekens: "Léon Molendijk" wordt "leon molendijk", "Coördinator" wordt "coordinator" */
export function normaliseer(tekst: string) {
  return tekst
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " en ")
    .replace(/[^a-z0-9@]+/g, " ")
    .trim();
}

export function woorden(tekst: string) {
  const n = normaliseer(tekst);
  return n ? n.split(" ") : [];
}

/** Vraagwoorden en vulwoorden die niets zeggen over wie je zoekt */
export const STOPWOORDEN = new Set(
  (
    "wie wat waar welke welk hoe wanneer waarom bij kan kun kunt kunnen ik je jij u mij me mijn we wij ons onze jullie " +
    "de het een en of voor van met over aan in op naar om te tot is zijn ben bent heb hebt heeft hebben nodig moet moeten " +
    "wil wilt willen iemand persoon helpen helpt hulp vraag gaat doet doen die dat dit deze er ook nog even graag iets " +
    "alles mag zou zouden hallo hoi beste regelt regelen terecht contact zoek zoeken zoekt"
  ).split(" "),
);

/** Lichte Nederlandse stam, genoeg om meervoud en verkleinwoord gelijk te trekken */
export function stam(woord: string) {
  let w = woord;
  if (w.length > 6 && w.endsWith("tjes")) w = w.slice(0, -4);
  else if (w.length > 5 && w.endsWith("tje")) w = w.slice(0, -3);
  else if (w.length > 5 && w.endsWith("en")) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  // Dubbele medeklinker aan het eind (bonn → bon, sleutell komt niet voor maar kost niets)
  if (w.length > 3 && w.at(-1) === w.at(-2) && !"aeiou".includes(w.at(-1)!)) w = w.slice(0, -1);
  return w;
}

/** Damerau-Levenshtein (met omwisselen van twee letters), afgebroken zodra het meer dan max wordt */
export function afstand(a: string, b: string, max = 3) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rijMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + kosten);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rijMin = Math.min(rijMin, d[i][j]);
    }
    if (rijMin > max) return max + 1;
  }
  return d[a.length][b.length];
}
