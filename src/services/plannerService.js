import { supabase } from "../lib/supabaseClient";

const TIMEOUT_MS = 12000;

/**
 * Envolve uma query Supabase com timeout para evitar travamento infinito.
 * Se a query não responder em TIMEOUT_MS ms, rejeita com erro de timeout.
 */
function run(query) {
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            "Tempo esgotado. Verifique sua conexão com a internet e tente novamente."
          )
        ),
      TIMEOUT_MS
    )
  );
  return Promise.race([query, timeout]);
}

export const plannerService = {
  /** Lista todos os blocos do usuário. */
  async listAll(userId) {
    console.debug("[plannerService] listAll – userId:", userId);
    const { data, error } = await run(
      supabase
        .from("study_blocks")
        .select("*")
        .eq("user_id", userId)
        .order("time", { ascending: true })
    );
    if (error) {
      console.error("[plannerService] listAll error:", error);
      throw error;
    }
    console.debug("[plannerService] listAll OK –", data?.length, "registro(s)");
    return data ?? [];
  },

  /** Lista blocos de uma data específica (YYYY-MM-DD). */
  async listByDate(userId, date) {
    const { data, error } = await run(
      supabase
        .from("study_blocks")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .order("time", { ascending: true })
    );
    if (error) throw error;
    return data ?? [];
  },

  /** Cria um novo bloco e retorna o registro inserido. */
  async create(userId, { date, time, subject, color }) {
    console.debug("[plannerService] create –", { userId, date, time, subject, color });
    const { data, error } = await run(
      supabase
        .from("study_blocks")
        .insert({ user_id: userId, date, time, subject, color })
        .select()
        .single()
    );
    if (error) {
      console.error("[plannerService] create error:", error);
      throw error;
    }
    console.debug("[plannerService] create OK –", data);
    return data;
  },

  /** Atualiza um bloco existente e retorna o registro atualizado. */
  async update(blockId, { time, subject, color }) {
    console.debug("[plannerService] update – blockId:", blockId);
    const { data, error } = await run(
      supabase
        .from("study_blocks")
        .update({ time, subject, color })
        .eq("id", blockId)
        .select()
        .single()
    );
    if (error) {
      console.error("[plannerService] update error:", error);
      throw error;
    }
    console.debug("[plannerService] update OK –", data);
    return data;
  },

  /** Remove um bloco pelo id. */
  async remove(blockId) {
    console.debug("[plannerService] remove – blockId:", blockId);
    const { error } = await run(
      supabase.from("study_blocks").delete().eq("id", blockId)
    );
    if (error) {
      console.error("[plannerService] remove error:", error);
      throw error;
    }
    console.debug("[plannerService] remove OK");
  },
};
