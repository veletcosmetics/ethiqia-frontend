import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ethiqia · Demo',
  description:
    'Demo funcional de Ethiqia: reputación digital, análisis de imágenes con IA, moderación ética y Ethiqia Score por bloques.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-neutral-950 text-neutral-50">
        {/* Navbar principal */}
        <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
          <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 text-sm">
            {/* Logo / Home */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 text-xs font-semibold">
                EQ
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-neutral-50">
                  Ethiqia
                </span>
                <span className="text-[11px] text-neutral-500">
                  Demo reputación · IA
                </span>
              </div>
            </Link>

            {/* Enlaces principales */}
            <div className="flex items-center gap-4">
              <Link
                href="/feed"
                className="text-xs text-neutral-300 hover:text-emerald-300"
              >
                Feed
              </Link>
              <Link
                href="/explore"
                className="text-xs text-neutral-300 hover:text-emerald-300"
              >
                Explorar
              </Link>
              <Link
                href="/news"
                className="text-xs text-neutral-300 hover:text-emerald-300"
              >
                Novedades
              </Link>
              <Link
                href="/score"
                className="text-xs text-neutral-300 hover:text-emerald-300"
              >
                Score
              </Link>
              <Link
                href="/monetizar"
                className="text-xs text-emerald-300 hover:text-emerald-200"
              >
                Monetizar
              </Link>
            </div>

            {/* Zona usuario / auth */}
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="text-xs text-neutral-300 hover:text-emerald-300"
              >
                Tu bio
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-neutral-700 px-3 py-1.5 text-[11px] text-neutral-100 hover:border-emerald-400 hover:text-emerald-300"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-medium text-black hover:bg-emerald-400"
              >
                Crear cuenta
              </Link>
            </div>
          </nav>
        </header>

        {/* Contenido de cada página */}
        {children}
      </body>
    </html>
  );
}
