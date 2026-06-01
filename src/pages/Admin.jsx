import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard, Users, Target, MessageSquare, TrendingUp,
  Zap, Trophy, HelpCircle, CheckCircle2, Clock, AlertCircle,
  ShieldCheck, BarChart2, UserPlus, Star, Search, RefreshCw,
  ChevronRight, Award, Flame, BookOpen, ListChecks, Trash2, Pencil,
} from "lucide-react";
import { getIcon, availableIconNames } from "../lib/icons";
import { adminService } from "../services/adminService";
import { challengesService } from "../services/challengesService";
import { trailsService } from "../services/trailsService";
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

  // Questions state
  const [questions, setQuestions]                 = useState([]);
  const [questionFilter, setQuestionFilter]       = useState("");
  const [editQuestion, setEditQuestion]           = useState(null);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [newQuestion, setNewQuestion]             = useState({ challenge_id: "", question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a" });

  // Trails state
  const [trails, setTrails]                 = useState([]);
  const [trailFilter, setTrailFilter]       = useState("");
  const [editTrail, setEditTrail]           = useState(null);
  const [isCreateTrailOpen, setIsCreateTrailOpen] = useState(false);
  const [newTrail, setNewTrail]             = useState({ titulo: "", nivel: "Fácil", tempo: "30 min", xp: 50, icon: "brain", conteudo: "", curiosidade: "", exemploPratico: "", dica: "" });

  // Toggle de status de desafio — rastreia qual está sendo alterado
  const [togglingChallengeId, setTogglingChallengeId] = useState(null);

  // Modals
  const [editUser, setEditUser]             = useState(null);
  const [editChallenge, setEditChallenge]   = useState(null);
  const [activeTicket, setActiveTicket]     = useState(null);
  const [isCreateOpen, setIsCreateOpen]     = useState(false);
  const [newChallenge, setNewChallenge]     = useState({ title: "", description: "", icon: "star" });
  const [replyText, setReplyText]           = useState("");

  /* Load main data (users, challenges, tickets, questions, trails) */
  const loadMain = useCallback(async () => {
    setLoadingMain(true);
    try {
      const [u, c, t, q, tr] = await Promise.all([
        adminService.listUsers(),
        challengesService.listAll(),
        adminService.listTickets(),
        challengesService.listAllQuestions().catch(() => []),
        trailsService.listAll().catch(() => []),
      ]);
      setUsers(u);
      setChallenges(c);
      setTickets(t);
      setQuestions(q);
      setTrails(tr);
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
    if (togglingChallengeId) return; // impede cliques duplos durante o request
    const nextStatus = c.status === "Ativo" ? "Suspenso" : "Ativo";
    setTogglingChallengeId(c.id);
    try {
      const updated = await challengesService.setStatus(c.id, nextStatus);
      setChallenges(prev => prev.map(x => x.id === updated.id ? updated : x));
      showToast(
        nextStatus === "Suspenso"
          ? `Desafio "${c.title}" suspenso com sucesso.`
          : `Desafio "${c.title}" reativado com sucesso.`
      );
    } catch (err) {
      console.error("[toggleChallengeStatus]", err);
      showToast("Erro ao alterar status: " + err.message);
    } finally {
      setTogglingChallengeId(null);
    }
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

  /* ── Question handlers ── */
  const handleCreateQuestion = async () => {
    if (!newQuestion.challenge_id || !newQuestion.question || !newQuestion.option_a || !newQuestion.option_b) {
      showToast("Preencha desafio, pergunta e ao menos as opções A e B.");
      return;
    }
    try {
      const created = await challengesService.createQuestion(newQuestion);
      setQuestions(prev => [...prev, created]);
      setIsCreateQuestionOpen(false);
      setNewQuestion({ challenge_id: "", question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a" });
      showToast("Pergunta criada!");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const handleSaveQuestion = async () => {
    try {
      const { id, challenge, ...updates } = editQuestion;
      const updated = await challengesService.updateQuestion(id, updates);
      setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
      setEditQuestion(null);
      showToast("Pergunta atualizada!");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const deleteQuestion = async (id) => {
    try {
      await challengesService.removeQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      showToast("Pergunta removida.");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  /* ── Trail handlers ── */
  const handleCreateTrail = async () => {
    if (!newTrail.titulo || !newTrail.conteudo) {
      showToast("Preencha título e conteúdo do módulo.");
      return;
    }
    try {
      const maxPos = trails.reduce((max, t) => Math.max(max, t.position || 0), 0);
      const created = await trailsService.create({ ...newTrail, position: maxPos + 1 });
      setTrails(prev => [...prev, created]);
      setIsCreateTrailOpen(false);
      setNewTrail({ titulo: "", nivel: "Fácil", tempo: "30 min", xp: 50, icon: "brain", conteudo: "", curiosidade: "", exemploPratico: "", dica: "", status: "Ativo" });
      showToast("Módulo criado!");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const handleSaveTrail = async () => {
    try {
      const { id, ...updates } = editTrail;
      const updated = await trailsService.update(id, updates);
      setTrails(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditTrail(null);
      showToast("Módulo atualizado!");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const deleteTrail = async (id) => {
    try {
      await trailsService.remove(id);
      setTrails(prev => prev.filter(t => t.id !== id));
      showToast("Módulo removido.");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const toggleTrailStatus = async (trail) => {
    try {
      const updated = await trailsService.toggleStatus(trail.id, trail.status);
      setTrails(prev => prev.map(t => t.id === updated.id ? updated : t));
      showToast(updated.status === "Ativo" ? "Módulo ativado!" : "Módulo desativado.");
    } catch (err) { showToast("Erro: " + err.message); }
  };

  const moveTrail = async (trail, direction) => {
    const sorted = [...trails].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex(t => t.id === trail.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const neighbor = sorted[swapIdx];
    try {
      const [updA, updB] = await Promise.all([
        trailsService.updatePosition(trail.id, neighbor.position),
        trailsService.updatePosition(neighbor.id, trail.position),
      ]);
      setTrails(prev => prev.map(t => {
        if (t.id === updA.id) return { ...t, position: updA.position };
        if (t.id === updB.id) return { ...t, position: updB.position };
        return t;
      }));
    } catch (err) { showToast("Erro ao reordenar: " + err.message); }
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

  const filteredQuestions = useMemo(() =>
    questions.filter(q =>
      q.question?.toLowerCase().includes(questionFilter.toLowerCase()) ||
      q.challenge?.title?.toLowerCase().includes(questionFilter.toLowerCase())
    ), [questions, questionFilter]);

  const filteredTrails = useMemo(() =>
    trails.filter(t => t.titulo?.toLowerCase().includes(trailFilter.toLowerCase())),
    [trails, trailFilter]);

  /* ── Sidebar nav ── */
  const nav = [
    { key: "Dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { key: "Usuários",  icon: <Users size={18} />,           label: "Usuários" },
    { key: "Desafios",  icon: <Target size={18} />,          label: "Desafios" },
    { key: "Perguntas", icon: <HelpCircle size={18} />,      label: "Perguntas" },
    { key: "Trilhas",   icon: <BookOpen size={18} />,        label: "Trilhas" },
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
              {filteredChallenges.map(c => {
                const isToggling = togglingChallengeId === c.id;
                return (
                <tr key={c.id} style={{ opacity: isToggling ? 0.65 : 1, transition: "opacity .2s" }}>
                  <td style={{ textAlign: "center" }}>{getIcon(c.icon, { size: 26 })}</td>
                  <td><strong>{c.title}</strong></td>
                  <td className="adm-td-muted">{c.description || "—"}</td>
                  <td>
                    <span className={`adm-badge ${c.status === "Ativo" ? "adm-badge-active" : "adm-badge-inactive"}`}
                      style={{ fontWeight: 700, fontSize: 12 }}>
                      {isToggling ? "Atualizando…" : c.status}
                    </span>
                  </td>
                  <td>
                    <div className="adm-actions">
                      <button
                        className="adm-btn adm-btn-ghost"
                        onClick={() => setEditChallenge(c)}
                        disabled={isToggling}
                      >
                        Editar
                      </button>
                      <button
                        className={`adm-btn ${c.status === "Ativo" ? "adm-btn-warn" : "adm-btn-success"}`}
                        onClick={() => toggleChallengeStatus(c)}
                        disabled={isToggling}
                        title={c.status === "Ativo" ? "Suspender este desafio" : "Reativar este desafio"}
                      >
                        {isToggling
                          ? "Aguarde…"
                          : c.status === "Ativo" ? "Suspender" : "Reativar"
                        }
                      </button>
                      <button
                        className="adm-btn adm-btn-danger"
                        onClick={() => deleteChallenge(c.id)}
                        disabled={isToggling}
                      >
                        Apagar
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
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

  /* ═══════════════════════════════════════
     QUESTIONS PANEL
  ═══════════════════════════════════════ */
  const QuestionsPanel = () => (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <div>
          <h2>Perguntas</h2>
          <span className="adm-panel-count">{filteredQuestions.length} perguntas</span>
        </div>
        <div className="adm-panel-actions">
          <div className="adm-search-wrap">
            <Search size={15} className="adm-search-icon" />
            <input className="adm-search" placeholder="Buscar pergunta ou desafio…"
              value={questionFilter} onChange={e => setQuestionFilter(e.target.value)} />
          </div>
          <button className="adm-btn adm-btn-primary" onClick={() => setIsCreateQuestionOpen(true)}>
            + Criar Pergunta
          </button>
        </div>
      </div>

      {loadingMain ? (
        <div className="adm-table-skeleton">
          {[...Array(4)].map((_, i) => <Skeleton key={i} h={52} r={6} />)}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <p className="adm-empty-mini" style={{ padding: "32px", textAlign: "center" }}>
          Nenhuma pergunta encontrada. Clique em "+ Criar Pergunta" para adicionar.
        </p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Desafio</th>
                <th>Pergunta</th>
                <th>Resp. Correta</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map(q => (
                <tr key={q.id}>
                  <td><span className="adm-badge adm-badge-level">{q.challenge?.title || "—"}</span></td>
                  <td style={{ maxWidth: 280 }}>
                    <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.4, display: "block",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.question}
                    </span>
                  </td>
                  <td>
                    <span className="adm-badge adm-badge-active" style={{ textTransform: "uppercase" }}>
                      {q.correct_answer}
                    </span>
                  </td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn adm-btn-ghost" onClick={() => setEditQuestion({ ...q })}>
                        <Pencil size={13} /> Editar
                      </button>
                      <button className="adm-btn adm-btn-danger" onClick={() => deleteQuestion(q.id)}>
                        <Trash2 size={13} /> Apagar
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
     TRAILS PANEL — CRUD completo com status e reordenação
  ═══════════════════════════════════════ */
  const TrailsPanel = () => {
    const sorted = [...filteredTrails].sort((a, b) => a.position - b.position);
    const allSorted = [...trails].sort((a, b) => a.position - b.position);
    return (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <div>
          <h2>Trilhas de Aprendizagem</h2>
          <span className="adm-panel-count">
            {trails.filter(t => t.status === "Ativo").length} ativos ·{" "}
            {trails.filter(t => t.status === "Inativo").length} inativos
          </span>
        </div>
        <div className="adm-panel-actions">
          <div className="adm-search-wrap">
            <Search size={15} className="adm-search-icon" />
            <input className="adm-search" placeholder="Buscar módulo…"
              value={trailFilter} onChange={e => setTrailFilter(e.target.value)} />
          </div>
          <button className="adm-btn adm-btn-primary" onClick={() => setIsCreateTrailOpen(true)}>
            + Criar Módulo
          </button>
        </div>
      </div>

      {loadingMain ? (
        <div className="adm-table-skeleton">
          {[...Array(5)].map((_, i) => <Skeleton key={i} h={52} r={6} />)}
        </div>
      ) : sorted.length === 0 ? (
        <p className="adm-empty-mini" style={{ padding: "32px", textAlign: "center" }}>
          Nenhum módulo encontrado. Clique em "+ Criar Módulo" para adicionar.
        </p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Ordem</th>
                <th style={{ width: 40 }}>Ícone</th>
                <th>Título</th>
                <th>Nível</th>
                <th>Tempo</th>
                <th>XP</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, idx) => {
                const globalIdx = allSorted.findIndex(x => x.id === t.id);
                return (
                <tr key={t.id} style={{ opacity: t.status === "Inativo" ? 0.6 : 1 }}>
                  <td>
                    <div className="adm-actions" style={{ gap: 2 }}>
                      <button
                        className="adm-btn adm-btn-ghost"
                        style={{ padding: "4px 7px", fontSize: 11 }}
                        onClick={() => moveTrail(t, -1)}
                        disabled={globalIdx === 0}
                        title="Mover para cima"
                      >▲</button>
                      <button
                        className="adm-btn adm-btn-ghost"
                        style={{ padding: "4px 7px", fontSize: 11 }}
                        onClick={() => moveTrail(t, 1)}
                        disabled={globalIdx === allSorted.length - 1}
                        title="Mover para baixo"
                      >▼</button>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>{getIcon(t.icon, { size: 22 })}</td>
                  <td>
                    <strong style={{ fontSize: 13 }}>{t.titulo}</strong>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>ID: {t.id} · Pos: {t.position}</div>
                  </td>
                  <td>
                    <span className={`adm-badge ${t.nivel === "Fácil" ? "adm-badge-active" : t.nivel === "Médio" ? "adm-badge-warn" : "adm-badge-level"}`}>
                      {t.nivel}
                    </span>
                  </td>
                  <td className="adm-td-muted">{t.tempo}</td>
                  <td><strong style={{ color: "#f59a3c" }}>{t.xp} XP</strong></td>
                  <td>
                    <span className={`adm-badge ${t.status === "Ativo" ? "adm-badge-active" : "adm-badge-inactive"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn adm-btn-ghost"
                        onClick={() => setEditTrail({ ...t, exemploPratico: t.exemploPratico || "" })}>
                        <Pencil size={13} /> Editar
                      </button>
                      <button
                        className={`adm-btn ${t.status === "Ativo" ? "adm-btn-warn" : "adm-btn-success"}`}
                        onClick={() => toggleTrailStatus(t)}>
                        {t.status === "Ativo" ? "Desativar" : "Ativar"}
                      </button>
                      <button className="adm-btn adm-btn-danger" onClick={() => deleteTrail(t.id)}>
                        <Trash2 size={13} /> Apagar
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );};

  const renderPanel = () => {
    switch (activeTab) {
      case "Usuários":  return <UsersPanel />;
      case "Desafios":  return <ChallengesPanel />;
      case "Perguntas": return <QuestionsPanel />;
      case "Trilhas":   return <TrailsPanel />;
      case "Tickets":   return <TicketsPanel />;
      default:          return <DashboardPanel />;
    }
  };

  const tabLabels = {
    Dashboard: "Visão Geral",
    Usuários:  "Gerenciar Usuários",
    Desafios:  "Gerenciar Desafios",
    Perguntas: "Gerenciar Perguntas",
    Trilhas:   "Gerenciar Trilhas",
    Tickets:   "Suporte",
  };

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

      {/* ══ Criar Pergunta ══ */}
      {isCreateQuestionOpen && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setIsCreateQuestionOpen(false)}>
          <div className="adm-modal adm-modal-lg">
            <div className="adm-modal-header">
              <h3>Criar Pergunta</h3>
              <button className="adm-modal-close" onClick={() => setIsCreateQuestionOpen(false)}>✕</button>
            </div>
            <label className="adm-label">Desafio</label>
            <select className="adm-input" value={newQuestion.challenge_id}
              onChange={e => setNewQuestion({ ...newQuestion, challenge_id: e.target.value })}>
              <option value="">— Selecione o desafio —</option>
              {challenges.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <label className="adm-label">Pergunta</label>
            <textarea className="adm-input" rows={2} placeholder="Texto da pergunta…"
              value={newQuestion.question} onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })} />
            <label className="adm-label">Opção A</label>
            <input className="adm-input" placeholder="Opção A" value={newQuestion.option_a}
              onChange={e => setNewQuestion({ ...newQuestion, option_a: e.target.value })} />
            <label className="adm-label">Opção B</label>
            <input className="adm-input" placeholder="Opção B" value={newQuestion.option_b}
              onChange={e => setNewQuestion({ ...newQuestion, option_b: e.target.value })} />
            <label className="adm-label">Opção C (opcional)</label>
            <input className="adm-input" placeholder="Opção C" value={newQuestion.option_c}
              onChange={e => setNewQuestion({ ...newQuestion, option_c: e.target.value })} />
            <label className="adm-label">Opção D (opcional)</label>
            <input className="adm-input" placeholder="Opção D" value={newQuestion.option_d}
              onChange={e => setNewQuestion({ ...newQuestion, option_d: e.target.value })} />
            <label className="adm-label">Resposta Correta</label>
            <select className="adm-input" value={newQuestion.correct_answer}
              onChange={e => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}>
              <option value="a">A</option>
              <option value="b">B</option>
              <option value="c">C</option>
              <option value="d">D</option>
            </select>
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setIsCreateQuestionOpen(false)}>Cancelar</button>
              <button className="adm-btn adm-btn-primary" onClick={handleCreateQuestion}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Editar Pergunta ══ */}
      {editQuestion && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setEditQuestion(null)}>
          <div className="adm-modal adm-modal-lg">
            <div className="adm-modal-header">
              <h3>Editar Pergunta</h3>
              <button className="adm-modal-close" onClick={() => setEditQuestion(null)}>✕</button>
            </div>
            <label className="adm-label">Desafio</label>
            <select className="adm-input" value={editQuestion.challenge_id}
              onChange={e => setEditQuestion({ ...editQuestion, challenge_id: e.target.value })}>
              {challenges.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <label className="adm-label">Pergunta</label>
            <textarea className="adm-input" rows={2} value={editQuestion.question}
              onChange={e => setEditQuestion({ ...editQuestion, question: e.target.value })} />
            <label className="adm-label">Opção A</label>
            <input className="adm-input" value={editQuestion.option_a || ""}
              onChange={e => setEditQuestion({ ...editQuestion, option_a: e.target.value })} />
            <label className="adm-label">Opção B</label>
            <input className="adm-input" value={editQuestion.option_b || ""}
              onChange={e => setEditQuestion({ ...editQuestion, option_b: e.target.value })} />
            <label className="adm-label">Opção C</label>
            <input className="adm-input" value={editQuestion.option_c || ""}
              onChange={e => setEditQuestion({ ...editQuestion, option_c: e.target.value })} />
            <label className="adm-label">Opção D</label>
            <input className="adm-input" value={editQuestion.option_d || ""}
              onChange={e => setEditQuestion({ ...editQuestion, option_d: e.target.value })} />
            <label className="adm-label">Resposta Correta</label>
            <select className="adm-input" value={editQuestion.correct_answer}
              onChange={e => setEditQuestion({ ...editQuestion, correct_answer: e.target.value })}>
              <option value="a">A</option>
              <option value="b">B</option>
              <option value="c">C</option>
              <option value="d">D</option>
            </select>
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setEditQuestion(null)}>Cancelar</button>
              <button className="adm-btn adm-btn-primary" onClick={handleSaveQuestion}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Criar Módulo de Trilha ══ */}
      {isCreateTrailOpen && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setIsCreateTrailOpen(false)}>
          <div className="adm-modal adm-modal-lg" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="adm-modal-header">
              <h3>Criar Módulo de Trilha</h3>
              <button className="adm-modal-close" onClick={() => setIsCreateTrailOpen(false)}>✕</button>
            </div>
            <label className="adm-label">Título do Módulo</label>
            <input className="adm-input" placeholder="Ex: Introdução ao TDAH" value={newTrail.titulo}
              onChange={e => setNewTrail({ ...newTrail, titulo: e.target.value })} />
            <label className="adm-label">Nível</label>
            <select className="adm-input" value={newTrail.nivel}
              onChange={e => setNewTrail({ ...newTrail, nivel: e.target.value })}>
              <option>Fácil</option><option>Médio</option><option>Avançado</option>
            </select>
            <label className="adm-label">Ícone</label>
            <select className="adm-input" value={newTrail.icon}
              onChange={e => setNewTrail({ ...newTrail, icon: e.target.value })}>
              {availableIconNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <label className="adm-label">Tempo estimado</label>
            <input className="adm-input" placeholder="Ex: 30 min" value={newTrail.tempo}
              onChange={e => setNewTrail({ ...newTrail, tempo: e.target.value })} />
            <label className="adm-label">XP concedido</label>
            <input className="adm-input" type="number" min={0} value={newTrail.xp}
              onChange={e => setNewTrail({ ...newTrail, xp: parseInt(e.target.value) || 0 })} />
            <label className="adm-label">Conteúdo</label>
            <textarea className="adm-input" rows={4} placeholder="Conteúdo principal do módulo…"
              value={newTrail.conteudo} onChange={e => setNewTrail({ ...newTrail, conteudo: e.target.value })} />
            <label className="adm-label">Curiosidade (opcional)</label>
            <textarea className="adm-input" rows={2} placeholder="Fato curioso relacionado ao tema…"
              value={newTrail.curiosidade} onChange={e => setNewTrail({ ...newTrail, curiosidade: e.target.value })} />
            <label className="adm-label">Exemplo Prático (opcional)</label>
            <textarea className="adm-input" rows={2} placeholder="Exemplo do cotidiano…"
              value={newTrail.exemploPratico} onChange={e => setNewTrail({ ...newTrail, exemploPratico: e.target.value })} />
            <label className="adm-label">Dica</label>
            <textarea className="adm-input" rows={2} placeholder="Dica prática para o aluno…"
              value={newTrail.dica} onChange={e => setNewTrail({ ...newTrail, dica: e.target.value })} />
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setIsCreateTrailOpen(false)}>Cancelar</button>
              <button className="adm-btn adm-btn-primary" onClick={handleCreateTrail}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Editar Módulo de Trilha ══ */}
      {editTrail && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setEditTrail(null)}>
          <div className="adm-modal adm-modal-lg" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="adm-modal-header">
              <h3>Editar Módulo</h3>
              <button className="adm-modal-close" onClick={() => setEditTrail(null)}>✕</button>
            </div>
            <label className="adm-label">Título</label>
            <input className="adm-input" value={editTrail.titulo}
              onChange={e => setEditTrail({ ...editTrail, titulo: e.target.value })} />
            <label className="adm-label">Nível</label>
            <select className="adm-input" value={editTrail.nivel}
              onChange={e => setEditTrail({ ...editTrail, nivel: e.target.value })}>
              <option>Fácil</option><option>Médio</option><option>Avançado</option>
            </select>
            <label className="adm-label">Ícone</label>
            <select className="adm-input" value={editTrail.icon}
              onChange={e => setEditTrail({ ...editTrail, icon: e.target.value })}>
              {availableIconNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <label className="adm-label">Tempo</label>
            <input className="adm-input" value={editTrail.tempo}
              onChange={e => setEditTrail({ ...editTrail, tempo: e.target.value })} />
            <label className="adm-label">XP</label>
            <input className="adm-input" type="number" min={0} value={editTrail.xp}
              onChange={e => setEditTrail({ ...editTrail, xp: parseInt(e.target.value) || 0 })} />
            <label className="adm-label">Conteúdo</label>
            <textarea className="adm-input" rows={4} value={editTrail.conteudo}
              onChange={e => setEditTrail({ ...editTrail, conteudo: e.target.value })} />
            <label className="adm-label">Curiosidade</label>
            <textarea className="adm-input" rows={2} value={editTrail.curiosidade || ""}
              onChange={e => setEditTrail({ ...editTrail, curiosidade: e.target.value })} />
            <label className="adm-label">Exemplo Prático</label>
            <textarea className="adm-input" rows={2} value={editTrail.exemploPratico || editTrail.exemplo_pratico || ""}
              onChange={e => setEditTrail({ ...editTrail, exemploPratico: e.target.value })} />
            <label className="adm-label">Dica</label>
            <textarea className="adm-input" rows={2} value={editTrail.dica || ""}
              onChange={e => setEditTrail({ ...editTrail, dica: e.target.value })} />
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setEditTrail(null)}>Cancelar</button>
              <button className="adm-btn adm-btn-primary" onClick={handleSaveTrail}>Salvar</button>
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
