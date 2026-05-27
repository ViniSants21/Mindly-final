import { supabase } from "../lib/supabaseClient";

/**
 * Serviço de contato / suporte (lado do usuário).
 * Cria tickets que aparecem no Painel Admin.
 */
export const contactService = {
  /**
   * Cria um ticket de suporte / mensagem de contato.
   * `userId` é opcional — visitantes não logados podem enviar contato.
   */
  async createTicket({ userId = null, name, email, subject, message }) {
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        user_id: userId,
        name,
        email,
        subject: subject || "Contato pelo site",
        message,
        status: "Aberto",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
