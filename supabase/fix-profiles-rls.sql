-- ============================================================
-- Ethiqia: Fix RLS profiles - permitir UPDATE propio
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1) Ver policies actuales
SELECT policyname, cmd, qual, with_check
FROM pg_policies WHERE tablename = 'profiles';

-- 2) Asegurar que RLS esta habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) Crear policies si no existen

-- SELECT: todos pueden leer perfiles
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT USING (true);

-- UPDATE: usuarios autenticados pueden actualizar su propio perfil
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: para cuando Supabase crea el perfil automaticamente
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Grants
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- 4) Verificar
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
