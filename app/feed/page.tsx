"use client";

import React, { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import PostCard, { Post } from "@/components/PostCard";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type NewPostState = {
  caption: string;
  file: File | null;
  aiDisclosed: boolean;
};

type ProfileMini = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

function computeGlobalScore(aiProbability: any): number {
  const n = typeof aiProbability === "number" ? aiProbability : 0;

  // Si viene como 0..1 lo convertimos a porcentaje 0..100
  const probPct = n <= 1 ? n * 100 : n;

  // Score simple: 100 - probabilidad IA (capado)
  return Math.max(0, Math.min(100, Math.round(100 - probPct)));
}

export default function FeedPage() {
  const [newPost, setNewPost] = useState<NewPostState>({
    caption: "",
    file: null,
    aiDisclosed: false,
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastPoints, setLastPoints] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("Usuario Ethiqia");
  const [authChecked, setAuthChecked] = useState(false);

  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileMini>>({});

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  };

  // 1) Cargar usuario actual + su perfil
  useEffect(() => {
    const initAuthAndProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        setCurrentUser(user ?? null);

        if (user) {
          const { data: profile, error } = await supabaseBrowser
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (!error && profile?.full_name) {
            setCurrentUserName(profile.full_name as string);
          }
        }
      } catch (err) {
        console.error("Error obteniendo usuario/perfil:", err);
      } finally {
        setAuthChecked(true);
      }
    };

    initAuthAndProfile();
  }, []);

  // 2) Cargar posts (requiere Bearer)
  useEffect(() => {
    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const token = await getAccessToken();
        if (!token) return;

        const res = await fetch("/api/posts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text();
          console.error("GET /api/posts failed:", res.status, t);
          throw new Error("Error al cargar posts");
        }

        const data = await res.json();
        const list = (data.posts ?? []) as Post[];
        setPosts(list);

        // Cargar mini-perfiles para nombres/avatares (si RLS lo permite)
        const ids = Array.from(new Set(list.map((p) => p.user_id).filter(Boolean)));
        if (ids.length > 0) {
          const { data: profs, error } = await supabaseBrowser
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", ids);

          if (!error && profs) {
            const next: Record<string, ProfileMini> = {};
            (profs as ProfileMini[]).forEach((p) => (next[p.id] = p));
            setProfilesMap(next);
          } else {
            if (error) console.warn("No se han podido cargar perfiles públicos (RLS):", error);
          }
        }
      } catch (err) {
        console.error("Error cargando posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setNewPost((prev) => ({ ...prev, file }));
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPost((prev) => ({ ...prev, caption: e.target.value }));
  };

  const handleAiDisclosedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPost((prev) => ({ ...prev, aiDisclosed: e.target.checked }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLastPoints(null);

    if (!currentUser) {
      setMessage("Debes iniciar sesión para publicar.");
      return;
    }

    if (!newPost.file) {
      setMessage("Primero selecciona una imagen.");
      return;
    }

    setSubmitting(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        setMessage("Sesión no válida. Vuelve a iniciar sesión.");
        return;
      }

      // 1) Subir imagen
      const formData = new FormData();
      formData.append("file", newPost.file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        console.error("Error en /api/upload:", await uploadRes.text());
        throw new Error("Error subiendo la imagen");
      }

      const uploadJson = await uploadRes.json();
      const imageUrl = (uploadJson.url ?? uploadJson.publicUrl) as string | undefined;
      if (!imageUrl) throw new Error("No se ha recibido la URL pública de la imagen");

      // 2) Moderación IA
      const moderationRes = await fetch("/api/moderate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: newPost.caption, imageUrl }),
      });

      if (!moderationRes.ok) {
        console.error("Error en /api/moderate-post:", await moderationRes.text());
        throw new Error("Error moderando el contenido");
      }

      const moderation = await moderationRes.json();
      const aiProbability = moderation.aiProbability ?? 0;
      const blocked = moderation.blocked ?? false;
      const reason = moderation.reason ?? null;

      const globalScore = computeGlobalScore(aiProbability);

      // 3) Guardar post (sin userId en body)
      const saveRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          imageUrl,
          caption: newPost.caption,
          aiProbability,
          globalScore,
          text: newPost.caption,
          blocked,
          reason,
          aiDisclosed: newPost.aiDisclosed,
        }),
      });

      if (!saveRes.ok) {
        console.error("Error en /api/posts:", await saveRes.text());
        throw new Error("Error guardando el post");
      }

      const saved = await saveRes.json();
      const post = saved.post as Post;
      const pointsAwarded = typeof saved.points_awarded === "number" ? saved.points_awarded : 3;

      setPosts((prev) => [post, ...prev]);
      setNewPost({ caption: "", file: null, aiDisclosed: false });

      setLastPoints(pointsAwarded);
      setMessage(
        `Publicación creada correctamente.\nHas ganado +${pointsAwarded} puntos.`
      );

      // 4) Flash banner para /profile
      try {
        const flash = {
          title: "Publicación creada",
          body:
            newPost.aiDisclosed
              ? `Has ganado +${pointsAwarded} puntos (+3 por publicar, +1 por transparencia IA).`
              : `Has ganado +${pointsAwarded} puntos por publicar.`,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("ethiqia_flash", JSON.stringify(flash));
      } catch (e) {
        console.warn("No se pudo guardar ethqia_flash en localStorage:", e);
      }
    } catch (err) {
      console.error("Error creando publicación:", err);
      setMessage("Ha ocurrido un error al crear la publicación.");
    } finally {
      setSubmitting(false);
    }
  };

  const myId = currentUser?.id ?? null;

  if (authChecked && !currentUser) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold">Ethiqia</h1>
          <p className="text-sm text-gray-400">Debes iniciar sesión para ver y publicar en el feed.</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold"
