/**
 * Valores monetários trafegam sempre em centavos (inteiros).
 * Quantidades usam no máximo duas casas decimais.
 */

export const UNITS = ["m2", "un", "m", "dias", "vb"] as const;
export type Unit = (typeof UNITS)[number];

export const UNIT_LABELS: Record<string, string> = {
  m2: "m²",
  un: "un",
  m: "metros",
  dias: "dias",
  vb: "vb",
};

/** Aceita "1.234,56", "1234,56", "1234.56", "R$ 1.234,56". */
export function parseBRNumber(input: string | number | null | undefined): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input == null) return null;
  let raw = String(input).trim().replace(/\s/g, "").replace(/R\$/gi, "");
  if (raw === "") return null;
  if (raw.includes(",")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if ((raw.match(/\./g) ?? []).length > 1) {
    raw = raw.replace(/\./g, "");
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseMoneyToCents(input: string | number | null | undefined): number | null {
  const n = parseBRNumber(input);
  if (n == null) return null;
  return Math.round(n * 100);
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatQuantity(quantity: number): string {
  return quantity.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatDateBR(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

export type CalcItem = { quantity: number; unit_price_cents: number };

export type Totals = {
  subtotal_cents: number;
  taxes_cents: number;
  bdi_cents: number;
  extra_costs_cents: number;
  discount_cents: number;
  before_discount_cents: number;
  total_cents: number;
  tax_percent: number;
  bdi_percent: number;
};

export type CalcInput = {
  items: CalcItem[];
  extra_costs_cents: number;
  discount_cents: number;
  tax_percent: number;
  bdi_percent: number;
};

export function itemTotalCents(quantity: number, unitPriceCents: number): number {
  return Math.round(quantity * unitPriceCents);
}

/** Total = subtotal + impostos + BDI + despesas adicionais − desconto. */
export function computeTotals(input: CalcInput): Totals {
  const subtotal = input.items.reduce(
    (acc, item) => acc + itemTotalCents(item.quantity, item.unit_price_cents),
    0,
  );
  const taxes = Math.round((subtotal * input.tax_percent) / 100);
  const bdi = Math.round((subtotal * input.bdi_percent) / 100);
  const beforeDiscount = subtotal + taxes + bdi + input.extra_costs_cents;
  const total = beforeDiscount - input.discount_cents;
  return {
    subtotal_cents: subtotal,
    taxes_cents: taxes,
    bdi_cents: bdi,
    extra_costs_cents: input.extra_costs_cents,
    discount_cents: input.discount_cents,
    before_discount_cents: beforeDiscount,
    total_cents: total,
    tax_percent: input.tax_percent,
    bdi_percent: input.bdi_percent,
  };
}

export function quantityIsValid(quantity: number): boolean {
  if (!Number.isFinite(quantity) || quantity <= 0) return false;
  return Math.abs(quantity * 100 - Math.round(quantity * 100)) < 1e-9;
}
