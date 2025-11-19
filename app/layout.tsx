import './globals.css';
import Link from 'next/link';
import ClientUserBadge from '../components/ClientUserBadge';

export const metadata = {
  title: 'Ethiqia',
  description: 'Ethiqia – Social network with AI supervision',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-neutral-950 text-neutral-100">
        <header className="border-b border-[#1c2230] bg-neutral-950/80 backdrop-blur">
          <div className="container py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-neutral-100 text-lg tracking-tight">
              Ethiqia
            </Link>

            <nav className="flex items-center gap-5 text-sm text-neutral-300">
              <Link href="/feed" className="hover:text-white">Feed</Link>
              <Link href="/news" className="hover:text-white">Novedades</Link>
              <Link href="/login" className="hover:text-white">Entrar</Link>
              <Link
                href="/register"
                className="rounded-md border border-neutral-700 px-3 py-1.5 hover:border-neutral-500"
              >
                Crear cuenta
              </Link>
              <ClientUserBadge />
            </nav>
          </div>
        </header>

        <main className="container py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
