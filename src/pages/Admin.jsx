import { useState, useEffect, useCallback } from "react";
import { getIcon, availableIconNames } from "../lib/icons";
import { adminService } from "../services/adminService";
import { challengesService } from "../services/challengesService";
import { useToast } from "../hooks/useToast";
import "../styles/admin.css";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const { message: toastMsg, showToast } = useToast(3000);

  // Dados do banco
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modais
  const [editUser, setEditUser] = useState(null);
  const [editChallenge, setEditChallenge] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ title: "", description: "", icon: "star" });
  const [replyText, setReplyText] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, c, t, s] = await Promise.all([
        adminService.listUsers(),
        challengesService.listAll(),
        adminService.listTickets(),
        adminService.getDashboardStats(),
      ]);
      setUsers(u);
      setChallenges(c);
      setTickets(t);
      setStats(s);
    } catch (err) {
      showToast("Erro ao carregar: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---- Ações ----
  const toggleUserStatus = async (u) => {
    try {
      const updated = await adminService.toggleUserStatus(u.id, u.status);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      showToast("Status do usuário atualizado!");
    } catch (err) {
      showToast("Erro: " + err.message);
    }
  };

  const handleSaveUser = async () => {
    try {
      const updated = await adminService.updateUser(editUser.id, {
        name: editUser.name,
        email: editUser.email,
        coins: editUser.coins,
      });
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setEditUser(null);
      showToast("Usuário salvo com sucesso!");
    } catch (err) {
      showToast("Erro: " + err.message);
    }
  };

  const handleCreateChallenge = async () => {
    try {
      const created = await challengesService.create(newChallenge);
      setChallenges((prev) => [...prev, created]);
      setIsCreateChallengeOpen(false);
      setNewChallenge({ title: "", description: "", icon: "star" });
      showToast("Desafio criado com sucesso!");
    } catch (err) {
      showToast("Erro: " + err.message);
    }
  };

  const handleSaveChallenge = async () => {
    try {
      const updated = await challengesService.update(editChallenge.id, {
        title: editChallenge.title,
        description: editChallenge.description,
      });
      setChallenges((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditChallenge(null);
      showToast("Desafio salvo com sucesso!");
    } catch (err) {
      showToast("Erro: " + err.message);
    }
  };

  const deleteChallenge = async (id) => {
    try {
      await challengesService.remove(id);
      setChallenges((prev) => prev.filter((c) => c.id !== id));
      showToast("Desafio apagado com sucesso!");
    } catch (err) {
      showToast("Erro: " + err.message);
    }
  };

  const toggleChallengeStatus = async (c) => {
    try {
      const updated = await challengesService.update(c.id, {
        status: c.status === "Ativo" ? "Suspenso" : "Ativo",
      });
      setChallenges((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      showToast("Status do desafio alterado!");
    } catch (err) {
      showToast("Erro: " + err.message);
    }
  };

  const handleSendReply = async () => {
    try {
      await adminService.replyTicket(activeTicket.id, replyText);
      setTickets((prev) =>
        prev.map((t) => (t.id === activeTicket.id ? { ...t, status: "Respondido" } : t))
      );
      setActiveTicket(null);
      setReplyText("");
      showToast("Mensagem enviada com sucesso!");
    } catch (err) {
      showToast("Erro: " + err.message);
    }
  };

  // ---- Painéis ----
  const DashboardPanel = () => (
    <div className="admin-panel-transparent">
      <h2 style={{ marginBottom: 30, color: "#1c2c4c" }}>Painel Geral</h2>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <h3>{stats?.total_users ?? users.length}</h3>
          <p>Usuários</p>
        </div>
        <div className="admin-stat-card">
          <h3>{stats?.active_challenges ?? 0}</h3>
          <p>Desafios Ativos</p>
        </div>
        <div className="admin-stat-card">
          <h3>{stats?.open_tickets ?? 0}</h3>
          <p>Tickets Abertos</p>
        </div>
      </div>
    </div>
  );

  const UsersPanel = () => (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Gerenciar Usuários</h2>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Moedas</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <strong>{u.name}</strong>
                <br />
                <small className={u.status === "Ativo" ? "text-success" : "text-danger"}>
                  {u.status}
                </small>
              </td>
              <td>{u.email}</td>
              <td>{u.coins}</td>
              <td>
                <button
                  className="btn-outline admin-table-btn"
                  onClick={() => setEditUser(u)}
                >
                  Editar
                </button>
                <button
                  className="btn-pause admin-table-btn"
                  onClick={() => toggleUserStatus(u)}
                >
                  {u.status === "Ativo" ? "Suspender" : "Reativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const ChallengesPanel = () => (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Gerenciar Desafios</h2>
        <button className="btn-primary" onClick={() => setIsCreateChallengeOpen(true)}>
          + Criar Desafio
        </button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Ícone</th>
            <th>Título e Descrição</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {challenges.map((c) => (
            <tr key={c.id}>
              <td
                style={{
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {getIcon(c.icon, { size: 28 })}
              </td>
              <td>
                <strong>{c.title}</strong>
                <br />
                <small>{c.description}</small>
              </td>
              <td>
                <span
                  className={`challenge-badge ${
                    c.status === "Ativo" ? "completed-badge" : "ongoing-badge"
                  }`}
                >
                  {c.status}
                </span>
              </td>
              <td>
                <button
                  className="btn-outline admin-table-btn"
                  onClick={() => setEditChallenge(c)}
                >
                  Editar
                </button>
                <button
                  className="btn-pause admin-table-btn"
                  onClick={() => toggleChallengeStatus(c)}
                >
                  {c.status === "Ativo" ? "Suspender" : "Reativar"}
                </button>
                <button
                  className="btn-add admin-table-btn"
                  style={{ backgroundColor: "#ff4d4d" }}
                  onClick={() => deleteChallenge(c.id)}
                >
                  Apagar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const TicketsPanel = () => (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Tickets de Suporte</h2>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Assunto</th>
            <th>Data</th>
            <th>Estado</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <strong>{ticket.profile?.name || ticket.name || "Visitante"}</strong>
              </td>
              <td>{ticket.subject}</td>
              <td>
                <small>
                  {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                </small>
              </td>
              <td>
                <span
                  className={`challenge-badge ${
                    ticket.status === "Aberto" ? "ongoing-badge" : "completed-badge"
                  }`}
                >
                  {ticket.status}
                </span>
              </td>
              <td>
                <button
                  className="btn-primary admin-btn-sm"
                  onClick={() => {
                    setActiveTicket(ticket);
                    setReplyText("");
                  }}
                  disabled={ticket.status === "Respondido"}
                  style={{ opacity: ticket.status === "Respondido" ? 0.5 : 1 }}
                >
                  {ticket.status === "Respondido" ? "Já Respondido" : "Responder"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPanel = () => {
    if (loading) {
      return (
        <div className="admin-panel">
          <p style={{ color: "#666" }}>Carregando dados…</p>
        </div>
      );
    }
    switch (activeTab) {
      case "Usuários":
        return <UsersPanel />;
      case "Desafios":
        return <ChallengesPanel />;
      case "Tickets":
        return <TicketsPanel />;
      default:
        return <DashboardPanel />;
    }
  };

  const tabs = [
    { key: "Dashboard", icon: "trending" },
    { key: "Usuários",  icon: "user" },
    { key: "Desafios",  icon: "award" },
    { key: "Tickets",   icon: "gift" },
  ];

  return (
    <div className="admin-layout">
      <div className="admin-main">
        <div className="admin-sidebar">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`admin-side-btn ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {getIcon(t.icon, { size: 18 })} {t.key}
            </button>
          ))}
        </div>

        <div className="admin-content">{renderPanel()}</div>
      </div>

      {/* Modal: Criar Desafio */}
      {isCreateChallengeOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Criar Novo Desafio</h3>
            <select
              className="admin-input"
              value={newChallenge.icon}
              onChange={(e) =>
                setNewChallenge({ ...newChallenge, icon: e.target.value })
              }
            >
              {availableIconNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="admin-input"
              placeholder="Título do Desafio"
              value={newChallenge.title}
              onChange={(e) =>
                setNewChallenge({ ...newChallenge, title: e.target.value })
              }
            />
            <textarea
              className="admin-input"
              rows="3"
              placeholder="Descrição do Desafio"
              value={newChallenge.description}
              onChange={(e) =>
                setNewChallenge({ ...newChallenge, description: e.target.value })
              }
            />
            <div className="admin-modal-actions">
              <button
                className="btn-outline"
                onClick={() => setIsCreateChallengeOpen(false)}
              >
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleCreateChallenge}>
                Salvar Desafio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuário */}
      {editUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Editar Usuário</h3>
            <input
              type="text"
              className="admin-input"
              value={editUser.name || ""}
              onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
              placeholder="Nome do Usuário"
            />
            <input
              type="email"
              className="admin-input"
              value={editUser.email || ""}
              onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
              placeholder="E-mail"
            />
            <input
              type="number"
              className="admin-input"
              value={editUser.coins}
              onChange={(e) =>
                setEditUser({ ...editUser, coins: parseInt(e.target.value) || 0 })
              }
              placeholder="Moedas"
            />
            <div className="admin-modal-actions">
              <button className="btn-outline" onClick={() => setEditUser(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSaveUser}>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Responder Ticket */}
      {activeTicket && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Responder Ticket</h3>
            <div className="admin-modal-info">
              <p>
                <strong>De:</strong>{" "}
                {activeTicket.profile?.name || activeTicket.name || "Visitante"}
              </p>
              <p>
                <strong>Assunto:</strong> {activeTicket.subject}
              </p>
              {activeTicket.message && (
                <p>
                  <strong>Mensagem:</strong> {activeTicket.message}
                </p>
              )}
            </div>
            <textarea
              placeholder="Digite sua resposta aqui para o usuário..."
              rows="5"
              className="admin-input"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="admin-modal-actions">
              <button className="btn-outline" onClick={() => setActiveTicket(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSendReply}>
                Enviar Resposta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Desafio */}
      {editChallenge && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Editar Desafio</h3>
            <input
              type="text"
              className="admin-input"
              value={editChallenge.title}
              onChange={(e) =>
                setEditChallenge({ ...editChallenge, title: e.target.value })
              }
              placeholder="Título do Desafio"
            />
            <textarea
              className="admin-input"
              rows="3"
              value={editChallenge.description || ""}
              onChange={(e) =>
                setEditChallenge({ ...editChallenge, description: e.target.value })
              }
              placeholder="Descrição"
            />
            <div className="admin-modal-actions">
              <button className="btn-outline" onClick={() => setEditChallenge(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSaveChallenge}>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="admin-toast">✅ {toastMsg}</div>}
    </div>
  );
}
