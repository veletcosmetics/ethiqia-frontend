'use client';
import { useState } from 'react';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      router.push('/login');
    } catch (e: any) { setError(e.message || 'Error'); }
  }

  return (
    <div className="max-w-md mx-auto grid gap-4">
      <h1 className="text-xl font-semibold">Crear cuenta</h1>
      {error && <div className="card text-red-300">{error}</div>}
      <form onSubmit={onSubmit} className="grid gap-3">
        <input className="input" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn">Registrarme</button>
      </form>
    </div>
  );
}
