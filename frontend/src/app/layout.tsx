import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "E-Transport ERP — Gestion de Flotte & Logistique",
  description:
    "Système ERP complet pour entreprise de transport : Véhicules, Chauffeurs, Clients, Maintenance, Contrats, Cautions et Stock.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="h-full bg-background font-sans text-text-primary antialiased">
        <div className="flex min-h-screen">
          {/* Main Sidebar */}
          <Sidebar />

          {/* Main View Area */}
          <div className="flex flex-1 flex-col pl-[72px] md:pl-[240px] transition-all duration-300">
            <TopBar />
            <main className="flex-1 p-6 md:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
