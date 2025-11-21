"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("❌ " + error.message);
    } else {
      setMessage("✔ Usuario creado. Revisa tu email para confirmar.");
    }

    setLoading(false);
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Crear cuenta</h1>

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full bg-emerald-600 py-2 rounded font-semibold"
        >
          {loading ? "Creando..." : "Registrarse"}
        </button>
      </form>

      {message && (
        <p className="text-sm text-neutral-300 mt-4">{message}</p>
      )}
    </main>
  );
}
