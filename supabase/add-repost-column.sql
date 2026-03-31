-- Añadir columna repost_of a la tabla posts
-- Ejecutar en Supabase SQL Editor

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'repost_of') THEN
    ALTER TABLE public.posts ADD COLUMN repost_of uuid REFERENCES public.posts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_repost_of ON public.posts(repost_of);

-- Verificacion
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'posts' AND column_name = 'repost_of';
