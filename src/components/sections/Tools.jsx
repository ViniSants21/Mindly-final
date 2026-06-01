import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [active, setActive] = useState(0);

  const prev = () => setActive((i) => (i - 1 + tools.length) % tools.length);
  const next = () => setActive((i) => (i + 1) % tools.length);

  return (
    <section className="tools">
      <div className="tools-title">
        <div className="bar" />
        <h2>Ferramentas que se adaptam ao seu ritmo</h2>
      </div>

      {/* Grade normal em desktop */}
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

      {/* Carrossel apenas em mobile */}
      <div className="tool-carousel">
        <button
          className="carousel-ctrl carousel-ctrl-prev"
          onClick={prev}
          aria-label="Anterior"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>

        <div className="carousel-track">
          {tools.map((t, i) => (
            <div
              key={t.title}
              className={`tool-card carousel-slide ${i === active ? "carousel-active" : ""}`}
              aria-hidden={i !== active}
            >
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

        <button
          className="carousel-ctrl carousel-ctrl-next"
          onClick={next}
          aria-label="Próximo"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>

        {/* Indicadores de ponto */}
        <div className="carousel-dots">
          {tools.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === active ? "carousel-dot-active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
