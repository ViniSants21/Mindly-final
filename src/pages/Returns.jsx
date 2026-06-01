import { Link } from "react-router-dom";
import "../styles/legal.css";

export default function Returns() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <Link to="/" className="legal-back">← Voltar ao início</Link>
          <h1>Trocas e Devoluções</h1>
          <p className="legal-updated">Atualizada em junho de 2025</p>
        </div>

        <div className="legal-body">
          <section>
            <h2>1. Política de reembolso</h2>
            <p>
              O Mindly oferece um período de avaliação gratuita. Caso você tenha
              adquirido um plano pago e não esteja satisfeito, entre em contato
              dentro de <strong>7 dias corridos</strong> após a compra para solicitar
              o reembolso integral.
            </p>
          </section>

          <section>
            <h2>2. Como solicitar o reembolso</h2>
            <p>Para solicitar um reembolso:</p>
            <ul>
              <li>Envie um e-mail para <a href="mailto:contatomindly@gmail.com">contatomindly@gmail.com</a> com o assunto "Solicitação de Reembolso".</li>
              <li>Informe seu nome, e-mail cadastrado e o motivo da solicitação.</li>
              <li>O prazo de análise é de até 5 dias úteis.</li>
              <li>O estorno será processado na mesma forma de pagamento utilizada.</li>
            </ul>
          </section>

          <section>
            <h2>3. Recompensas virtuais</h2>
            <p>
              Moedas, XP e itens virtuais adquiridos ou ganhos dentro da plataforma
              não são reembolsáveis em dinheiro, pois são ativos virtuais sem valor
              monetário real.
            </p>
          </section>

          <section>
            <h2>4. Cancelamento de plano</h2>
            <p>
              Você pode cancelar seu plano a qualquer momento pelas configurações da
              conta. O acesso permanece ativo até o final do período já pago.
              Não há cobranças adicionais após o cancelamento.
            </p>
          </section>

          <section>
            <h2>5. Contato</h2>
            <p>
              Dúvidas sobre trocas e devoluções?<br />
              E-mail: <a href="mailto:contatomindly@gmail.com">contatomindly@gmail.com</a><br />
              WhatsApp: <a href="https://wa.me/5512997813395" target="_blank" rel="noopener noreferrer">(12) 99781-3395</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
