-- ==========================================================================
-- MINDLY — Pacote de Correções 2026-06-01
-- Execute todo este arquivo no Supabase SQL Editor (uma única vez).
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. CONSTRAINT UNIQUE em study_blocks — impede duplicata de horário
--    (mesmo usuário, mesma data, mesmo time)
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'study_blocks_user_date_time_unique'
  ) THEN
    ALTER TABLE study_blocks
      ADD CONSTRAINT study_blocks_user_date_time_unique
      UNIQUE (user_id, date, time);
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 2. FUNÇÃO + RPC  add_learning_xp
--    Chamada pelo frontend ao concluir uma etapa da Trilha de Aprendizagem.
--    Incrementa XP no perfil e recalcula o nível de forma atômica.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION add_learning_xp(p_user_id uuid, p_xp int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_xp  int;
  v_new_lvl int;
BEGIN
  UPDATE profiles
     SET xp    = COALESCE(xp, 0) + p_xp
   WHERE id = p_user_id
  RETURNING xp INTO v_new_xp;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Recalcula nível: cada 100 XP sobe um nível (mínimo 1)
  v_new_lvl := GREATEST(1, FLOOR(v_new_xp / 100) + 1);

  UPDATE profiles
     SET level = v_new_lvl
   WHERE id = p_user_id;
END;
$$;

-- Garante que usuários autenticados possam chamar a função
GRANT EXECUTE ON FUNCTION add_learning_xp(uuid, int) TO authenticated;

-- --------------------------------------------------------------------------
-- 3. TABELA learning_modules — módulos de trilha gerenciados pelo Admin
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_modules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          text        NOT NULL,
  nivel           text        NOT NULL DEFAULT 'Fácil'
                              CHECK (nivel IN ('Fácil', 'Médio', 'Avançado')),
  tempo           text        NOT NULL DEFAULT '30 min',
  xp              int         NOT NULL DEFAULT 50,
  icon            text        NOT NULL DEFAULT 'brain',
  conteudo        text        NOT NULL DEFAULT '',
  curiosidade     text,
  exemplo_pratico text,
  dica            text,
  position        int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Índice para ordenação por posição
CREATE INDEX IF NOT EXISTS idx_learning_modules_position
  ON learning_modules (position);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_learning_modules_updated_at ON learning_modules;
CREATE TRIGGER trg_learning_modules_updated_at
  BEFORE UPDATE ON learning_modules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- 4. RLS em learning_modules
-- --------------------------------------------------------------------------
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode LER
DROP POLICY IF EXISTS "learning_modules_select" ON learning_modules;
CREATE POLICY "learning_modules_select"
  ON learning_modules FOR SELECT
  TO authenticated
  USING (true);

-- Somente administradores podem INSERT / UPDATE / DELETE
DROP POLICY IF EXISTS "learning_modules_insert" ON learning_modules;
CREATE POLICY "learning_modules_insert"
  ON learning_modules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "learning_modules_update" ON learning_modules;
CREATE POLICY "learning_modules_update"
  ON learning_modules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "learning_modules_delete" ON learning_modules;
CREATE POLICY "learning_modules_delete"
  ON learning_modules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- --------------------------------------------------------------------------
-- 5. RLS em challenges — garante que admin possa criar/editar/apagar
-- --------------------------------------------------------------------------
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados leem desafios ativos
DROP POLICY IF EXISTS "challenges_select" ON challenges;
CREATE POLICY "challenges_select"
  ON challenges FOR SELECT
  TO authenticated
  USING (true);

-- Admin pode INSERT
DROP POLICY IF EXISTS "challenges_insert" ON challenges;
CREATE POLICY "challenges_insert"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode UPDATE
DROP POLICY IF EXISTS "challenges_update" ON challenges;
CREATE POLICY "challenges_update"
  ON challenges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode DELETE
DROP POLICY IF EXISTS "challenges_delete" ON challenges;
CREATE POLICY "challenges_delete"
  ON challenges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- --------------------------------------------------------------------------
-- 6. RLS em challenge_questions — admin gerencia, todos leem
-- --------------------------------------------------------------------------
ALTER TABLE challenge_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cq_select" ON challenge_questions;
CREATE POLICY "cq_select"
  ON challenge_questions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "cq_insert" ON challenge_questions;
CREATE POLICY "cq_insert"
  ON challenge_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "cq_update" ON challenge_questions;
CREATE POLICY "cq_update"
  ON challenge_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "cq_delete" ON challenge_questions;
CREATE POLICY "cq_delete"
  ON challenge_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- --------------------------------------------------------------------------
-- 7. Garantir que challenge_questions.id seja gerado automaticamente (UUID)
--    Se a coluna já for uuid com default, o comando é ignorado.
-- --------------------------------------------------------------------------
DO $$
BEGIN
  -- Só executa se a coluna id não tiver um default definido
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'challenge_questions'
      AND column_name = 'id'
      AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE challenge_questions
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 8. Verificação final — retorna a lista de tabelas afetadas
-- --------------------------------------------------------------------------
SELECT table_name, COUNT(*) AS policies
FROM information_schema.table_privileges
WHERE grantee = 'authenticated'
  AND table_name IN ('study_blocks','challenges','challenge_questions','learning_modules','learning_progress','profiles')
GROUP BY table_name
ORDER BY table_name;
