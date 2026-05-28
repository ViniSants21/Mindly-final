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

  /** Marca uma etapa da trilha como concluída. */
  async completeStep(userId, stepId) {
    const { error } = await supabase
      .from("learning_progress")
      .upsert(
        { user_id: userId, step_id: stepId },
        { onConflict: "user_id,step_id", ignoreDuplicates: true }
      );
    if (error) throw error;
  },

  // ---- Conquistas ----

  /**
   * Catálogo de conquistas + flag se o usuário desbloqueou.
   * Inclui: unlocked, unlocked_at, current_progress (0–100 para
   * exibir barra de progresso nos cards bloqueados).
   */
  async listAchievements(userId) {
    const [achResult, countResult] = await Promise.all([
      supabase
        .from("achievements")
        .select("*, user_achievements(user_id, unlocked_at)")
        .order("id", { ascending: true }),
      supabase
        .from("user_challenges")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("progress", 100),
    ]);

    if (achResult.error) throw achResult.error;

    const completedCount = countResult.count || 0;

    return achResult.data.map((a) => {
      const userRecord = (a.user_achievements || []).find(
        (u) => u.user_id === userId
      );
      const unlocked = !!userRecord;
      // Progresso percentual em direção à conquista (99% máx se ainda bloqueada)
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
