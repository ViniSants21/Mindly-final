import { useNavigate } from "react-router-dom";
import plannerIcon from "../../assets/iconeplanner.png";
import graficoIcon from "../../assets/iconegrafico.png";
import trofeuIcon from "../../assets/iconetrofeu.png";

const tools = [
  {
    icon: plannerIcon,
    title: "Planner inteligente",
    text: "Monte horários personalizados com blocos de tempo, pausas automáticas e prioridades visuais.",
    cta: "Criar plano",
    to: "/planner",
  },
  {
    icon: graficoIcon,
    title: "Desempenho",
    text: "Gráficos detalhados de horas estudadas, metas cumpridas e evolução por disciplina.",
    cta: "Ver painel",
    to: "/desempenho",
  },
  {
    icon: trofeuIcon,
    title: "Desafios",
    text: "Missões curtas para manter a motivação: recompensas em XP e conquistas.",
    cta: "Explorar",
    to: "/desafios",
  },
];

export default function Tools() {
  const navigate = useNavigate();
  return (
    <section className="tools">
      <div className="tools-title">
        <div className="bar" />
        <h2>Ferramentas que se adaptam ao seu ritmo</h2>
      </div>

      <div className="tool-grid">
        {tools.map((t) => (
          <div className="tool-card" key={t.title}>
            <div className="tool-header">
              <img src={t.icon} alt={t.title} className="tool-icon" />
              <h3>{t.title}</h3>
            </div>
            <p>{t.text}</p>
            <button className="btn-outline" onClick={() => navigate(t.to)}>
              {t.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
