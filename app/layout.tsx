import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Footer from "@/components/layout/footer";
import { CheckSession } from "@/components/auth/check-session";
import { variables } from "@/settings/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${variables.title} - Commandez vos pizzas en ligne`,
  description:
    "Commandez vos pizzas préférées en ligne pour une livraison rapide ou un retrait en magasin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className} cz-shortcut-listen="true">
        <CheckSession />
        {children}
        <Footer />
      </body>
    </html>
  );
}
