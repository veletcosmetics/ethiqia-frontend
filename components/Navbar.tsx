import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-zinc-800 bg-black/80 backdrop-blur px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Logo / nombre app */}
        <Link href="/feed" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-sm">
            E
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-zinc-50">
              Ethiqia
            </span>
            <span className="text-[11px] text-zinc-500">
              Beta reputación ética
            </span>
          </div>
        </Link>

        {/* Navegación principal */}
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/feed"
            className="text-zinc-300 hover:text-white transition-colors"
          >
            Feed
          </Link>

          <Link
            href="/profile"
            className="text-zinc-300 hover:text-white transition-colors"
          >
            Mi perfil
          </Link>

          {/* Más adelante aquí podemos poner: Empresas, Score, etc. */}
        </div>
      </div>
    </nav>
  );
}
