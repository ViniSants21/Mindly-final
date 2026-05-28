import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { challengesService } from "../services/challengesService";
import { getIcon } from "../lib/icons";
import { games } from "../data/content";
import { useToast } from "../hooks/useToast";
import "../styles/challenges.css";

export default function Challenges() {
  const { session, refreshProfile } = useAuth();
  const userId = session?.user?.id;

  const [progressMap, setProgressMap] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeGame, setActiveGame] = useState(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);

  // Toast para feedback de conquistas desbloqueadas
  const { message: toastMsg, showToast } = useToast(4000);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const active = await challengesService.listActive();
      await Promise.all(
        active.map((c) => challengesService.ensureProgress(userId, c.id))
      );
      const prog = await challengesService.listUserProgress(userId);
      setProgressMap(prog);
    } catch (err) {
      console.error("Challenges:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeGame && modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeGame]);

  const ongoing = progressMap.filter((p) => p.progress < 100);
  const completed = progressMap.filter((p) => p.progress >= 100);

  const openGame = (progressEntry) => {
    // Distribui jogos pelos desafios em andamento (rotação pelo índice)
    const idx = ongoing.indexOf(progressEntry) % games.length;
    setActiveGame({ ...games[idx], challengeId: progressEntry.challenge_id });
    setMessage("");
    setAnswer("");
  };

  const closeModal = () => {
    setActiveGame(null);
    setMessage("");
    setAnswer("");
  };

  const checkAnswer = async () => {
    if (!activeGame || submitting) return;
    const correct =
      answer.trim().toLowerCase() === activeGame.answer.toLowerCase();

    if (correct) {
      setMessage("✅ Acertou!!");

      if (activeGame.challengeId && userId) {
        setSubmitting(true);
        try {
          const result = await challengesService.addProgress(
            userId,
            activeGame.challengeId,
            activeGame.reward
          );

          // Exibe toast para cada conquista desbloqueada nesta jogada
          const unlocked = result?.newly_unlocked || [];
          unlocked.forEach((ach) => {
            showToast(
              `🏆 Conquista desbloqueada: "${ach.title}"! +${ach.reward_coins} moedas`
            );
          });

          await Promise.all([load(), refreshProfile()]);
        } catch (err) {
          console.error(err.message);
        } finally {
          setSubmitting(false);
        }
      }
    } else {
      setMessage("❌ Errou! Tente novamente.");
    }

    setTimeout(() => setMessage(""), 2500);
    setAnswer("");
  };

  return (
    <section className="challenges">
      <div className="challenges-container">

        {/* TÍTULO DA PÁGINA */}
        <div className="challenges-title">
          {getIcon("target", { size: 32, color: "#3f7fe3" })}
          <h1>Trilha de Aprendizagem</h1>
        </div>

        {/* DESAFIOS EM ANDAMENTO */}
        <div className="challenges-section">
          <h2>
            <span className="section-bar" />
            Desafios em andamento
          </h2>
          <div className="challenges-list">
            {loading ? (
              <div className="empty-state">Carregando desafios…</div>
            ) : ongoing.length === 0 ? (
              <div className="empty-state">
                {getIcon("success", { size: 20, color: "#32cd32" })}
                Nenhum desafio em andamento. Bom trabalho! 🎉
              </div>
            ) : (
              ongoing.map((p) => (
                <div key={p.id} className="challenge-card ongoing">
                  <div className="challenge-left">
                    <div className="challenge-icon">
                      {getIcon(p.challenge?.icon, { size: 26 })}
                    </div>
                    <div className="challenge-info">
                      <h3>{p.challenge?.title}</h3>
                      <p>{p.challenge?.description}</p>
                    </div>
                  </div>
                  <div className="challenge-middle">
                    <span className="challenge-badge ongoing-badge">
                      Em Andamento
                    </span>
                  </div>
                  <div className="challenge-right">
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{p.progress}%</span>
                    </div>
                    <button
                      className="challenge-btn"
                      onClick={() => openGame(p)}
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DESAFIOS CONCLUÍDOS */}
        <div className="challenges-section">
          <h2>
            <span className="section-bar" />
            Desafios concluídos
          </h2>
          <div className="challenges-list">
            {completed.length === 0 ? (
              <div className="empty-state">
                {getIcon("award", { size: 20, color: "#999" })}
                Você ainda não concluiu desafios. Vá em frente!
              </div>
            ) : (
              completed.map((p) => (
                <div key={p.id} className="challenge-card completed">
                  <div className="challenge-left">
                    <div className="challenge-icon completed-icon">
                      {getIcon(p.challenge?.icon, { size: 26 })}
                    </div>
                    <div className="challenge-info">
                      <h3>{p.challenge?.title}</h3>
                      <p>{p.challenge?.description}</p>
                    </div>
                  </div>
                  <div className="challenge-middle">
                    <span className="challenge-badge completed-badge">
                      ✓ Concluído
                    </span>
                  </div>
                  <div className="challenge-right">
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div className="progress-fill completed-fill" style={{ width: "100%" }} />
                      </div>
                      <span className="progress-text">100%</span>
                    </div>
                    <button className="challenge-btn done-btn" disabled>
                      Concluído
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* JOGOS */}
        <div className="challenges-section">
          <h2>
            <span className="section-bar" />
            Jogos de Prática
          </h2>
          <div className="games-grid">
            {games.map((game) => (
              <div key={game.id} className="game-card">
                <div className="game-card-icon">
                  {getIcon("lightning", { size: 28, color: "#f59a3c" })}
                </div>
                <h3>{game.title}</h3>
                <p>{game.description}</p>
                <button className="game-btn" onClick={() => setActiveGame(game)}>
                  Jogar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE JOGO */}
      {activeGame && (
        <div className="game-overlay" ref={modalRef} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="game-modal">
            <button className="close-btn" onClick={closeModal} aria-label="Fechar">
              ✕
            </button>

            <div className="game-modal-icon">
              {getIcon("lightning", { size: 32, color: "#f59a3c" })}
            </div>
            <h2>{activeGame.title}</h2>
            <p>{activeGame.prompt}</p>
            {activeGame.hint && (
              <div className="hint">💡 {activeGame.hint}</div>
            )}

            <input
              placeholder="Sua resposta"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
              disabled={submitting}
              autoFocus
            />
            <button
              className="submit-btn"
              onClick={checkAnswer}
              disabled={submitting || !answer.trim()}
            >
              {submitting ? "Verificando…" : "Enviar Resposta"}
            </button>

            {message && (
              <div className={`game-message ${message.startsWith("✅") ? "correct" : "wrong"}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST DE CONQUISTA DESBLOQUEADA */}
      {toastMsg && (
        <div className="achievement-toast">
          {toastMsg}
        </div>
      )}
    </section>
  );
}
