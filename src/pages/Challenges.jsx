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
  const lastQuestionRef = useRef({});
  // Controla se o modal já foi fechado (para evitar setState em componente desmontado)
  const mountedRef = useRef(true);

  const { message: toastMsg, showToast } = useToast(4000);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const active = await challengesService.listActive();
      await Promise.all(
        active.map((c) => challengesService.ensureProgress(userId, c.id))
      );
      const prog = await challengesService.listUserProgress(userId);
      if (mountedRef.current) setProgressMap(prog);
    } catch (err) {
      console.error("Challenges:", err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
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

  const ongoing   = progressMap.filter((p) => p.progress < 100);
  const completed = progressMap.filter((p) => p.progress >= 100);

  /* ─── Helper: busca e sorteia uma pergunta para o desafio ─── */
  const fetchNextQuestion = useCallback(async (challengeId, challengeTitle) => {
    const questions = await challengesService.getQuestionsForChallenge(challengeId);
    if (!questions?.length) return null;

    const lastId = lastQuestionRef.current[challengeId];
    const pool = questions.length > 1
      ? questions.filter((q) => q.id !== lastId)
      : questions;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    lastQuestionRef.current[challengeId] = chosen.id;

    return { ...chosen, reward: 15, challengeId, challengeTitle };
  }, []);

  /* ─── Abre o modal carregando a primeira pergunta do desafio ─── */
  const openGame = async (progressEntry) => {
    setPendingChallenge(progressEntry.challenge_id);
    setMessage("");
    setAnswer("");
    try {
      const next = await fetchNextQuestion(
        progressEntry.challenge_id,
        progressEntry.challenge?.title
      );
      if (!next) {
        showToast("⚠️ Nenhuma pergunta disponível para este desafio.");
        return;
      }
      setActiveGame(next);
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

  /* ─── Valida resposta, salva progresso e avança para a próxima pergunta ─── */
  const checkAnswer = async () => {
    if (!activeGame || submitting) return;

    // ─── 1. Verificar se é tela de conclusão — apenas fecha o modal ───
    if (activeGame._isCompletion) {
      closeModal();
      return;
    }

    let correct = false;

    if (isDbQuestion) {
      const dbAnswer = activeGame.correct_answer?.trim().toLowerCase() ?? null;
      const selected = answer.trim().toLowerCase();

      if (!dbAnswer) {
        correct = false;
      } else if (["a", "b", "c", "d"].includes(dbAnswer)) {
        correct = selected === dbAnswer;
      } else {
        const selectedText = (activeGame[`option_${selected}`] ?? "").trim().toLowerCase();
        correct = selectedText === dbAnswer;
      }
    } else {
      const correctValue = (activeGame.answer ?? "").trim().toLowerCase();
      correct = answer.trim().toLowerCase() === correctValue;
    }

    // ─── 2. Resposta ERRADA ───
    if (!correct) {
      setMessage("❌ Errou! Tente novamente.");
      setAnswer("");
      setTimeout(() => { if (mountedRef.current) setMessage(""); }, 2500);
      return;
    }

    // ─── 3. Resposta CERTA ───
    setMessage("✅ Acertou!!");
    setAnswer("");

    if (!activeGame.challengeId || !userId) {
      // Jogo de prática: apenas limpa a mensagem após 2,5s
      setTimeout(() => { if (mountedRef.current) setMessage(""); }, 2500);
      return;
    }

    // ─── 4. Salvar progresso no banco ───
    const challengeId    = activeGame.challengeId;
    const challengeTitle = activeGame.challengeTitle;

    setSubmitting(true);
    try {
      const result = await challengesService.addProgress(
        userId,
        challengeId,
        activeGame.reward ?? 15
      );

      // Conquistas desbloqueadas nesta jogada
      const unlocked = result?.newly_unlocked || [];
      unlocked.forEach((ach) => {
        showToast(
          `🏆 Conquista desbloqueada: "${ach.title}"! +${ach.reward_coins} moedas`
        );
      });

      // Recarrega dados em paralelo (progresso + perfil do usuário)
      await Promise.all([load(), refreshProfile()]);

      // Novo progresso retornado pelo banco
      const newProgress =
        typeof result === "number" ? result : (result?.progress ?? 0);

      // ─── 5. Após 1,5s de feedback, avançar para próxima pergunta ou concluir ───
      setTimeout(async () => {
        if (!mountedRef.current) return;
        setMessage("");

        if (newProgress >= 100) {
          // ─── Desafio concluído ───
          setActiveGame({
            _isCompletion: true,
            challengeId,
            challengeTitle,
          });
        } else {
          // ─── Carregar próxima pergunta automaticamente ───
          try {
            const next = await fetchNextQuestion(challengeId, challengeTitle);
            if (!mountedRef.current) return;
            if (!next) {
              closeModal();
              return;
            }
            setActiveGame(next);
          } catch (err) {
            console.error("Erro ao avançar pergunta:", err.message);
            if (mountedRef.current) closeModal();
          }
        }
      }, 1500);

    } catch (err) {
      console.error("Erro ao salvar progresso:", err.message);
      if (mountedRef.current) {
        setMessage("❌ Erro ao salvar progresso. Tente novamente.");
        setTimeout(() => { if (mountedRef.current) setMessage(""); }, 2500);
      }
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  const isDbQuestion   = Boolean(activeGame?.question);
  const isCompletion   = Boolean(activeGame?._isCompletion);

  return (
    <section className="challenges">
      <div className="challenges-container">

        {/* TÍTULO */}
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
                    <span className="challenge-badge ongoing-badge">Em Andamento</span>
                  </div>
                  <div className="challenge-right">
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="progress-text">{p.progress}%</span>
                    </div>
                    <button
                      className="challenge-btn"
                      onClick={() => openGame(p)}
                      disabled={pendingChallenge === p.challenge_id}
                    >
                      {pendingChallenge === p.challenge_id ? "Carregando…" : "Continuar"}
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
                    <span className="challenge-badge completed-badge">✓ Concluído</span>
                  </div>
                  <div className="challenge-right">
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div className="progress-fill completed-fill" style={{ width: "100%" }} />
                      </div>
                      <span className="progress-text">100%</span>
                    </div>
                    <button className="challenge-btn done-btn" disabled>Concluído</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* JOGOS DE PRÁTICA */}
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
                <button className="game-btn" onClick={() => setActiveGame(game)}>Jogar</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL — pergunta (banco / prática) OU tela de conclusão */}
      {activeGame && (
        <div
          className="game-overlay"
          ref={modalRef}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="game-modal">
            <button className="close-btn" onClick={closeModal} aria-label="Fechar">✕</button>

            {/* ── TELA DE CONCLUSÃO ── */}
            {isCompletion ? (
              <div className="challenge-complete">
                <div className="challenge-complete-icon">🎉</div>
                <h2 className="challenge-complete-title">Desafio Concluído!</h2>
                {activeGame.challengeTitle && (
                  <p className="challenge-complete-sub">{activeGame.challengeTitle}</p>
                )}
                <p className="challenge-complete-msg">
                  Parabéns! Você completou todas as perguntas deste desafio.
                </p>
                <button className="submit-btn" onClick={closeModal}>
                  Fechar
                </button>
              </div>
            ) : (
              <>
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
                  /* Jogo de prática — texto livre */
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
                  <div className={`game-message ${message.startsWith("✅") ? "correct" : "wrong"}`}>
                    {message}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TOAST DE CONQUISTA */}
      {toastMsg && <div className="achievement-toast">{toastMsg}</div>}
    </section>
  );
}
