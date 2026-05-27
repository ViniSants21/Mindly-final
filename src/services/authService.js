import { supabase } from "../lib/supabaseClient";

/**
 * Serviço de autenticação e perfil.
 *
 * O Supabase Auth cuida das credenciais (tabela auth.users, gerenciada
 * pelo Supabase). Os dados de perfil de aplicação (nome, avatar, role,
 * moedas, xp...) ficam na tabela pública `profiles`, ligada por id =
 * auth.users.id. Um trigger no banco cria automaticamente um profile
 * quando um novo usuário se cadastra (ver supabase/schema.sql).
 */
export const authService = {
  /** Cadastra um novo usuário com email/senha. */
  async signUp({ email, password, name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Estes metadados são lidos pelo trigger handle_new_user()
        data: { name: name || email.split("@")[0] },
      },
    });
    if (error) throw error;
    return data;
  },

  /** Login com email/senha. */
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /** Login com Google (OAuth). Requer o provider habilitado no Supabase. */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },

  /** Encerra a sessão. */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /** Retorna a sessão atual (ou null). */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /** Busca o perfil de aplicação de um usuário pelo id. */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  },

  /** Atualiza campos do perfil do usuário logado. */
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Inscreve um listener para mudanças de estado de auth. */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
