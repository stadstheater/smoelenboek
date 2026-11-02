/** Werkt de URL bij zonder de pagina opnieuw te laden (Next houdt useSearchParams in sync) */
export function zetParams(wijzig: (p: URLSearchParams) => void, modus: "push" | "replace" = "replace") {
  const params = new URLSearchParams(window.location.search);
  wijzig(params);
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
  if (modus === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

export function lijstUitParam(waarde: string | null) {
  return waarde?.split(",").filter(Boolean) ?? [];
}

export function wissel(lijst: string[], waarde: string) {
  return lijst.includes(waarde) ? lijst.filter((x) => x !== waarde) : [...lijst, waarde];
}
