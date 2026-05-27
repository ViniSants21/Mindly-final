import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { challengesService } from "../services/challengesService";
import { getIcon } from "../lib/icons";
import { games } from "../data/content";
import "../styles/challenges.css";

export default function Challenges() {
  const { session, refreshProfile } = useAuth();
  const userId = session?.user?.id;

  const [progressMap, setProgressMap] = useState([]); // user_challenges + challenge
  const [loading, setLoading] = useState(true);

  const [activeGame, setActiveGame] = useState(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const modalRef = useRef(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Garante um registro de progresso para cada desafio ativo
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

  const checkAnswer = async () => {
    if (!activeGame) return;
    const correct =
      answer.trim().toLowerCase() === activeGame.answer.toLowerCase();

    if (correct) {
      setMessage("✅ Acertou!!");
      // Se o jogo está ligado a um desafio, soma progresso e ganha moedas
      if (activeGame.challengeId && userId) {
        try {
          await challengesService.addProgress(
            userId,
            activeGame.challengeId,
            activeGame.reward
          );
          await load();
          await refreshProfile();
        } catch (err) {
          console.error(err.message);
        }
      }
    } else {
      setMessage("❌ Errou! Tente novamente.");
    }

    setTimeout(() => setMessage(""), 2000);
    setAnswer("");
  };

  return (
    <section className="challenges">
      <div className="challenges-container">
        <div style={{ marginBottom: 50 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: "bold",
              color: "#1c2c4c",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {getIcon("target", { size: 36 })} Trilha de Aprendizagem
          </h1>
        </div>

        {/* DESAFIOS EM ANDAMENTO */}
        <div className="challenges-section">
          <h2>
            <span className="section-bar" />
            Desafios em andamento
          </h2>
          <div className="challenges-list">
            {loading ? (
              <p style={{ color: "#666" }}>Carregando…</p>
            ) : ongoing.length === 0 ? (
              <p style={{ color: "#666" }}>
                Nenhum desafio em andamento. Bom trabalho! 🎉
              </p>
            ) : (
              ongoing.map((p) => (
                <div key={p.id} className="challenge-card ongoing">
                  <div className="challenge-left">
                    <div className="challenge-icon">
                      {getIcon(p.challenge?.icon, { size: 32 })}
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
                      onClick={() =>
                        setActiveGame({ ...games[1], challengeId: p.challenge_id })
                      }
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
              <p style={{ color: "#666" }}>
                Você ainda não concluiu desafios. Vá em frente!
              </p>
            ) : (
              completed.map((p) => (
                <div key={p.id} className="challenge-card completed">
                  <div className="challenge-left">
                    <div className="challenge-icon">
                      {getIcon(p.challenge?.icon, { size: 32, color: "#3f7fe3" })}
                    </div>
                    <div className="challenge-info">
                      <h3>{p.challenge?.title}</h3>
                      <p>{p.challenge?.description}</p>
                    </div>
                  </div>
                  <div className="challenge-middle">
                    <span className="challenge-badge completed-badge">
                      Concluído
                    </span>
                  </div>
                  <div className="challenge-right">
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div
                          className="progress-fill completed-fill"
                          style={{ width: "100%" }}
                        />
                      </div>
                      <span className="progress-text">100%</span>
                    </div>
                    <button className="challenge-btn">Refazer</button>
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
            Jogos
          </h2>
          <div className="games-grid">
            {games.map((game) => (
              <div key={game.id} className="game-card">
                <h3>{game.title}</h3>
                <p>{game.description}</p>
                <button className="game-btn" onClick={() => setActiveGame(game)}>
                  Focar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE JOGO */}
      {activeGame && (
        <div className="game-overlay" ref={modalRef}>
          <div className="game-modal">
            <button
              className="close-btn"
              onClick={() => {
                setActiveGame(null);
                setMessage("");
                setAnswer("");
              }}
            >
              ✕
            </button>

            <h2>{activeGame.title}</h2>
            <p>{activeGame.prompt}</p>
            {activeGame.hint && <div className="hint">{activeGame.hint}</div>}

            <input
              placeholder="Sua resposta"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
            />
            <button className="submit-btn" onClick={checkAnswer}>
              Enviar
            </button>

            {message && <div className="game-message">{message}</div>}
          </div>
        </div>
      )}
    </section>
  );
}
