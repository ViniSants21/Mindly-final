import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2,
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
  { icon: "🚀", color: "#eff6ff", label: "Comece em minutos",      sub: "Criação de conta rápida e gratuita" },
  { icon: "📈", color: "#f0fdf4", label: "Evolua do básico ao avançado", sub: "Trilha adaptada ao seu nível" },
  { icon: "🎮", color: "#fefce8", label: "Aprendizado gamificado", sub: "Pontos, conquistas e rankings" },
  { icon: "🧠", color: "#fdf4ff", label: "Retenção garantida",     sub: "Técnicas validadas de memorização" },
];

/* ─── Força da senha ─────────────────────────── */
function calcStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ["", "Fraca", "Regular", "Boa", "Forte"];
const STRENGTH_COLORS = ["#e2e8f0", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

function traduzErro(msg = "") {
  if (msg.includes("already registered") || msg.includes("already been"))
    return "Este e-mail já está cadastrado.";
  if (msg.toLowerCase().includes("password"))
    return "Senha inválida (mínimo 6 caracteres).";
  return msg || "Erro inesperado. Tente novamente.";
}

export default function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, isConfigured } = useAuth();

  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [senha, setSenha]             = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState("");
  const [info, setInfo]               = useState("");
  const [loading, setLoading]         = useState(false);

  const strength      = calcStrength(senha);
  const strengthLabel = STRENGTH_LABELS[strength];
  const strengthColor = STRENGTH_COLORS[strength];

  const passwordsMatch = confirmSenha.length > 0 && confirmSenha === senha;
  const passwordsWrong = confirmSenha.length > 0 && confirmSenha !== senha;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email || !senha)       { setError("Preencha e-mail e senha."); return; }
    if (senha.length < 6)       { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (confirmSenha && confirmSenha !== senha) { setError("As senhas não coincidem."); return; }
    if (!isConfigured)          { setError("Supabase não configurado. Veja o arquivo .env.example."); return; }

    setLoading(true);
    try {
      const data = await register({ email, password: senha, name });
      if (data?.session) {
        navigate("/planner");
      } else {
        setInfo("Conta criada! Verifique seu e-mail para confirmar e depois faça login.");
      }
    } catch (err) {
      setError(traduzErro(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try { await loginWithGoogle(); }
    catch (err) { setError("Erro ao cadastrar com Google: " + err.message); }
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
            Comece sua jornada de <span>aprendizado</span> hoje
          </h1>
          <p className="auth-panel-sub">
            Junte-se a milhares de estudantes que já transformaram sua forma de aprender.
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

          <h2 className="auth-form-title">Criar conta gratuita</h2>
          <p className="auth-form-subtitle">Preencha os dados abaixo e comece agora mesmo.</p>

          {error && (
            <div className="auth-error-box">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {info && (
            <div className="auth-success-box">
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {info}
            </div>
          )}

          <form onSubmit={handleRegister} noValidate>

            {/* Nome */}
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="reg-name">Nome</label>
              <div className="auth-input-wrap">
                <span className="auth-input-prefix"><User size={16} /></span>
                <input
                  id="reg-name"
                  type="text"
                  className="auth-input"
                  placeholder="Como devemos te chamar?"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="reg-email">E-mail</label>
              <div className="auth-input-wrap">
                <span className="auth-input-prefix"><Mail size={16} /></span>
                <input
                  id="reg-email"
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
              <label className="auth-field-label" htmlFor="reg-senha">Senha</label>
              <div className="auth-input-wrap">
                <span className="auth-input-prefix"><Lock size={16} /></span>
                <input
                  id="reg-senha"
                  type={showPw ? "text" : "password"}
                  className="auth-input"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  autoComplete="new-password"
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

              {/* Força da senha */}
              {senha.length > 0 && (
                <div className="auth-strength">
                  <div className="auth-strength-bars">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="auth-strength-bar"
                        style={{ background: i <= strength ? strengthColor : "#e2e8f0" }}
                      />
                    ))}
                  </div>
                  <span className="auth-strength-label" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Confirmar senha */}
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="reg-confirm">Confirmar senha</label>
              <div className="auth-input-wrap">
                <span className="auth-input-prefix"><Lock size={16} /></span>
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  className={`auth-input ${passwordsMatch ? "is-valid" : ""} ${passwordsWrong ? "has-error" : ""}`}
                  placeholder="Repita a senha"
                  value={confirmSenha}
                  onChange={e => setConfirmSenha(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <div className="auth-input-suffix">
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowConfirm(v => !v)}
                    tabIndex={-1}
                    aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Feedback de correspondência */}
              {passwordsMatch && (
                <div className="auth-field-hint ok">
                  <CheckCircle2 size={12} /> Senhas coincidem
                </div>
              )}
              {passwordsWrong && (
                <div className="auth-field-hint error">
                  <AlertCircle size={12} /> As senhas não coincidem
                </div>
              )}
            </div>

            {/* Cadastrar */}
            <button
              className="auth-btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? <span className="auth-spinner" /> : null}
              {loading ? "Criando conta…" : "Criar conta grátis"}
            </button>

            {/* Divisor */}
            <div className="auth-divider">ou continue com</div>

            {/* Google */}
            <button type="button" className="auth-btn-google" onClick={handleGoogle}>
              <GoogleIcon />
              Cadastrar com Google
            </button>
          </form>

          <p className="auth-switch">
            Já tem uma conta?{" "}
            <button className="auth-switch-link" onClick={() => navigate("/login")}>
              Entrar agora
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}
