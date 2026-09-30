import { jsPDF } from "jspdf";
import { formatCents, formatDateBR, formatQuantity, UNIT_LABELS } from "./money";
import type { QuoteSnapshot } from "./quote-snapshot";
import { formatBRPhone } from "./phone";

const M = 14; // margem em mm
const W = 210;
const H = 297;
const CONTENT = W - M * 2;

type Ctx = { doc: jsPDF; y: number; page: number };

function addPage(ctx: Ctx, title: string) {
  ctx.doc.addPage();
  ctx.page += 1;
  ctx.y = M;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(8);
  ctx.doc.setTextColor(120);
  ctx.doc.text(title, M, ctx.y);
  ctx.doc.setTextColor(20);
  ctx.y += 6;
}

function ensure(ctx: Ctx, needed: number, title: string) {
  if (ctx.y + needed > H - M - 8) addPage(ctx, title);
}

function wrapped(ctx: Ctx, text: string, size = 9.5, bold = false, title = "") {
  ctx.doc.setFont("helvetica", bold ? "bold" : "normal");
  ctx.doc.setFontSize(size);
  const lines = ctx.doc.splitTextToSize(text, CONTENT) as string[];
  for (const line of lines) {
    ensure(ctx, 5, title);
    ctx.doc.text(line, M, ctx.y);
    ctx.y += size * 0.5 + 0.6;
  }
}

function sectionTitle(ctx: Ctx, label: string, title: string) {
  ensure(ctx, 12, title);
  ctx.y += 3;
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(10.5);
  ctx.doc.setTextColor(21, 50, 79);
  ctx.doc.text(label.toUpperCase(), M, ctx.y);
  ctx.doc.setTextColor(20);
  ctx.y += 2;
  ctx.doc.setDrawColor(210);
  ctx.doc.line(M, ctx.y, W - M, ctx.y);
  ctx.y += 5;
}

