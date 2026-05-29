-- =====================================================================
--  MINDLY — Estatísticas completas para o painel admin
--  Execute no SQL Editor do Supabase (Dashboard > SQL Editor > New query)
-- =====================================================================

-- =====================================================================
--  1. admin_full_stats — retorna todos os indicadores do dashboard
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_full_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_users         bigint;
  v_active_users        bigint;
  v_new_users_month     bigint;
  v_total_admins        bigint;
  v_total_xp            bigint;
  v_avg_xp              integer;
  v_top_user            jsonb;
  v_total_challenges    bigint;
  v_active_challenges   bigint;
  v_completed_uc        bigint;
  v_inprogress_uc       bigint;
  v_completion_rate     integer;
  v_total_questions     bigint;
  v_total_achievements  bigint;
  v_unlocked_ach        bigint;
  v_open_tickets        bigint;
  v_total_tickets       bigint;
  v_level_dist          jsonb;
  v_monthly_users       jsonb;
BEGIN
  -- Usuários
  SELECT COUNT(*)                                           INTO v_total_users        FROM public.profiles;
  SELECT COUNT(*) FILTER (WHERE status = 'Ativo')          INTO v_active_users       FROM public.profiles;
  SELECT COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE))
                                                            INTO v_new_users_month    FROM public.profiles;
  SELECT COUNT(*) FILTER (WHERE role = 'admin')            INTO v_total_admins       FROM public.profiles;
  SELECT COALESCE(SUM(xp), 0)                              INTO v_total_xp           FROM public.profiles;
  SELECT COALESCE(AVG(xp), 0)::integer                     INTO v_avg_xp             FROM public.profiles;

  SELECT jsonb_build_object('name', name, 'xp', xp, 'level', level)
  INTO v_top_user
  FROM public.profiles ORDER BY xp DESC LIMIT 1;

  -- Desafios
  SELECT COUNT(*)                               INTO v_total_challenges  FROM public.challenges;
  SELECT COUNT(*) FILTER (WHERE status='Ativo') INTO v_active_challenges FROM public.challenges;
  SELECT COUNT(*) FILTER (WHERE progress >= 100) INTO v_completed_uc    FROM public.user_challenges;
  SELECT COUNT(*) FILTER (WHERE progress > 0 AND progress < 100)
                                                 INTO v_inprogress_uc   FROM public.user_challenges;
  IF (v_completed_uc + v_inprogress_uc) > 0 THEN
    v_completion_rate := ROUND(v_completed_uc::numeric / (v_completed_uc + v_inprogress_uc) * 100);
  ELSE
    v_completion_rate := 0;
  END IF;

  -- Perguntas
  SELECT COUNT(*) INTO v_total_questions FROM public.challenge_questions;

  -- Conquistas
  SELECT COUNT(*) INTO v_total_achievements FROM public.achievements;
  SELECT COUNT(*) INTO v_unlocked_ach       FROM public.user_achievements;

  -- Tickets
  SELECT COUNT(*) FILTER (WHERE status='Aberto')    INTO v_open_tickets  FROM public.tickets;
  SELECT COUNT(*)                                    INTO v_total_tickets FROM public.tickets;

  -- Distribuição de níveis (top 7)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('level', level, 'count', cnt) ORDER BY level
  ), '[]'::jsonb)
  INTO v_level_dist
  FROM (
    SELECT level, COUNT(*) AS cnt
    FROM public.profiles
    GROUP BY level
    ORDER BY level
    LIMIT 7
  ) t;

  -- Novos usuários por mês (últimos 6 meses)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('month', month_label, 'count', cnt) ORDER BY dt
  ), '[]'::jsonb)
  INTO v_monthly_users
  FROM (
    SELECT
      to_char(date_trunc('month', created_at), 'Mon/YY') AS month_label,
      date_trunc('month', created_at)                     AS dt,
      COUNT(*)                                            AS cnt
    FROM public.profiles
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY date_trunc('month', created_at)
    ORDER BY dt
  ) t;

  RETURN jsonb_build_object(
    'total_users',          v_total_users,
    'active_users',         v_active_users,
    'new_users_month',      v_new_users_month,
    'total_admins',         v_total_admins,
    'total_xp',             v_total_xp,
    'avg_xp',               v_avg_xp,
    'top_user',             v_top_user,
    'total_challenges',     v_total_challenges,
    'active_challenges',    v_active_challenges,
    'completed_challenges', v_completed_uc,
    'inprogress_challenges',v_inprogress_uc,
    'completion_rate',      v_completion_rate,
    'total_questions',      v_total_questions,
    'total_achievements',   v_total_achievements,
    'unlocked_achievements',v_unlocked_ach,
    'open_tickets',         v_open_tickets,
    'total_tickets',        v_total_tickets,
    'level_distribution',   v_level_dist,
    'monthly_users',        v_monthly_users
  );
END;
$$;

-- =====================================================================
--  2. get_admin_activity — atividade recente para o feed do dashboard
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_admin_activity(p_limit integer DEFAULT 8)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'recent_users', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id, 'name', name, 'email', email,
          'xp', xp, 'level', level, 'created_at', created_at
        ) ORDER BY created_at DESC
      ), '[]'::jsonb)
      FROM (SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT p_limit) t
    ),

    'recent_completions', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'user_name',       p.name,
          'challenge_title', c.title,
          'completed_at',    uc.completed_at
        ) ORDER BY uc.completed_at DESC
      ), '[]'::jsonb)
      FROM (
        SELECT * FROM public.user_challenges
        WHERE completed_at IS NOT NULL
        ORDER BY completed_at DESC
        LIMIT p_limit
      ) uc
      JOIN public.profiles   p ON p.id = uc.user_id
      JOIN public.challenges c ON c.id = uc.challenge_id
    ),

    'recent_achievements', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'user_name',         p.name,
          'achievement_title', a.title,
          'reward_coins',      a.reward_coins,
          'unlocked_at',       ua.unlocked_at
        ) ORDER BY ua.unlocked_at DESC
      ), '[]'::jsonb)
      FROM (
        SELECT * FROM public.user_achievements
        ORDER BY unlocked_at DESC
        LIMIT p_limit
      ) ua
      JOIN public.profiles    p ON p.id = ua.user_id
      JOIN public.achievements a ON a.id = ua.achievement_id
    )
  );
END;
$$;

-- =====================================================================
--  3. Atualiza admin_dashboard_stats para compatibilidade retroativa
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT json_build_object(
    'total_users',       (SELECT COUNT(*) FROM public.profiles),
    'active_challenges', (SELECT COUNT(*) FROM public.challenges WHERE status = 'Ativo'),
    'open_tickets',      (SELECT COUNT(*) FROM public.tickets   WHERE status = 'Aberto')
  );
$$;
