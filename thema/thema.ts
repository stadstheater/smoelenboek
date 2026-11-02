export type Thema = "licht" | "donker";

/** Cookie met de keuze van de gebruiker */
export const THEMA_COOKIE = "stz_thema";

/** Op dit domein en alle subdomeinen geldt één keuze voor alle apps */
const GEDEELD_DOMEIN = "stadstheater.app";

const EEN_JAAR = 60 * 60 * 24 * 365;

/**
 * Draait in <head>, vóór de eerste weergave: zet data-thema op <html> uit de cookie,
 * en zonder cookie uit de systeeminstelling (die het dan ook live blijft volgen).
 */
export const THEMA_SCRIPT = `(function(){try{var d=document.documentElement,m=matchMedia("(prefers-color-scheme: light)");function k(){var r=document.cookie.match(/(?:^|; )${THEMA_COOKIE}=(licht|donker)(?:;|$)/);return r&&r[1]}function z(){d.dataset.thema=k()||(m.matches?"licht":"donker")}z();m.addEventListener("change",function(){if(!k())z()})}catch(e){}})()`;

/** Het thema dat nu op de pagina staat */
export function huidigThema(): Thema {
  const thema = document.documentElement.dataset.thema;
  if (thema === "licht" || thema === "donker") return thema;
  return matchMedia("(prefers-color-scheme: light)").matches ? "licht" : "donker";
}

/** Zet het thema direct op de pagina en bewaar de keuze een jaar in de cookie */
export function zetThema(thema: Thema) {
  const html = document.documentElement;
  html.setAttribute("data-thema-wissel", "");
  html.dataset.thema = thema;

  const host = location.hostname;
  const domein = host === GEDEELD_DOMEIN || host.endsWith(`.${GEDEELD_DOMEIN}`) ? `; domain=${GEDEELD_DOMEIN}` : "";
  const veilig = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${THEMA_COOKIE}=${thema}; path=/; max-age=${EEN_JAAR}; samesite=lax${domein}${veilig}`;

  // Overgangen pas weer aan na de nieuwe weergave
  requestAnimationFrame(() => requestAnimationFrame(() => html.removeAttribute("data-thema-wissel")));
}
