import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authService } from "../services/authService";
import { isSupabaseConfigured } from "../lib/supabaseClient";

const AuthContext = createContext(null);

/**
 * Provider de autenticação.
 *
 * Mantém em memória:
 *  - session  : sessão do Supabase Auth (tokens).
 *  - profile  : registro da tabela `profiles` (nome, role, coins, xp...).
 *  - loading  : true enquanto a sessão inicial é resolvida.
 *
 * Expõe `user` = profile (compatível com o resto do app, que lê
 * user.name, user.role, user.email, user.coins, etc.).
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Carrega (ou recarrega) o perfil de aplicação a partir do id. */
  const loadProfile = useCallback(async (userId) => {
    try {
      const data = await authService.getProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error("[Auth] Falha ao carregar perfil:", err.message);
      setProfile(null);
    }
  }, []);

  // Resolve a sessão inicial e escuta mudanças de auth.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    authService
      .getSession()
      .then(async (s) => {
        if (!mounted) return;
        setSession(s);
        if (s?.user) await loadProfile(s.user.id);
      })
      .finally(() => mounted && setLoading(false));

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        await loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadProfile]);

  // ---- ações expostas ----

  const register = useCallback(async ({ email, password, name }) => {
    const data = await authService.signUp({ email, password, name });
    return data;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await authService.signIn({ email, password });
    return data;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await authService.signInWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    await authService.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(
    async (updates) => {
      if (!session?.user) return null;
      const updated = await authService.updateProfile(session.user.id, updates);
      setProfile(updated);
      return updated;
    },
    [session]
  );

  /** Recarrega o perfil (ex.: após comprar item ou ganhar moedas). */
  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = {
    session,
    user: profile,
    loading,
    isConfigured: isSupabaseConfigured,
    register,
    login,
    loginWithGoogle,
    logout,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
