import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LoginFormulier } from "@/app/login/LoginFormulier";
import { wachtwoord } from "@/lib/config";

export const metadata: Metadata = { title: "Inloggen" };

export default async function LoginPagina() {
  // Het wachtwoord wordt bij elk bezoek gelezen, niet tijdens het bouwen
  await connection();
  // Lokaal zonder wachtwoord is er niets om in te loggen
  if (!wachtwoord) redirect("/");

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.2fr_1fr]">
      {/* Beeldvlak met bewegend verloop */}
      <section data-thema="donker" className="relative flex min-h-[38dvh] flex-col justify-between overflow-hidden bg-vlak-kaart p-6 sm:p-10 lg:min-h-dvh lg:p-14">
        <div aria-hidden className="absolute inset-0">
          <div className="gloed absolute -top-1/4 -right-1/4 aspect-square w-[90%] rounded-full bg-[radial-gradient(circle_at_35%_35%,#e8264f,#ed6e13_45%,transparent_70%)] opacity-80 blur-sm" />
          <div className="gloed absolute -bottom-1/3 -left-1/4 aspect-square w-[70%] rounded-full bg-[radial-gradient(circle,#6d3aa8,transparent_65%)] opacity-70 [animation-delay:-9s]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>
        <Image src="/logo-stadstheater.svg" alt="Stadstheater Zoetermeer" width={150} height={32} priority className="relative" />
        <div className="relative">
          <p className="eyebrow animate-verschijn text-white/80">Intern</p>
          <h1 className="kop mt-3 animate-verschijn text-[clamp(3.5rem,7.2vw,8.5rem)] [animation-delay:80ms]">Smoelenboek</h1>
          <p className="mt-3 max-w-md animate-verschijn text-[16px] text-white/85 [animation-delay:160ms]">
            Wie is wie bij het Stadstheater en bij wie moet je zijn voor wat.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-vlak p-6 sm:p-10">
        <div className="w-full max-w-sm animate-verschijn [animation-delay:120ms]">
          <h2 className="text-[20px] font-semibold">Inloggen</h2>
          <p className="mt-1 mb-6 text-[13px] text-inkt-4">Vul het teamwachtwoord in.</p>
          <LoginFormulier />
        </div>
      </section>
    </main>
  );
}
