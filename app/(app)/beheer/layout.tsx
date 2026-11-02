import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BeheerTabs } from "@/components/beheer/BeheerTabs";
import { isBeheerder } from "@/lib/toegang";

export const metadata: Metadata = { title: "Beheer" };

export default async function BeheerLayout({ children }: LayoutProps<"/beheer">) {
  // De proxy houdt dit al tegen; dit is de tweede controle
  if (!(await isBeheerder())) redirect("/?pincode=/beheer");
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <p className="eyebrow">Smoelenboek</p>
      <h1 className="kop mt-2 text-[clamp(2.4rem,5vw,3.6rem)]">Beheer</h1>
      <BeheerTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
