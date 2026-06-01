import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2,
  Rocket, TrendingUp, Gamepad2, Brain,
} from "lucide-react";
import lapis from "../assets/lapismindly.png";
import mindlyLogo from "/images/mindly-logo.png";
import "../styles/auth.css";


const BENEFITS = [
  { Icon: Rocket,      color: "#eff6ff", label: "Comece em minutos",            sub: "Criação de conta rápida e gratuita" },
  { Icon: TrendingUp,  color: "#f0fdf4", label: "Evolua do básico ao avançado", sub: "Trilha adaptada ao seu nível" },
  { Icon: Gamepad2,    color: "#fefce8", label: "Aprendizado gamificado",       sub: "Pontos, conquistas e rankings" },
  { Icon: Brain,       color: "#fdf4ff", label: "Retenção garantida",           sub: "Técnicas validadas de memorização" },
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
  const { register, isConfigured } = useAuth();

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
                  <b.Icon size={20} color="#3f7fe3" />
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
