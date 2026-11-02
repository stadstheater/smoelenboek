import { NextResponse } from "next/server";
import { haalBestand } from "@/lib/opslag";

/** Foto's staan privé in Vercel Blob; deze route geeft ze door, achter het wachtwoord */
export async function GET(_request: Request, ctx: RouteContext<"/api/foto/[...pad]">) {
  const { pad } = await ctx.params;
  const volledig = pad.map(decodeURIComponent).join("/");
  if (!volledig.startsWith("fotos/") || volledig.includes("..")) {
    return NextResponse.json({ fout: "Ongeldig pad" }, { status: 400 });
  }
  const res = await haalBestand(volledig);
  if (!res) return NextResponse.json({ fout: "Niet gevonden" }, { status: 404 });
  return new Response(res.stream, {
    headers: {
      "content-type": res.blob.contentType,
      // Elke foto heeft een uniek pad, dus de browser mag hem lang bewaren
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
}
