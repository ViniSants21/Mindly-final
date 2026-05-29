import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { progressService } from "../services/progressService";
import {
  Trophy,
  Flame,
  Zap,
  Star,
  Target,
  CheckCircle,
  Lock,
  Calendar,
  Edit3,
  LogOut,
  Award,
  TrendingUp,
} from "lucide-react";
import "../styles/profile.css";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function Skeleton({ width = "100%", height = 18, radius = 6 }) {
  return (
    <span
      className="pf-skeleton"
      style={{ width, height, borderRadius: radius, display: "block" }}
    />
  );
}

function StatCard({ icon, value, label, color, loading }) {
  return (
    <div className="pf-stat-card">
      <div className="pf-stat-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="pf-stat-body">
        {loading ? (
          <Skeleton width={44} height={20} />
        ) : (
          <span className="pf-stat-val">{value}</span>
        )}
        <span className="pf-stat-lbl">{label}</span>
      </div>
    </div>
  );
}

function AchievementCard({ achievement }) {
  const {
    unlocked, title, description, reward_coins, unlocked_at,
    required_challenges, current_challenges, progress_pct,
  } = achievement;

  const formattedDate = unlocked_at
    ? new Date(unlocked_at).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : null;

  if (unlocked) {
    return (
      <div className="pf-ach-card pf-ach-unlocked">
        <div className="pf-ach-icon">
          <Trophy size={22} color="#f59a3c" />
        </div>
        <div className="pf-ach-info">
          <h4>{title}</h4>
          <p>{description}</p>
          <div className="pf-ach-meta">
            <span className="pf-ach-coins">+{reward_coins} moedas</span>
            {formattedDate && (
              <span className="pf-ach-date">
                <Calendar size={10} />
                {formattedDate}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-ach-card pf-ach-locked">
      <div className="pf-ach-icon pf-ach-icon-locked">
        <Lock size={18} color="#bbb" />
      </div>
      <div className="pf-ach-info">
        <h4 className="pf-ach-locked-title">{title}</h4>
        <p className="pf-ach-locked-desc">{description}</p>
        <div className="pf-ach-progress">
          <div className="pf-ach-prog-bar">
            <div
              className="pf-ach-prog-fill"
              style={{ width: `${progress_pct}%` }}
            />
          </div>
          <span className="pf-ach-prog-text">
            {current_challenges}/{required_challenges}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function Profile() {
  const { user, session, logout } = useAuth();
  const navigate = useNavigate();
  const userId = session?.user?.id;

  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [achLoading, setAchLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;

    const [statsRes, achRes] = await Promise.allSettled([
      progressService.getStats(userId),
      progressService.listAchievements(userId),
    ]);

    if (statsRes.status === "fulfilled") setStats(statsRes.value);
    setStatsLoading(false);

    if (achRes.status === "fulfilled") setAchievements(achRes.value);
    setAchLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // XP dentro do nível (200 xp por nível)
  const xpInLevel = (user?.xp ?? 0) % 200;
  const xpPct = Math.min((xpInLevel / 200) * 100, 100);

  const unlockedAch = achievements.filter((a) => a.unlocked);
  const lockedAch   = achievements.filter((a) => !a.unlocked);

  const displayName   = user?.name || "Usuário Mindly";
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3f7fe3&color=fff&size=120&bold=true`;
  const roleLabel     = user?.role === "admin" ? "Administrador" : "Estudante";

  return (
    <div className="pf-page">

      {/* ===== HERO CARD ===== */}
      <div className="pf-hero-card">
        <div className="pf-hero-left">
          <img
            src={user?.photo || avatarFallback}
            alt="avatar"
            className="pf-avatar"
            onError={(e) => { e.target.src = avatarFallback; }}
          />

          <div className="pf-hero-info">
            <div className="pf-name-row">
              <h1>{displayName}</h1>
              <span className={`pf-role-badge ${user?.role === "admin" ? "pf-role-admin" : "pf-role-user"}`}>
                {roleLabel}
              </span>
            </div>

            {user?.username && (
              <p className="pf-username">@{user.username}</p>
            )}
            {user?.bio && <p className="pf-bio">{user.bio}</p>}
            {user?.email && <p className="pf-email">{user.email}</p>}

            {/* Barra de XP */}
            <div className="pf-xp-section">
              <div className="pf-xp-label">
                <span>Nível {user?.level ?? 1}</span>
                <span className="pf-xp-caption">{xpInLevel} / 200 XP para o próximo nível</span>
              </div>
              <div className="pf-xp-bar">
                <div className="pf-xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="pf-hero-actions">
          <button
            className="pf-btn pf-btn-edit"
            onClick={() => navigate("/editar-perfil")}
          >
            <Edit3 size={14} />
            Editar perfil
          </button>
          <button className="pf-btn pf-btn-logout" onClick={handleLogout}>
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </div>

      {/* ===== ESTATÍSTICAS ===== */}
      <div className="pf-stats-grid">
        <StatCard
          icon={<Zap size={17} />}
          value={user?.xp ?? 0}
          label="XP Total"
          color="#9b59b6"
          loading={false}
        />
        <StatCard
          icon={<Star size={17} />}
          value={`Nível ${user?.level ?? 1}`}
          label="Nível Atual"
          color="#f59a3c"
          loading={false}
        />
        <StatCard
          icon={<CheckCircle size={17} />}
          value={stats?.completed_challenges ?? 0}
          label="Desafios Concluídos"
          color="#27ae60"
          loading={statsLoading}
        />
        <StatCard
          icon={<Flame size={17} />}
          value={user?.streak ?? 0}
          label="Dias Consecutivos"
          color="#e74c3c"
          loading={false}
        />
        <StatCard
          icon={<Trophy size={17} />}
          value={stats?.unlocked_achievements ?? 0}
          label="Conquistas"
          color="#f59a3c"
          loading={statsLoading}
        />
        <StatCard
          icon={<TrendingUp size={17} />}
          value={`${stats?.completion_rate ?? 0}%`}
          label="Taxa de Conclusão"
          color="#3f7fe3"
          loading={statsLoading}
        />
        <StatCard
          icon={<Target size={17} />}
          value={stats?.in_progress_challenges ?? 0}
          label="Em Andamento"
          color="#1abc9c"
          loading={statsLoading}
        />
        <StatCard
          icon={<Award size={17} />}
          value={user?.coins ?? 0}
          label="Moedas"
          color="#e67e22"
          loading={false}
        />
      </div>

      {/* ===== CONQUISTAS ===== */}
      <div className="pf-section">
        <div className="pf-section-header">
          <div className="pf-section-bar" />
          <h2>Conquistas</h2>
          {!achLoading && achievements.length > 0 && (
            <span className="pf-ach-count">
              {unlockedAch.length} de {achievements.length} desbloqueadas
            </span>
          )}
        </div>

        {achLoading ? (
          <div className="pf-ach-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="pf-ach-card pf-ach-skeleton" />
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <div className="pf-empty">
            <Trophy size={38} color="#ddd" />
            <p>Nenhuma conquista disponível no momento.</p>
          </div>
        ) : (
          <>
            {/* Desbloqueadas */}
            {unlockedAch.length > 0 && (
              <>
                <p className="pf-ach-subtitle">Desbloqueadas</p>
                <div className="pf-ach-grid">
                  {unlockedAch.map((a) => (
                    <AchievementCard key={a.id} achievement={a} />
                  ))}
                </div>
              </>
            )}

            {unlockedAch.length === 0 && (
              <div className="pf-empty pf-empty-sm">
                <Trophy size={28} color="#ddd" />
                <p>Nenhuma conquista desbloqueada ainda. Continue estudando!</p>
              </div>
            )}

            {/* Em progresso */}
            {lockedAch.length > 0 && (
              <>
                <p className="pf-ach-subtitle pf-ach-subtitle-locked">
                  Em progresso
                </p>
                <div className="pf-ach-grid">
                  {lockedAch.map((a) => (
                    <AchievementCard key={a.id} achievement={a} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

    </div>
  );
}
