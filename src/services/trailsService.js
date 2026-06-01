import { supabase } from "../lib/supabaseClient";

/**
 * Mapeia as colunas do banco para o formato usado pelos componentes.
 * - DB: exemplo_pratico  →  JS: exemploPratico
 * - DB: id (integer)     →  JS: id (number) — compatível com learning_progress.step_id
 */
function mapModule(row) {
  if (!row) return null;
  return {
    ...row,
    exemploPratico: row.exemplo_pratico ?? "",
  };
}

export const trailsService = {
  /**
   * Lista módulos ATIVOS ordenados por position (para a página de Trilha).
   * Retorna objetos com `exemploPratico` mapeado de `exemplo_pratico`.
   */
  async listActive() {
    const { data, error } = await supabase
      .from("learning_modules")
      .select("*")
      .eq("status", "Ativo")
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapModule);
  },

  /**
   * Lista TODOS os módulos (ativos + inativos) para o painel Admin.
   */
  async listAll() {
    const { data, error } = await supabase
      .from("learning_modules")
      .select("*")
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapModule);
  },

  /**
   * Cria um novo módulo. O id é gerado automaticamente pelo banco (IDENTITY).
   */
  async create({ titulo, nivel = "Fácil", tempo = "30 min", xp = 50, icon = "brain",
                  conteudo = "", curiosidade = "", exemploPratico = "", dica = "",
                  status = "Ativo", position = 0 }) {
    const { data, error } = await supabase
      .from("learning_modules")
      .insert({
        titulo, nivel, tempo, xp, icon,
        conteudo, curiosidade,
        exemplo_pratico: exemploPratico,
        dica, status, position,
      })
      .select()
      .single();
    if (error) throw error;
    return mapModule(data);
  },

  /**
   * Atualiza um módulo existente pelo id.
   */
  async update(moduleId, updates) {
    const payload = { ...updates };
    // Converter nomes JS → DB
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
    return mapModule(data);
  },

  /**
   * Remove um módulo pelo id.
   */
  async remove(moduleId) {
    const { error } = await supabase
      .from("learning_modules")
      .delete()
      .eq("id", moduleId);
    if (error) throw error;
  },

  /**
   * Atualiza apenas o campo position de um módulo (para reordenação).
   */
  async updatePosition(moduleId, newPosition) {
    const { data, error } = await supabase
      .from("learning_modules")
      .update({ position: newPosition })
      .eq("id", moduleId)
      .select("id, position")
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Alterna o status entre Ativo e Inativo.
   */
  async toggleStatus(moduleId, currentStatus) {
    const nextStatus = currentStatus === "Ativo" ? "Inativo" : "Ativo";
    return this.update(moduleId, { status: nextStatus });
  },
};
