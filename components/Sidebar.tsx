import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/feed", label: "Feed" },
  { href: "/explore", label: "Explorar" },
  { href: "/perfil", label: "Mi perfil" },
  { href: "/normas", label: "Normas" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full sm:w-60 border-r border-zinc-800 bg-black/60">
      <nav className="flex sm:flex-col gap-2 p-4">
        {menuItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-black"
                  : "text-gray-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
