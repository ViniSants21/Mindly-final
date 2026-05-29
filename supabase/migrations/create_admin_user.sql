-- =====================================================================
--  MINDLY — Criar usuário administrador
--
--  EXECUTE EM DOIS PASSOS:
--    Passo 1 → Crie a conta no Supabase Dashboard  (instruções abaixo)
--    Passo 2 → Cole e execute este SQL para conceder role = 'admin'
--
-- =====================================================================
-- ═════════════════════════════════════════════════════════════════════
--  PASSO 1 — Criar a conta pelo Supabase Dashboard
--  (não é possível criar usuário com senha via SQL simples)
--
--  1. Acesse: https://supabase.com/dashboard
--  2. Selecione seu projeto
--  3. Menu lateral: Authentication → Users
--  4. Clique em "Add user" → "Create new user"
--  5. Preencha:
--       Email:  admin@mindly.com
--       Password: Mindly@Admin2025
--       ✅ Auto Confirm User (marque esta opção)
--  6. Clique em "Create User"
--  7. Copie o UUID gerado — você vai precisar dele abaixo
--
-- ═════════════════════════════════════════════════════════════════════

-- ═════════════════════════════════════════════════════════════════════
--  PASSO 2 — Conceder permissão admin pelo email
--  Execute no SQL Editor do Supabase após criar o usuário acima.
-- ═════════════════════════════════════════════════════════════════════

-- 2A. Promover o usuário pelo email (mais simples — não precisa do UUID)
UPDATE public.profiles
SET
  role   = 'admin',
  name   = COALESCE(NULLIF(name, ''), 'Administrador'),
  status = 'Ativo'
WHERE email = 'admin@mindly.com';

-- Verificar se funcionou:
SELECT id, email, name, role, status
FROM public.profiles
WHERE email = 'admin@mindly.com';

-- ─────────────────────────────────────────────────────────────────────
-- Caso o perfil ainda não exista (trigger pode demorar alguns segundos),
-- aguarde 5 segundos após criar o usuário e execute o UPDATE acima.
-- Se ainda assim não encontrar, crie o perfil manualmente:
-- ─────────────────────────────────────────────────────────────────────
/*
INSERT INTO public.profiles (id, email, name, role, status)
SELECT
  id,
  email,
  'Administrador',
  'admin',
  'Ativo'
FROM auth.users
WHERE email = 'admin@mindly.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'admin', name = COALESCE(NULLIF(profiles.name, ''), 'Administrador');
*/

-- ═════════════════════════════════════════════════════════════════════
--  OPCIONAL — Atualizar o trigger para que qualquer cadastro com
--  este email já entre automaticamente como admin no futuro
-- ═════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    CASE
      WHEN new.email IN ('vitoraugusto1079@gmail.com', 'admin@mindly.com')
      THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- ═════════════════════════════════════════════════════════════════════
--  VERIFICAÇÃO FINAL — confirmar que o admin está correto
-- ═════════════════════════════════════════════════════════════════════
SELECT
  p.id,
  p.email,
  p.name,
  p.role,
  p.status,
  p.coins,
  p.xp
FROM public.profiles p
WHERE p.role = 'admin'
ORDER BY p.created_at;
