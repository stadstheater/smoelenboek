import type { Metadata } from "next";
import { Suspense } from "react";
import { Zoekresultaten } from "@/components/Zoekresultaten";
import { Pagina } from "@/components/Pagina";

export const metadata: Metadata = { title: "Zoeken" };

export default function ZoekPagina() {
  return (
    <Pagina>
      <Suspense fallback={null}>
        <Zoekresultaten />
      </Suspense>
    </Pagina>
  );
}
