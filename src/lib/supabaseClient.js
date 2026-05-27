import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase (singleton).
 *
 * As credenciais vêm das variáveis de ambiente do Vite.
 * Crie um arquivo .env na raiz do projeto com:
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 *
 * A chave anon (publishable) é segura para uso no frontend — a
 * segurança real é garantida pelas políticas de Row Level Security
 * (RLS) configuradas no banco (ver supabase/schema.sql).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Aviso claro no console em vez de uma tela branca silenciosa.
  console.error(
    "[Mindly] Variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes. " +
      "Crie um arquivo .env (veja .env.example)."
  );
}

/** Indica se o app está configurado com credenciais válidas. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Usamos placeholders válidos quando faltam credenciais para que o
// createClient não lance erro (a tela de configuração é exibida no app).
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
