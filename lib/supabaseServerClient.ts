// lib/supabaseServerClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente SOLO para uso en el servidor (API routes, acciones, etc.)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
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

// Export default por si alguna ruta lo importa así
export default supabaseServer;
