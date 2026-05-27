import { supabase } from "../lib/supabaseClient";

/**
 * Serviço do Planner — blocos de estudo por data.
 * Tabela: study_blocks (user_id, date, time, subject, color).
 */
export const plannerService = {
  /** Lista todos os blocos do usuário (para marcar dias no calendário). */
  async listAll(userId) {
    const { data, error } = await supabase
      .from("study_blocks")
      .select("*")
      .eq("user_id", userId)
      .order("time", { ascending: true });
    if (error) throw error;
    return data;
  },

  /** Lista blocos de uma data específica (YYYY-MM-DD). */
  async listByDate(userId, date) {
    const { data, error } = await supabase
      .from("study_blocks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("time", { ascending: true });
    if (error) throw error;
    return data;
  },

  /** Cria um novo bloco. */
  async create(userId, { date, time, subject, color }) {
    const { data, error } = await supabase
      .from("study_blocks")
      .insert({ user_id: userId, date, time, subject, color })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Atualiza um bloco existente. */
  async update(blockId, { time, subject, color }) {
    const { data, error } = await supabase
      .from("study_blocks")
      .update({ time, subject, color })
      .eq("id", blockId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Remove um bloco. */
  async remove(blockId) {
    const { error } = await supabase
      .from("study_blocks")
      .delete()
      .eq("id", blockId);
    if (error) throw error;
  },
};
