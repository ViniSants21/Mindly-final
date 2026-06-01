-- ==========================================================================
-- MINDLY — Sistema de Recompensas Funcionais
-- Execute no Supabase SQL Editor (uma única vez).
--
-- O que este arquivo faz:
--  1. Adiciona colunas de estado de boost ao profiles
--  2. Adiciona hint_text à challenge_questions
--  3. Adiciona coluna consumable à rewards e atualiza seed
--  4. RPC activate_consumable  — ativa Dobra XP / Proteção / Dica
--  5. RPC use_hint             — consome 1 dica do inventário
--  6. RPC deduct_xp_on_wrong   — desconta 10 XP no erro (se sem escudo)
--  7. Atualiza increment_challenge_progress — XP real + multiplicador
--  8. Atualiza add_learning_xp             — respeita multiplicador
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. PROFILES — novas colunas de estado de boost
-- --------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp_boost_expires_at   timestamptz,
  ADD COLUMN IF NOT EXISTS xp_shield_expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS hints_count           integer NOT NULL DEFAULT 0;

-- --------------------------------------------------------------------------
-- 2. CHALLENGE_QUESTIONS — coluna de dica por pergunta
-- --------------------------------------------------------------------------
ALTER TABLE public.challenge_questions
  ADD COLUMN IF NOT EXISTS hint_text text;

-- --------------------------------------------------------------------------
-- 3. REWARDS — marcar consumíveis, desbloquear Dobra XP e Proteção
-- --------------------------------------------------------------------------
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS consumable boolean NOT NULL DEFAULT false;

-- Dica: consumível (já estava desbloqueada)
UPDATE public.rewards SET consumable = true WHERE name = 'Dica';

-- Dobra XP e Proteção: desbloquear + marcar como consumíveis
UPDATE public.rewards
  SET locked = false, consumable = true
  WHERE name IN ('Dobra XP', 'Proteção');

-- --------------------------------------------------------------------------
-- 4. RPC: activate_consumable
--    Ativa a recompensa consumível escolhida:
--    • 'Dobra XP'  → seta xp_boost_expires_at = now() + 20 min
--    • 'Proteção'  → seta xp_shield_expires_at = now() + 20 min
--    • 'Dica'      → incrementa hints_count
--    Debita as moedas do perfil.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_consumable(
  p_user_id  uuid,
  p_reward_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_reward   RECORD;
  v_coins    integer;
BEGIN
  -- Busca a recompensa
  SELECT name, category, price, consumable, locked
    INTO v_reward
    FROM rewards WHERE id = p_reward_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Recompensa não encontrada.');
  END IF;

  IF v_reward.locked THEN
    RETURN jsonb_build_object('success', false, 'message', '🔒 Recompensa bloqueada.');
  END IF;

  IF NOT v_reward.consumable THEN
    RETURN jsonb_build_object('success', false, 'message', 'Use o botão de compra padrão para este item.');
  END IF;

  -- Verifica saldo
  SELECT coins INTO v_coins FROM profiles WHERE id = p_user_id;
  IF v_coins < v_reward.price THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Moedas insuficientes. Você tem %s moedas.', v_coins)
    );
  END IF;

  -- Debita moedas
  UPDATE profiles SET coins = coins - v_reward.price WHERE id = p_user_id;
  v_coins := v_coins - v_reward.price;

  -- Aplica efeito conforme o nome da recompensa
  IF v_reward.name ILIKE '%Dobra%' OR v_reward.name ILIKE '%XP%' THEN
    UPDATE profiles
      SET xp_boost_expires_at = now() + interval '20 minutes'
      WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success',     true,
      'message',     '⚡ Dobra XP ativado por 20 minutos!',
      'type',        'xp_boost',
      'expires_at',  (now() + interval '20 minutes')::text,
      'coins',       v_coins
    );
  ELSIF v_reward.name ILIKE '%Prote%' THEN
    UPDATE profiles
      SET xp_shield_expires_at = now() + interval '20 minutes'
      WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success',     true,
      'message',     '🛡️ Proteção de XP ativada por 20 minutos!',
      'type',        'xp_shield',
      'expires_at',  (now() + interval '20 minutes')::text,
      'coins',       v_coins
    );
  ELSIF v_reward.category = 'Dicas' THEN
    UPDATE profiles
      SET hints_count = hints_count + 1
      WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success',      true,
      'message',      '💡 Dica adicionada ao seu inventário!',
      'type',         'hint',
      'hints_count',  (SELECT hints_count FROM profiles WHERE id = p_user_id),
      'coins',        v_coins
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'message', 'Tipo de recompensa não reconhecido.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_consumable(uuid, uuid) TO authenticated;

