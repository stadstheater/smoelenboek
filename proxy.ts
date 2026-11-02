import { NextResponse, type NextRequest } from "next/server";
import { wachtwoordOntbreekt } from "@/lib/config";
import { BEHEER_COOKIE, geldigBeheer, geldigeSessie, SESSIE_COOKIE } from "@/lib/wachtwoord";

export async function proxy(request: NextRequest) {
  const pad = request.nextUrl.pathname;

  // Liever dicht dan per ongeluk open
  if (wachtwoordOntbreekt) {
    return new NextResponse("APP_WACHTWOORD is nog niet ingesteld in Vercel. Zet die env-var en deploy opnieuw.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (pad === "/login") return NextResponse.next();

  if (!(await geldigeSessie(request.cookies.get(SESSIE_COOKIE)?.value))) {
    if (pad.startsWith("/api/")) {
      return NextResponse.json({ fout: "Niet ingelogd" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Het beheer vraagt daarnaast de pincode; zonder pincode terug naar het smoelenboek met het pincodevenster open
  if (pad.startsWith("/beheer") && !(await geldigBeheer(request.cookies.get(BEHEER_COOKIE)?.value))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = `?pincode=${encodeURIComponent(pad + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Alles behalve statische bestanden
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|logo-stadstheater.svg|logo-stadstheater-paars.svg).*)",
  ],
};
