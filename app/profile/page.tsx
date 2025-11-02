'use client';
import { useEffect, useState } from 'react';

export default function Profile() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  if (!user) return <div className="card">Inicia sesión para ver tu perfil.</div>;

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Tu perfil</h1>
      <div className="card grid gap-2">
        <div><b>Nombre:</b> {user.name}</div>
        <div><b>Email:</b> {user.email}</div>
        <div><b>Ethiqia Score:</b> {user.score ?? 50}</div>
      </div>
    </div>
  );
}
