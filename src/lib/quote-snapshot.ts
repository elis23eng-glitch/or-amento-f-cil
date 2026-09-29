import type { Totals } from "./money";

export type SnapshotCompany = {
  trade_name: string;
  responsible_name: string | null;
  whatsapp: string | null;
  city: string | null;
  cnpj: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  logo_path: string | null;
};

export type SnapshotItem = {
  description: string;
  unit: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
};

export type SnapshotQuote = {
  number: number;
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
};

export type QuoteSnapshot = {
  company: SnapshotCompany;
  quote: SnapshotQuote;
  items: SnapshotItem[];
  totals: Totals;
};

export const PROJECT_TYPES = [
  "Reforma residencial",
  "Reforma comercial",
  "Pequena construção",
  "Manutenção predial",
] as const;

export const SERVICE_SUGGESTIONS = [
  { description: "Pintura", unit: "m2" },
  { description: "Alvenaria", unit: "m2" },
  { description: "Elétrica", unit: "un" },
  { description: "Hidráulica", unit: "un" },
  { description: "Revestimento", unit: "m2" },
  { description: "Gesso", unit: "m2" },
  { description: "Demolição", unit: "m2" },
  { description: "Impermeabilização", unit: "m2" },
] as const;
