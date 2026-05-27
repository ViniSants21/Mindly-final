import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getIcon } from "../../lib/icons";

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
            <span className="bell">{getIcon("gift", { size: 20 })}</span>

            <img
              src={user.photo || "https://i.pravatar.cc/40"}
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
