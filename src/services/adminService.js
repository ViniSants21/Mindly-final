import { supabase } from "../lib/supabaseClient";

/**
 * Serviço do Painel Admin.
 *
 * Todas estas operações dependem de o usuário logado ter role = 'admin'.
 * As políticas RLS no banco garantem que apenas admins consigam ler/
 * escrever nestas tabelas (ver supabase/schema.sql).
 */
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

  // ---------- ESTATÍSTICAS / DASHBOARD ----------
  async getDashboardStats() {
    const { data, error } = await supabase.rpc("admin_dashboard_stats");
    if (error) throw error;
    return data;
  },
};
