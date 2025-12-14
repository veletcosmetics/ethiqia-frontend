"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppTopNav() {
  const pathname = usePathname();

  // Rutas donde NO queremos el navbar de la app
  const isLanding = pathname === "/" || pathname.startsWith("/investors");
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isLanding || isAuth) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-black/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo -> SIEMPRE a la landing */}
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-semibold">
            E
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-white">Ethiqia</div>
            <div className="text-xs text-neutral-400">Beta reputación ética</div>
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-sm text-neutral-300">
          <Link href="/feed" className="hover:text-white transition-colors">
            Feed
          </Link>
          <Link href="/profile" className="hover:text-white transition-colors">
            Mi perfil
          </Link>
        </nav>
      </div>
    </header>
  );
}
