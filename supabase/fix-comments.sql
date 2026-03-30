-- ============================================================
-- Ethiqia: Fix completo para la tabla comments
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- 1) CREAR TABLA SI NO EXISTE
-- Si ya existe, este bloque no hace nada.
CREATE TABLE IF NOT EXISTS public.comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) AÑADIR COLUMNAS QUE PUEDAN FALTAR (si la tabla ya existia con schema parcial)
DO $$
BEGIN
  -- Asegurarse de que post_id tiene FK a posts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'comments' AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%post_id%'
  ) THEN
    BEGIN
      ALTER TABLE public.comments
        ADD CONSTRAINT comments_post_id_fkey
        FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Asegurarse de que user_id tiene FK a auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'comments' AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%user_id%'
  ) THEN
    BEGIN
      ALTER TABLE public.comments
        ADD CONSTRAINT comments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 3) INDICE para queries rapidas por post_id
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(post_id, created_at);

-- 4) FK IMPLICITA A PROFILES (necesaria para el JOIN profiles(full_name, avatar_url))
-- Supabase PostgREST detecta FKs para habilitar el embedding.
-- comments.user_id -> auth.users(id) ya existe arriba.
-- Pero el JOIN profiles(...) requiere que comments.user_id referencie profiles.id.
-- Si tu tabla profiles tiene PK = id (uuid) referenciando auth.users(id):
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'comments' AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'profiles'
  ) THEN
    BEGIN
      ALTER TABLE public.comments
        ADD CONSTRAINT comments_user_id_profiles_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 5) HABILITAR RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 6) BORRAR POLITICAS ANTIGUAS (por si existen rotas)
DROP POLICY IF EXISTS "comments_select_all"          ON public.comments;
DROP POLICY IF EXISTS "comments_insert_authenticated" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_own"           ON public.comments;
DROP POLICY IF EXISTS "Permitir lectura de comentarios" ON public.comments;
DROP POLICY IF EXISTS "Permitir insertar comentarios"   ON public.comments;
DROP POLICY IF EXISTS "Permitir borrar propios"         ON public.comments;

-- 7) CREAR POLITICAS RLS CORRECTAS

-- Cualquiera puede LEER comentarios (incluso sin auth para SSR)
CREATE POLICY "comments_select_all"
  ON public.comments
  FOR SELECT
  USING (true);

-- Usuarios autenticados pueden INSERTAR comentarios (solo como ellos mismos)
CREATE POLICY "comments_insert_authenticated"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuarios solo pueden BORRAR sus propios comentarios
CREATE POLICY "comments_delete_own"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8) PERMITIR AL SERVICE ROLE BYPASEAR RLS (para la API route)
-- El service role ya bypasea RLS por defecto en Supabase.
-- Pero si por alguna razon se ha desactivado, forzarlo:
GRANT ALL ON public.comments TO service_role;
GRANT ALL ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;

-- 9) COLUMNA comments_count EN POSTS (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN comments_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 10) FUNCION RPC increment_comments_count
-- La API la llama despues de insertar un comentario.
CREATE OR REPLACE FUNCTION public.increment_comments_count(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = comments_count + 1
  WHERE id = p_post_id;
END;
$$;

-- Permitir que authenticated y service_role la llamen
GRANT EXECUTE ON FUNCTION public.increment_comments_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_comments_count(uuid) TO service_role;

-- 10b) FUNCION RPC decrement_comments_count
-- La API la llama despues de borrar un comentario.
CREATE OR REPLACE FUNCTION public.decrement_comments_count(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_comments_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_comments_count(uuid) TO service_role;

-- 11) VERIFICACION: comprobar que todo esta bien
-- Ejecuta esto despues para confirmar:
SELECT
  'Table exists' AS check,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') AS result
UNION ALL
SELECT
  'RLS enabled',
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'comments' AND rowsecurity = true)
UNION ALL
SELECT
  'Insert policy exists',
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'comments' AND policyname = 'comments_insert_authenticated'
  )
UNION ALL
SELECT
  'FK to profiles exists',
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'comments' AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'profiles'
  )
UNION ALL
SELECT
  'RPC exists',
  EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'increment_comments_count'
  );
