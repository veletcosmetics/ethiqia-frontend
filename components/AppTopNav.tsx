"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppTopNav() {
  const pathname = usePathname();

  // Ocultar en home e investors (según tu comentario en layout)
  if (pathname === "/" || pathname.startsWith("/investors")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-black/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Logo + links */}
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/feed" className="font-semibold text-white hover:text-emerald-400 transition-colors">
            Ethiqia
          </Link>

          <Link
            href="/score-rules"
            className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            Info Score
          </Link>
        </div>

        {/* Right: navegación rápida */}
        <nav className="flex items-center gap-3">
          <Link
            href="/feed"
            className={`text-xs px-3 py-2 rounded-full border transition-colors ${
              pathname.startsWith("/feed")
                ? "border-emerald-700/50 bg-emerald-500/10 text-emerald-300"
                : "border-neutral-800 bg-black text-neutral-300 hover:text-white hover:border-neutral-600"
            }`}
          >
            Feed
          </Link>

          <Link
            href="/profile"
            className={`text-xs px-3 py-2 rounded-full border transition-colors ${
              pathname.startsWith("/profile")
                ? "border-emerald-700/50 bg-emerald-500/10 text-emerald-300"
                : "border-neutral-800 bg-black text-neutral-300 hover:text-white hover:border-neutral-600"
            }`}
          >
            Mi perfil
          </Link>
        </nav>
      </div>
    </header>
  );
}
