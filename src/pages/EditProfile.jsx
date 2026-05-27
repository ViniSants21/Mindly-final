import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateProfile({
        name,
        username,
        photo,
        bio,
        birth: birth || null,
      });
      navigate("/perfil");
    } catch (err) {
      setError("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-profile-page">
      <div className="profile-header">
        <div className="bar" />
        <h1>Editar perfil</h1>
      </div>

      <div className="edit-card">
        <div className="avatar-section">
          <img
            src={photo || "https://i.pravatar.cc/100"}
            alt="avatar"
            className="avatar"
          />
          <input
            type="text"
            placeholder="URL da imagem"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
          />
          <small>Use uma URL de imagem para personalizar seu avatar</small>
        </div>

        <form className="edit-form" onSubmit={handleSave}>
          <h3>Informações básicas</h3>

          {error && (
            <p style={{ color: "#ff4d4d", fontSize: 14, marginBottom: 10 }}>
              {error}
            </p>
          )}

          <label>Nome</label>
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Username</label>
          <input
            type="text"
            placeholder="@seuuser"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label>E-mail</label>
          <input type="email" value={user?.email || ""} disabled />

          <h3>Perfil</h3>

          <label>Bio</label>
          <textarea
            placeholder="Fale um pouco sobre você..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <label>Data de nascimento</label>
          <input
            type="date"
            value={birth || ""}
            onChange={(e) => setBirth(e.target.value)}
          />

          <div className="buttons">
            <button
              type="button"
              className="cancel"
              onClick={() => navigate("/perfil")}
            >
              Cancelar
            </button>
            <button type="submit" className="save" disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
