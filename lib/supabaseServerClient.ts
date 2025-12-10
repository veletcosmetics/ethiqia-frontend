// lib/supabaseServerClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Factoría para crear un cliente de Supabase en el servidor.
 * Se usa en las rutas API (por ejemplo /api/posts).
 */
export function supabaseServerClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "ethiqia-frontend-server",
      },
    },
  });
}

/**
 * Cliente singleton por si en algún sitio prefieres importar
 * directamente un cliente ya creado.
 *
 *   import { supabaseServer } from "@/lib/supabaseServerClient";
 */
export const supabaseServer = supabaseServerClient();

// Export default por si algún import usa `default`
export default supabaseServer;
