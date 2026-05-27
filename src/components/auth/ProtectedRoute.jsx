import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Protege rotas que exigem autenticação.
 * - Enquanto a sessão carrega, mostra um spinner (evita "flash" de redirect).
 * - Sem usuário => redireciona para /login.
 * - Com requireAdmin e usuário não-admin => redireciona para /perfil.
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-state">
        <div className="spinner" />
        <p>Carregando…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/perfil" replace />;
  }

  return children;
}
