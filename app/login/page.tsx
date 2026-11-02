import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LoginFormulier } from "@/app/login/LoginFormulier";
import { wachtwoord } from "@/lib/config";
import { ThemaKnop } from "@/thema/ThemaKnop";

export const metadata: Metadata = { title: "Inloggen" };

export default async function LoginPagina() {
  // Het wachtwoord wordt bij elk bezoek gelezen, niet tijdens het bouwen
  await connection();
  // Lokaal zonder wachtwoord is er niets om in te loggen
  if (!wachtwoord) redirect("/");

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.2fr_1fr]">
      {/* Beeldvlak: donker-paars met het lijnenspel uit de huisstijl */}
      <section data-thema="donker" className="relative flex min-h-[40dvh] flex-col justify-between overflow-hidden bg-donker-paars p-6 sm:p-10 lg:min-h-dvh lg:p-14">
        {/* Eén kader met vier schuine hoeken, op gelijke afstand van de rand */}
        <div aria-hidden className="lijnenspel lijnenspel-op-donker pointer-events-none absolute inset-3 sm:inset-5" />
        <Image src="/logo-stadstheater.svg" alt="Stadstheater Zoetermeer" width={150} height={32} priority className="relative m-2 sm:m-3" />
        <div className="relative m-2 sm:m-3">
          <span className="infoblokje animate-verschijn">Intern</span>
          <h1 className="kop mt-4 animate-verschijn text-[clamp(3.5rem,9vw,8rem)] text-white [animation-delay:80ms]">Smoelenboek</h1>
          <p className="mt-3 max-w-md animate-verschijn text-[16px] text-white/85 [animation-delay:160ms]">
            Wie is wie bij het Stadstheater en bij wie moet je zijn voor wat.
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center bg-vlak p-6 sm:p-10">
        <ThemaKnop className="knop knop-ghost knop-icoon absolute top-4 right-4" />
        <div className="w-full max-w-sm animate-verschijn [animation-delay:120ms]">
          <h2 className="text-[20px] font-semibold">Inloggen</h2>
          <p className="mt-1 mb-6 text-[13px] text-inkt-4">Vul het teamwachtwoord in.</p>
          <LoginFormulier />
        </div>
      </section>
    </main>
  );
}
