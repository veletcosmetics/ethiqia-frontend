import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ethiqia · Demo',
  description:
    'Ethiqia: reputación digital, autenticidad de imágenes y análisis IA para comunidades y organizaciones.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-neutral-950 text-neutral-50">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
            <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
              {/* Logo / Marca */}
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-semibold tracking-wide"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-[13px] font-bold text-black">
                  E
                </div>
                <div className="flex flex-col leading-tight">
                  <span>Ethiqia</span>
                  <span className="text-[10px] text-neutral-500">
                    IA · Reputación · Autenticidad
                  </span>
                </div>
              </Link>

              {/* Navegación principal */}
              <div className="hidden gap-5 text-sm text-neutral-300 md:flex">
                <Link
                  href="/feed"
                  className="hover:text-emerald-300 transition-colors"
                >
                  Feed
                </Link>
                <Link
                  href="/explore"
                  className="hover:text-emerald-300 transition-colors"
                >
                  Explorar
                </Link>
                <Link
                  href="/news"
                  className="hover:text-emerald-300 transition-colors"
                >
                  Novedades
                </Link>
                <Link
                  href="/score"
                  className="hover:text-emerald-300 transition-colors"
                >
                  Score
                </Link>
                <Link
                  href="/profile"
                  className="hover:text-emerald-300 transition-colors"
                >
                  Tu bio
                </Link>
              </div>

              {/* Zona derecha: Demo en vivo + Auth */}
              <div className="flex items-center gap-2">
                <Link
                  href="/demo/live"
                  className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500 hover:text-black transition-colors"
                >
                  ⚡ Demo en vivo
                </Link>
                <Link
                  href="/login"
                  className="hidden text-[11px] text-neutral-300 hover:text-emerald-300 md:inline"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="hidden rounded-full border border-neutral-700 px-3 py-1.5 text-[11px] text-neutral-100 hover:border-emerald-400 hover:text-emerald-300 md:inline"
                >
                  Crear cuenta
                </Link>
              </div>
            </nav>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-neutral-900 py-3 text-center text-[11px] text-neutral-500">
            Ethiqia · Demo funcional para inversores y Parque Científico.
          </footer>
        </div>
      </body>
    </html>
  );
}
