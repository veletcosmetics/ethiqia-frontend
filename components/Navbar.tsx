'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
      <nav className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-neutral-100">Ethiqia</Link>
        <ul className="flex items-center gap-5 text-sm text-neutral-300">
          <li><Link href="/feed" className="hover:text-white">Feed</Link></li>
          <li><Link href="/login" className="hover:text-white">Entrar</Link></li>
          <li>
            <Link href="/register" className="rounded-md border border-neutral-700 px-3 py-1.5 hover:border-neutral-500">
              Crear cuenta
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
