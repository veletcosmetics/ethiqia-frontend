"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user } } = await supabaseBrowser.auth.getUser();
        if (!user) { router.push("/login"); return; }

        // If already confirmed, go to onboarding/feed
        if (user.email_confirmed_at) {
          router.push("/onboarding");
          return;
        }

        setEmail(user.email ?? null);
      } catch {
        router.push("/login");
      } finally {
        setChecking(false);
      }
    };
    check();

    // Poll every 5s to detect confirmation
    const interval = setInterval(async () => {
      try {
        const { data: { user } } = await supabaseBrowser.auth.getUser();
        if (user?.email_confirmed_at) {
          router.push("/onboarding");
        }
      } catch { /* no-op */ }
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const resendEmail = async () => {
    if (!email) return;
    setSending(true);
    setError(null);
    setSent(false);
    try {
      const { error: err } = await supabaseBrowser.auth.resend({
        type: "signup",
        email,
      });
      if (err) {
        setError(err.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Error al reenviar el email");
    } finally {
      setSending(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-600 border-t-emerald-500 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 mx-auto">
          <svg className="h-8 w-8 text-amber-400" viewBox="0 0 24 24" fill="none">
            <path d="M3 8l9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold">Confirma tu email</h1>
          <p className="text-sm text-neutral-400 mt-3 leading-relaxed">
            Te enviamos un email de confirmacion a{" "}
            <span className="text-white font-medium">{email ?? "tu correo"}</span>.
            Revisa tambien la carpeta de spam.
          </p>
        </div>

        <p className="text-xs text-neutral-500">
          Esta pagina se actualizara automaticamente cuando confirmes tu email.
        </p>

        {sent && (
          <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
            Email reenviado! Revisa tu bandeja.
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={resendEmail}
          disabled={sending}
          className="rounded-full border border-neutral-700 hover:border-emerald-500 px-6 py-2.5 text-sm font-semibold text-neutral-200 hover:text-emerald-400 transition-colors disabled:opacity-50"
        >
          {sending ? "Enviando..." : "Reenviar email de confirmacion"}
        </button>

        <p className="text-xs text-neutral-600">
          Si ya confirmaste, <button type="button" onClick={() => window.location.reload()} className="text-emerald-400 hover:text-emerald-300">recarga esta pagina</button>.
        </p>
      </div>
    </main>
  );
}
