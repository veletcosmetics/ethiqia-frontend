'use client';
import { useEffect, useState } from 'react';
import { getBase, getToken } from '../../lib/api';

type Post = {
  _id: string;
  authorId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt?: string;
  authenticity?: { label: string; probability_ai: number };
};

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch(`${getBase()}/api/posts`, { cache: 'no-store' });
      const data = await res.json();
      setPosts(data);
    } catch (e: any) {
      setError(e.message || 'Error cargando feed');
    }
  }

  useEffect(() => { load(); }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      // 1) Moderación previa en cliente
      const modRes = await fetch(`${getBase()}/api/ai/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const mod = await modRes.json();
      if (mod?.allowed === false) {
        setError('Contenido rechazado por moderación de IA');
        return;
      }

      // 2) Publicación
      const token = getToken();
      if (!token) { setError('Inicia sesión primero'); return; }
      const fd = new FormData();
      fd.append('text', text);
      if (file) fd.append('media', file);
      const res = await fetch(`${getBase()}/api/posts`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: fd
      });
      if (!res.ok) throw new Error(await res.text());
      setText(''); setFile(null);
      await load();
    } catch (e: any) {
      setError(e.message || 'Error publicando');
    }
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Feed</h1>
      <form onSubmit={publish} className="card grid gap-3">
        <textarea className="input h-28" placeholder="¿Qué quieres compartir?" value={text} onChange={e=>setText(e.target.value)} />
        <input className="text-sm" type="file" accept="image/*,video/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <div className="flex gap-2">
          <button className="btn">Publicar</button>
          {error && <div className="text-red-300 text-sm">{error}</div>}
        </div>
      </form>

      <div className="grid gap-3">
        {posts.map(p => (
          <div key={p._id} className="card grid gap-2">
            <div className="text-sm text-[#c8cfdb]">Auth: <b>{p.authenticity?.label || 'n/a'}</b> · AI prob: <b>{p.authenticity?.probability_ai ?? 0}</b></div>
            <p>{p.text}</p>
            {p.mediaUrl && (
              p.mediaType?.startsWith('video') ? (
                <video controls className="rounded-xl w-full">
                  <source src={`${getBase()}${p.mediaUrl}`} />
                </video>
              ) : (
                <img src={`${getBase()}${p.mediaUrl}`} className="rounded-xl w-full" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