-- --------------------------------------------------------------------------
-- 5. RPC: use_hint
--    Consome 1 dica do inventário do usuário.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.use_hint(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT hints_count INTO v_count FROM profiles WHERE id = p_user_id;

  IF v_count IS NULL OR v_count <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você não tem dicas disponíveis.');
  END IF;

  UPDATE profiles SET hints_count = hints_count - 1 WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success',         true,
    'hints_remaining', v_count - 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_hint(uuid) TO authenticated;

-- --------------------------------------------------------------------------
-- 6. RPC: deduct_xp_on_wrong
--    Desconta 10 XP ao errar uma pergunta.
--    Se xp_shield_expires_at ainda não expirou → não desconta.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_xp_on_wrong(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_shield_active boolean := false;
  v_new_xp        integer;
  v_new_level     integer;
BEGIN
  SELECT (xp_shield_expires_at IS NOT NULL AND xp_shield_expires_at > now())
    INTO v_shield_active
    FROM profiles WHERE id = p_user_id;

  IF v_shield_active THEN
    SELECT xp INTO v_new_xp FROM profiles WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'xp_lost',      0,
      'shield_active', true,
      'new_xp',        v_new_xp
    );
  END IF;

  -- Desconta 10 XP (mínimo 0)
  UPDATE profiles
    SET xp    = GREATEST(0, COALESCE(xp, 0) - 10),
        level = GREATEST(1, FLOOR(GREATEST(0, COALESCE(xp, 0) - 10) / 100) + 1)
    WHERE id = p_user_id
    RETURNING xp INTO v_new_xp;

  RETURN jsonb_build_object(
    'xp_lost',       10,
    'shield_active', false,
    'new_xp',        v_new_xp
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_xp_on_wrong(uuid) TO authenticated;

-- --------------------------------------------------------------------------
-- 7. increment_challenge_progress — adiciona XP real + respeita multiplicador
--    Substitui a versão de achievements_stats.sql.
--    ATENÇÃO: tipo de retorno permanece jsonb (sem DROP necessário).
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_challenge_progress(
  p_user_id      uuid,
  p_challenge_id uuid,
  p_amount       integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_progress integer;
  v_ach_result   jsonb;
  v_multiplier   integer := 1;
  v_xp_gain      integer;
BEGIN
  -- Verifica se o boost de XP está ativo
  SELECT CASE WHEN xp_boost_expires_at IS NOT NULL AND xp_boost_expires_at > now()
              THEN 2 ELSE 1 END
    INTO v_multiplier
    FROM profiles WHERE id = p_user_id;

  v_xp_gain := p_amount * v_multiplier;

  -- Atualiza progresso do desafio (0–100)
  INSERT INTO user_challenges (user_id, challenge_id, progress)
    VALUES (p_user_id, p_challenge_id, least(p_amount, 100))
  ON CONFLICT (user_id, challenge_id) DO UPDATE
    SET progress     = least(user_challenges.progress + p_amount, 100),
        completed_at = CASE
          WHEN least(user_challenges.progress + p_amount, 100) >= 100
          THEN COALESCE(user_challenges.completed_at, now())
          ELSE user_challenges.completed_at END
  RETURNING progress INTO v_new_progress;

  -- Adiciona XP ao perfil (com multiplicador) e recalcula nível
  UPDATE profiles
    SET xp    = COALESCE(xp, 0) + v_xp_gain,
        level = GREATEST(1, FLOOR((COALESCE(xp, 0) + v_xp_gain) / 100) + 1)
    WHERE id = p_user_id;

  -- Verifica conquistas desbloqueadas
  v_ach_result := check_and_unlock_achievements(p_user_id);

  RETURN jsonb_build_object(
    'progress',        v_new_progress,
    'newly_unlocked',  v_ach_result->'unlocked',
    'coins_earned',    (v_ach_result->>'coins_earned')::integer,
    'xp_gained',       v_xp_gain,
    'xp_multiplier',   v_multiplier
  );
END;
$$;

-- --------------------------------------------------------------------------
-- 8. add_learning_xp — respeita multiplicador de Dobra XP
--    Substitui versão de 2026_migrate_learning_modules.sql.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_learning_xp(p_user_id uuid, p_xp int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_multiplier integer := 1;
  v_new_xp     int;
  v_new_lvl    int;
BEGIN
  SELECT CASE WHEN xp_boost_expires_at IS NOT NULL AND xp_boost_expires_at > now()
              THEN 2 ELSE 1 END
    INTO v_multiplier
    FROM profiles WHERE id = p_user_id;

  UPDATE profiles
    SET xp = COALESCE(xp, 0) + (p_xp * v_multiplier)
    WHERE id = p_user_id
    RETURNING xp INTO v_new_xp;

  IF NOT FOUND THEN RETURN; END IF;

  v_new_lvl := GREATEST(1, FLOOR(v_new_xp / 100) + 1);
  UPDATE profiles SET level = v_new_lvl WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_learning_xp(uuid, int) TO authenticated;

-- --------------------------------------------------------------------------
-- 9. Verificação final
-- --------------------------------------------------------------------------
SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'profiles'
    AND column_name  IN ('xp_boost_expires_at','xp_shield_expires_at','hints_count');

SELECT name, category, price, locked, consumable FROM public.rewards ORDER BY price;
