import { supabase } from "../lib/supabaseClient";

/**
 * Serviço de Trilha de Aprendizagem, Conquistas e Desempenho.
 */
export const progressService = {
  // ---- Trilha de Aprendizagem ----

  /** Lista os ids das etapas concluídas pelo usuário. */
  async listCompletedSteps(userId) {
    const { data, error } = await supabase
      .from("learning_progress")
      .select("step_id")
      .eq("user_id", userId);
    if (error) throw error;
    return data.map((r) => r.step_id);
  },

  /**
   * Marca uma etapa da trilha como concluída.
   * Se xpAmount > 0, incrementa o XP e recalcula o nível no perfil do usuário.
   */
  async completeStep(userId, stepId, xpAmount = 0) {
    const { error } = await supabase
      .from("learning_progress")
      .upsert(
        { user_id: userId, step_id: stepId },
        { onConflict: "user_id,step_id", ignoreDuplicates: true }
      );
    if (error) throw error;

    if (xpAmount > 0) {
      // Tenta usar a RPC para incrementar XP de forma atômica
      const { error: rpcErr } = await supabase.rpc("add_learning_xp", {
        p_user_id: userId,
        p_xp: xpAmount,
      });

      // Se a RPC não existir no banco, faz o cálculo no cliente como fallback
      if (rpcErr) {
        const { data: profile, error: pErr } = await supabase
          .from("profiles")
          .select("xp")
          .eq("id", userId)
          .single();

        if (!pErr && profile) {
          const newXp = (profile.xp || 0) + xpAmount;
          const newLevel = Math.max(1, Math.floor(newXp / 100) + 1);
          await supabase
            .from("profiles")
            .update({ xp: newXp, level: newLevel })
            .eq("id", userId);
        }
      }
    }
  },

  // ---- Conquistas ----

  /**
   * Catálogo de conquistas + flag se o usuário desbloqueou.
   * Inclui: unlocked, unlocked_at, current_progress (0–100 para
   * exibir barra de progresso nos cards bloqueados).
   */
  async listAchievements(userId) {
    /**
     * CORREÇÃO: a versão anterior usava embed de user_achievements sem filtro
     * de userId, trazendo registros de TODOS os usuários e filtrando em JS.
     * Nova abordagem: 3 queries paralelas, cada uma filtrada corretamente.
     */
    const [achResult, uaResult, countResult] = await Promise.all([
      supabase
        .from("achievements")
        .select("*")
        .order("id", { ascending: true }),
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", userId),
      supabase
        .from("user_challenges")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("progress", 100),
    ]);

    if (achResult.error) throw achResult.error;
    if (uaResult.error) throw uaResult.error;

    const completedCount = countResult.count || 0;
    const unlockedMap = new Map(
      (uaResult.data || []).map((u) => [u.achievement_id, u])
    );

    return (achResult.data || []).map((a) => {
      const userRecord = unlockedMap.get(a.id);
      const unlocked = !!userRecord;
      const progressPct = unlocked
        ? 100
        : Math.min(
            Math.round((completedCount / a.required_challenges) * 100),
            99
          );
      return {
        ...a,
        unlocked,
        unlocked_at: userRecord?.unlocked_at || null,
        current_challenges: Math.min(completedCount, a.required_challenges),
        progress_pct: progressPct,
      };
    });
  },

  /**
   * Verifica e desbloqueia conquistas retroativamente.
   * Útil ao carregar a página de Desempenho pela primeira vez,
   * garantindo que conquistas já merecidas sejam creditadas.
   * Retorna { unlocked, coins_earned } ou null em caso de erro.
   */
  async checkAchievements(userId) {
    const { data, error } = await supabase.rpc(
      "check_and_unlock_achievements",
      { p_user_id: userId }
    );
    if (error) {
      console.warn("checkAchievements:", error.message);
      return null;
    }
    return data;
  },

  // ---- Estatísticas de Desempenho ----

  /**
   * Retorna estatísticas reais do usuário para a página de Desempenho.
   * Chama a RPC get_user_stats que agrega dados de várias tabelas.
   */
  async getStats(userId) {
    const { data, error } = await supabase.rpc("get_user_stats", {
      p_user_id: userId,
    });
    if (error) throw error;
    return data;
  },

  // ---- Desempenho por disciplina ----

  /**
   * Desempenho agregado por disciplina do usuário.
   * Tabela: subject_performance (subject, percentage).
   */
  async listSubjectPerformance(userId) {
    const { data, error } = await supabase
      .from("subject_performance")
      .select("*")
      .eq("user_id", userId)
      .order("percentage", { ascending: false });
    if (error) throw error;
    return data;
  },
};
