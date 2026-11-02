import type { Metadata } from "next";
import { PersoonFormulier } from "@/components/beheer/PersoonFormulier";
import { isDemo } from "@/lib/config";
import { Pagina } from "@/components/Pagina";

export const metadata: Metadata = { title: "Persoon toevoegen" };

export default function NieuwePersoonPagina() {
  return (
    <Pagina>
      <PersoonFormulier persoonId={null} isDemo={isDemo} />
    </Pagina>
  );
}
