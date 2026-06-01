import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Target, Trophy, BarChart2, Flame,
} from "lucide-react";
import lapis from "../assets/lapismindly.png";
import mindlyLogo from "/images/mindly-logo.png";
import "../styles/auth.css";

/* ─── SVG do Google ─────────────────────────── */
const GoogleIcon = () => (
  <svg className="auth-google-icon" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

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
  const { login, loginWithGoogle, isConfigured } = useAuth();

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

  const handleGoogle = async () => {
    setError("");
    try { await loginWithGoogle(); }
    catch (err) { setError("Erro ao entrar com Google: " + err.message); }
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

            {/* Divisor */}
            <div className="auth-divider">ou continue com</div>

            {/* Google */}
            <button type="button" className="auth-btn-google" onClick={handleGoogle}>
              <GoogleIcon />
              Entrar com Google
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
