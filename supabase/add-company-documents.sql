-- ============================================================
-- Ethiqia: Tabla company_documents + bucket company-docs
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1) Crear tabla company_documents
CREATE TABLE IF NOT EXISTS public.company_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_handle text NOT NULL,
  name        text NOT NULL,
  file_url    text,
  doc_type    text NOT NULL DEFAULT 'certificacion',
  verified    boolean NOT NULL DEFAULT false,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_docs_handle ON public.company_documents(company_handle);

-- 2) RLS
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_docs_select_all" ON public.company_documents;
CREATE POLICY "company_docs_select_all"
  ON public.company_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "company_docs_insert_auth" ON public.company_documents;
CREATE POLICY "company_docs_insert_auth"
  ON public.company_documents FOR INSERT TO authenticated
  WITH CHECK (true);

GRANT ALL ON public.company_documents TO service_role;
GRANT ALL ON public.company_documents TO authenticated;
GRANT SELECT ON public.company_documents TO anon;

-- 3) Bucket company-docs en Storage
-- NOTA: los buckets se crean desde el Dashboard de Supabase:
-- Storage > New Bucket > "company-docs" > Public
-- O ejecutar esto (puede fallar si ya existe):
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-docs', 'company-docs', true)
ON CONFLICT (id) DO NOTHING;

-- 4) Verificacion
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'company_documents' ORDER BY ordinal_position;
