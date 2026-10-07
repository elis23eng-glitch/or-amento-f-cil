import { computeTotals, itemTotalCents } from "./money";
import type { QuoteSnapshot } from "./quote-snapshot";

const items = [
  { description: "Pintura de paredes internas com massa corrida", unit: "m2", quantity: 86, unit_price_cents: 4200 },
  { description: "Revestimento cerâmico em piso de cozinha", unit: "m2", quantity: 18.5, unit_price_cents: 9800 },
  { description: "Troca de pontos elétricos (tomadas e interruptores)", unit: "un", quantity: 12, unit_price_cents: 7500 },
  { description: "Impermeabilização de box do banheiro", unit: "m2", quantity: 6, unit_price_cents: 12000 },
  { description: "Limpeza final e remoção de entulho", unit: "vb", quantity: 1, unit_price_cents: 45000 },
];

/** Proposta FICTÍCIA, usada somente na demonstração pública. */
export const DEMO_SNAPSHOT: QuoteSnapshot = {
  company: {
    trade_name: "Construtora Exemplo (empresa fictícia)",
    responsible_name: "Responsável de exemplo",
    whatsapp: null,
    city: "Cidade Exemplo",
    cnpj: null,
    email: null,
    address: null,
    website: null,
    logo_path: null,
    proposal_header_text: "Reformas e acabamentos residenciais",
    proposal_footer_text: null,
  },
  quote: {
    number: 1,
    quote_date: "2026-01-15",
    client_name: "Cliente de exemplo",
    client_phone: null,
    client_kind: "pf",
    service_location: "Rua de Exemplo, 100 — Cidade Exemplo",
    project_type: "Reforma residencial",
    title: "Reforma de cozinha e banheiro",
    description:
      "Exemplo ilustrativo de proposta: pintura, revestimento, revisão elétrica e impermeabilização, com limpeza final da obra.",
    payment_terms: "40% na assinatura, 30% no meio da obra e 30% na entrega",
    execution_term: "18 dias úteis após a liberação do local",
    valid_until: "2026-02-15",
    inclusions: "Mão de obra, ferramentas e limpeza final.",
    exclusions: "Louças, metais e móveis planejados.",
    notes: "Valores de exemplo. Cada profissional informa os próprios preços no Orçai.",
  },
  items: items.map((i) => ({ ...i, total_cents: itemTotalCents(i.quantity, i.unit_price_cents) })),
  totals: computeTotals({
    items,
    extra_costs_cents: 0,
    discount_cents: 20000,
    tax_percent: 0,
    bdi_percent: 0,
  }),
};
