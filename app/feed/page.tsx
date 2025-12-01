'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { uploadPostImage } from '@/lib/uploadImage';

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Cargar posts desde Supabase
  const loadPosts = async () => {
    setLoadingFeed(true);
    setFeedError(null);

    const { data, error } = await supabase
      .from('posts')
      .select('id, user_id, caption, image_url, created_at')
      .eq('moderation_status', 'approved') // solo aprobados
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  // Crear un nuevo post REAL con moderación IA
  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!caption.trim() && !imageFile) {
      setCreateError('Escribe un texto o selecciona una foto.');
      return;
    }

    setCreatingPost(true);

    try {
      // 0) Moderación IA del caption antes de hacer nada más
      if (caption.trim()) {
        const modRes = await fetch('/api/moderate-post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ caption }),
        });

        if (!modRes.ok) {
          const errData = await modRes.json().catch(() => ({}));
          console.error('Error en moderación:', errData);
          setCreateError(
            'No se ha podido validar el contenido. Inténtalo de nuevo dentro de unos minutos.'
          );
          setCreatingPost(false);
          return;
        }

        const modData = (await modRes.json()) as {
          allowed: boolean;
          flagged: boolean;
          reason?: string | null;
          categories?: any;
        };

        if (!modData.allowed) {
          setCreateError(
            modData.reason ||
              'Tu publicación no cumple las normas de contenido de Ethiqia.'
          );
          setCreatingPost(false);
          return;
        }
      }

      // 1) Usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = userData.user;
      if (!user) {
        router.push('/login');
        return;
      }

      // 2) Subir imagen si hay archivo
      let finalImageUrl = '';
      if (imageFile) {
        finalImageUrl = await uploadPostImage(imageFile);
      } else {
        finalImageUrl = 'https://placehold.co/600x400?text=Ethiqia';
      }

      // 3) Insertar post en Supabase con moderation_status = 'approved'
      const { data: newPostData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: caption.trim() || null,
          image_url: finalImageUrl,
          moderation_status: 'approved',
          moderation_reason: null,
          moderation_labels: null,
          moderation_decided_at: new Date().toISOString(),
          moderation_decided_by: 'ai',
        })
        .select('id, user_id, caption, image_url, created_at')
        .single();

      if (postError) throw postError;

      const newPost = newPostData as Post;

      // 4) Insertar puntos (score) por crear post
      const { error: scoreError } = await supabase.from('scores').insert({
        user_id: user.id,
        source: 'post',
        value: 5,
        meta: { reason: 'publicacion' },
      });

      if (scoreError) {
        console.error('Error insertando score:', scoreError);
      }

      // 5) Limpiar formulario y actualizar feed
      setCaption('');
      setImageFile(null);
      setImagePreview(null);
      setPosts((prev) => [newPost, ...prev]);
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || 'Error al crear la publicación');
    } finally {
      setCreatingPost(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center py-6 px-4 gap-6">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {/* Cabecera */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Feed Ethiqia</h1>
          <div className="flex gap-2">
            <button
              className="text-xs px-3 py-1 border rounded-xl hover:bg-gray-100"
              onClick={() => router.push('/score')}
            >
              Ver mi Score
            </button>
            <button
              className="text-xs px-3 py-1 border rounded-xl hover:bg-gray-100"
              onClick={() => router.push('/profile')}
            >
              Mi perfil
            </button>
          </div>
        </header>

        {/* Formulario nueva publicación */}
        <section className="border rounded-2xl p-4 flex flex-col gap-3 bg-black text-white">
          <h2 className="text-sm font-semibold">Crear nueva publicación</h2>

          <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
            <textarea
              className="border rounded-xl px-3 py-2 text-sm min-h-[70px] bg-black text-white"
              placeholder="Cuenta algo sobre tu foto o contenido auténtico..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-300">
                Selecciona una foto de tu galería
              </label>
              <input
                type="file"
                accept="image/*"
                className="text-xs"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Previsualización"
                  className="mt-2 max-h-48 rounded-xl object-cover"
                />
              )}
            </div>

            {createError && (
              <p className="text-xs text-red-400">{createError}</p>
            )}

            <button
              type="submit"
              disabled={creatingPost}
              className="self-end bg-white text-black rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {creatingPost ? 'Publicando...' : 'Publicar'}
            </button>
          </form>
        </section>

        {/* Feed */}
        <section className="flex flex-col gap-3">
          {loadingFeed && (
            <p className="text-sm text-gray-500">Cargando feed...</p>
          )}
          {feedError && (
            <p className="text-sm text-red-600">Error: {feedError}</p>
          )}

          {!loadingFeed && !feedError && posts.length === 0 && (
            <p className="text-sm text-gray-500">
              Todavía no hay publicaciones aprobadas. Crea la primera arriba.
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
                    <p className="text-sm whitespace-pre-line">
                      {post.caption}
                    </p>
                  )}
                </div>
                <div className="w-full bg-black/5">
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
