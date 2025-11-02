'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type U = { id: string; name: string; email: string; score?: number };

export default function ClientUserBadge() {
  const [user, setUser] = useState<U | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="text-[#c8cfdb]">
        {user.name} · Score: <b>{user.score ?? 50}</b>
      </Link>
      <button
        className="btn"
        onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }}
      >
        Salir
      </button>
    </div>
  );
}
