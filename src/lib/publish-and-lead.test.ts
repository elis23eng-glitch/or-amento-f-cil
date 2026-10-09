import { describe, expect, it } from "vitest";
import { previewBanner, quoteMatchesSnapshot } from "./publish-state";
import { validateLead } from "./lead-validation";
import type { QuoteSnapshot } from "./quote-snapshot";

const quote = {
  quote_date: "2026-10-08",
  client_name: "Maria",
  client_phone: "11912345678",
  client_kind: "pf" as const,
  service_location: null,
  project_type: "Reforma residencial",
  title: null,
  description: null,
  payment_terms: "50% entrada",
  execution_term: null,
  valid_until: "2026-10-23",
  inclusions: null,
  exclusions: null,
  notes: null,
  extra_costs_cents: 3000,
  discount_cents: 1500,
  tax_percent: 0,
  bdi_percent: 0,
};
const items = [{ description: "Pintura", unit: "m2", quantity: 10, unit_price_cents: 2550 }];
const snapshot = {
  company: {} as QuoteSnapshot["company"],
  quote: { number: 1, ...quote },
  items: [{ ...items[0]!, total_cents: 25500 }],
  totals: { extra_costs_cents: 3000, discount_cents: 1500, tax_percent: 0, bdi_percent: 0, total_cents: 27000 },
} as unknown as QuoteSnapshot;

describe("estado de publicação", () => {
  it("orçamento igual à versão publicada é reconhecido como publicado", () => {
    expect(quoteMatchesSnapshot(quote, items, snapshot)).toBe(true);
    expect(previewBanner({ hasVersion: true, savedMatchesLatest: true, dirty: false })).toBe("published");
  });
  it("mudar condição de pagamento indica alterações não publicadas", () => {
    expect(quoteMatchesSnapshot({ ...quote, payment_terms: "À vista" }, items, snapshot)).toBe(false);
  });
  it("mudar a quantidade de um item indica alterações não publicadas", () => {
    expect(quoteMatchesSnapshot(quote, [{ ...items[0]!, quantity: 11 }], snapshot)).toBe(false);
  });
  it("edição não salva na tela indica alterações não publicadas", () => {
    expect(previewBanner({ hasVersion: true, savedMatchesLatest: true, dirty: true })).toBe("unpublished");
  });
  it("sem nenhuma versão o aviso é de rascunho", () => {
    expect(previewBanner({ hasVersion: false, savedMatchesLatest: false, dirty: false })).toBe("draft");
  });
});

describe("formulário de interesse", () => {
  const ok = {
    name: "João", whatsapp: "(31) 98974-7907", profession: "Pintor", city: "BH",
    monthly_quotes: "1 a 5", interest: "testar", marketing_consent: false,
  };
  it("campos vazios geram mensagem simples em cada campo", () => {
    const r = validateLead({ ...ok, name: "", whatsapp: "", profession: "", city: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.name).toBe("Informe seu nome.");
      expect(r.errors.whatsapp).toBe("Informe seu WhatsApp com DDD.");
      expect(r.errors.profession).toBe("Informe sua profissão ou tipo de serviço.");
      expect(r.errors.city).toBe("Informe sua cidade.");
    }
  });
  it("WhatsApp inválido é recusado", () => {
    const r = validateLead({ ...ok, whatsapp: "1234" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.whatsapp).toContain("WhatsApp inválido");
  });
  it("dados válidos passam", () => {
    expect(validateLead(ok).ok).toBe(true);
  });
});
