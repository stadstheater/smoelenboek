import { Suspense } from "react";
import { Overzicht } from "@/components/Overzicht";

export default function SmoelenboekPagina() {
  return (
    <Suspense fallback={null}>
      <Overzicht />
    </Suspense>
  );
}
