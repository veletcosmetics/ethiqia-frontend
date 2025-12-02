import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Ethiqia - Demo reputación IA",
  description: "Ethiqia, la plataforma de reputación basada en contenido auténtico.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-black text-white">
        <div className="min-h-screen flex flex-col">
          {/* NAVBAR CORRECTO */}
          <Navbar />

          {/* CONTENIDO PRINCIPAL */}
          <main className="flex-1">{children}</main>

          {/* FOOTER */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
