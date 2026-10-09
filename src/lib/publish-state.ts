import type { QuoteSnapshot } from "./quote-snapshot";

export type ComparableQuote = {
  quote_date: string;
  client_name: string;
  client_phone: string | null;
  client_kind: "pf" | "pj";
  service_location: string | null;
  project_type: string | null;
  title: string | null;
  description: string | null;
  payment_terms: string | null;
  execution_term: string | null;
  valid_until: string | null;
  inclusions: string | null;
  exclusions: string | null;
  notes: string | null;
  extra_costs_cents: number;
  discount_cents: number;
  tax_percent: number;
  bdi_percent: number;
};

export type ComparableItem = {
  description: string;
  unit: string;
  quantity: number;
  unit_price_cents: number;
};

const TEXT_FIELDS = [
  "quote_date",
  "client_name",
  "client_phone",
  "client_kind",
  "service_location",
  "project_type",
  "title",
  "description",
  "payment_terms",
  "execution_term",
  "valid_until",
  "inclusions",
  "exclusions",
  "notes",
] as const;

const norm = (v: unknown) => (v === undefined || v === "" ? null : v);

/** Indica se o orçamento salvo corresponde exatamente à versão publicada informada. */
export function quoteMatchesSnapshot(
  quote: ComparableQuote,
  items: ComparableItem[],
  snapshot: QuoteSnapshot | null | undefined,
): boolean {
  if (!snapshot) return false;
  for (const f of TEXT_FIELDS) {
    if (norm(quote[f]) !== norm(snapshot.quote[f])) return false;
  }
  const t = snapshot.totals;
  if (Number(quote.extra_costs_cents) !== t.extra_costs_cents) return false;
  if (Number(quote.discount_cents) !== t.discount_cents) return false;
  if (Number(quote.tax_percent) !== Number(t.tax_percent)) return false;
  if (Number(quote.bdi_percent) !== Number(t.bdi_percent)) return false;
  if (items.length !== snapshot.items.length) return false;
  return items.every((it, i) => {
    const s = snapshot.items[i]!;
    return (
      it.description === s.description &&
      it.unit === s.unit &&
      Number(it.quantity) === Number(s.quantity) &&
      Number(it.unit_price_cents) === Number(s.unit_price_cents)
    );
  });
}

export type PreviewBanner = "draft" | "published" | "unpublished";

/** Aviso da prévia: sem versão = rascunho; versão igual e sem edições = publicada. */
export function previewBanner(opts: {
  hasVersion: boolean;
  savedMatchesLatest: boolean;
  dirty: boolean;
}): PreviewBanner {
  if (!opts.hasVersion) return "draft";
  if (opts.dirty || !opts.savedMatchesLatest) return "unpublished";
  return "published";
}
