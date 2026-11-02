import { Suspense } from "react";
import { Overzicht } from "@/components/Overzicht";
import { Pagina } from "@/components/Pagina";

export default function SmoelenboekPagina() {
  return (
    <Pagina>
      <Suspense fallback={null}>
        <Overzicht />
      </Suspense>
    </Pagina>
  );
}
