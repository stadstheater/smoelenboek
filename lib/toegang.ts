import "server-only";
import { cookies } from "next/headers";
import { BEHEER_COOKIE, geldigBeheer, geldigeSessie, SESSIE_COOKIE } from "@/lib/wachtwoord";

/** Gooit een fout als de bezoeker het teamwachtwoord niet heeft ingevuld */
export async function vereisToegang() {
  if (!(await heeftToegang())) throw new Error("Je bent niet ingelogd.");
}

export async function heeftToegang() {
  return geldigeSessie((await cookies()).get(SESSIE_COOKIE)?.value);
}

/** Beheer vraagt het teamwachtwoord én de pincode */
export async function isBeheerder() {
  const jar = await cookies();
  return (await geldigeSessie(jar.get(SESSIE_COOKIE)?.value)) && (await geldigBeheer(jar.get(BEHEER_COOKIE)?.value));
}

export async function vereisBeheer() {
  if (!(await isBeheerder())) throw new Error("Vul eerst de pincode voor het beheer in.");
}
