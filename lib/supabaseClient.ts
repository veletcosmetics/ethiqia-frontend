"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables de entorno."
  );
}

// Cliente principal para usar en el frontend
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Alias para no romper código antiguo que hacía `import { supabase } ...`
export const supabase = supabaseClient;

// Opcionalmente, export por defecto
export default supabaseClient;
