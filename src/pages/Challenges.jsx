import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { challengesService } from "../services/challengesService";
import { getIcon } from "../lib/icons";
import { games } from "../data/content";
import { useToast } from "../hooks/useToast";
import "../styles/challenges.css";

export default function Challenges() {
  const { session, user, refreshProfile } = useAuth();
  const userId = session?.user?.id;

  const [progressMap, setProgressMap] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeGame, setActiveGame] = useState(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [hintText, setHintText] = useState(null);
  const modalRef = useRef(null);
  const lastQuestionRef = useRef({});
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
      await Promise.all(active.map((c) => challengesService.ensureProgress(userId, c.id)));
      const prog = await challengesService.listUserProgress(userId);
      if (mountedRef.current) setProgressMap(prog);
    } catch (err) {
      console.error("Challenges:", err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (activeGame && modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeGame]);

  const ongoing   = progressMap.filter((p) => p.progress < 100);
  const completed = progressMap.filter((p) => p.progress >= 100);

  const fetchNextQuestion = useCallback(async (challengeId, challengeTitle) => {
    const questions = await challengesService.getQuestionsForChallenge(challengeId);
    if (!questions?.length) return null;

    const lastId = lastQuestionRef.current[challengeId];
    const pool = questions.length > 1 ? questions.filter((q) => q.id !== lastId) : questions;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    lastQuestionRef.current[challengeId] = chosen.id;

    return { ...chosen, reward: 15, challengeId, challengeTitle };
  }, []);

  const openGame = async (progressEntry) => {
    setPendingChallenge(progressEntry.challenge_id);
    setMessage("");
    setAnswer("");
    setHintText(null);
    try {
      const next = await fetchNextQuestion(
        progressEntry.challenge_id,
        progressEntry.challenge?.title
      );
      if (!next) { showToast("⚠️ Nenhuma pergunta disponível para este desafio."); return; }
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
    setHintText(null);
  };

  /* ─── Usa dica da pergunta atual ─── */
  const handleUseHint = async () => {
    if (!userId || !activeGame) return;

    if ((user?.hints_count ?? 0) <= 0) {
      showToast("💡 Você não tem dicas. Compre na loja de Recompensas!");
      return;
    }

    try {
      const res = await challengesService.useHint(userId);
      if (!res?.success) { showToast(res?.message || "Erro ao usar dica."); return; }

      // Usa a dica específica da pergunta, ou uma dica de raciocínio genérica
      const specificHint = activeGame.hint_text || activeGame.hint;
      setHintText(
        specificHint ||
        "Releia cada opção com atenção. Elimine as que claramente contradizem o enunciado e concentre-se nas que restam."
      );
      await refreshProfile();
    } catch (err) {
      showToast("Erro ao usar dica: " + err.message);
    }
  };

  /* ─── Valida resposta, aplica XP e avança ─── */
  const checkAnswer = async () => {
    if (!activeGame || submitting) return;
    if (activeGame._isCompletion) { closeModal(); return; }

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
      correct = answer.trim().toLowerCase() === (activeGame.answer ?? "").trim().toLowerCase();
    }

    // ─── RESPOSTA ERRADA ───
    if (!correct) {
      setAnswer("");

      if (activeGame.challengeId && userId) {
        // Desconta 10 XP (ou mostra que o escudo está ativo)
        try {
          const result = await challengesService.deductXpOnWrong(userId);
          await refreshProfile();
          if (result?.shield_active) {
            setMessage("🛡️ Errou, mas a Proteção te salvou! Tente novamente.");
          } else {
            setMessage(`❌ Errou! −10 XP. Tente novamente.`);
          }
        } catch {
          setMessage("❌ Errou! Tente novamente.");
        }
      } else {
        setMessage("❌ Errou! Tente novamente.");
      }

      setTimeout(() => { if (mountedRef.current) setMessage(""); }, 2500);
      return;
    }

    // ─── RESPOSTA CERTA ───
    setMessage("✅ Acertou!!");
    setAnswer("");
    setHintText(null);

    if (!activeGame.challengeId || !userId) {
      setTimeout(() => { if (mountedRef.current) setMessage(""); }, 2500);
      return;
    }

    const challengeId    = activeGame.challengeId;
    const challengeTitle = activeGame.challengeTitle;

    setSubmitting(true);
    try {
      const result = await challengesService.addProgress(
        userId, challengeId, activeGame.reward ?? 15
      );

      const unlocked = result?.newly_unlocked || [];
      unlocked.forEach((ach) => showToast(`🏆 Conquista: "${ach.title}"! +${ach.reward_coins} moedas`));

      if (result?.xp_multiplier === 2) {
        showToast(`⚡ Dobra XP ativo! +${result.xp_gained} XP`);
      }

      await Promise.all([load(), refreshProfile()]);

      const newProgress = typeof result === "number" ? result : (result?.progress ?? 0);

      setTimeout(async () => {
        if (!mountedRef.current) return;
        setMessage("");

        if (newProgress >= 100) {
          setActiveGame({ _isCompletion: true, challengeId, challengeTitle });
        } else {
          try {
            const next = await fetchNextQuestion(challengeId, challengeTitle);
            if (!mountedRef.current) return;
            if (!next) { closeModal(); return; }
            setActiveGame(next);
          } catch (err) {
            console.error("Erro ao avançar:", err.message);
            if (mountedRef.current) closeModal();
          }
        }
      }, 1500);

    } catch (err) {
      console.error("Erro ao salvar progresso:", err.message);
      if (mountedRef.current) {
        setMessage("❌ Erro ao salvar progresso.");
        setTimeout(() => { if (mountedRef.current) setMessage(""); }, 2500);
      }
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  const isDbQuestion = Boolean(activeGame?.question);
  const isCompletion = Boolean(activeGame?._isCompletion);

  const hintsCount     = user?.hints_count ?? 0;
  const hasHint        = Boolean(activeGame?.hint_text || activeGame?.hint);
  const canUseHint     = isDbQuestion && hintsCount > 0 && hasHint && !hintText;
  const boostActive    = user?.xp_boost_expires_at && new Date(user.xp_boost_expires_at) > Date.now();
  const shieldActive   = user?.xp_shield_expires_at && new Date(user.xp_shield_expires_at) > Date.now();

  return (
    <section className="challenges">
      <div className="challenges-container">

        {/* TÍTULO */}
        <div className="challenges-title">
          {getIcon("target", { size: 32, color: "#3f7fe3" })}
          <h1>Trilha de Aprendizagem</h1>
          {/* Indicadores de boost ativos */}
          <div className="challenge-boost-bar">
            {boostActive && <span className="challenge-boost-pill boost">⚡ Dobra XP</span>}
            {shieldActive && <span className="challenge-boost-pill shield">🛡️ Proteção</span>}
            {hintsCount > 0 && <span className="challenge-boost-pill hint">💡 {hintsCount} dica{hintsCount !== 1 ? "s" : ""}</span>}
          </div>
        </div>

        {/* DESAFIOS EM ANDAMENTO */}
        <div className="challenges-section">
          <h2><span className="section-bar" />Desafios em andamento</h2>
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
                    <div className="challenge-icon">{getIcon(p.challenge?.icon, { size: 26 })}</div>
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
          <h2><span className="section-bar" />Desafios concluídos</h2>
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
                    <div className="challenge-icon completed-icon">{getIcon(p.challenge?.icon, { size: 26 })}</div>
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
          <h2><span className="section-bar" />Jogos de Prática</h2>
          <div className="games-grid">
            {games.map((game) => (
              <div key={game.id} className="game-card">
                <div className="game-card-icon">{getIcon("lightning", { size: 28, color: "#f59a3c" })}</div>
                <h3>{game.title}</h3>
                <p>{game.description}</p>
                <button className="game-btn" onClick={() => setActiveGame(game)}>Jogar</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
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
                <button className="submit-btn" onClick={closeModal}>Fechar</button>
              </div>
            ) : (
              <>
                <div className="game-modal-icon">
                  {getIcon("lightning", { size: 32, color: "#f59a3c" })}
                </div>

                {isDbQuestion ? (
                  <>
                    {activeGame.challengeTitle && (
                      <div className="question-challenge-label">{activeGame.challengeTitle}</div>
                    )}
                    <h2 className="question-text">{activeGame.question}</h2>

                    {/* Dica exibida */}
                    {hintText && (
                      <div className="hint-display">
                        💡 <strong>Dica:</strong> {hintText}
                      </div>
                    )}

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
                  <>
                    <h2>{activeGame.title}</h2>
                    <p>{activeGame.prompt}</p>
                    {(activeGame.hint || hintText) && !hintText && (
                      <div className="hint">💡 {activeGame.hint}</div>
                    )}
                    {hintText && <div className="hint-display">💡 <strong>Dica:</strong> {hintText}</div>}
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

                {/* Linha de ação: confirmar + usar dica */}
                <div className="modal-action-row">
                  <button
                    className="submit-btn"
                    onClick={checkAnswer}
                    disabled={submitting || !answer.trim()}
                    style={{ flex: canUseHint ? "1" : "unset", width: canUseHint ? "auto" : "100%" }}
                  >
                    {submitting ? "Verificando…" : "Confirmar Resposta"}
                  </button>

                  {canUseHint && (
                    <button className="hint-btn" onClick={handleUseHint} title="Usar dica">
                      💡 Dica ({hintsCount})
                    </button>
                  )}
                </div>

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

      {toastMsg && <div className="achievement-toast">{toastMsg}</div>}
    </section>
  );
}
