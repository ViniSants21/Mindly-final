/**
 * Mostrado quando as variáveis do Supabase não estão configuradas,
 * orientando o usuário em vez de deixar a tela quebrar silenciosamente.
 */
export default function ConfigWarning() {
  return (
    <div className="config-warning">
      <h2 style={{ marginBottom: 12 }}>⚙️ Configuração necessária</h2>
      <p>
        O Mindly precisa das credenciais do Supabase para funcionar. Crie um
        arquivo <code>.env</code> na raiz do projeto (use o{" "}
        <code>.env.example</code> como base) com:
      </p>
      <p style={{ marginTop: 12 }}>
        <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>
      </p>
      <p style={{ marginTop: 12 }}>
        Você encontra esses valores no painel do Supabase em{" "}
        <strong>Project Settings → API</strong>. Depois, rode o SQL em{" "}
        <code>supabase/schema.sql</code> no SQL Editor.
      </p>
    </div>
  );
}
