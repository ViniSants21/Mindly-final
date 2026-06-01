import { Link } from "react-router-dom";
import "../styles/legal.css";

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <Link to="/" className="legal-back">← Voltar ao início</Link>
          <h1>Política de Privacidade</h1>
          <p className="legal-updated">Atualizada em junho de 2025</p>
        </div>

        <div className="legal-body">
          <section>
            <h2>1. Quais dados coletamos</h2>
            <p>Coletamos apenas os dados necessários para oferecer a melhor experiência na plataforma Mindly:</p>
            <ul>
              <li>Nome e endereço de e-mail informados no cadastro.</li>
              <li>Dados de progresso: etapas concluídas, XP, nível, moedas e desafios.</li>
              <li>Horários de estudo inseridos no Planner.</li>
              <li>Informações técnicas de navegação (IP anonimizado, tipo de dispositivo).</li>
            </ul>
          </section>

          <section>
            <h2>2. Como usamos seus dados</h2>
            <p>Utilizamos suas informações exclusivamente para:</p>
            <ul>
              <li>Personalizar sua experiência de aprendizagem.</li>
              <li>Exibir seu progresso, conquistas e estatísticas de desempenho.</li>
              <li>Enviar comunicações relevantes sobre a plataforma (com opção de descadastro).</li>
              <li>Melhorar funcionalidades com base em padrões de uso anonimizados.</li>
            </ul>
          </section>

          <section>
            <h2>3. Armazenamento e segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros via Supabase (PostgreSQL),
              com criptografia em repouso e em trânsito. Utilizamos autenticação robusta
              e políticas de segurança em nível de linha (RLS) para garantir que cada
              usuário acesse apenas seus próprios dados.
            </p>
          </section>

          <section>
            <h2>4. Compartilhamento de dados</h2>
            <p>
              Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros,
              exceto quando exigido por lei ou mediante seu consentimento expresso.
            </p>
          </section>

          <section>
            <h2>5. Seus direitos (LGPD)</h2>
            <p>Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
            <ul>
              <li>Acessar, corrigir ou excluir seus dados pessoais a qualquer momento.</li>
              <li>Solicitar a portabilidade dos seus dados.</li>
              <li>Revogar o consentimento de uso.</li>
              <li>Ser informado sobre incidentes de segurança que afetem seus dados.</li>
            </ul>
            <p>Para exercer esses direitos, entre em contato: <a href="mailto:contatomindly@gmail.com">contatomindly@gmail.com</a></p>
          </section>

          <section>
            <h2>6. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para manter sua sessão ativa e cookies
              analíticos anonimizados para entender como a plataforma é utilizada.
              Você pode desativar cookies nas configurações do seu navegador, mas
              algumas funcionalidades podem deixar de funcionar.
            </p>
          </section>

          <section>
            <h2>7. Contato</h2>
            <p>
              Dúvidas sobre esta política? Entre em contato:<br />
              E-mail: <a href="mailto:contatomindly@gmail.com">contatomindly@gmail.com</a><br />
              WhatsApp: <a href="https://wa.me/5512997813395" target="_blank" rel="noopener noreferrer">(12) 99781-3395</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
