-- ============================================================
-- Ethiqia: Columnas extra para company_profiles
-- Ejecutar en Supabase SQL Editor
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'cif') THEN
    ALTER TABLE public.company_profiles ADD COLUMN cif text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'bio') THEN
    ALTER TABLE public.company_profiles ADD COLUMN bio text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'website') THEN
    ALTER TABLE public.company_profiles ADD COLUMN website text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'contact_email') THEN
    ALTER TABLE public.company_profiles ADD COLUMN contact_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'sector') THEN
    ALTER TABLE public.company_profiles ADD COLUMN sector text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'country') THEN
    ALTER TABLE public.company_profiles ADD COLUMN country text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'city') THEN
    ALTER TABLE public.company_profiles ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'founded_year') THEN
    ALTER TABLE public.company_profiles ADD COLUMN founded_year integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'domain_verification_token') THEN
    ALTER TABLE public.company_profiles ADD COLUMN domain_verification_token text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'domain_verified') THEN
    ALTER TABLE public.company_profiles ADD COLUMN domain_verified boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'domain_verified_at') THEN
    ALTER TABLE public.company_profiles ADD COLUMN domain_verified_at timestamptz;
  END IF;
END $$;

-- RLS para INSERT (necesario para crear empresa)
DROP POLICY IF EXISTS "company_profiles_insert_auth" ON public.company_profiles;
CREATE POLICY "company_profiles_insert_auth"
  ON public.company_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

-- RLS para UPDATE (necesario para editar empresa)
DROP POLICY IF EXISTS "company_profiles_update_own" ON public.company_profiles;
CREATE POLICY "company_profiles_update_own"
  ON public.company_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Verificar
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'company_profiles' ORDER BY ordinal_position;
