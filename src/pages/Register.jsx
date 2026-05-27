import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import lapis from "../assets/lapismindly.png";
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, isConfigured } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email || !senha) {
      setError("Preencha e-mail e senha.");
      return;
    }
    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (!isConfigured) {
      setError("Supabase não configurado. Veja o arquivo .env.example.");
      return;
    }

    setLoading(true);
    try {
      const data = await register({ email, password: senha, name });
      // Se a confirmação de e-mail estiver ativa, não há sessão imediata.
      if (data?.session) {
        navigate("/planner");
      } else {
        setInfo(
          "Conta criada! Verifique seu e-mail para confirmar e depois faça login."
        );
      }
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
    } catch (err) {
      setError("Erro ao cadastrar com Google: " + err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <h1>
          Crie sua conta <br /> agora mesmo
        </h1>
        <p>comece a estudar com a gente!</p>

        <form className="login-form" onSubmit={handleRegister}>
          {error && <div className="auth-error">{error}</div>}
          {info && (
            <div className="auth-error" style={{ background: "rgba(50,205,50,.18)", borderColor: "#7ddf7d", color: "#dfffdf" }}>
              {info}
            </div>
          )}

          <label>Nome:</label>
          <input
            type="text"
            placeholder="Como devemos te chamar?"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
            placeholder="Crie uma senha (mín. 6 caracteres)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button className="btn-auth" type="submit" disabled={loading}>
            {loading ? "Criando…" : "Cadastrar"}
          </button>

          <button type="button" className="btn-google" onClick={handleGoogle}>
            CADASTRAR COM GOOGLE
          </button>

          <p className="register">
            Já tem conta?{" "}
            <span
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate("/login")}
            >
              Entrar
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
  if (msg.includes("already registered") || msg.includes("already been"))
    return "Este e-mail já está cadastrado.";
  if (msg.toLowerCase().includes("password"))
    return "Senha inválida (mínimo 6 caracteres).";
  return msg;
}
