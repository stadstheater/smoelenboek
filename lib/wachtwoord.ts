import { pincode, wachtwoord } from "@/lib/config";

export const SESSIE_COOKIE = "smoelenboek_sessie";
export const SESSIE_DUUR = 60 * 60 * 24 * 30;

export const BEHEER_COOKIE = "smoelenboek_beheer";
export const BEHEER_DUUR = 60 * 60 * 12;

function naarHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(sleutel: string, bericht: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(sleutel), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return naarHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(bericht)));
}

/** Vergelijkt zonder dat de duur iets verraadt over hoeveel tekens kloppen */
export function gelijk(a: string, b: string) {
  if (a.length !== b.length) return false;
  let verschil = 0;
  for (let i = 0; i < a.length; i++) verschil |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return verschil === 0;
}

// ---------- Teamwachtwoord ----------

/**
 * Waarde van de sessie-cookie: een HMAC van het wachtwoord.
 * Verander je het wachtwoord in Vercel, dan is iedereen automatisch uitgelogd.
 */
export function sessieWaarde() {
  return hmac(wachtwoord, "stadstheater-smoelenboek-sessie");
}

/** Heeft deze cookie toegang? Zonder ingesteld wachtwoord (lokaal) altijd wel. */
export async function geldigeSessie(cookie: string | undefined) {
  if (!wachtwoord) return true;
  return !!cookie && gelijk(cookie, await sessieWaarde());
}

export function juistWachtwoord(invoer: string) {
  return !!wachtwoord && gelijk(invoer, wachtwoord);
}

// ---------- Pincode voor het beheer ----------

/** De sleutel hangt aan pincode en wachtwoord: verandert een van beide, dan is de beheercookie ongeldig */
function beheerSleutel() {
  return `${wachtwoord}::${pincode}::stadstheater-smoelenboek-beheer`;
}

/** Cookie met verloopmoment, zodat beheer na 12 uur vanzelf dichtgaat */
export async function beheerWaarde(nu = Date.now()) {
  const tot = String(nu + BEHEER_DUUR * 1000);
  return `${tot}.${await hmac(beheerSleutel(), tot)}`;
}

export async function geldigBeheer(cookie: string | undefined, nu = Date.now()) {
  if (!pincode || !cookie) return false;
  const [tot, handtekening] = cookie.split(".");
  if (!tot || !handtekening || !/^\d+$/.test(tot) || Number(tot) < nu) return false;
  return gelijk(handtekening, await hmac(beheerSleutel(), tot));
}

export function juistePincode(invoer: string) {
  return !!pincode && gelijk(invoer.trim(), pincode);
}
