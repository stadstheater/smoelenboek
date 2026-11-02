import { NextResponse } from "next/server";
import { exportCsv, haalRuw } from "@/lib/data";
import { isBeheerder } from "@/lib/toegang";

/** Export voor het beheer: ?soort=csv (Excel) of ?soort=json (volledige back-up) */
export async function GET(request: Request) {
  if (!(await isBeheerder())) return NextResponse.json({ fout: "Alleen in het beheer" }, { status: 403 });
  const soort = new URL(request.url).searchParams.get("soort");
  const datum = new Date().toISOString().slice(0, 10);
  if (soort === "json") {
    return new Response(JSON.stringify(await haalRuw(), null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="smoelenboek-backup-${datum}.json"`,
        "cache-control": "no-store",
      },
    });
  }
  return new Response(await exportCsv(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="smoelenboek-${datum}.csv"`,
      "cache-control": "no-store",
    },
  });
}
