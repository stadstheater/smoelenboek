import { AppShell } from "@/components/shell/AppShell";
import { isDemo } from "@/lib/config";
import { haalGegevens } from "@/lib/data";
import { isBeheerder } from "@/lib/toegang";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [gegevens, beheer] = await Promise.all([haalGegevens(), isBeheerder()]);
  return (
    <AppShell gegevens={gegevens} beheer={beheer} isDemo={isDemo}>
      {children}
    </AppShell>
  );
}
