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
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const modalRef = useRef(null);
  // Guarda o id da última pergunta exibida por desafio para evitar repetição consecutiva
  const lastQuestionRef = useRef({});

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

  // Busca perguntas do banco vinculadas ao challenge_id exato do desafio
  const openGame = async (progressEntry) => {
    setPendingChallenge(progressEntry.challenge_id);
    setMessage("");
    setAnswer("");
    try {
      const questions = await challengesService.getQuestionsForChallenge(
        progressEntry.challenge_id
      );

      if (!questions || questions.length === 0) {
        showToast("⚠️ Nenhuma pergunta disponível para este desafio.");
        return;
      }

      // Evita repetir a mesma pergunta duas vezes seguidas no mesmo desafio
      const lastId = lastQuestionRef.current[progressEntry.challenge_id];
      const pool =
        questions.length > 1
          ? questions.filter((q) => q.id !== lastId)
          : questions;

      const chosen = pool[Math.floor(Math.random() * pool.length)];
      lastQuestionRef.current[progressEntry.challenge_id] = chosen.id;

      setActiveGame({
        ...chosen,
        reward: 15,
        challengeId: progressEntry.challenge_id,
        challengeTitle: progressEntry.challenge?.title,
      });
    } catch (err) {
      console.error("Erro ao carregar perguntas:", err.message);
      showToast("❌ Erro ao carregar perguntas. Tente novamente.");
    } finally {
      setPendingChallenge(null);
    }
  };

  const closeModal = () => {
    setActiveGame(null);
    setMessage("");
    setAnswer("");
  };

  const checkAnswer = async () => {
    if (!activeGame || submitting) return;

    let correct = false;

    if (isDbQuestion) {
      const dbAnswer = activeGame.correct_answer?.trim().toLowerCase() ?? null;
      const selected  = answer.trim().toLowerCase(); // 'a', 'b', 'c' ou 'd'

      if (!dbAnswer) {
        // Gabarito não configurado no banco — não aceita nenhuma resposta
        correct = false;
      } else if (["a", "b", "c", "d"].includes(dbAnswer)) {
        // Banco guarda a LETRA da opção correta ('a','b','c','d')
        correct = selected === dbAnswer;
      } else {
        // Banco guarda o TEXTO da opção correta — compara com o texto da opção selecionada
        const selectedText = (activeGame[`option_${selected}`] ?? "").trim().toLowerCase();
        correct = selectedText === dbAnswer;
      }
    } else {
      // Jogo de prática (legado) — comparação por texto livre
      const correctValue = (activeGame.answer ?? "").trim().toLowerCase();
      correct = answer.trim().toLowerCase() === correctValue;
    }

    if (correct) {
      setMessage("✅ Acertou!!");

      if (activeGame.challengeId && userId) {
        setSubmitting(true);
        try {
          const result = await challengesService.addProgress(
            userId,
            activeGame.challengeId,
            activeGame.reward ?? 15
          );

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

  // Perguntas do banco têm o campo 'question'; jogos de prática têm 'prompt'
  const isDbQuestion = Boolean(activeGame?.question);

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
                      disabled={pendingChallenge === p.challenge_id}
                    >
                      {pendingChallenge === p.challenge_id
                        ? "Carregando…"
                        : "Continuar"}
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
                        <div
                          className="progress-fill completed-fill"
                          style={{ width: "100%" }}
                        />
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

        {/* JOGOS DE PRÁTICA — dados estáticos, independentes dos desafios */}
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

      {/* MODAL — múltipla escolha (banco) ou texto livre (prática) */}
      {activeGame && (
        <div
          className="game-overlay"
          ref={modalRef}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="game-modal">
            <button className="close-btn" onClick={closeModal} aria-label="Fechar">
              ✕
            </button>

            <div className="game-modal-icon">
              {getIcon("lightning", { size: 32, color: "#f59a3c" })}
            </div>

            {isDbQuestion ? (
              /* Pergunta do banco — múltipla escolha */
              <>
                {activeGame.challengeTitle && (
                  <div className="question-challenge-label">
                    {activeGame.challengeTitle}
                  </div>
                )}
                <h2 className="question-text">{activeGame.question}</h2>

                <div className="options-list">
                  {["a", "b", "c", "d"].map((key) =>
                    activeGame[`option_${key}`] ? (
                      <button
                        key={key}
                        className={`option-btn${answer === key ? " option-selected" : ""}`}
                        onClick={() => !submitting && setAnswer(key)}
                        disabled={submitting}
                      >
                        <span className="option-letter">{key.toUpperCase()}</span>
                        <span>{activeGame[`option_${key}`]}</span>
                      </button>
                    ) : null
                  )}
                </div>
              </>
            ) : (
              /* Jogo de prática — resposta em texto livre */
              <>
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
              </>
            )}

            <button
              className="submit-btn"
              onClick={checkAnswer}
              disabled={submitting || !answer.trim()}
            >
              {submitting ? "Verificando…" : "Confirmar Resposta"}
            </button>

            {message && (
              <div
                className={`game-message ${
                  message.startsWith("✅") ? "correct" : "wrong"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST DE CONQUISTA DESBLOQUEADA */}
      {toastMsg && <div className="achievement-toast">{toastMsg}</div>}
    </section>
  );
}
