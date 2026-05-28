-- =====================================================================
--  MINDLY — Script de diagnóstico e correção do Planner
--  Cole no Supabase Dashboard > SQL Editor > New query e clique em RUN
-- =====================================================================

-- 1. Verifica se a tabela study_blocks existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND   table_name   = 'study_blocks'
) AS tabela_existe;

-- 2. Verifica se a tabela profiles existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND   table_name   = 'profiles'
) AS profiles_existe;

-- 3. Verifica se há perfis criados
SELECT COUNT(*) AS total_perfis FROM public.profiles;

-- 4. Lista usuários auth que NÃO têm perfil correspondente (deveria retornar 0 linhas)
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 5. Cria perfis faltantes para usuários que não têm (corrige o FK faltante)
INSERT INTO public.profiles (id, email, name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)),
  CASE WHEN u.email = 'vitoraugusto1079@gmail.com' THEN 'admin' ELSE 'user' END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 6. Garante que a tabela study_blocks existe com a estrutura correta
CREATE TABLE IF NOT EXISTS public.study_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  time        text not null,
  subject     text not null,
  color       text not null default '#3b82f6',
  created_at  timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_study_blocks_user_date
  ON public.study_blocks(user_id, date);

-- 7. Garante que o RLS está habilitado
ALTER TABLE public.study_blocks ENABLE ROW LEVEL SECURITY;

-- 8. Recria a policy do Planner (garante que está correta)
DROP POLICY IF EXISTS "study_blocks_owner_all" ON public.study_blocks;
CREATE POLICY "study_blocks_owner_all" ON public.study_blocks
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 9. Confirma as policies da tabela
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'study_blocks';

-- 10. Testa leitura e escrita como o usuário logado (deve retornar sem erro)
SELECT COUNT(*) AS blocos_meus FROM public.study_blocks;

-- =====================================================================
-- Se o passo 4 retornou linhas, o passo 5 criou os perfis faltantes.
-- Se a tabela não existia, ela foi criada nos passos 6 e 7.
-- Execute este script sempre que suspeitar de problema no banco.
-- =====================================================================
