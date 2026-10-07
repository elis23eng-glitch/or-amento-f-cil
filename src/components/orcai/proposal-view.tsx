import { formatCents, formatDateBR, formatQuantity, UNIT_LABELS } from "@/lib/money";
import { formatBRPhone } from "@/lib/phone";
import type { QuoteSnapshot } from "@/lib/quote-snapshot";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="font-display text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-brand">
        {title}
      </h3>
      <div className="mt-1.5 border-t border-border pt-2 text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </section>
  );
}

export function ProposalView({
  snapshot,
  logoUrl,
  draft,
  version,
}: {
  snapshot: QuoteSnapshot;
  logoUrl?: string | null | undefined;
  draft?: boolean | undefined;
  version?: number | null | undefined;
}) {
  const { company, quote, items, totals } = snapshot;
  return (
    <article className="surface overflow-hidden">
      {draft ? (
        <p className="bg-warning/25 px-4 py-2 text-xs font-bold uppercase tracking-wide text-warning-foreground">
          Rascunho — ainda não publicado
        </p>
      ) : null}
      <header className="bg-card px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`Logo de ${company.trade_name}`}
                className="size-12 shrink-0 object-contain"
              />
            ) : null}
            <div className="min-w-0">
              <h2 className="font-display text-lg font-extrabold leading-tight text-brand">
                {company.trade_name}
              </h2>
              {company.proposal_header_text || company.responsible_name ? (
                <p className="mt-1 text-[0.65rem] font-semibold uppercase text-muted-foreground">
                  {company.proposal_header_text || `Responsável: ${company.responsible_name}`}
                </p>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <p className="text-[0.62rem] font-extrabold uppercase text-foreground">Proposta comercial</p>
            <p className="font-display text-sm font-extrabold text-brand">ORC-{String(quote.number).padStart(4, "0")}</p>
            <p>Emitida em {formatDateBR(quote.quote_date)}</p>
            {version ? <p>Versão {version}</p> : null}
          </div>
        </div>
        <div className="mt-5 border-b border-border" />
      </header>

      <div className="px-4 pb-6 sm:px-6">
        <Block title="Cliente">
          <p className="font-semibold">
            {quote.client_name || "—"}{" "}
            <span className="font-normal text-muted-foreground">
              ({quote.client_kind === "pj" ? "Pessoa jurídica" : "Pessoa física"})
            </span>
          </p>
          {quote.client_phone ? <p>Telefone: {formatBRPhone(quote.client_phone)}</p> : null}
          {quote.service_location ? <p>Local do serviço: {quote.service_location}</p> : null}
          {quote.project_type ? <p>Tipo de projeto: {quote.project_type}</p> : null}
        </Block>

        {quote.title || quote.description ? (
          <Block title="Serviço">
            {quote.title ? <p className="font-semibold">{quote.title}</p> : null}
            {quote.description ? (
              <p className="whitespace-pre-line text-muted-foreground">{quote.description}</p>
            ) : null}
          </Block>
        ) : null}

        <Block title="Itens">
          <ul className="divide-y divide-border">
            {items.map((item, index) => (
              <li key={index} className="grid gap-1 py-2.5">
                <p className="font-medium">{item.description}</p>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 text-xs text-muted-foreground">
                  <span>
                    {formatQuantity(item.quantity)} {UNIT_LABELS[item.unit] ?? item.unit} ×{" "}
                    {formatCents(item.unit_price_cents)}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-foreground">
                    {formatCents(item.total_cents)}
                  </span>
                </div>
              </li>
            ))}
            {items.length === 0 ? (
              <li className="py-2 text-muted-foreground">Nenhum item adicionado.</li>
            ) : null}
          </ul>
        </Block>

        <div className="mt-4 grid gap-1 rounded-xl bg-secondary p-3 text-sm">
          <Row label="Subtotal" value={formatCents(totals.subtotal_cents)} />
          {totals.tax_percent > 0 ? (
            <Row
              label={`Impostos (${totals.tax_percent}% do subtotal)`}
              value={formatCents(totals.taxes_cents)}
            />
          ) : null}
          {totals.bdi_percent > 0 ? (
            <Row
              label={`BDI (${totals.bdi_percent}% do subtotal)`}
              value={formatCents(totals.bdi_cents)}
            />
          ) : null}
          {totals.extra_costs_cents > 0 ? (
            <Row label="Despesas adicionais" value={formatCents(totals.extra_costs_cents)} />
          ) : null}
          {totals.discount_cents > 0 ? (
            <Row label="Desconto" value={`- ${formatCents(totals.discount_cents)}`} />
          ) : null}
          <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-brand px-3 py-2 text-brand-foreground">
            <span className="font-display text-sm font-extrabold uppercase tracking-wide">
              Total
            </span>
            <span className="font-display text-lg font-extrabold">
              {formatCents(totals.total_cents)}
            </span>
          </div>
        </div>

        <Block title="Condições">
          <p>Pagamento: {quote.payment_terms || "a combinar"}</p>
          <p>Prazo de execução: {quote.execution_term || "a combinar"}</p>
          <p>Validade da proposta: {formatDateBR(quote.valid_until)}</p>
        </Block>

        {quote.inclusions ? (
          <Block title="Inclusões">
            <p className="whitespace-pre-line">{quote.inclusions}</p>
          </Block>
        ) : null}
        {quote.exclusions ? (
          <Block title="Exclusões">
            <p className="whitespace-pre-line">{quote.exclusions}</p>
          </Block>
        ) : null}
        {quote.notes ? (
          <Block title="Observações">
            <p className="whitespace-pre-line">{quote.notes}</p>
          </Block>
        ) : null}
      </div>

      <footer className="px-4 pb-6 pt-8 sm:px-6 sm:pb-8">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
          <div className="border-t border-border pt-2 text-center">
            <p className="text-sm font-semibold text-foreground">{company.trade_name}</p>
            <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground">Contratada</p>
          </div>
          <div className="border-t border-border pt-2 text-center">
            <p className="text-sm font-semibold text-foreground">{quote.client_name || "Cliente"}</p>
            <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground">Contratante</p>
          </div>
        </div>
        <ul className="mt-7 flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-border pt-3 text-center text-[0.65rem] text-muted-foreground">
          {company.proposal_footer_text ? <li className="basis-full whitespace-pre-line">{company.proposal_footer_text}</li> : null}
          {company.cnpj ? <li>CNPJ {company.cnpj}</li> : null}
          {company.whatsapp ? <li>{formatBRPhone(company.whatsapp)}</li> : null}
          {company.email ? <li>{company.email}</li> : null}
          {company.website ? <li>{company.website}</li> : null}
          {company.address ? <li>{company.address}</li> : company.city ? <li>{company.city}</li> : null}
        </ul>
      </footer>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="shrink-0 font-semibold">{value}</span>
    </div>
  );
}
