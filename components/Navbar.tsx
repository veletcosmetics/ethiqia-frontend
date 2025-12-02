"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/feed", label: "Feed" },
    { href: "/explore", label: "Explorar" },
    { href: "/news", label: "Novedades" },
    { href: "/score", label: "Score" },
    { href: "/monetizar", label: "Monetizar" },
    { href: "/normas", label: "Normas" },
  ];

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

        {/* Menú desktop */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/feed" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 rounded-full transition-colors ${
                  active
                    ? "bg-white text-black"
                    : "text-gray-300 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Zona derecha: botones */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Link
            href="/profile"
            className="hidden sm:inline-flex px-3 py-1 rounded-full border border-zinc-700 text-gray-200 hover:bg-zinc-900 transition"
          >
            Tu bio
          </Link>
          <Link
            href="/login"
            className="px-3 py-1 rounded-full border border-zinc-700 text-gray-200 hover:bg-zinc-900 transition"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-3 py-1 rounded-full bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
          >
            Crear cuenta
          </Link>
        </div>
      </div>

      {/* Menú móvil */}
      <div className="md:hidden border-t border-zinc-800 mt-3 px-3 py-2 flex gap-2 overflow-x-auto text-xs">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/feed" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1 whitespace-nowrap rounded-full transition-colors ${
                active
                  ? "bg-white text-black"
                  : "text-gray-300 hover:text-white hover:bg-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
