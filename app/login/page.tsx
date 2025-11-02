'use client';
import { useState } from 'react';
import { api, setToken } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setToken(res.token);
      router.push('/feed');
    } catch (e: any) { setError(e.message || 'Error'); }
  }

  return (
    <div className="max-w-md mx-auto grid gap-4">
      <h1 className="text-xl font-semibold">Entrar</h1>
      {error && <div className="card text-red-300">{error}</div>}
      <form onSubmit={onSubmit} className="grid gap-3">
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn">Entrar</button>
      </form>
    </div>
  );
}
