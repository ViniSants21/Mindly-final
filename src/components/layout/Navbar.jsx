import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getIcon } from "../../lib/icons";
import { getAvatarUrl } from "../../lib/avatar";

/* ─── Contador regressivo exibido na navbar ─── */
function NavBoostTimer({ expiresAt, label, color }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
    setTimeLeft(calc());
    const iv = setInterval(() => {
      const t = calc();
      setTimeLeft(t);
      if (t <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  if (timeLeft <= 0) return null;
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;

  return (
    <div className="nav-boost-badge" style={{ "--badge-color": color }} title={label}>
      {label} {m}:{s.toString().padStart(2, "0")}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/login");
  };

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="navbar">
      <NavLink to="/" className="logo">
        <img src="/images/mindly-logo.png" alt="Logo Mindly" className="logo-img" />
      </NavLink>

      <nav className="menu">
        <NavLink to="/" end className="nav-item">
          Início
        </NavLink>
        <NavLink to="/planner" className="nav-item">
          Planner
        </NavLink>
        <NavLink to="/desempenho" className="nav-item">
          Desempenho
        </NavLink>
        <NavLink to="/desafios" className="nav-item">
          Desafios
        </NavLink>
        <NavLink to="/trilha" className="nav-item">
          Trilha
        </NavLink>

        {user?.role === "admin" && (
          <NavLink
            to="/admin"
            className="nav-item"
            style={{ color: "#ffcc00", fontWeight: "bold" }}
          >
            Painel Admin
          </NavLink>
        )}
      </nav>

      <div className="user" ref={menuRef}>
        {user ? (
          <>
            {/* Indicadores de boost/shield ativos */}
            {user.xp_boost_expires_at && new Date(user.xp_boost_expires_at) > Date.now() && (
              <NavBoostTimer expiresAt={user.xp_boost_expires_at} label="⚡" color="#9b59b6" />
            )}
            {user.xp_shield_expires_at && new Date(user.xp_shield_expires_at) > Date.now() && (
              <NavBoostTimer expiresAt={user.xp_shield_expires_at} label="🛡️" color="#3f7fe3" />
            )}
            <span className="bell">{getIcon("gift", { size: 20 })}</span>

            <img
              src={getAvatarUrl(user.photo)}
              alt="user"
              className="avatar-click"
              onClick={() => setOpen(!open)}
            />

            {open && (
              <div className="dropdown">
                <p className="user-name">{user.name || user.email}</p>
                <button
                  onClick={() => {
                    navigate("/perfil");
                    setOpen(false);
                  }}
                >
                  Perfil
                </button>
                <button
                  onClick={() => {
                    navigate("/editar-perfil");
                    setOpen(false);
                  }}
                >
                  Editar perfil
                </button>
                <button className="logout" onClick={handleLogout}>
                  Sair
                </button>
              </div>
            )}
          </>
        ) : (
          <button className="login-btn" onClick={() => navigate("/login")}>
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}
