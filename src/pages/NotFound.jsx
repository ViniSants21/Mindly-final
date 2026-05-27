import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page-state">
      <h1 style={{ fontSize: 64, color: "var(--blue)" }}>404</h1>
      <p>Ops! Esta página não existe.</p>
      <Link to="/" className="btn-primary" style={{ textDecoration: "none" }}>
        Voltar ao início
      </Link>
    </div>
  );
}
