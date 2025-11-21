"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  if (!session) {
    return (
      <main className="p-6 text-center">
        <p>No has iniciado sesión.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Tu perfil</h1>

      <p className="mt-4">
        <strong>Email:</strong> {session.user.email}
      </p>
    </main>
  );
}
