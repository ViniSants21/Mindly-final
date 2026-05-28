-- =====================================================================
--  MINDLY — Migration: Sistema de Conquistas + Estatísticas Reais
--  Execute este arquivo no SQL Editor do Supabase (Dashboard > SQL Editor)
-- =====================================================================

-- =====================================================================
--  1. check_and_unlock_achievements
--     Verifica quantos desafios o usuário concluiu e desbloqueia
--     automaticamente as conquistas cujo required_challenges foi atingido.
--     Creditando reward_coins ao perfil e retornando o que foi desbloqueado.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_completed_count integer;
  v_achievement     RECORD;
  v_newly_unlocked  jsonb := '[]'::jsonb;
  v_reward_total    integer := 0;
BEGIN
  SELECT COUNT(*) INTO v_completed_count
  FROM public.user_challenges
  WHERE user_id = p_user_id AND progress >= 100;

  FOR v_achievement IN
    SELECT a.id, a.title, a.description, a.reward_coins
    FROM public.achievements a
    WHERE a.required_challenges <= v_completed_count
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
      )
    ORDER BY a.id
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (p_user_id, v_achievement.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;

    v_reward_total   := v_reward_total + v_achievement.reward_coins;
    v_newly_unlocked := v_newly_unlocked || jsonb_build_array(
      jsonb_build_object(
        'id',          v_achievement.id,
        'title',       v_achievement.title,
        'description', v_achievement.description,
        'reward_coins',v_achievement.reward_coins
      )
    );
  END LOOP;

  IF v_reward_total > 0 THEN
    UPDATE public.profiles
    SET coins = coins + v_reward_total
    WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'unlocked',         v_newly_unlocked,
    'completed_count',  v_completed_count,
    'coins_earned',     v_reward_total
  );
END;
$$;

-- =====================================================================
--  2. increment_challenge_progress  (substitui a versão anterior)
--     Agora retorna jsonb em vez de integer, incluindo conquistas
--     desbloqueadas nesta jogada.
--     ATENÇÃO: o tipo de retorno mudou — precisamos dropar antes.
-- =====================================================================
DROP FUNCTION IF EXISTS public.increment_challenge_progress(uuid, uuid, integer);

CREATE FUNCTION public.increment_challenge_progress(
  p_user_id    uuid,
  p_challenge_id uuid,
  p_amount     integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_progress integer;
  v_ach_result   jsonb;
BEGIN
  INSERT INTO public.user_challenges (user_id, challenge_id, progress)
  VALUES (p_user_id, p_challenge_id, least(p_amount, 100))
  ON CONFLICT (user_id, challenge_id) DO UPDATE
    SET progress     = least(public.user_challenges.progress + p_amount, 100),
        completed_at = CASE
          WHEN least(public.user_challenges.progress + p_amount, 100) >= 100
          THEN COALESCE(public.user_challenges.completed_at, now())
          ELSE public.user_challenges.completed_at
        END
  RETURNING progress INTO v_new_progress;

  v_ach_result := public.check_and_unlock_achievements(p_user_id);

  RETURN jsonb_build_object(
    'progress',        v_new_progress,
    'newly_unlocked',  v_ach_result->'unlocked',
    'coins_earned',    (v_ach_result->>'coins_earned')::integer
  );
END;
$$;

-- =====================================================================
--  3. get_user_stats
--     Retorna estatísticas reais do usuário para a página de Desempenho.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile          RECORD;
  v_completed        integer := 0;
  v_in_progress      integer := 0;
  v_total            integer := 0;
  v_achievements     integer := 0;
  v_days_week        integer := 0;
  v_days_month       integer := 0;
  v_completion_rate  integer := 0;
BEGIN
  SELECT coins, xp, level, streak
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  SELECT
    COUNT(*) FILTER (WHERE progress >= 100),
    COUNT(*) FILTER (WHERE progress BETWEEN 1 AND 99),
    COUNT(*)
  INTO v_completed, v_in_progress, v_total
  FROM public.user_challenges
  WHERE user_id = p_user_id;

  SELECT COUNT(*)
  INTO v_achievements
  FROM public.user_achievements
  WHERE user_id = p_user_id;

  SELECT COUNT(DISTINCT date)
  INTO v_days_week
  FROM public.study_blocks
  WHERE user_id = p_user_id
    AND date >= date_trunc('week', CURRENT_DATE)::date
    AND date <= CURRENT_DATE;

  SELECT COUNT(DISTINCT date)
  INTO v_days_month
  FROM public.study_blocks
  WHERE user_id = p_user_id
    AND date >= date_trunc('month', CURRENT_DATE)::date
    AND date <= CURRENT_DATE;

  IF v_total > 0 THEN
    v_completion_rate := ROUND((v_completed::numeric / v_total) * 100);
  END IF;

  RETURN jsonb_build_object(
    'coins',                  COALESCE(v_profile.coins, 0),
    'xp',                     COALESCE(v_profile.xp, 0),
    'level',                  COALESCE(v_profile.level, 1),
    'streak',                 COALESCE(v_profile.streak, 0),
    'completed_challenges',   COALESCE(v_completed, 0),
    'in_progress_challenges', COALESCE(v_in_progress, 0),
    'total_challenges',       COALESCE(v_total, 0),
    'completion_rate',        COALESCE(v_completion_rate, 0),
    'unlocked_achievements',  COALESCE(v_achievements, 0),
    'study_days_this_week',   COALESCE(v_days_week, 0),
    'study_days_this_month',  COALESCE(v_days_month, 0)
  );
END;
$$;

-- =====================================================================
--  4. Retroativo: desbloqueia conquistas para usuários existentes
--     que já completaram desafios antes desta migração.
-- =====================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.user_challenges WHERE progress >= 100 LOOP
    PERFORM public.check_and_unlock_achievements(r.user_id);
  END LOOP;
END;
$$;
