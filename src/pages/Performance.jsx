import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { progressService } from "../services/progressService";
import { getIcon } from "../lib/icons";
import Rewards from "../components/sections/Rewards";
import "../styles/performance.css";

export default function Performance() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [achievements, setAchievements] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [ach, subj] = await Promise.all([
        progressService.listAchievements(userId),
        progressService.listSubjectPerformance(userId),
      ]);
      setAchievements(ach);
      setSubjects(subj);
    } catch (err) {
      console.error("Performance:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="performance">
      <div className="container">
        {/* CONQUISTAS */}
        <div className="section">
          <div className="section-title">
            <div className="bar" />
            <h2>Conquistas</h2>
          </div>

          <div className="achievements-grid">
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="achievement-card locked">
                    <div className="locked-content">
                      <p>Carregando…</p>
                    </div>
                  </div>
                ))
              : achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`achievement-card ${a.unlocked ? "active" : "locked"}`}
                  >
                    {a.unlocked ? (
                      <>
                        <h3>{a.title}</h3>
                        <p>{a.description}</p>
                        <span>+{a.reward_coins} coins</span>
                      </>
                    ) : (
                      <div className="locked-content">
                        <div className="lock-icon">
                          {getIcon("lock", { size: 36, color: "#999" })}
                        </div>
                        <h3>Bloqueado</h3>
                        <p style={{ fontSize: 12, marginTop: 5 }}>{a.description}</p>
                      </div>
                    )}
                  </div>
                ))}
          </div>
        </div>

        {/* DESEMPENHO */}
        <div className="section">
          <div className="section-title">
            <div className="bar" />
            <h2>Desempenho</h2>
          </div>

          <div className="performance-grid">
            <div className="card chart">
              <h3>Distribuição de tempo</h3>
              <div className="fake-chart" />
            </div>

            <div className="card progress">
              <h3>Progresso por disciplina</h3>
              {subjects.length === 0 ? (
                <p style={{ color: "#666", fontSize: 14 }}>
                  Estude e conclua desafios para ver seu progresso aqui.
                </p>
              ) : (
                subjects.map((s) => (
                  <div key={s.id} className="progress-item">
                    <div className="progress-label">
                      <span>{s.subject}</span>
                      <span>{s.percentage}%</span>
                    </div>
                    <div className="progress-bar">
                      <div style={{ width: `${s.percentage}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RECOMPENSAS */}
        <Rewards />
      </div>
    </section>
  );
}
