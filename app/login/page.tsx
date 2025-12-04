"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error("Error login:", error);
      setErrorMsg(error.message || "No se ha podido iniciar sesión");
      return;
    }

    if (!data.session) {
      setErrorMsg("No se ha creado sesión. Revisa tu email o contraseña.");
      return;
    }

    // Login correcto -> al feed
    router.push("/feed");
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-zinc-800 rounded-2xl p-8 bg-zinc-950/70 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-2">Iniciar sesión</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Accede a tu cuenta de Ethiqia para publicar y ver tu reputación.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input
              type="password"
              required
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-medium py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-400">
          ¿No tienes cuenta?{" "}
          <a
            href="/register"
            className="text-emerald-400 hover:text-emerald-300 underline"
          >
            Crear cuenta
          </a>
        </p>
      </div>
    </div>
  );
}
