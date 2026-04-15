-- ============================================================
-- Ethiqia: Tabla company_profiles para vincular empresas a usuarios
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.company_profiles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle         text UNIQUE NOT NULL,
  name           text NOT NULL,
  owner_user_id  uuid NOT NULL REFERENCES auth.users(id),
  score          numeric DEFAULT 0,
  logo_url       text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_profiles_owner ON public.company_profiles(owner_user_id);

-- RLS
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_profiles_select_all" ON public.company_profiles;
CREATE POLICY "company_profiles_select_all"
  ON public.company_profiles FOR SELECT USING (true);

GRANT ALL ON public.company_profiles TO service_role;
GRANT ALL ON public.company_profiles TO authenticated;
GRANT SELECT ON public.company_profiles TO anon;

-- Insertar Velet Cosmetics vinculada a David
INSERT INTO public.company_profiles (handle, name, owner_user_id, score, logo_url)
VALUES ('velet_cosmetics', 'Velet Cosmetics', '5c9cd28d-e8e5-4f45-b06e-ec92181aa718', 84.1, '/logo-velet.png')
ON CONFLICT (handle) DO NOTHING;

-- Verificar
SELECT * FROM public.company_profiles;