export async function generateQuotePdf(options: {
  snapshot: QuoteSnapshot;
  logoDataUrl?: string | null;
  draft?: boolean;
  version?: number | null;
}): Promise<void> {
  const { snapshot, logoDataUrl, draft } = options;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx: Ctx = { doc, y: M, page: 1 };
  const company = snapshot.company;
  const q = snapshot.quote;
  const runningTitle = `Orçamento nº ${q.number} — ${company.trade_name}`;

  // Cabeçalho
  let headerTextX = M;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, M, ctx.y, 24, 24, undefined, "FAST");
      headerTextX = M + 28;
    } catch {
      headerTextX = M;
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(21, 50, 79);
  doc.text(company.trade_name, headerTextX, ctx.y + 6);
  doc.setTextColor(60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const companyLines = [
    company.responsible_name ? `Responsável: ${company.responsible_name}` : null,
    company.whatsapp ? `WhatsApp: ${formatBRPhone(company.whatsapp)}` : null,
    company.city,
    company.cnpj ? `CNPJ: ${company.cnpj}` : null,
    company.email,
    company.address,
    company.website,
  ].filter(Boolean) as string[];
  let ly = ctx.y + 11;
  for (const line of companyLines.slice(0, 6)) {
    doc.text(line, headerTextX, ly);
    ly += 3.6;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(21, 50, 79);
  doc.text(`ORÇAMENTO Nº ${q.number}`, W - M, ctx.y + 6, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60);
  doc.text(`Data: ${formatDateBR(q.quote_date)}`, W - M, ctx.y + 11, { align: "right" });
  doc.text(`Validade: ${formatDateBR(q.valid_until)}`, W - M, ctx.y + 15, { align: "right" });
  if (draft) {
    doc.setTextColor(200, 80, 10);
    doc.setFont("helvetica", "bold");
    doc.text("RASCUNHO", W - M, ctx.y + 20, { align: "right" });
  }
  doc.setTextColor(20);

  ctx.y = Math.max(ly, ctx.y + 26) + 2;
  doc.setDrawColor(21, 50, 79);
  doc.setLineWidth(0.5);
  doc.line(M, ctx.y, W - M, ctx.y);
  doc.setLineWidth(0.2);
  ctx.y += 7;

  // Cliente
  sectionTitle(ctx, "Cliente", runningTitle);
  wrapped(
    ctx,
    `${q.client_name}  (${q.client_kind === "pj" ? "Pessoa jurídica" : "Pessoa física"})`,
    10,
    true,
    runningTitle,
  );
  if (q.client_phone) wrapped(ctx, `Telefone: ${formatBRPhone(q.client_phone)}`, 9, false, runningTitle);
  if (q.service_location) wrapped(ctx, `Local do serviço: ${q.service_location}`, 9, false, runningTitle);
  if (q.project_type) wrapped(ctx, `Tipo de projeto: ${q.project_type}`, 9, false, runningTitle);

  // Serviço
  if (q.title || q.description) {
    sectionTitle(ctx, "Serviço", runningTitle);
    if (q.title) wrapped(ctx, q.title, 10.5, true, runningTitle);
    if (q.description) wrapped(ctx, q.description, 9.5, false, runningTitle);
  }

  // Itens
  sectionTitle(ctx, "Itens", runningTitle);
  const colX = [M, M + 96, M + 116, M + 136, M + CONTENT];

  const drawItemsHeader = () => {
    ensure(ctx, 10, runningTitle);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setFillColor(238, 242, 246);
    doc.rect(M, ctx.y - 4, CONTENT, 6.5, "F");
    doc.text("Descrição", colX[0] + 1, ctx.y);
    doc.text("Un.", colX[1], ctx.y);
    doc.text("Qtde", colX[2], ctx.y);
    doc.text("Preço un.", colX[3], ctx.y);
    doc.text("Total", colX[4] - 1, ctx.y, { align: "right" });
    ctx.y += 6;
  };
  drawItemsHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const item of snapshot.items) {
    const descLines = doc.splitTextToSize(item.description, 92) as string[];
    const blockHeight = Math.max(descLines.length * 4.2, 5) + 2;
    if (ctx.y + blockHeight > H - M - 10) {
      addPage(ctx, runningTitle);
      drawItemsHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
    const baseY = ctx.y;
    descLines.forEach((line, i) => doc.text(line, colX[0] + 1, baseY + i * 4.2));
    doc.text(UNIT_LABELS[item.unit] ?? item.unit, colX[1], baseY);
    doc.text(formatQuantity(item.quantity), colX[2], baseY);
    doc.text(formatCents(item.unit_price_cents), colX[3], baseY);
    doc.text(formatCents(item.total_cents), colX[4] - 1, baseY, { align: "right" });
    ctx.y = baseY + blockHeight;
    doc.setDrawColor(232);
    doc.line(M, ctx.y - 2, W - M, ctx.y - 2);
  }

  // Totais (bloco não pode ser cortado)
  const t = snapshot.totals;
  const totalRows: Array<[string, string]> = [["Subtotal", formatCents(t.subtotal_cents)]];
  if (t.tax_percent > 0)
    totalRows.push([`Impostos (${t.tax_percent}% do subtotal)`, formatCents(t.taxes_cents)]);
  if (t.bdi_percent > 0)
    totalRows.push([`BDI (${t.bdi_percent}% do subtotal)`, formatCents(t.bdi_cents)]);
  if (t.extra_costs_cents > 0)
    totalRows.push(["Despesas adicionais", formatCents(t.extra_costs_cents)]);
  if (t.discount_cents > 0) totalRows.push(["Desconto", `- ${formatCents(t.discount_cents)}`]);

  const totalsHeight = totalRows.length * 5 + 16;
  if (ctx.y + totalsHeight > H - M - 8) addPage(ctx, runningTitle);
  ctx.y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  for (const [label, value] of totalRows) {
    doc.text(label, W - M - 62, ctx.y);
    doc.text(value, W - M, ctx.y, { align: "right" });
    ctx.y += 5;
  }
  ctx.y += 2;
  doc.setFillColor(21, 50, 79);
  doc.rect(W - M - 90, ctx.y - 4.5, 90, 9, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", W - M - 87, ctx.y + 1.5);
  doc.text(formatCents(t.total_cents), W - M - 3, ctx.y + 1.5, { align: "right" });
  doc.setTextColor(20);
  ctx.y += 12;

  // Condições comerciais
  sectionTitle(ctx, "Condições", runningTitle);
  wrapped(ctx, `Pagamento: ${q.payment_terms || "a combinar"}`, 9.5, false, runningTitle);
  wrapped(ctx, `Prazo de execução: ${q.execution_term || "a combinar"}`, 9.5, false, runningTitle);
  wrapped(ctx, `Validade da proposta: ${formatDateBR(q.valid_until)}`, 9.5, false, runningTitle);

  if (q.inclusions) {
    sectionTitle(ctx, "Inclusões", runningTitle);
    wrapped(ctx, q.inclusions, 9.5, false, runningTitle);
  }
  if (q.exclusions) {
    sectionTitle(ctx, "Exclusões", runningTitle);
    wrapped(ctx, q.exclusions, 9.5, false, runningTitle);
  }
  if (q.notes) {
    sectionTitle(ctx, "Observações", runningTitle);
    wrapped(ctx, q.notes, 9.5, false, runningTitle);
  }

  // Rodapé com numeração
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140);
    doc.text(`Página ${i} de ${total}`, W - M, H - 8, { align: "right" });
    doc.text(draft ? "Rascunho — documento não publicado" : company.trade_name, M, H - 8);
  }

  doc.save(
    `orcamento-${q.number}-${(q.client_name || "cliente")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase()}${draft ? "-rascunho" : ""}.pdf`,
  );
}

export async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
