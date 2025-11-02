import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Ethiqia',
  description: 'Ethiqia – Social network with AI supervision',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="border-b border-[#1c2230]">
          <div className="container py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold">Ethiqia</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/feed">Feed</Link>
              <Link href="/login">Entrar</Link>
              <Link href="/register">Crear cuenta</Link>
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
      </body>
    </html>
  );
}
