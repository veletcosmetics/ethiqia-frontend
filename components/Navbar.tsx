"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-zinc-800 bg-black/80 backdrop-blur px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">
            EQ
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm sm:text-base">Ethiqia</span>
            <span className="text-[11px] text-gray-400">Reputación · IA</span>
          </div>
        </Link>

        {/* Menú simple */}
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <Link href="/feed" className="hover:text-white text-gray-300">
            Feed
          </Link>
          <Link href="/explore" className="hover:text-white text-gray-300">
            Explorar
          </Link>
          <Link href="/news" className="hover:text-white text-gray-300">
            Novedades
          </Link>
          <Link href="/score" className="hover:text-white text-gray-300">
            Score
          </Link>
          <Link href="/monetizar" className="hover:text-white text-gray-300">
            Monetizar
          </Link>
          <Link href="/normas" className="hover:text-white text-gray-300">
            Normas
          </Link>
        </div>
      </div>
    </nav>
  );
}
