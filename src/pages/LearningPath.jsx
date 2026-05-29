import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { progressService } from "../services/progressService";
import { learningPath } from "../data/content";
import { getIcon } from "../lib/icons";
import {
  CheckCircle, Lock, ChevronRight, ChevronLeft,
  Volume2, Clock, Zap, BookOpen, Info, Lightbulb, FlaskConical,
} from "lucide-react";
import "../styles/learningpath.css";

/* ─── badge de nível ─── */
const NIVEL_CLASS = { Fácil: "lp-nivel-easy", Médio: "lp-nivel-mid", Avançado: "lp-nivel-hard" };

/* ─── XP total dos concluídos ─── */
function calcXP(doneIds) {
  return learningPath
    .filter(s => doneIds.includes(s.id))
    .reduce((acc, s) => acc + (s.xp || 0), 0);
}

export default function LearningPath() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [etapaAtual, setEtapaAtual]   = useState(0);
  const [concluidas, setConcluidas]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [completing, setCompleting]   = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [vista, setVista]             = useState("trilha"); // "trilha" | "estudo"

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const steps = await progressService.listCompletedSteps(userId);
      setConcluidas(steps);
    } catch (err) {
      console.error("LearningPath:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const etapa       = learningPath[etapaAtual];
  const isConcluida = concluidas.includes(etapa.id);
  const progresso   = Math.round((concluidas.length / learningPath.length) * 100);
  const xpTotal     = calcXP(concluidas);

  const marcarConcluida = async () => {
    if (isConcluida || !userId || completing) return;
    setCompleting(true);
    try {
      await progressService.completeStep(userId, etapa.id);
      setConcluidas(prev => [...prev, etapa.id]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const falar = () => {
    if (!window.speechSynthesis) return;
    const msg = new SpeechSynthesisUtterance(`${etapa.titulo}. ${etapa.conteudo}`);
    msg.lang = "pt-BR";
    speechSynthesis.speak(msg);
  };

  const abrirEstudo = (idx) => {
    setEtapaAtual(idx);
    setVista("estudo");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navegar = (delta) => {
    const next = etapaAtual + delta;
    if (next >= 0 && next < learningPath.length) {
      setEtapaAtual(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* ══════════════════════════════════════════
     VISTA: TRILHA (overview de módulos)
  ══════════════════════════════════════════ */
  if (vista === "trilha") {
    return (
      <div className="lp-page">
        <div className="lp-container">

          {/* Título da página */}
          <div className="lp-page-title">
            {getIcon("brain", { size: 32, color: "#3f7fe3" })}
            <div>
              <h1>Trilha de Aprendizagem</h1>
              <p className="lp-page-sub">Neurodiversidade — do básico ao avançado</p>
            </div>
          </div>

          {/* Resumo de progresso */}
          <div className="lp-progress-card">
            <div className="lp-progress-info">
              <div className="lp-progress-stat">
                <span className="lp-progress-num">{concluidas.length}</span>
                <span className="lp-progress-lbl">concluídos</span>
              </div>
              <div className="lp-progress-stat">
                <span className="lp-progress-num">{learningPath.length - concluidas.length}</span>
                <span className="lp-progress-lbl">restantes</span>
              </div>
              <div className="lp-progress-stat">
                <span className="lp-progress-num" style={{ color: "#f59a3c" }}>{xpTotal}</span>
                <span className="lp-progress-lbl">XP ganhos</span>
              </div>
              <div className="lp-progress-stat">
                <span className="lp-progress-num">{progresso}%</span>
                <span className="lp-progress-lbl">progresso</span>
              </div>
            </div>
            <div className="lp-progress-bar-track">
              <div className="lp-progress-bar-fill" style={{ width: `${progresso}%` }} />
            </div>
          </div>

          {/* Lista de módulos */}
          <div className="lp-section">
            <h2 className="lp-section-title">
              <span className="section-bar" />
              Módulos do Curso
            </h2>

            {loading ? (
              <div className="lp-module-list">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="lp-module-skeleton" />
                ))}
              </div>
            ) : (
              <div className="lp-module-list">
                {learningPath.map((modulo, idx) => {
                  const done = concluidas.includes(modulo.id);
                  return (
                    <div
                      key={modulo.id}
                      className={`lp-module-row ${done ? "lp-module-done" : ""}`}
                      onClick={() => abrirEstudo(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && abrirEstudo(idx)}
                    >
                      {/* Ícone */}
                      <div className={`lp-module-icon-wrap ${done ? "lp-icon-done" : ""}`}>
                        {done
                          ? <CheckCircle size={22} />
                          : getIcon(modulo.icon, { size: 22, color: "#3f7fe3" })
                        }
                      </div>

                      {/* Texto */}
                      <div className="lp-module-info">
                        <div className="lp-module-title-row">
                          <h3>{modulo.titulo}</h3>
                          <span className={`lp-nivel ${NIVEL_CLASS[modulo.nivel]}`}>
                            {modulo.nivel}
                          </span>
                        </div>
                        <div className="lp-module-meta">
                          <span><Clock size={12} /> {modulo.tempo}</span>
                          <span><Zap size={12} /> {modulo.xp} XP</span>
                          {done && (
                            <span className="lp-done-tag">
                              <CheckCircle size={11} /> Concluído
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Seta */}
                      <ChevronRight size={18} className="lp-module-arrow" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     VISTA: ESTUDO (sidebar + conteúdo)
  ══════════════════════════════════════════ */
  return (
    <div className="lp-page">
      <div className="lp-study-layout">

        {/* SIDEBAR */}
        <aside className="lp-sidebar">
          <button className="lp-back-btn" onClick={() => setVista("trilha")}>
            <ChevronLeft size={15} /> Todos os módulos
          </button>

          <div className="lp-sidebar-progress">
            <div className="lp-sidebar-bar-track">
              <div className="lp-sidebar-bar-fill" style={{ width: `${progresso}%` }} />
            </div>
            <span>{progresso}% concluído</span>
          </div>

          <div className="lp-sidebar-list">
            {learningPath.map((item, idx) => {
              const done   = concluidas.includes(item.id);
              const active = idx === etapaAtual;
              return (
                <div
                  key={item.id}
                  className={`lp-sidebar-item ${active ? "active" : ""} ${done ? "done" : ""}`}
                  onClick={() => setEtapaAtual(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && setEtapaAtual(idx)}
                >
                  <div className="lp-sidebar-num">
                    {done
                      ? <CheckCircle size={14} />
                      : <span>{idx + 1}</span>
                    }
                  </div>
                  <div className="lp-sidebar-item-body">
                    <span className="lp-sidebar-item-title">{item.titulo}</span>
                    {done && <span className="lp-sidebar-xp">+{item.xp} XP</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CONTEÚDO */}
        <main className="lp-study-main">

          {/* Toast de sucesso */}
          {showSuccess && (
            <div className="lp-toast-success">
              <CheckCircle size={16} />
              Módulo concluído! <strong>+{etapa.xp} XP</strong> ganhos.
            </div>
          )}

          {/* Cabeçalho do módulo */}
          <div className="lp-study-header">
            <div className="lp-study-meta-row">
              <span className={`lp-nivel ${NIVEL_CLASS[etapa.nivel]}`}>{etapa.nivel}</span>
              <span className="lp-meta-chip"><Clock size={12} /> {etapa.tempo}</span>
              <span className="lp-meta-chip lp-chip-xp"><Zap size={12} /> {etapa.xp} XP</span>
              <span className="lp-meta-chip lp-chip-count">
                Módulo {etapaAtual + 1} de {learningPath.length}
              </span>
            </div>

            <div className="lp-study-title-row">
              <div className="lp-study-icon-wrap">
                {getIcon(etapa.icon, { size: 26, color: "#3f7fe3" })}
              </div>
              <h1 className="lp-study-title">{etapa.titulo}</h1>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="lp-card">
            <div className="lp-card-label lp-label-blue">
              <BookOpen size={13} /> Conteúdo
            </div>
            <div className="lp-card-body">
              {etapa.conteudo.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {/* Curiosidade */}
          {etapa.curiosidade && (
            <div className="lp-card lp-card-info">
              <div className="lp-card-label lp-label-blue">
                <Info size={13} /> Curiosidade
              </div>
              <p className="lp-card-body">{etapa.curiosidade}</p>
            </div>
          )}

          {/* Exemplo Prático */}
          {etapa.exemploPratico && (
            <div className="lp-card lp-card-example">
              <div className="lp-card-label lp-label-green">
                <FlaskConical size={13} /> Exemplo Prático
              </div>
              <p className="lp-card-body">{etapa.exemploPratico}</p>
            </div>
          )}

          {/* Dica */}
          <div className="lp-card lp-card-tip">
            <div className="lp-card-label lp-label-orange">
              <Lightbulb size={13} /> Dica
            </div>
            <p className="lp-card-body">{etapa.dica}</p>
          </div>

          {/* Controles */}
          <div className="lp-controls">
            <div className="lp-controls-left">
              <button
                className="lp-btn lp-btn-secondary"
                onClick={() => navegar(-1)}
                disabled={etapaAtual === 0}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button className="lp-btn lp-btn-secondary" onClick={falar}>
                <Volume2 size={16} /> Ouvir
              </button>
            </div>
            <div className="lp-controls-right">
              <button
                className={`lp-btn lp-btn-complete ${isConcluida ? "is-done" : ""}`}
                onClick={marcarConcluida}
                disabled={isConcluida || completing}
              >
                <CheckCircle size={16} />
                {completing ? "Salvando…" : isConcluida ? "Concluído" : `Concluir · +${etapa.xp} XP`}
              </button>
              <button
                className="lp-btn lp-btn-primary"
                onClick={() => navegar(1)}
                disabled={etapaAtual === learningPath.length - 1}
              >
                Próximo <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
