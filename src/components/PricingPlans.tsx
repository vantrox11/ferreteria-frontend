// Componente de planes de precios para la landing page
import React from "react";
import "./PricingPlans.css";

interface Plan {
  title: string;
  description: string;
  price: string;
  period: string;
  features: string[];
}

const plans: Plan[] = [
  {
    title: "Plan Completo",
    description: "Todo lo que necesitas para gestionar tu ferretería",
    price: "$29",
    period: "/mes",
    features: [
      "Control de inventario",
      "POS básico",
      "Gestión de compras",
      "1 usuario",
      "Email support",
    ],
  },
  {
    title: "Plan Completo",
    description: "Todo lo que necesitas para gestionar tu ferretería",
    price: "$78",
    period: "/mes (facturado trimestral)",
    features: [
      "Control de inventario",
      "POS básico",
      "Gestión de compras",
      "1 usuario",
      "Email support",
    ],
  },
  {
    title: "Plan Completo",
    description: "Todo lo que necesitas para gestionar tu ferretería",
    price: "$261",
    period: "/mes (facturado anual)",
    features: [
      "Control de inventario",
      "POS básico",
      "Gestión de compras",
      "1 usuario",
      "Email support",
    ],
  },
];

export const PricingPlans: React.FC = () => {
  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-container">
        <h2 className="pricing-title">Planes simples y transparentes</h2>
        <p className="pricing-subtitle">
          Un plan, todas las herramientas que necesitas
        </p>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div key={index} className="pricing-card">
              <h3 className="plan-title">{plan.title}</h3>
              <p className="plan-description">{plan.description}</p>

              <div className="plan-price">{plan.price}</div>
              <div className="plan-period">{plan.period}</div>

              <button className="plan-button">Comenzar prueba gratis</button>

              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
