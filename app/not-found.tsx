import Link from "next/link";

export default function NietGevonden() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="kop text-[clamp(2.5rem,7vw,4.5rem)]">Niet gevonden</h1>
      <p className="max-w-sm text-[14px] text-inkt-3">Deze pagina bestaat niet (meer). Misschien is de persoon uit het smoelenboek gehaald.</p>
      <Link href="/" className="knop knop-vol">
        Naar het smoelenboek
      </Link>
    </main>
  );
}
