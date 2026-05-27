import { supabase } from "../lib/supabaseClient";

/**
 * Serviço de Recompensas / loja.
 *
 * - `rewards`: catálogo de itens (preço, categoria, bloqueado).
 * - `user_rewards`: itens já comprados por cada usuário.
 * - As moedas ficam em `profiles.coins`.
 *
 * A compra é feita pela função RPC `purchase_reward`, que valida saldo,
 * debita as moedas e registra a compra numa única transação atômica.
 */
export const rewardsService = {
  /** Catálogo completo de recompensas. */
  async listRewards() {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .order("price", { ascending: true });
    if (error) throw error;
    return data;
  },

  /** IDs das recompensas que o usuário já comprou. */
  async listOwned(userId) {
    const { data, error } = await supabase
      .from("user_rewards")
      .select("reward_id")
      .eq("user_id", userId);
    if (error) throw error;
    return data.map((r) => r.reward_id);
  },

  /**
   * Compra uma recompensa.
   * Retorna { success, message, coins } — coins = saldo restante.
   */
  async purchase(userId, rewardId) {
    const { data, error } = await supabase.rpc("purchase_reward", {
      p_user_id: userId,
      p_reward_id: rewardId,
    });
    if (error) throw error;
    return data;
  },
};
