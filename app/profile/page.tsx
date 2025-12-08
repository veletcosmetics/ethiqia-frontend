"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import PostCard, { Post } from "@/components/PostCard";

type ProfileData = {
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1) Cargar usuario + perfil
  useEffect(() => {
    const loadUserAndProfile = async () => {
      setLoadingUser(true);
      setErrorMsg(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabaseBrowser.auth.getUser();

        if (authError) {
          console.error("Error obteniendo usuario:", authError);
          setErrorMsg("No se ha podido obtener el usuario.");
          setUser(null);
          return;
        }

        if (!user) {
          setUser(null);
          return;
        }

        setUser(user);

        const { data: profileData, error: profileError } = await supabaseBrowser
          .from("profiles")
          .select("full_name, bio, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.warn("Perfil no encontrado o error en profiles:", profileError);
          setProfile(null);
        } else {
          setProfile(profileData as ProfileData);
        }
      } catch (err) {
        console.error("Error cargando usuario/perfil:", err);
        setErrorMsg("Ha ocurrido un error cargando tu perfil.");
      } finally {
        setLoadingUser(false);
      }
    };

    loadUserAndProfile();
  }, []);

  // 2) Cargar posts del usuario actual
  useEffect(() => {
    const loadPosts = async () => {
      if (!user) {
        setPosts([]);
        setLoadingPosts(false);
        return;
      }

      setLoadingPosts(true);
      setErrorMsg(null);

      try {
        const { data, error } = await supabaseBrowser
          .from("posts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error cargando posts del perfil:", error);
          setErrorMsg("No se han podido cargar tus publicaciones.");
          setPosts([]);
        } else {
          setPosts((data ?? []) as Post[]);
        }
      } catch (err) {
        console.error("Error inesperado cargando posts:", err);
        setErrorMsg("Ha ocurrido un error cargando tus publicaciones.");
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, [user]);

  // 3) Si ya sabemos que no hay usuario, mensaje claro
  if (!loadingUser && !user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold">Tu perfil en Ethiqia</h1>
          <p className="text-sm text-gray-400">
            Debes iniciar sesión para ver tu perfil y tus publicaciones.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold"
          >
            Ir a iniciar sesión
          </a>
        </div>
      </main>
    );
  }

  const displayName =
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuario Ethiqia";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Cabecera de perfil */}
        <header className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              // Usamos <img> simple para evitar líos con next/image
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            {profile?.bio && (
              <p className="text-sm text-gray-400 mt-1">{profile.bio}</p>
            )}
          </div>
        </header>

        {errorMsg && (
          <p className="text-sm text-red-400">{errorMsg}</p>
        )}

        {/* Bloque publicaciones del usuario */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Tus publicaciones</h2>

          {loadingPosts && (
            <p className="text-sm text-gray-400">
              Cargando tus publicaciones...
            </p>
          )}

          {!loadingPosts && posts.length === 0 && (
            <p className="text-sm text-gray-500">
              Todavía no has publicado nada. Sube tu primera foto auténtica desde el feed.
            </p>
          )}

          <div className="space-y-4 mt-2">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                authorName={displayName}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
