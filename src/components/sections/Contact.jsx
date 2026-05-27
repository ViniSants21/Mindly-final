import { useState } from "react";
import { contactService } from "../../services/contactService";
import { useAuth } from "../../context/AuthContext";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

export default function Contact() {
  const { session } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setFeedback("Preencha todos os campos.");
      return;
    }
    if (!isSupabaseConfigured) {
      setFeedback("✅ Mensagem registrada (modo demonstração).");
      setForm({ name: "", email: "", message: "" });
      return;
    }
    setSending(true);
    try {
      await contactService.createTicket({
        userId: session?.user?.id || null,
        name: form.name,
        email: form.email,
        message: form.message,
      });
      setFeedback("✅ Mensagem enviada com sucesso!");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setFeedback("Erro ao enviar: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="contact">
      <div className="container">
        <h2>Entre em Contato</h2>
        <p>Tem dúvidas ou sugestões? Estamos aqui para ajudar!</p>
        <div className="contact-content">
          <div className="contact-info">
            <h3>Informações de Contato</h3>
            <p>
              <strong>Email:</strong> contato@mindly.com
            </p>
            <p>
              <strong>Telefone:</strong> (11) 9999-9999
            </p>
            <p>
              <strong>Endereço:</strong> São Paulo, SP
            </p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <textarea
              placeholder="Mensagem"
              rows="5"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? "Enviando…" : "Enviar Mensagem"}
            </button>
            {feedback && <span className="form-feedback">{feedback}</span>}
          </form>
        </div>
      </div>
    </section>
  );
}
