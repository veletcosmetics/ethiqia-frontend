// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Factoría para el cliente servidor usado en rutas API como /api/upload.
 * No se instancia a nivel de módulo para evitar fallos en build time.
 */
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
