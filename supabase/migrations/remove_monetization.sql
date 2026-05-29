-- =====================================================================
--  MINDLY — Remover tabelas de monetização
--  Execute no SQL Editor do Supabase (Dashboard > SQL Editor > New query)
--  Idempotente: pode rodar mais de uma vez sem erro.
-- =====================================================================

-- =====================================================================
--  1. Remover tabela de receita mensal (usada apenas no gráfico do admin)
-- =====================================================================
DROP TABLE IF EXISTS public.revenue CASCADE;

-- =====================================================================
--  2. Remover tabela de planos (usada apenas na seção de preços)
-- =====================================================================
DROP TABLE IF EXISTS public.plans CASCADE;

-- =====================================================================
--  3. Remover coluna 'plan' da tabela profiles
--     (era usada para indicar Grátis / Premium / Institucional)
-- =====================================================================
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS plan;

-- =====================================================================
--  4. Atualizar a função admin_dashboard_stats para não referenciar
--     a tabela revenue (que foi removida)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT json_build_object(
    'total_users',      (SELECT COUNT(*) FROM public.profiles),
    'active_challenges',(SELECT COUNT(*) FROM public.challenges WHERE status = 'Ativo'),
    'open_tickets',     (SELECT COUNT(*) FROM public.tickets   WHERE status = 'Aberto')
  );
$$;

-- =====================================================================
--  5. Verificação final
-- =====================================================================
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('plans', 'revenue')
ORDER BY table_name;
-- Se a query retornar linhas vazias, as tabelas foram removidas com sucesso.
