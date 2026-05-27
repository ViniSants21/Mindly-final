import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

// Fallback estático caso o banco ainda não esteja populado/configurado.
const FALLBACK_PLANS = [
  {
    id: "free",
    name: "Grátis",
    price: "R$ 0",
    features: ["Até 3 planos de estudo", "Relatórios básicos", "3 desafios por mês"],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 19,99/mês",
    features: [
      "Planos ilimitados",
      "Relatórios avançados",
      "Desafios ilimitados",
      "Suporte prioritário",
    ],
    cta: "Assinar Premium",
    popular: true,
  },
  {
    id: "inst",
    name: "Institucional",
    price: "Contato",
    features: [
      "Para escolas e universidades",
      "Recursos personalizados",
      "Relatórios para administradores",
      "Suporte dedicado",
    ],
    cta: "Falar com Vendas",
    popular: false,
  },
];

export default function Pricing() {
  const [plans, setPlans] = useState(FALLBACK_PLANS);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    adminService
      .listPlans()
      .then((rows) => {
        if (rows?.length) {
          setPlans(
            rows.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              features: (p.description || "").split("·").map((s) => s.trim()).filter(Boolean),
              cta: p.name === "Institucional" ? "Falar com Vendas" : "Assinar",
              popular: p.name === "Premium",
            }))
          );
        }
      })
      .catch(() => {
        /* mantém fallback */
      });
  }, []);

  return (
    <section className="pricing">
      <div className="container">
        <h2>Planos e Preços</h2>
        <p>Escolha o plano que melhor se adapta às suas necessidades.</p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.popular ? "popular" : ""}`}
            >
              <h3>{plan.name}</h3>
              <p className="price">{plan.price}</p>
              {plan.features?.length > 0 && (
                <ul>
                  {plan.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
              <button
                className={plan.name === "Institucional" ? "btn-outline" : "btn-primary"}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
