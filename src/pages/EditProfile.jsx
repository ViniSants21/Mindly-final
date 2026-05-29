import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  User,
  AtSign,
  Mail,
  AlignLeft,
  Calendar,
  Camera,
  Save,
  ArrowLeft,
  Lock,
  CheckCircle,
  AlertCircle,
  Zap,
  Star,
  Shield,
} from "lucide-react";
import { getAvatarUrl } from "../lib/avatar";
import "../styles/editprofile.css";

export default function EditProfile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [photo, setPhoto] = useState(user?.photo || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [birth, setBirth] = useState(user?.birth || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      await updateProfile({
        name,
        username,
        photo,
        bio,
        birth: birth || null,
      });
      setSuccess(true);
      setTimeout(() => navigate("/perfil"), 1600);
    } catch (err) {
      setError("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = getAvatarUrl(photo);
  const roleLabel = user?.role === "admin" ? "Administrador" : "Estudante";

  return (
    <div className="ep-page">

      {/* ===== CABEÇALHO ===== */}
      <div className="ep-header">
        <button
          type="button"
          className="ep-back-btn"
          onClick={() => navigate("/perfil")}
        >
          <ArrowLeft size={15} />
          Voltar ao perfil
        </button>
        <div className="ep-title-row">
          <div className="ep-bar" />
          <h1>Editar Perfil</h1>
        </div>
      </div>

      {/* ===== LAYOUT PRINCIPAL ===== */}
      <div className="ep-layout">

        {/* ---------- PAINEL LATERAL ---------- */}
        <aside className="ep-sidebar">

          {/* Avatar */}
          <div className="ep-avatar-card">
            <div className="ep-avatar-wrap">
              <img
                src={avatarSrc}
                alt="avatar"
                className="ep-avatar"
                onError={(e) => { e.target.src = getAvatarUrl(); }}
              />
              <div className="ep-avatar-overlay">
                <Camera size={22} />
                <span>Alterar</span>
              </div>
            </div>

            <div className="ep-field-group" style={{ width: "100%" }}>
              <label className="ep-label">
                <Camera size={12} />
                URL da foto
              </label>
              <input
                type="url"
                className="ep-input"
                placeholder="https://exemplo.com/foto.jpg"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
              />
            </div>
            <p className="ep-avatar-hint">
              Cole uma URL pública de imagem para personalizar seu avatar
            </p>
          </div>

          {/* Stats */}
          <div className="ep-stats-card">
            <p className="ep-stats-title">Seus dados</p>
            <div className="ep-stat">
              <div className="ep-stat-icon" style={{ background: "#f59a3c18", color: "#f59a3c" }}>
                <Star size={15} />
              </div>
              <div className="ep-stat-info">
                <span className="ep-stat-val">Nível {user?.level ?? 1}</span>
                <span className="ep-stat-lbl">Nível atual</span>
              </div>
            </div>
            <div className="ep-stat">
              <div className="ep-stat-icon" style={{ background: "#9b59b618", color: "#9b59b6" }}>
                <Zap size={15} />
              </div>
              <div className="ep-stat-info">
                <span className="ep-stat-val">{user?.xp ?? 0} XP</span>
                <span className="ep-stat-lbl">Experiência total</span>
              </div>
            </div>
            <div className="ep-stat">
              <div className="ep-stat-icon" style={{ background: "#3f7fe318", color: "#3f7fe3" }}>
                <Shield size={15} />
              </div>
              <div className="ep-stat-info">
                <span className="ep-stat-val">{roleLabel}</span>
                <span className="ep-stat-lbl">Permissão</span>
              </div>
            </div>
          </div>

        </aside>

        {/* ---------- CARTÃO DO FORMULÁRIO ---------- */}
        <div className="ep-form-card">

          {error && (
            <div className="ep-alert ep-alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="ep-alert ep-alert-success">
              <CheckCircle size={16} />
              Perfil atualizado com sucesso! Redirecionando…
            </div>
          )}

          <form onSubmit={handleSave}>

            {/* SEÇÃO 1 — Informações básicas */}
            <div className="ep-section">
              <h3 className="ep-section-title">Informações Básicas</h3>
              <div className="ep-fields-grid">

                <div className="ep-field-group">
                  <label className="ep-label">
                    <User size={13} />
                    Nome completo
                  </label>
                  <input
                    type="text"
                    className="ep-input"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="ep-field-group">
                  <label className="ep-label">
                    <AtSign size={13} />
                    Username
                  </label>
                  <input
                    type="text"
                    className="ep-input"
                    placeholder="@seuuser"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="ep-field-group ep-field-full">
                  <label className="ep-label">
                    <Mail size={13} />
                    E-mail
                    <span className="ep-readonly-badge">
                      <Lock size={9} />
                      somente leitura
                    </span>
                  </label>
                  <input
                    type="email"
                    className="ep-input ep-input-readonly"
                    value={user?.email || ""}
                    disabled
                  />
                </div>

              </div>
            </div>

            {/* SEÇÃO 2 — Sobre você */}
            <div className="ep-section">
              <h3 className="ep-section-title">Sobre você</h3>
              <div className="ep-fields-grid">

                <div className="ep-field-group ep-field-full">
                  <label className="ep-label">
                    <AlignLeft size={13} />
                    Bio
                  </label>
                  <textarea
                    className="ep-input ep-textarea"
                    placeholder="Fale um pouco sobre você…"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="ep-field-group">
                  <label className="ep-label">
                    <Calendar size={13} />
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    className="ep-input"
                    value={birth || ""}
                    onChange={(e) => setBirth(e.target.value)}
                  />
                </div>

              </div>
            </div>

            {/* AÇÕES */}
            <div className="ep-actions">
              <button
                type="button"
                className="ep-btn ep-btn-cancel"
                onClick={() => navigate("/perfil")}
                disabled={saving}
              >
                <ArrowLeft size={15} />
                Cancelar
              </button>
              <button
                type="submit"
                className="ep-btn ep-btn-save"
                disabled={saving || success}
              >
                {saving ? (
                  <>
                    <span className="ep-spinner" />
                    Salvando…
                  </>
                ) : success ? (
                  <>
                    <CheckCircle size={15} />
                    Salvo!
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Salvar alterações
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
