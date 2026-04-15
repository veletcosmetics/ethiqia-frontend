-- ============================================================
-- Ethiqia: Trigger para crear fila en profiles al registrar usuario
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Funcion que crea un row en profiles cuando se registra un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, onboarding_completed)
  VALUES (NEW.id, '', null, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Crear rows para usuarios existentes que no tengan profiles
INSERT INTO public.profiles (id, full_name, onboarding_completed)
SELECT id, '', false FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT count(*) AS profiles_count FROM public.profiles;
SELECT count(*) AS users_count FROM auth.users;
