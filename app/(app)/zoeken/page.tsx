import type { Metadata } from "next";
import { Suspense } from "react";
import { Zoekresultaten } from "@/components/Zoekresultaten";

export const metadata: Metadata = { title: "Zoeken" };

export default function ZoekPagina() {
  return (
    <Suspense fallback={null}>
      <Zoekresultaten />
    </Suspense>
  );
}
