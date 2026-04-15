-- ============================================================
-- Ethiqia: Fix tabla posts - columnas que pueden faltar
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1) Columnas que puede que no existan
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'repost_of') THEN
    ALTER TABLE public.posts ADD COLUMN repost_of uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'moderation_status') THEN
    ALTER TABLE public.posts ADD COLUMN moderation_status text DEFAULT 'approved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'moderation_decided_at') THEN
    ALTER TABLE public.posts ADD COLUMN moderation_decided_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'moderation_decided_by') THEN
    ALTER TABLE public.posts ADD COLUMN moderation_decided_by text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'moderation_labels') THEN
    ALTER TABLE public.posts ADD COLUMN moderation_labels jsonb;
  END IF;
END $$;

-- 2) RLS - asegurar que service_role puede insertar
GRANT ALL ON public.posts TO service_role;
GRANT ALL ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;

-- 3) Verificar columnas
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'posts' ORDER BY ordinal_position;

-- 4) Verificar RLS policies
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'posts';
