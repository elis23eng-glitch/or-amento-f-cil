import type { SnapshotCompany } from "./quote-snapshot";

export type CompanyProposalSource = {
  trade_name: string;
  responsible_name: string | null;
  whatsapp: string | null;
  city: string | null;
  cnpj: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  logo_path: string | null;
  proposal_header_text: string | null;
  proposal_footer_text: string | null;
};

/** Copies company presentation data into an immutable published-version snapshot. */
export function snapshotCompany(company: CompanyProposalSource): SnapshotCompany {
  return {
    trade_name: company.trade_name,
    responsible_name: company.responsible_name,
    whatsapp: company.whatsapp,
    city: company.city,
    cnpj: company.cnpj,
    email: company.email,
    address: company.address,
    website: company.website,
    logo_path: company.logo_path,
    proposal_header_text: company.proposal_header_text,
    proposal_footer_text: company.proposal_footer_text,
  };
}