// lib/feed.ts
import { supabase } from './supabaseClient';

export type FeedPost = {
  id: string;
  imageUrl: string;
  score: number | null;
  createdAt: string;
};

function mapRow(row: any): FeedPost {
  return {
    id: row.id,
    imageUrl: row.image_url,
    score: row.ai_score ?? null,
    createdAt: row.created_at,
  };
}

/**
 * Crea (o asegura) el perfil del usuario en la tabla profiles
 * usando su id de Supabase Auth.
 */
async function ensureProfile() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    throw new Error('NOT_AUTHENTICATED');
  }
  const user = data.user;

  const username =
    (user.user_metadata && (user.user_metadata.name as string)) ||
    (user.email ? user.email.split('@')[0] : 'Usuario Ethiqia');

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, username },
      {
        onConflict: 'id',
      }
    );

  if (upsertError) {
    console.error('Error al asegurar perfil:', upsertError);
    throw upsertError;
  }

  return user;
}

/**
 * Crea un post en la tabla posts, vinculado al usuario actual.
 * imageUrl puede ser un dataURL (para MVP) o una URL real de storage en el futuro.
 */
export async function createFeedPost(params: {
  imageUrl: string;
  score: number;
}) {
  const user = await ensureProfile();

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    image_url: params.imageUrl,
    ai_score: params.score,
  });

  if (error) {
    console.error('Error al crear post en Supabase:', error);
    throw error;
  }
}

/**
 * Obtiene los últimos posts del feed (simplificado).
 */
export async function fetchFeedPosts(limit = 20): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, image_url, ai_score, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error al leer posts de Supabase:', error);
    return [];
  }

  if (!data) return [];

  return data.map(mapRow);
}
