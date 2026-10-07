import { describe, expect, it } from "vitest";
import { snapshotCompany, type CompanyProposalSource } from "./snapshot-company";

function company(overrides: Partial<CompanyProposalSource> = {}): CompanyProposalSource {
  return {
    trade_name: "Empresa Teste",
    responsible_name: "Ana Responsável",
    whatsapp: "5511999999999",
    city: "São Paulo",
    cnpj: null,
    email: "contato@empresa.test",
    address: "Rua Teste, 10",
    website: "empresa.test",
    logo_path: null,
    proposal_header_text: "Cabeçalho original",
    proposal_footer_text: "Rodapé original",
    ...overrides,
  };
}

describe("snapshot dos dados da empresa na proposta", () => {
  it("mantém os textos da versão publicada após a empresa ser alterada", () => {
    const currentCompany = company();
    const publishedVersion = snapshotCompany(currentCompany);

    currentCompany.proposal_header_text = "Cabeçalho alterado";
    currentCompany.proposal_footer_text = "Rodapé alterado";

    expect(publishedVersion.proposal_header_text).toBe("Cabeçalho original");
    expect(publishedVersion.proposal_footer_text).toBe("Rodapé original");
  });

  it("usa os novos textos somente em uma nova versão", () => {
    const currentCompany = company();
    const versionOne = snapshotCompany(currentCompany);

    currentCompany.proposal_header_text = "Cabeçalho da versão 2";
    currentCompany.proposal_footer_text = "Rodapé da versão 2";
    const versionTwo = snapshotCompany(currentCompany);

    expect(versionOne).toMatchObject({
      proposal_header_text: "Cabeçalho original",
      proposal_footer_text: "Rodapé original",
    });
    expect(versionTwo).toMatchObject({
      proposal_header_text: "Cabeçalho da versão 2",
      proposal_footer_text: "Rodapé da versão 2",
    });
  });

  it("copia cabeçalho e rodapé independentemente", () => {
    expect(
      snapshotCompany(company({ proposal_header_text: "Só cabeçalho", proposal_footer_text: null })),
    ).toMatchObject({ proposal_header_text: "Só cabeçalho", proposal_footer_text: null });
    expect(
      snapshotCompany(company({ proposal_header_text: null, proposal_footer_text: "Só rodapé" })),
    ).toMatchObject({ proposal_header_text: null, proposal_footer_text: "Só rodapé" });
  });

  it("mantém compatibilidade de leitura com versões antigas sem os campos opcionais", () => {
    const oldPublishedCompany = {
      trade_name: "Empresa Antiga",
      responsible_name: null,
      whatsapp: null,
      city: null,
      cnpj: null,
      email: null,
      address: null,
      website: null,
      logo_path: null,
    };

    expect(oldPublishedCompany.proposal_header_text).toBeUndefined();
    expect(oldPublishedCompany.proposal_footer_text).toBeUndefined();
  });
});