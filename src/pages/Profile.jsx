import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getIcon } from "../lib/icons";
import "../styles/profile.css";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // XP / nível: barra proporcional ao xp dentro do nível (200 xp por nível)
  const xpInLevel = (user?.xp ?? 0) % 200;
  const xpPercent = Math.min((xpInLevel / 200) * 100, 100);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="bar" />
        <h1>Perfil do jogador</h1>
      </div>

      <div className="profile-card">
        <div className="profile-left">
          <img
            src={user?.photo || "https://i.pravatar.cc/100"}
            alt="user"
            className="avatar"
          />
        </div>

        <div className="profile-info">
          <h2>{user?.name || "Usuário Mindly"}</h2>
          <p className="sub">{user?.bio || "Aluno Mindly"}</p>
          <p className="streak">
            🔥 Ofensiva: {user?.streak ?? 0} dia(s) seguidos!
          </p>
          <p className="xp-text">
            XP Nível {user?.level ?? 1} — {xpInLevel} / 200 xp
          </p>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        <div className="profile-actions">
          <button className="edit-btn" onClick={() => navigate("/editar-perfil")}>
            Editar dados
          </button>
          <button className="logout-btn-profile" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>

      <div className="profile-bottom">
        <div className="card">
          <h3>Continue aprendendo</h3>
          <div className="learning-item">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt=""
            />
            <div>
              <p>Matemática Básica</p>
              <div className="progress-bar">
                <div className="progress fill1" />
              </div>
            </div>
          </div>
          <hr />
          <div className="learning-item">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
              alt=""
            />
            <div>
              <p>Interpretação de texto</p>
              <div className="progress-bar">
                <div className="progress fill2" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Conquistas</h3>
          <div className="badges">
            <div className="badge">
              {getIcon("award", { size: 28 })}
              <p>Conclua 10 desafios</p>
            </div>
            <div className="badge">
              {getIcon("star", { size: 28 })}
              <p>Mantenha ofensiva</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
