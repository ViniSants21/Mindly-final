-- ==========================================================================
-- MINDLY — Correção de RLS da tabela challenges  (re-execute se necessário)
-- Execute no Supabase SQL Editor.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. Remover TODAS as policies existentes em challenges para começar limpo
-- --------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'challenges'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.challenges', pol.policyname);
  END LOOP;
END $$;

-- --------------------------------------------------------------------------
-- 2. Garantir que RLS está habilitado
-- --------------------------------------------------------------------------
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- 3. Policies limpas — sem conflito, WITH CHECK explícito em todas
-- --------------------------------------------------------------------------

-- Qualquer usuário autenticado pode LER qualquer desafio (ativo ou suspenso)
CREATE POLICY "challenges_read_auth"
  ON public.challenges
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin pode INSERT com WITH CHECK explícito
CREATE POLICY "challenges_insert_admin"
  ON public.challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin pode UPDATE com USING + WITH CHECK explícitos
-- WITH CHECK explícito é obrigatório para garantir que a mudança para
-- 'Suspenso' seja aceita em todas as versões do PostgREST
CREATE POLICY "challenges_update_admin"
  ON public.challenges
  FOR UPDATE
  TO authenticated
  USING     (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin pode DELETE
CREATE POLICY "challenges_delete_admin"
  ON public.challenges
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- --------------------------------------------------------------------------
-- 4. Teste direto: tenta atualizar um desafio para 'Suspenso' e confirma
--    (substitua o UUID pelo ID real de um desafio no seu banco)
-- --------------------------------------------------------------------------
-- UPDATE public.challenges SET status = 'Suspenso'
-- WHERE id = 'SEU-UUID-AQUI';
-- SELECT id, title, status FROM public.challenges WHERE status = 'Suspenso';

-- --------------------------------------------------------------------------
-- 5. Verificação — lista as policies ativas
-- --------------------------------------------------------------------------
SELECT
  policyname,
  cmd        AS operation,
  permissive,
  qual       AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'challenges'
ORDER BY cmd, policyname;
