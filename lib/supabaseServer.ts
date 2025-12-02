// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // usamos la misma clave anon

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
