-- ============================================================
-- Ethiqia: Tabla company_tools para herramientas de empresas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1) Crear tabla
CREATE TABLE IF NOT EXISTS public.company_tools (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  text NOT NULL,
  tool_key    text NOT NULL,
  status      text NOT NULL DEFAULT 'declared',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, tool_key)
);

CREATE INDEX IF NOT EXISTS idx_company_tools_company ON public.company_tools(company_id);

-- 2) RLS
ALTER TABLE public.company_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_tools_select_all" ON public.company_tools;
CREATE POLICY "company_tools_select_all"
  ON public.company_tools FOR SELECT USING (true);

DROP POLICY IF EXISTS "company_tools_insert_auth" ON public.company_tools;
CREATE POLICY "company_tools_insert_auth"
  ON public.company_tools FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "company_tools_delete_auth" ON public.company_tools;
CREATE POLICY "company_tools_delete_auth"
  ON public.company_tools FOR DELETE TO authenticated USING (true);

GRANT ALL ON public.company_tools TO service_role;
GRANT ALL ON public.company_tools TO authenticated;
GRANT SELECT ON public.company_tools TO anon;

-- 3) Datos iniciales para Velet Cosmetics
INSERT INTO public.company_tools (company_id, tool_key, status) VALUES
  ('7c9071c5-1b04-4fd6-b0db-deb55dcdd145', 'prestashop', 'verified'),
  ('7c9071c5-1b04-4fd6-b0db-deb55dcdd145', 'cpnp', 'verified'),
  ('7c9071c5-1b04-4fd6-b0db-deb55dcdd145', 'fda', 'verified'),
  ('7c9071c5-1b04-4fd6-b0db-deb55dcdd145', 'ecoembes', 'declared'),
  ('7c9071c5-1b04-4fd6-b0db-deb55dcdd145', 'claude', 'declared'),
  ('7c9071c5-1b04-4fd6-b0db-deb55dcdd145', 'canva', 'declared'),
  ('7c9071c5-1b04-4fd6-b0db-deb55dcdd145', 'peta', 'declared'),
  ('7c9071c5-1b04-4fd6-b0db-deb55dcdd145', 'vegan_society', 'declared')
ON CONFLICT (company_id, tool_key) DO NOTHING;

-- 4) Verificacion
SELECT tool_key, status FROM public.company_tools
WHERE company_id = '7c9071c5-1b04-4fd6-b0db-deb55dcdd145'
ORDER BY status, tool_key;
