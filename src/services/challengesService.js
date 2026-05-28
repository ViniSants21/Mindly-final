import { supabase } from "../lib/supabaseClient";

/**
 * Serviço de Desafios.
 *
 * - `challenges`: catálogo global de desafios (criado/gerido pelo Admin).
 * - `user_challenges`: progresso de cada usuário em cada desafio
 *   (relacionamento N:N com a coluna `progress` 0–100).
 */
export const challengesService = {
  /** Catálogo de desafios ativos (visível para os alunos). */
  async listActive() {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("status", "Ativo")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  /** Catálogo completo (Admin — inclui suspensos). */
  async listAll() {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  /** Progresso do usuário em todos os desafios (com dados do desafio). */
  async listUserProgress(userId) {
    const { data, error } = await supabase
      .from("user_challenges")
      .select("*, challenge:challenges(*)")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  },

  /**
   * Garante que exista um registro de progresso para (user, challenge).
   * Usa upsert para evitar duplicatas (constraint unique no banco).
   */
  async ensureProgress(userId, challengeId) {
    const { data, error } = await supabase
      .from("user_challenges")
      .upsert(
        { user_id: userId, challenge_id: challengeId },
        { onConflict: "user_id,challenge_id", ignoreDuplicates: true }
      )
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Soma `amount` ao progresso do usuário num desafio (limitado a 100).
   * Retorna: { progress, newly_unlocked: [...], coins_earned }
   *   - progress: novo valor de progresso (0–100)
   *   - newly_unlocked: array de conquistas desbloqueadas nesta jogada
   *   - coins_earned: moedas ganhas por conquistas (já creditadas no perfil)
   */
  async addProgress(userId, challengeId, amount) {
    const { data, error } = await supabase.rpc(
      "increment_challenge_progress",
      { p_user_id: userId, p_challenge_id: challengeId, p_amount: amount }
    );
    if (error) throw error;
    return data; // { progress, newly_unlocked, coins_earned }
  },

  // ---- operações de Admin ----

  async create({ title, description, icon, status = "Ativo" }) {
    const { data, error } = await supabase
      .from("challenges")
      .insert({ title, description, icon, status })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(challengeId, updates) {
    const { data, error } = await supabase
      .from("challenges")
      .update(updates)
      .eq("id", challengeId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(challengeId) {
    const { error } = await supabase
      .from("challenges")
      .delete()
      .eq("id", challengeId);
    if (error) throw error;
  },
};
