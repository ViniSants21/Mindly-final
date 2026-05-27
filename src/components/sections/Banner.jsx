import { useNavigate } from "react-router-dom";
import bannerImg from "../../assets/banners.png";

export default function Banner() {
  const navigate = useNavigate();
  return (
    <section className="banner">
      <img src={bannerImg} className="banner-img" alt="Banner Mindly" />
      <button className="btn-orange" onClick={() => navigate("/cadastro")}>
        Começar agora
      </button>
    </section>
  );
}
