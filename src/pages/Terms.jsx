import { Link } from "react-router-dom";
import "../styles/legal.css";

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <Link to="/" className="legal-back">← Voltar ao início</Link>
          <h1>Termos de Uso</h1>
          <p className="legal-updated">Atualizados em junho de 2025</p>
        </div>

        <div className="legal-body">
          <section>
            <h2>1. Aceitação dos termos</h2>
            <p>
              Ao criar uma conta e utilizar a plataforma Mindly, você concorda com
              estes Termos de Uso. Se não concordar com alguma cláusula, não utilize
              a plataforma.
            </p>
          </section>

          <section>
            <h2>2. Uso da plataforma</h2>
            <p>O Mindly é uma plataforma educacional gamificada. Você se compromete a:</p>
            <ul>
              <li>Utilizar a plataforma apenas para fins educacionais legítimos.</li>
              <li>Não compartilhar suas credenciais de acesso com terceiros.</li>
              <li>Não tentar acessar áreas restritas ou manipular dados de outros usuários.</li>
              <li>Não realizar engenharia reversa ou extrair dados da plataforma de forma automatizada.</li>
            </ul>
          </section>

          <section>
            <h2>3. Conta do usuário</h2>
            <p>
              Você é responsável por manter a confidencialidade da sua senha e por
              todas as atividades realizadas na sua conta. Notifique-nos imediatamente
              em caso de uso não autorizado.
            </p>
          </section>

          <section>
            <h2>4. Conteúdo da plataforma</h2>
            <p>
              Todo o conteúdo educacional disponível no Mindly — incluindo textos,
              imagens, módulos de aprendizagem e desafios — é de propriedade da
              equipe Mindly ou licenciado adequadamente. É proibida a reprodução
              sem autorização prévia por escrito.
            </p>
          </section>

          <section>
            <h2>5. Moedas e recompensas virtuais</h2>
            <p>
              As moedas, XP e conquistas são ativos virtuais da plataforma, sem
              valor monetário real. A equipe Mindly reserva-se o direito de
              ajustar o sistema de recompensas sem aviso prévio.
            </p>
          </section>

          <section>
            <h2>6. Suspensão e encerramento</h2>
            <p>
              Reservamo-nos o direito de suspender ou encerrar contas que violem
              estes termos, sem necessidade de aviso prévio. Em caso de encerramento,
              seus dados poderão ser excluídos conforme nossa Política de Privacidade.
            </p>
          </section>

          <section>
            <h2>7. Limitação de responsabilidade</h2>
            <p>
              O Mindly é fornecido "como está". Não garantimos que a plataforma
              estará disponível ininterruptamente ou livre de erros. Não nos
              responsabilizamos por perdas de dados decorrentes de falhas técnicas
              fora do nosso controle.
            </p>
          </section>

          <section>
            <h2>8. Alterações nos termos</h2>
            <p>
              Podemos atualizar estes termos periodicamente. Notificaremos usuários
              sobre mudanças significativas por e-mail. O uso continuado da
              plataforma após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2>9. Contato</h2>
            <p>
              Dúvidas: <a href="mailto:contatomindly@gmail.com">contatomindly@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
