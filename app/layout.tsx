import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { ToastProvider } from "@/components/shell/Toasts";
import { ThemaScript } from "@/thema/ThemaScript";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Smoelenboek | Stadstheater Zoetermeer",
    template: "%s | Smoelenboek Stadstheater Zoetermeer",
  },
  description: "Wie is wie bij Stadstheater Zoetermeer en bij wie moet je zijn.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Het themascript zet data-thema op <html> voordat React laadt
    <html lang="nl" className={`${inter.variable} ${barlow.variable}`} suppressHydrationWarning>
      <head>
        <ThemaScript />
      </head>
      <body className="min-h-dvh">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
