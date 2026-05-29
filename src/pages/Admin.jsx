import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard, Users, Target, MessageSquare, TrendingUp,
  Zap, Trophy, HelpCircle, CheckCircle2, Clock, AlertCircle,
  ShieldCheck, BarChart2, UserPlus, Star, Search, RefreshCw,
  ChevronRight, Award, Flame,
} from "lucide-react";
import { getIcon, availableIconNames } from "../lib/icons";
import { adminService } from "../services/adminService";
import { challengesService } from "../services/challengesService";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { getAvatarUrl } from "../lib/avatar";
import "../styles/admin.css";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtNum(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("pt-BR");
}

/* ─────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────── */
function Skeleton({ w = "100%", h = 16, r = 6 }) {
  return <span className="adm-skeleton" style={{ width: w, height: h, borderRadius: r }} />;
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="adm-stat-body">
        {loading ? <Skeleton w={60} h={28} r={6} /> : <span className="adm-stat-value">{value}</span>}
        <span className="adm-stat-label">{label}</span>
        {sub && <span className="adm-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BARRA DE GRÁFICO (CSS)
───────────────────────────────────────────── */
function BarChart({ data, valueKey = "count", labelKey = "level", color = "#3b82f6", loading }) {
  if (loading) return (
    <div className="adm-barchart">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="adm-bar-col">
          <Skeleton w="100%" h={`${40 + i * 15}px`} r={4} />
          <Skeleton w={28} h={10} r={4} />
        </div>
      ))}
    </div>
  );
  if (!data?.length) return <p className="adm-empty-mini">Sem dados disponíveis</p>;
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  return (
    <div className="adm-barchart">
      {data.map((d, i) => {
        const pct = Math.max((Number(d[valueKey]) / max) * 100, 4);
        return (
          <div key={i} className="adm-bar-col">
            <div className="adm-bar-track">
              <div
                className="adm-bar-fill"
                style={{ height: `${pct}%`, background: color }}
                title={`${d[valueKey]}`}
              />
            </div>
            <span className="adm-bar-label">
              {labelKey === "level" ? `Nv ${d[valueKey] ?? d.level}` : (d[labelKey] ?? d.month ?? d.level)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DONUT RING
───────────────────────────────────────────── */
function DonutRing({ pct = 0, color = "#3b82f6", size = 90, label }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min((pct / 100) * circ, circ);
  return (
    <div className="adm-donut-wrap">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
      </svg>
      <div className="adm-donut-center">
        <span className="adm-donut-pct">{pct}%</span>
        <span className="adm-donut-label">{label}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ACTIVITY ITEM
───────────────────────────────────────────── */
function ActivityItem({ icon, text, time, color = "#3b82f6" }) {
  return (
    <div className="adm-activity-item">
      <span className="adm-activity-dot" style={{ background: color }} />
      <div className="adm-activity-body">
        <span className="adm-activity-text">{text}</span>
        <span className="adm-activity-time">{time}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const { message: toastMsg, showToast } = useToast(3500);

  // Data
  const [users, setUsers]           = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [tickets, setTickets]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [activity, setActivity]     = useState(null);

  // Loading states
  const [loadingMain, setLoadingMain]       = useState(true);
  const [loadingStats, setLoadingStats]     = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Search / filter
  const [userSearch, setUserSearch]           = useState("");
  const [challengeSearch, setChallengeSearch] = useState("");
  const [ticketFilter, setTicketFilter]       = useState("Todos");

  // Modals
  const [editUser, setEditUser]             = useState(null);
  const [editChallenge, setEditChallenge]   = useState(null);
  const [activeTicket, setActiveTicket]     = useState(null);
  const [isCreateOpen, setIsCreateOpen]     = useState(false);
  const [newChallenge, setNewChallenge]     = useState({ title: "", description: "", icon: "star" });
  const [replyText, setReplyText]           = useState("");

  /* Load main data (users, challenges, tickets) */
  const loadMain = useCallback(async () => {
    setLoadingMain(true);
    try {
      const [u, c, t] = await Promise.all([
        adminService.listUsers(),
        challengesService.listAll(),
        adminService.listTickets(),
      ]);
      setUsers(u);
      setChallenges(c);
      setTickets(t);
    } catch (err) {
      showToast("Erro ao carregar dados: " + err.message);
    } finally {
      setLoadingMain(false);
    }
  }, [showToast]);

  /* Load stats separately */
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const s = await adminService.getFullStats();
      setStats(s);
    } catch {
      /* fallback silencioso */
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /* Load activity feed */
  const loadActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const a = await adminService.getActivity(8);
      setActivity(a);
    } catch {
      /* fallback silencioso */
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    loadMain();
    loadStats();
    loadActivity();
  }, [loadMain, loadStats, loadActivity]);

  /* ── Actions ── */
  const toggleUserStatus = async (u) => {
    try {
      const updated = await adminService.toggleUserStatus(u.id, u.status);
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
      showToast(u.status === "Ativo" ? "Usuário suspenso." : "Usuário reativado.");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const handleSaveUser = async () => {
    try {
      const updated = await adminService.updateUser(editUser.id, {
        name: editUser.name, email: editUser.email, coins: editUser.coins,
      });
      setUsers(prev => prev.map(x => x.id === updated.id ? updated : x));
      setEditUser(null);
      showToast("Usuário atualizado!");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const handleCreateChallenge = async () => {
    try {
      const created = await challengesService.create(newChallenge);
      setChallenges(prev => [...prev, created]);
      setIsCreateOpen(false);
      setNewChallenge({ title: "", description: "", icon: "star" });
      showToast("Desafio criado!");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const handleSaveChallenge = async () => {
    try {
      const updated = await challengesService.update(editChallenge.id, {
        title: editChallenge.title, description: editChallenge.description,
      });
      setChallenges(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditChallenge(null);
      showToast("Desafio atualizado!");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const deleteChallenge = async (id) => {
    try {
      await challengesService.remove(id);
      setChallenges(prev => prev.filter(c => c.id !== id));
      showToast("Desafio removido.");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const toggleChallengeStatus = async (c) => {
    try {
      const updated = await challengesService.update(c.id, {
        status: c.status === "Ativo" ? "Suspenso" : "Ativo",
      });
      setChallenges(prev => prev.map(x => x.id === updated.id ? updated : x));
      showToast("Status do desafio alterado!");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const handleSendReply = async () => {
    try {
      await adminService.replyTicket(activeTicket.id, replyText);
      setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status: "Respondido" } : t));
      setActiveTicket(null);
      setReplyText("");
      showToast("Resposta enviada!");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  /* ── Filtered data ── */
  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  const filteredChallenges = useMemo(() =>
    challenges.filter(c =>
      c.title?.toLowerCase().includes(challengeSearch.toLowerCase())
    ), [challenges, challengeSearch]);

  const filteredTickets = useMemo(() =>
    tickets.filter(t => ticketFilter === "Todos" || t.status === ticketFilter),
    [tickets, ticketFilter]);

  /* ── Sidebar nav ── */
  const nav = [
    { key: "Dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { key: "Usuários",  icon: <Users size={18} />,           label: "Usuários" },
    { key: "Desafios",  icon: <Target size={18} />,          label: "Desafios" },
    { key: "Tickets",   icon: <MessageSquare size={18} />,   label: "Tickets" },
  ];

  /* ═══════════════════════════════════════
     DASHBOARD PANEL
  ═══════════════════════════════════════ */
  const DashboardPanel = () => {
    const s = stats;
    const ld = loadingStats;

    const topRow = [
      { icon: <Users size={20}/>,        label: "Total de Usuários",      value: fmtNum(s?.total_users),        color: "#3b82f6" },
      { icon: <UserPlus size={20}/>,     label: "Usuários Ativos",        value: fmtNum(s?.active_users),       color: "#22c55e" },
      { icon: <TrendingUp size={20}/>,   label: "Novos Este Mês",         value: fmtNum(s?.new_users_month),    color: "#8b5cf6" },
      { icon: <Zap size={20}/>,          label: "XP Total Distribuído",   value: fmtNum(s?.total_xp),           color: "#f59e0b" },
    ];

    const midRow = [
      { icon: <CheckCircle2 size={20}/>, label: "Desafios Concluídos",    value: fmtNum(s?.completed_challenges),  color: "#22c55e" },
      { icon: <Clock size={20}/>,        label: "Em Andamento",           value: fmtNum(s?.inprogress_challenges), color: "#3b82f6" },
      { icon: <Trophy size={20}/>,       label: "Conquistas Desbloqueadas",value: fmtNum(s?.unlocked_achievements),color: "#f59e0b" },
      { icon: <AlertCircle size={20}/>,  label: "Tickets Abertos",        value: fmtNum(s?.open_tickets),          color: "#ef4444" },
    ];

    const botRow = [
      { icon: <HelpCircle size={20}/>,   label: "Total de Perguntas",     value: fmtNum(s?.total_questions),    color: "#14b8a6" },
      { icon: <BarChart2 size={20}/>,    label: "Média de XP / Usuário",  value: fmtNum(s?.avg_xp),             color: "#6366f1" },
      { icon: <Target size={20}/>,       label: "Desafios Ativos",        value: fmtNum(s?.active_challenges),  color: "#3b82f6" },
      { icon: <ShieldCheck size={20}/>,  label: "Administradores",        value: fmtNum(s?.total_admins),       color: "#64748b" },
    ];

    /* activity helpers */
    const recentUsers  = activity?.recent_users      || [];
    const recentComp   = activity?.recent_completions|| [];
    const recentAch    = activity?.recent_achievements|| [];

    return (
      <div className="adm-dashboard">
        {/* STAT ROWS */}
        <div className="adm-stats-row">
          {topRow.map(c => <StatCard key={c.label} {...c} loading={ld} />)}
        </div>
        <div className="adm-stats-row">
          {midRow.map(c => <StatCard key={c.label} {...c} loading={ld} />)}
        </div>
        <div className="adm-stats-row">
          {botRow.map(c => <StatCard key={c.label} {...c} loading={ld} />)}
        </div>

        {/* CHARTS ROW */}
        <div className="adm-charts-row">
          {/* Distribuição de Níveis */}
          <div className="adm-card adm-chart-card">
            <div className="adm-card-header">
              <h3>Distribuição de Níveis</h3>
              <span className="adm-card-badge">{fmtNum(s?.total_users)} usuários</span>
            </div>
            <BarChart
              data={(s?.level_distribution || []).map(d => ({ level: `Nv ${d.level}`, count: d.count }))}
              valueKey="count"
              labelKey="level"
              color="#3b82f6"
              loading={ld}
            />
          </div>

          {/* Novos usuários por mês */}
          <div className="adm-card adm-chart-card">
            <div className="adm-card-header">
              <h3>Novos Usuários (6 meses)</h3>
              <span className="adm-card-badge">{fmtNum(s?.new_users_month)} este mês</span>
            </div>
            <BarChart
              data={(s?.monthly_users || []).map(d => ({ level: d.month, count: d.count }))}
              valueKey="count"
              labelKey="level"
              color="#8b5cf6"
              loading={ld}
            />
          </div>

          {/* Taxa de conclusão */}
          <div className="adm-card adm-donut-card">
            <div className="adm-card-header">
              <h3>Conclusão de Desafios</h3>
            </div>
            {ld ? <Skeleton w={90} h={90} r="50%" /> : (
              <DonutRing
                pct={s?.completion_rate ?? 0}
                color="#22c55e"
                label="conclusão"
              />
            )}
            <div className="adm-donut-stats">
              <div>
                <span className="adm-donut-stat-val" style={{ color: "#22c55e" }}>{fmtNum(s?.completed_challenges)}</span>
                <span className="adm-donut-stat-lbl">Concluídos</span>
              </div>
              <div>
                <span className="adm-donut-stat-val" style={{ color: "#3b82f6" }}>{fmtNum(s?.inprogress_challenges)}</span>
                <span className="adm-donut-stat-lbl">Em andamento</span>
              </div>
            </div>
          </div>
        </div>

        {/* TOP USER */}
        {s?.top_user && (
          <div className="adm-card adm-top-user-card">
            <Flame size={18} color="#f59e0b" />
            <span><strong>Maior XP:</strong> {s.top_user.name}</span>
            <span className="adm-top-xp">{fmtNum(s.top_user.xp)} XP</span>
            <span className="adm-top-level">Nível {s.top_user.level}</span>
          </div>
        )}

        {/* ACTIVITY FEED */}
        <div className="adm-activity-grid">
          {/* Últimos cadastros */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h3>Últimos Cadastros</h3>
              <UserPlus size={16} color="#3b82f6" />
            </div>
            {loadingActivity
              ? [...Array(4)].map((_, i) => <Skeleton key={i} h={14} r={4} style={{ marginBottom: 8 }} />)
              : recentUsers.length === 0
              ? <p className="adm-empty-mini">Nenhum usuário ainda</p>
              : recentUsers.slice(0, 6).map((u, i) => (
                <ActivityItem
                  key={i}
                  icon={<UserPlus size={13}/>}
                  text={u.name || u.email || "Usuário"}
                  time={fmtDate(u.created_at)}
                  color="#3b82f6"
                />
              ))
            }
          </div>

          {/* Últimas conclusões */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h3>Últimas Conclusões</h3>
              <CheckCircle2 size={16} color="#22c55e" />
            </div>
            {loadingActivity
              ? [...Array(4)].map((_, i) => <Skeleton key={i} h={14} r={4} style={{ marginBottom: 8 }} />)
              : recentComp.length === 0
              ? <p className="adm-empty-mini">Nenhuma conclusão ainda</p>
              : recentComp.slice(0, 6).map((c, i) => (
                <ActivityItem
                  key={i}
                  text={`${c.user_name} — ${c.challenge_title}`}
                  time={fmtDate(c.completed_at)}
                  color="#22c55e"
                />
              ))
            }
          </div>

          {/* Últimas conquistas */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h3>Últimas Conquistas</h3>
              <Trophy size={16} color="#f59e0b" />
            </div>
            {loadingActivity
              ? [...Array(4)].map((_, i) => <Skeleton key={i} h={14} r={4} style={{ marginBottom: 8 }} />)
              : recentAch.length === 0
              ? <p className="adm-empty-mini">Nenhuma conquista ainda</p>
              : recentAch.slice(0, 6).map((a, i) => (
                <ActivityItem
                  key={i}
                  text={`${a.user_name} — ${a.achievement_title}`}
                  time={fmtDate(a.unlocked_at)}
                  color="#f59e0b"
                />
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════
     USERS PANEL
  ═══════════════════════════════════════ */
  const UsersPanel = () => (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <div>
          <h2>Usuários</h2>
          <span className="adm-panel-count">{filteredUsers.length} encontrados</span>
        </div>
        <div className="adm-search-wrap">
          <Search size={15} className="adm-search-icon" />
          <input
            className="adm-search"
            placeholder="Buscar por nome ou email…"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
        </div>
      </div>

      {loadingMain ? (
        <div className="adm-table-skeleton">
          {[...Array(5)].map((_, i) => <Skeleton key={i} h={44} r={6} />)}
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>XP</th>
                <th>Nível</th>
                <th>Moedas</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="adm-user-cell">
                      <div className="adm-user-avatar">{(u.name || u.email || "?")[0].toUpperCase()}</div>
                      <div>
                        <strong>{u.name || "—"}</strong>
                        {u.role === "admin" && <span className="adm-badge adm-badge-admin">admin</span>}
                      </div>
                    </div>
                  </td>
                  <td className="adm-td-muted">{u.email}</td>
                  <td><strong>{fmtNum(u.xp)}</strong></td>
                  <td><span className="adm-badge adm-badge-level">Nv {u.level}</span></td>
                  <td>{fmtNum(u.coins)}</td>
                  <td>
                    <span className={`adm-badge ${u.status === "Ativo" ? "adm-badge-active" : "adm-badge-inactive"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="adm-td-muted">{fmtDate(u.created_at)}</td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn adm-btn-ghost" onClick={() => setEditUser(u)}>Editar</button>
                      <button
                        className={`adm-btn ${u.status === "Ativo" ? "adm-btn-warn" : "adm-btn-success"}`}
                        onClick={() => toggleUserStatus(u)}
                      >
                        {u.status === "Ativo" ? "Suspender" : "Reativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════
     CHALLENGES PANEL
  ═══════════════════════════════════════ */
  const ChallengesPanel = () => (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <div>
          <h2>Desafios</h2>
          <span className="adm-panel-count">{filteredChallenges.length} desafios</span>
        </div>
        <div className="adm-panel-actions">
          <div className="adm-search-wrap">
            <Search size={15} className="adm-search-icon" />
            <input
              className="adm-search"
              placeholder="Buscar desafio…"
              value={challengeSearch}
              onChange={e => setChallengeSearch(e.target.value)}
            />
          </div>
          <button className="adm-btn adm-btn-primary" onClick={() => setIsCreateOpen(true)}>
            + Criar Desafio
          </button>
        </div>
      </div>

      {loadingMain ? (
        <div className="adm-table-skeleton">
          {[...Array(4)].map((_, i) => <Skeleton key={i} h={52} r={6} />)}
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Ícone</th>
                <th>Título</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallenges.map(c => (
                <tr key={c.id}>
                  <td style={{ textAlign: "center" }}>{getIcon(c.icon, { size: 26 })}</td>
                  <td><strong>{c.title}</strong></td>
                  <td className="adm-td-muted">{c.description || "—"}</td>
                  <td>
                    <span className={`adm-badge ${c.status === "Ativo" ? "adm-badge-active" : "adm-badge-inactive"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn adm-btn-ghost" onClick={() => setEditChallenge(c)}>Editar</button>
                      <button
                        className={`adm-btn ${c.status === "Ativo" ? "adm-btn-warn" : "adm-btn-success"}`}
                        onClick={() => toggleChallengeStatus(c)}
                      >
                        {c.status === "Ativo" ? "Suspender" : "Reativar"}
                      </button>
                      <button className="adm-btn adm-btn-danger" onClick={() => deleteChallenge(c.id)}>
                        Apagar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════
     TICKETS PANEL
  ═══════════════════════════════════════ */
  const TicketsPanel = () => (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <div>
          <h2>Tickets de Suporte</h2>
          <span className="adm-panel-count">{filteredTickets.length} tickets</span>
        </div>
        <div className="adm-filter-tabs">
          {["Todos", "Aberto", "Respondido"].map(f => (
            <button
              key={f}
              className={`adm-filter-tab ${ticketFilter === f ? "active" : ""}`}
              onClick={() => setTicketFilter(f)}
            >
              {f}
              {f === "Aberto" && tickets.filter(t => t.status === "Aberto").length > 0 && (
                <span className="adm-filter-badge">
                  {tickets.filter(t => t.status === "Aberto").length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loadingMain ? (
        <div className="adm-table-skeleton">
          {[...Array(4)].map((_, i) => <Skeleton key={i} h={52} r={6} />)}
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Assunto</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(t => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.profile?.name || t.name || "Visitante"}</strong>
                    <br /><small className="adm-td-muted">{t.profile?.email || t.email || ""}</small>
                  </td>
                  <td>{t.subject}</td>
                  <td className="adm-td-muted">{fmtDate(t.created_at)}</td>
                  <td>
                    <span className={`adm-badge ${t.status === "Aberto" ? "adm-badge-warn" : "adm-badge-active"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`adm-btn ${t.status === "Respondido" ? "adm-btn-ghost" : "adm-btn-primary"}`}
                      disabled={t.status === "Respondido"}
                      onClick={() => { setActiveTicket(t); setReplyText(""); }}
                    >
                      {t.status === "Respondido" ? "Respondido" : "Responder"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderPanel = () => {
    switch (activeTab) {
      case "Usuários":  return <UsersPanel />;
      case "Desafios":  return <ChallengesPanel />;
      case "Tickets":   return <TicketsPanel />;
      default:          return <DashboardPanel />;
    }
  };

  const tabLabels = { Dashboard: "Visão Geral", Usuários: "Gerenciar Usuários", Desafios: "Gerenciar Desafios", Tickets: "Suporte" };

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="adm-layout">

      {/* ── SIDEBAR ── */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <div className="adm-brand-dot" />
          <span>Mindly Admin</span>
        </div>

        <div className="adm-sidebar-section">
          <p className="adm-sidebar-section-title">Menu</p>
          {nav.map(item => (
            <button
              key={item.key}
              className={`adm-nav-btn ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.key === "Tickets" && tickets.filter(t => t.status === "Aberto").length > 0 && (
                <span className="adm-nav-badge">{tickets.filter(t => t.status === "Aberto").length}</span>
              )}
              {activeTab === item.key && <ChevronRight size={14} className="adm-nav-arrow" />}
            </button>
          ))}
        </div>

        <div className="adm-sidebar-footer">
          <img src={getAvatarUrl(user?.photo)} alt="admin" className="adm-sidebar-avatar" />
          <div>
            <p className="adm-sidebar-name">{user?.name || "Admin"}</p>
            <p className="adm-sidebar-role">Administrador</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="adm-main">

        {/* Header */}
        <header className="adm-header">
          <div className="adm-header-left">
            <h1 className="adm-header-title">{tabLabels[activeTab]}</h1>
          </div>
          <div className="adm-header-right">
            <button
              className="adm-refresh-btn"
              onClick={() => { loadMain(); loadStats(); loadActivity(); }}
              title="Recarregar dados"
            >
              <RefreshCw size={15} />
            </button>
            {tickets.filter(t => t.status === "Aberto").length > 0 && (
              <div className="adm-notif-pill" onClick={() => setActiveTab("Tickets")}>
                <AlertCircle size={14} />
                {tickets.filter(t => t.status === "Aberto").length} tickets abertos
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="adm-content">
          {renderPanel()}
        </div>
      </div>

      {/* ══ MODALS ══ */}

      {/* Criar Desafio */}
      {isCreateOpen && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setIsCreateOpen(false)}>
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h3>Criar Desafio</h3>
              <button className="adm-modal-close" onClick={() => setIsCreateOpen(false)}>✕</button>
            </div>
            <label className="adm-label">Ícone</label>
            <select className="adm-input" value={newChallenge.icon}
              onChange={e => setNewChallenge({ ...newChallenge, icon: e.target.value })}>
              {availableIconNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <label className="adm-label">Título</label>
            <input className="adm-input" placeholder="Ex: Liderança" value={newChallenge.title}
              onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })} />
            <label className="adm-label">Descrição</label>
            <textarea className="adm-input" rows={3} placeholder="Descrição breve…" value={newChallenge.description}
              onChange={e => setNewChallenge({ ...newChallenge, description: e.target.value })} />
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</button>
              <button className="adm-btn adm-btn-primary" onClick={handleCreateChallenge}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Editar Usuário */}
      {editUser && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setEditUser(null)}>
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h3>Editar Usuário</h3>
              <button className="adm-modal-close" onClick={() => setEditUser(null)}>✕</button>
            </div>
            <label className="adm-label">Nome</label>
            <input className="adm-input" value={editUser.name || ""} placeholder="Nome completo"
              onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
            <label className="adm-label">E-mail</label>
            <input className="adm-input" type="email" value={editUser.email || ""}
              onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
            <label className="adm-label">Moedas</label>
            <input className="adm-input" type="number" value={editUser.coins}
              onChange={e => setEditUser({ ...editUser, coins: parseInt(e.target.value) || 0 })} />
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setEditUser(null)}>Cancelar</button>
              <button className="adm-btn adm-btn-primary" onClick={handleSaveUser}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Responder Ticket */}
      {activeTicket && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setActiveTicket(null)}>
          <div className="adm-modal adm-modal-lg">
            <div className="adm-modal-header">
              <h3>Responder Ticket</h3>
              <button className="adm-modal-close" onClick={() => setActiveTicket(null)}>✕</button>
            </div>
            <div className="adm-ticket-info">
              <p><strong>De:</strong> {activeTicket.profile?.name || activeTicket.name || "Visitante"}</p>
              <p><strong>Assunto:</strong> {activeTicket.subject}</p>
              {activeTicket.message && <p><strong>Mensagem:</strong> {activeTicket.message}</p>}
            </div>
            <label className="adm-label">Sua resposta</label>
            <textarea className="adm-input" rows={5} placeholder="Digite sua resposta…"
              value={replyText} onChange={e => setReplyText(e.target.value)} />
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setActiveTicket(null)}>Cancelar</button>
              <button className="adm-btn adm-btn-primary" onClick={handleSendReply}>Enviar Resposta</button>
            </div>
          </div>
        </div>
      )}

      {/* Editar Desafio */}
      {editChallenge && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setEditChallenge(null)}>
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h3>Editar Desafio</h3>
              <button className="adm-modal-close" onClick={() => setEditChallenge(null)}>✕</button>
            </div>
            <label className="adm-label">Título</label>
            <input className="adm-input" value={editChallenge.title}
              onChange={e => setEditChallenge({ ...editChallenge, title: e.target.value })} />
            <label className="adm-label">Descrição</label>
            <textarea className="adm-input" rows={3} value={editChallenge.description || ""}
              onChange={e => setEditChallenge({ ...editChallenge, description: e.target.value })} />
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setEditChallenge(null)}>Cancelar</button>
              <button className="adm-btn adm-btn-primary" onClick={handleSaveChallenge}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="adm-toast">
          <CheckCircle2 size={16} />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
