import type { Metadata } from "next";
import { Organigram } from "@/components/Organigram";

export const metadata: Metadata = { title: "Organigram" };

export default function OrganigramPagina() {
  return <Organigram />;
}
