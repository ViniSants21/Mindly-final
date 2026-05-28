import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { progressService } from "../services/progressService";
import { getIcon } from "../lib/icons";
import Rewards from "../components/sections/Rewards";
import "../styles/performance.css";

function StatCard({ icon, value, label, color = "#3f7fe3" }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function AchievementCard({ achievement }) {
  const { unlocked, title, description, reward_coins, unlocked_at,
          required_challenges, current_challenges, progress_pct } = achievement;

  const formattedDate = unlocked_at
    ? new Date(unlocked_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  if (unlocked) {
    return (
      <div className="achievement-card active">
        <div className="achievement-trophy">🏆</div>
        <h3>{title}</h3>
        <p>{description}</p>
        <span className="achievement-reward">+{reward_coins} moedas</span>
        {formattedDate && (
          <span className="achievement-date">🗓 {formattedDate}</span>
        )}
      </div>
    );
  }

  return (
    <div className="achievement-card locked">
      <div className="lock-icon">
        {getIcon("lock", { size: 28, color: "#bbb" })}
      </div>
      <h3 className="locked-title">{title}</h3>
      <p className="locked-desc">{description}</p>
      <div className="achievement-progress-wrap">
        <div className="achievement-progress-bar">
          <div
            className="achievement-progress-fill"
            style={{ width: `${progress_pct}%` }}
          />
        </div>
        <span className="achievement-progress-text">
          {current_challenges}/{required_challenges} desafios
        </span>
      </div>
    </div>
  );
}

export default function Performance() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [achievements, setAchievements] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Verifica conquistas retroativamente (dados existentes antes da migration)
      const checkResult = await progressService.checkAchievements(userId);
      if (checkResult?.unlocked?.length > 0) {
        setNewlyUnlocked(checkResult.unlocked);
      }

      const [ach, subj, st] = await Promise.all([
        progressService.listAchievements(userId),
        progressService.listSubjectPerformance(userId),
        progressService.getStats(userId),
      ]);
      setAchievements(ach);
      setSubjects(subj);
      setStats(st);
    } catch (err) {
      console.error("Performance:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Calcula percentuais para o gráfico de pizza dinâmico
  const total = stats?.total_challenges || 0;
  const completedPct = stats?.completion_rate || 0;
  const inProgressPct = total > 0
    ? Math.round(((stats?.in_progress_challenges || 0) / total) * 100)
    : 0;
  const notStartedPct = Math.max(0, 100 - completedPct - inProgressPct);

  const donutGradient = `conic-gradient(
    #27ae60 0% ${completedPct}%,
    #3f7fe3 ${completedPct}% ${completedPct + inProgressPct}%,
    #e0e6f0 ${completedPct + inProgressPct}% 100%
  )`;

  return (
    <section className="performance">
      <div className="perf-container">

        {/* NOTIFICAÇÃO DE CONQUISTAS RECÉM DESBLOQUEADAS */}
        {newlyUnlocked.length > 0 && (
          <div className="unlocked-banner">
            <span>🏆</span>
            <div>
              <strong>Conquistas desbloqueadas!</strong>
              <span>{newlyUnlocked.map((a) => a.title).join(", ")}</span>
            </div>
            <button onClick={() => setNewlyUnlocked([])}>✕</button>
          </div>
        )}

        {/* ===== SEÇÃO 1: VISÃO GERAL (estatísticas reais) ===== */}
        <div className="perf-section">
          <div className="section-title">
            <div className="perf-bar" />
            <h2>Visão Geral</h2>
          </div>

          {loading ? (
            <div className="stats-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="stat-card skeleton" />
              ))}
            </div>
          ) : (
            <div className="stats-grid">
              <StatCard
                icon={getIcon("success", { size: 22 })}
                value={stats?.completed_challenges ?? 0}
                label="Desafios Concluídos"
                color="#27ae60"
              />
              <StatCard
                icon={getIcon("trending", { size: 22 })}
                value={`${stats?.completion_rate ?? 0}%`}
                label="Taxa de Conclusão"
                color="#3f7fe3"
              />
              <StatCard
                icon="🏆"
                value={stats?.unlocked_achievements ?? 0}
                label="Conquistas"
                color="#f59a3c"
              />
              <StatCard
                icon="🔥"
                value={stats?.streak ?? 0}
                label="Dias Consecutivos"
                color="#e74c3c"
              />
              <StatCard
                icon="⚡"
                value={stats?.xp ?? 0}
                label="XP Total"
                color="#9b59b6"
              />
              <StatCard
                icon={getIcon("star", { size: 22 })}
                value={`Nível ${stats?.level ?? 1}`}
                label="Nível Atual"
                color="#f59a3c"
              />
              <StatCard
                icon="📅"
                value={stats?.study_days_this_week ?? 0}
                label="Dias de Estudo (semana)"
                color="#1abc9c"
              />
              <StatCard
                icon={getIcon("coins", { size: 22 })}
                value={stats?.coins ?? 0}
                label="Moedas"
                color="#e67e22"
              />
            </div>
          )}
        </div>

        {/* ===== SEÇÃO 2: CONQUISTAS ===== */}
        <div className="perf-section">
          <div className="section-title">
            <div className="perf-bar" />
            <h2>Conquistas</h2>
          </div>

          <div className="achievements-grid">
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="achievement-card locked skeleton" />
                ))
              : achievements.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
          </div>
        </div>

        {/* ===== SEÇÃO 3: DESEMPENHO ===== */}
        <div className="perf-section">
          <div className="section-title">
            <div className="perf-bar" />
            <h2>Desempenho</h2>
          </div>

          <div className="performance-grid">
            {/* GRÁFICO REAL baseado em dados do banco */}
            <div className="perf-card chart-card">
              <h3>Progresso Geral</h3>
              {loading ? (
                <div className="chart-skeleton" />
              ) : (
                <>
                  <div
                    className="donut-chart"
                    style={{ background: donutGradient }}
                  >
                    <div className="donut-hole">
                      <span className="donut-pct">{completedPct}%</span>
                      <span className="donut-sub">concluído</span>
                    </div>
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#27ae60" }} />
                      <span>Concluídos ({stats?.completed_challenges ?? 0})</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#3f7fe3" }} />
                      <span>Em andamento ({stats?.in_progress_challenges ?? 0})</span>
                    </div>
                    {notStartedPct > 0 && (
                      <div className="legend-item">
                        <span className="legend-dot" style={{ background: "#e0e6f0" }} />
                        <span>Não iniciados</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* PROGRESSO POR DISCIPLINA */}
            <div className="perf-card progress-card">
              <h3>Progresso por Disciplina</h3>
              {loading ? (
                <div className="progress-skeleton" />
              ) : subjects.length === 0 ? (
                <p className="empty-msg">
                  Estude e conclua desafios para ver seu progresso aqui.
                </p>
              ) : (
                subjects.map((s) => (
                  <div key={s.id} className="progress-item">
                    <div className="progress-label">
                      <span>{s.subject}</span>
                      <span className="progress-pct">{s.percentage}%</span>
                    </div>
                    <div className="subject-bar">
                      <div
                        className="subject-fill"
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}

              {/* Métricas adicionais de estudo */}
              {!loading && stats && (
                <div className="study-extra">
                  <div className="study-stat">
                    <span className="study-stat-val">{stats.study_days_this_week}</span>
                    <span className="study-stat-lbl">dias esta semana</span>
                  </div>
                  <div className="study-stat">
                    <span className="study-stat-val">{stats.study_days_this_month}</span>
                    <span className="study-stat-lbl">dias este mês</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== SEÇÃO 4: RECOMPENSAS ===== */}
        <Rewards />

      </div>
    </section>
  );
}
