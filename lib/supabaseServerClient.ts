// lib/supabaseServerClient.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Factoría para crear un cliente de Supabase en el servidor.
 * Se llama dentro de las rutas API (runtime), nunca a nivel de módulo,
 * para evitar que Next.js intente instanciar el cliente durante el build
 * cuando las variables de entorno aún no están disponibles.
 */
export function supabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key, {
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
