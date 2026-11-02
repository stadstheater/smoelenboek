import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isBeheerder } from "@/lib/toegang";

const MB = 1024 * 1024;

/**
 * Geeft de browser een tijdelijke, ondertekende link om een foto direct naar Vercel Blob te uploaden.
 * Alleen in het beheer, alleen beelden in de map fotos/, maximaal 5 MB.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody;
  try {
    const resultaat = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pad) => {
        if (!(await isBeheerder())) throw new Error("Alleen in het beheer");
        if (!/^fotos\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/i.test(pad)) throw new Error("Ongeldig pad");
        const regels = { allowedContentTypes: ["image/jpeg", "image/png", "image/webp"], maximumSizeInBytes: 5 * MB };
        const token = await issueSignedToken({
          pathname: pad,
          operations: ["put"],
          validUntil: Date.now() + 10 * 60 * 1000,
          ...regels,
        });
        return { token, urlOptions: { ...regels, addRandomSuffix: false } };
      },
    });
    return NextResponse.json(resultaat);
  } catch (e) {
    return NextResponse.json({ fout: e instanceof Error ? e.message : "Upload mislukt" }, { status: 400 });
  }
}
