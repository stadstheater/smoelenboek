import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PersoonFormulier } from "@/components/beheer/PersoonFormulier";
import { isDemo } from "@/lib/config";
import { haalGegevens } from "@/lib/data";

export const metadata: Metadata = { title: "Persoon bewerken" };

export default async function BewerkPersoonPagina({ params }: PageProps<"/beheer/medewerkers/[id]">) {
  const { id } = await params;
  const { personen } = await haalGegevens();
  if (!personen.some((p) => p.id === id)) notFound();
  return <PersoonFormulier key={id} persoonId={id} isDemo={isDemo} />;
}
