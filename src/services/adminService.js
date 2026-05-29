import { supabase } from "../lib/supabaseClient";

export const adminService = {
  // ---------- USUÁRIOS ----------
  async listUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async toggleUserStatus(userId, currentStatus) {
    const next = currentStatus === "Ativo" ? "Inativo" : "Ativo";
    return this.updateUser(userId, { status: next });
  },

  // ---------- TICKETS ----------
  async listTickets() {
    const { data, error } = await supabase
      .from("tickets")
      .select("*, profile:profiles(name, email)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async replyTicket(ticketId, reply) {
    const { data, error } = await supabase
      .from("tickets")
      .update({ status: "Respondido", reply, replied_at: new Date().toISOString() })
      .eq("id", ticketId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---------- ESTATÍSTICAS COMPLETAS ----------
  async getFullStats() {
    const { data, error } = await supabase.rpc("admin_full_stats");
    if (error) throw error;
    return data;
  },

  // ---------- ATIVIDADE RECENTE ----------
  async getActivity(limit = 8) {
    const { data, error } = await supabase.rpc("get_admin_activity", { p_limit: limit });
    if (error) throw error;
    return data;
  },

  // ---------- FALLBACK LEGADO ----------
  async getDashboardStats() {
    const { data, error } = await supabase.rpc("admin_dashboard_stats");
    if (error) throw error;
    return data;
  },
};
