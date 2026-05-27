import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { progressService } from "../services/progressService";
import { learningPath } from "../data/content";
import "../styles/learningpath.css";

export default function LearningPath() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [etapaAtual, setEtapaAtual] = useState(0);
  const [concluidas, setConcluidas] = useState([]); // step_ids concluídos

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const steps = await progressService.listCompletedSteps(userId);
      setConcluidas(steps);
    } catch (err) {
      console.error("LearningPath:", err.message);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const progresso = (concluidas.length / learningPath.length) * 100;
  const etapa = learningPath[etapaAtual];

  const marcarConcluida = async () => {
    if (concluidas.includes(etapa.id) || !userId) return;
    try {
      await progressService.completeStep(userId, etapa.id);
      setConcluidas((prev) => [...prev, etapa.id]);
    } catch (err) {
      console.error(err.message);
    }
  };

  const falar = () => {
    const msg = new SpeechSynthesisUtterance(etapa.conteudo);
    msg.lang = "pt-BR";
    speechSynthesis.speak(msg);
  };

  return (
    <div className="lp-container">
      <aside className="lp-sidebar">
        <h2>Trilha</h2>
        {learningPath.map((item, index) => (
          <div
            key={item.id}
            className={`lp-step ${index === etapaAtual ? "active" : ""} ${
              concluidas.includes(item.id) ? "done" : ""
            }`}
            onClick={() => setEtapaAtual(index)}
          >
            <span>{concluidas.includes(item.id) ? "✓" : index + 1}</span>
            <p>{item.titulo}</p>
          </div>
        ))}
      </aside>

      <main className="lp-content">
        <div className="lp-header">
          <h1>{etapa.titulo}</h1>
          <span className="lp-etapa">
            Etapa {etapaAtual + 1} de {learningPath.length}
          </span>
        </div>

        <div className="lp-progress">
          <div className="lp-progress-fill" style={{ width: `${progresso}%` }} />
        </div>

        <div className="lp-card">
          <p>{etapa.conteudo}</p>
          <div className="lp-tip">💡 {etapa.dica}</div>
        </div>

        <div className="lp-controls">
          <button
            onClick={() => setEtapaAtual(etapaAtual - 1)}
            disabled={etapaAtual === 0}
          >
            Voltar
          </button>
          <button onClick={falar}>🔊 Ouvir</button>
          <button onClick={marcarConcluida}>
            {concluidas.includes(etapa.id) ? "✔ Concluída" : "✔ Concluir"}
          </button>
          <button
            onClick={() => setEtapaAtual(etapaAtual + 1)}
            disabled={etapaAtual === learningPath.length - 1}
          >
            Próximo
          </button>
        </div>
      </main>
    </div>
  );
}
