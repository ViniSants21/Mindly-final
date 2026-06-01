import { supabase } from "../lib/supabaseClient";

/**
 * Serviço de Trilhas de Aprendizagem (módulos gerenciados pelo Admin).
 * Os módulos ficam na tabela `learning_modules` do Supabase.
 * O id é gerado automaticamente (UUID) — nunca preenchido manualmente.
 */
export const trailsService = {
  /** Lista todos os módulos ordenados por posição. */
  async listAll() {
    const { data, error } = await supabase
      .from("learning_modules")
      .select("*")
      .order("position", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  /** Cria um novo módulo. ID gerado automaticamente pelo banco (UUID). */
  async create({ titulo, nivel = "Fácil", tempo = "30 min", xp = 50, icon = "brain",
                  conteudo = "", curiosidade = "", exemploPratico = "", dica = "", position }) {
    const { data, error } = await supabase
      .from("learning_modules")
      .insert({ titulo, nivel, tempo, xp, icon, conteudo, curiosidade,
                exemplo_pratico: exemploPratico, dica, position })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Atualiza um módulo existente. */
  async update(moduleId, updates) {
    const payload = { ...updates };
    if ("exemploPratico" in payload) {
      payload.exemplo_pratico = payload.exemploPratico;
      delete payload.exemploPratico;
    }
    const { data, error } = await supabase
      .from("learning_modules")
      .update(payload)
      .eq("id", moduleId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Remove um módulo pelo id. */
  async remove(moduleId) {
    const { error } = await supabase
      .from("learning_modules")
      .delete()
      .eq("id", moduleId);
    if (error) throw error;
  },
};
