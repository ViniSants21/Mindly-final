import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Target, Trophy, BarChart2, Flame,
} from "lucide-react";
import lapis from "../assets/lapismindly.png";
import mindlyLogo from "/images/mindly-logo.png";
import "../styles/auth.css";


const BENEFITS = [
  { icon: "🎯", color: "#eff6ff", label: "Trilha personalizada", sub: "Conteúdo adaptado ao seu ritmo" },
  { icon: "🏆", color: "#fefce8", label: "Conquistas e XP",      sub: "Evolua e ganhe recompensas" },
  { icon: "📊", color: "#f0fdf4", label: "Progresso em tempo real", sub: "Veja sua evolução diária" },
  { icon: "🔥", color: "#fff7ed", label: "Desafios diários",     sub: "Gamificação para manter o foco" },
];

function traduzErro(msg = "") {
  if (msg.includes("Invalid login"))      return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  return msg || "Erro inesperado. Tente novamente.";
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isConfigured } = useAuth();

  const [email, setEmail]         = useState("");
  const [senha, setSenha]         = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !senha) { setError("Preencha todos os campos."); return; }
    if (!isConfigured)    { setError("Supabase não configurado. Veja o arquivo .env.example."); return; }

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

  return (
    <div className="auth-layout">

      {/* ── PAINEL ESQUERDO — Marca ── */}
      <div className="auth-panel">
        <div className="auth-panel-inner">

          <div className="auth-brand-row">
            <img src={mindlyLogo} alt="Mindly" className="auth-logo-img" />
            <span className="auth-brand-name">Mindly</span>
          </div>

          <h1 className="auth-panel-headline">
            Aprenda de forma <span>gamificada</span> e evolua todos os dias
          </h1>
          <p className="auth-panel-sub">
            A plataforma que transforma seu aprendizado em conquistas.
          </p>

          <ul className="auth-benefits">
            {BENEFITS.map(b => (
              <li key={b.label} className="auth-benefit-item">
                <div className="auth-benefit-icon" style={{ background: b.color }}>
                  {b.icon}
                </div>
                <div className="auth-benefit-text">
                  <strong>{b.label}</strong>
                  <span>{b.sub}</span>
                </div>
              </li>
            ))}
          </ul>

          <img src={lapis} alt="Mascote Mindly" className="auth-mascot" />
        </div>
      </div>

      {/* ── PAINEL DIREITO — Formulário ── */}
      <div className="auth-form-side">
        <div className="auth-form-box">

          <h2 className="auth-form-title">Bem-vindo de volta!</h2>
          <p className="auth-form-subtitle">Entre na sua conta para continuar estudando.</p>

          {error && (
            <div className="auth-error-box">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="login-email">E-mail</label>
              <div className="auth-input-wrap">
                <span className="auth-input-prefix"><Mail size={16} /></span>
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="login-senha">Senha</label>
              <div className="auth-input-wrap">
                <span className="auth-input-prefix"><Lock size={16} /></span>
                <input
                  id="login-senha"
                  type={showPw ? "text" : "password"}
                  className="auth-input"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <div className="auth-input-suffix">
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Esqueci senha */}
            <div className="auth-field-row">
              <span />
              <button type="button" className="auth-forgot">
          
              </button>
            </div>

            {/* Entrar */}
            <button className="auth-btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : null}
              {loading ? "Entrando…" : "Entrar na conta"}
            </button>

          </form>

          <p className="auth-switch">
            Ainda não tem conta?{" "}
            <button className="auth-switch-link" onClick={() => navigate("/cadastro")}>
              Criar conta grátis
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}
