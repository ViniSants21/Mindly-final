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

  /**
   * Ativa um item consumível (Dobra XP, Proteção ou Dica).
   * Debita o preço em coins e aplica o efeito no perfil.
   * Retorna { success, message }.
   */
  async activate(userId, rewardId) {
    const { data: reward, error: rewardErr } = await supabase
      .from("rewards")
      .select("name, price")
      .eq("id", rewardId)
      .single();
    if (rewardErr) throw rewardErr;

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("coins, hints_count")
      .eq("id", userId)
      .single();
    if (profileErr) throw profileErr;

    if ((profile.coins ?? 0) < reward.price) {
      return { success: false, message: "Moedas insuficientes." };
    }

    const updates = { coins: profile.coins - reward.price };
    const name = reward.name ?? "";

    if (name.includes("Dobra") || name.includes("XP")) {
      const expires = new Date(Date.now() + 20 * 60 * 1000).toISOString();
      updates.xp_boost_expires_at = expires;
    } else if (name.includes("Prote")) {
      const expires = new Date(Date.now() + 20 * 60 * 1000).toISOString();
      updates.xp_shield_expires_at = expires;
    } else {
      updates.hints_count = (profile.hints_count ?? 0) + 1;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);
    if (updateErr) throw updateErr;

    return { success: true, message: "Recompensa ativada com sucesso!" };
  },
};
