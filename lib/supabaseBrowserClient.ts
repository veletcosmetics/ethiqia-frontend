// lib/supabaseBrowserClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Las variables NEXT_PUBLIC_* se incrustan en build time por Next.js.
// El guard evita que createClient lance "supabaseUrl is required"
// en entornos de build donde aún no están disponibles.
export const supabaseBrowser =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as any);
