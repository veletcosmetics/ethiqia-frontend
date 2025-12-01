'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Post = {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string;
  created_at: string;
};

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Cargar posts desde Supabase
  const loadPosts = async () => {
    setLoadingFeed(true);
    setFeedError(null);

    const { data, error } = await supabase
      .from('posts')
      .select('id, user_id, caption, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error(error);
      setFeedError(error.message);
    } else {
      setPosts((data || []) as Post[]);
    }

    setLoadingFeed(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Crear un nuevo post
  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!caption.trim() && !imageUrl.trim()) {
      setCreateError('Escribe un texto o pon al menos una URL de imagen.');
      return;
    }

    setCreatingPost(true);

    try {
      // 1) Obtener usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = userData.user;
      if (!user) {
        router.push('/login');
        return;
      }

      if (!imageUrl.trim()) {
        // si no hay imagen, ponemos un placeholder
        // luego lo cambiaremos cuando integremos subida real
        // para que no falle el NOT NULL
        setImageUrl('https://placehold.co/600x400');
      }

      // 2) Insertar post
      const { data: newPostData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: caption.trim() || null,
          image_url: imageUrl.trim() || 'https://placehold.co/600x400',
        })
        .select('id, user_id, caption, image_url, created_at')
        .single();

      if (postError) throw postError;

      const newPost = newPostData as Post;

      // 3) Insertar puntos (score) por crear post
      const { error: scoreError } = await supabase.from('scores').insert({
        user_id: user.id,
        source: 'post',
        value: 5, // por ejemplo, 5 puntos por publicar
        meta: { reason: 'publicacion' },
      });

      if (scoreError) {
        console.error('Error insertando score:', scoreError);
        // No hacemos throw para no romper la creación del post;
        // simplemente no se suman puntos si falla
      }

      // 4) Limpiar formulario y actualizar feed en pantalla
      setCaption('');
      setImageUrl('');
      setPosts((prev) => [newPost, ...prev]);
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || 'Error al crear el post');
    } finally {
      setCreatingPost(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center py-6 px-4 gap-6">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {/* Cabecera simple */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Feed Ethiqia</h1>
          <button
            className="text-xs px-3 py-1 border rounded-xl hover:bg-gray-100"
            onClick={() => router.push('/profile')}
          >
            Ir a mi perfil
          </button>
        </header>

        {/* Formulario para crear post */}
        <section className="border rounded-2xl p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Crear nueva publicación</h2>

          <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
            <textarea
              className="border rounded-xl px-3 py-2 text-sm min-h-[70px]"
              placeholder="Cuenta algo sobre tu foto o contenido auténtico..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">
                URL de imagen (temporal, luego conectaremos subida real)
              </label>
              <input
                className="border rounded-xl px-3 py-2 text-sm"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            {createError && (
              <p className="text-xs text-red-600">{createError}</p>
            )}

            <button
              type="submit"
              disabled={creatingPost}
              className="self-end bg-black text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {creatingPost ? 'Publicando...' : 'Publicar'}
            </button>
          </form>
        </section>

        {/* Feed de posts */}
        <section className="flex flex-col gap-3">
          {loadingFeed && <p className="text-sm text-gray-500">Cargando feed...</p>}
          {feedError && <p className="text-sm text-red-600">Error: {feedError}</p>}

          {!loadingFeed && !feedError && posts.length === 0 && (
            <p className="text-sm text-gray-500">
              Todavía no hay publicaciones. Crea la primera arriba.
            </p>
          )}

          <ul className="flex flex-col gap-4">
            {posts.map((post) => (
              <li
                key={post.id}
                className="border rounded-2xl overflow-hidden bg-white"
              >
                <div className="px-4 py-3 flex flex-col gap-1">
                  <span className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                  {post.caption && (
                    <p className="text-sm whitespace-pre-line">{post.caption}</p>
                  )}
                </div>
                <div className="w-full bg-black/5">
                  {/* De momento solo mostramos la URL como imagen directa;
                      luego se integrará con el sistema de subida */}
                  <img
                    src={post.image_url}
                    alt={post.caption ?? 'Post'}
                    className="w-full max-h-[480px] object-cover"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
