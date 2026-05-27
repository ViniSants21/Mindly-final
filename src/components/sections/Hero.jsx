import { useNavigate } from "react-router-dom";
import homeImg from "../../assets/home.jpg";

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>
          Organize seus estudos <br />
          com a Mindly
        </h1>
        <p>
          Crie planos sob medida, acompanhe seu progresso e ganhe recompensas
          enquanto aprende.
        </p>
        <button className="btn-primary" onClick={() => navigate("/cadastro")}>
          Crie uma conta
        </button>
      </div>

      <div className="hero-image">
        <img src={homeImg} alt="Estudando" />
      </div>
    </section>
  );
}
