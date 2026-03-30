-- ============================================================
-- Ethiqia: Ajustar campos de perfil en tabla profiles
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1) Añadir twitter_url si no existe (las demas _url ya existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'twitter_url') THEN
    ALTER TABLE public.profiles ADD COLUMN twitter_url text;
  END IF;
END $$;

-- 2) Eliminar columnas duplicadas (instagram, linkedin, twitter)
-- que se crearon por error. Las correctas son instagram_url, linkedin_url, twitter_url.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS instagram;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS linkedin;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS twitter;

-- 3) Verificacion
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
