import type { Metadata } from "next";
import { Organigram } from "@/components/Organigram";
import { Pagina } from "@/components/Pagina";

export const metadata: Metadata = { title: "Organigram" };

export default function OrganigramPagina() {
  return (
    <Pagina>
      <Organigram />
    </Pagina>
  );
}
