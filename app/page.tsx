'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-[calc(100dvh-64px)] bg-neutral-950 text-neutral-200">
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-24 text-center">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">Ethiqia</h1>
        <p className="mt-5 text-neutral-400 md:text-lg">
          Red social impulsada por IA para reputación transparente.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/feed" className="rounded-lg px-5 py-3 bg-white text-black font-medium hover:opacity-90 transition">
            Entrar al feed
          </Link>
          <Link href="/login" className="rounded-lg px-5 py-3 border border-neutral-700 hover:border-neutral-500 transition">
            Iniciar sesión
          </Link>
        </div>

        <div className="mt-12 text-sm text-neutral-500">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/profile" className="underline hover:text-neutral-300">
            Crear cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}
