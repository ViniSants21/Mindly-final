import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import Home from "./pages/Home";
import Planner from "./pages/Planner";
import Performance from "./pages/Performance";
import Challenges from "./pages/Challenges";
import LearningPath from "./pages/LearningPath";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Returns from "./pages/Returns";

/**
 * Layout decide quando mostrar Navbar/Footer e renderiza as rotas.
 * Login e Cadastro são telas "cheias", sem navbar/footer.
 */
function Layout() {
  const location = useLocation();
  const { user } = useAuth();

  const noLayoutRoutes = ["/login", "/cadastro"];
  const hideLayout = noLayoutRoutes.includes(location.pathname);

  return (
    <>
      {!hideLayout && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />

        {/* Rotas protegidas — exigem login */}
        <Route
          path="/planner"
          element={
            <ProtectedRoute>
              <Planner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/desempenho"
          element={
            <ProtectedRoute>
              <Performance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/desafios"
          element={
            <ProtectedRoute>
              <Challenges />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trilha"
          element={
            <ProtectedRoute>
              <LearningPath />
            </ProtectedRoute>
          }
        />

        {/* Perfil dinâmico: admin vê o painel, usuário vê o perfil */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              {user?.role === "admin" ? <Admin /> : <Profile />}
            </ProtectedRoute>
          }
        />

        {/* Painel admin — exige role admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/editar-perfil"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/termos" element={<Terms />} />
        <Route path="/trocas" element={<Returns />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
