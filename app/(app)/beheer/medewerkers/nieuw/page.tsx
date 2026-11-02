import type { Metadata } from "next";
import { PersoonFormulier } from "@/components/beheer/PersoonFormulier";
import { isDemo } from "@/lib/config";

export const metadata: Metadata = { title: "Persoon toevoegen" };

export default function NieuwePersoonPagina() {
  return <PersoonFormulier persoonId={null} isDemo={isDemo} />;
}
