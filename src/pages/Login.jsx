import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import lapis from "../assets/lapismindly.png";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !senha) {
      setError("Preencha todos os campos.");
      return;
    }
    if (!isConfigured) {
      setError("Supabase não configurado. Veja o arquivo .env.example.");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password: senha });
      navigate("/planner");
    } catch (err) {
      setError(traduzErro(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await loginWithGoogle();
      // O redirect do OAuth recarrega a página; navegação acontece depois.
    } catch (err) {
      setError("Erro ao logar com Google: " + err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <h1>
          Já estuda com <br /> a gente?
        </h1>
        <p>faça seu login e boa aula!</p>

        <form className="login-form" onSubmit={handleLogin}>
          {error && <div className="auth-error">{error}</div>}

          <label>E-mail:</label>
          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Senha:</label>
          <input
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <span className="forgot">esqueci minha senha</span>

          <button className="btn-auth" type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <button type="button" className="btn-google" onClick={handleGoogle}>
            LOGAR COM GOOGLE
          </button>

          <p className="register">
            Ainda não é cadastrado?{" "}
            <span
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate("/cadastro")}
            >
              Criar conta
            </span>
          </p>
        </form>
      </div>

      <div className="login-right">
        <h1 className="brand-logo">MINDLY</h1>
        <img src={lapis} alt="Mascote" />
      </div>
    </div>
  );
}

function traduzErro(msg = "") {
  if (msg.includes("Invalid login")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed"))
    return "Confirme seu e-mail antes de entrar.";
  return msg;
}
