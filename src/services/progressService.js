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

  /** Catálogo de conquistas + flag se o usuário desbloqueou. */
  async listAchievements(userId) {
    const { data, error } = await supabase
      .from("achievements")
      .select("*, user_achievements(user_id)")
      .order("id", { ascending: true });
    if (error) throw error;
    // Marca unlocked = true quando há um registro do usuário atual
    return data.map((a) => ({
      ...a,
      unlocked: (a.user_achievements || []).some((u) => u.user_id === userId),
    }));
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
