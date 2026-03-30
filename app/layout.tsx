import type { Metadata } from "next";
import "./globals.css";
import AppTopNav from "@/components/AppTopNav";

export const metadata: Metadata = {
  title: "Ethiqia",
  description: "Beta reputación ética",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-black text-white">
        {/* Navbar de la app (Feed/Mi perfil) — se oculta en / y /investors */}
        <AppTopNav />

        {/* Contenido de cada página */}
        {children}
      </body>
    </html>
  );
}
