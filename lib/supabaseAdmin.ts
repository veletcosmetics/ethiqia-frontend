// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

// IMPORTANTÍSIMO:
// - En servidor (route handlers) debes usar la SERVICE_ROLE KEY, nunca en cliente.
// - Asegúrate de definir estas variables en Render (Environment):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Si ya usas NEXT_PUBLIC_SUPABASE_URL en el proyecto, también puedes reutilizarlo como fallback.

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

if (!supabaseUrl) {
  // Esto hace fallar rápido en build/runtime si faltan envs
  console.error("[supabaseAdmin] Falta SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  console.error("[supabaseAdmin] Falta SUPABASE_SERVICE_ROLE_KEY");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
