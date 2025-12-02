import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <span>
          © {new Date().getFullYear()} Ethiqia. Todos los derechos reservados.
        </span>

        <nav className="flex items-center gap-4">
          <Link href="/normas" className="hover:text-white transition-colors">
            Normas de la comunidad
          </Link>
          <Link href="/privacidad" className="hover:text-white transition-colors">
            Política de privacidad
          </Link>
          <Link href="/terminos" className="hover:text-white transition-colors">
            Términos de uso
          </Link>
        </nav>
      </div>
    </footer>
  );
}
