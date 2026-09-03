import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";


export const metadata: Metadata = {
  title: "Fl\u014d | Fleet Management & BI",
  description: "Plateforme ERP SaaS de gestion de flotte en temps réel.",
  openGraph: {
    title: "Fl\u014d | Fleet Management & BI",
    description: "Plateforme ERP SaaS de gestion de flotte en temps réel.",
    type: "website",
    locale: "fr_DZ",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full overflow-x-hidden">
      <head>
        {/* Fontshare — Satoshi, Clash Display, General Sans, Cabinet Grotesk */}
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=clash-display@500,600&f[]=general-sans@400,500&f[]=cabinet-grotesk@700&display=swap" />
        {/* Google Fonts — DM Sans, Space Grotesk, Poppins, Inter, Bruno Ace SC, Tajawal (for Arabic) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Space+Grotesk:wght@600&family=Poppins:wght@600&family=Inter:wght@400;500&family=Bruno+Ace+SC&family=Tajawal:wght@400;500;700&display=swap" />
      </head>
      <body className="h-full font-sans text-text-primary antialiased bg-[var(--color-haiti)] overflow-x-hidden">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
