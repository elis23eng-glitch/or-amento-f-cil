import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProposalView } from "@/components/orcai/proposal-view";
import { getPublicQuote } from "@/lib/public-quote.functions";
import { formatDateBR } from "@/lib/money";

const publicQuoteQuery = (token: string) =>
  queryOptions({
    queryKey: ["public-quote", token],
    queryFn: () => getPublicQuote({ data: { token } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/orcamento/$token")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(publicQuoteQuery(params.token)),
  head: ({ loaderData }) => {
    const ok = loaderData && loaderData.ok;
    const title = ok
      ? `Proposta nº ${loaderData.snapshot.quote.number} — ${loaderData.snapshot.company.trade_name}`
      : "Proposta indisponível — Orçai";
    return {
      meta: [
        { title },
        { name: "description", content: "Proposta comercial compartilhada pelo Orçai." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Proposta comercial compartilhada pelo Orçai." },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: PublicQuotePage,
  errorComponent: () => <Unavailable />,
  notFoundComponent: () => <Unavailable />,
});

function Unavailable() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="surface max-w-md p-6 text-center">
        <h1 className="font-display text-xl font-extrabold text-brand">Proposta indisponível</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este link não é válido ou foi desativado por quem enviou a proposta. Peça um novo link ao
          profissional responsável.
        </p>
      </div>
    </div>
  );
}

function PublicQuotePage() {
  const { token } = Route.useParams();
  const { data } = useSuspenseQuery(publicQuoteQuery(token));
  const [downloading, setDownloading] = useState(false);

  if (!data.ok) return <Unavailable />;

  async function download() {
    if (!data.ok) return;
    setDownloading(true);
    try {
      const { generateQuotePdf, urlToDataUrl } = await import("@/lib/pdf");
      const logo = data.logoUrl ? await urlToDataUrl(data.logoUrl) : null;
      await generateQuotePdf({ snapshot: data.snapshot, logoDataUrl: logo, version: data.version });
      toast.success("PDF baixado.");
    } catch {
      toast.error("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-6">
        {data.expired ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-warning/50 bg-warning/15 p-3 text-sm text-warning-foreground"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              A validade comercial desta proposta venceu em{" "}
              {formatDateBR(data.snapshot.quote.valid_until)}. Confirme valores e condições com o
              profissional antes de aprovar.
            </span>
          </div>
        ) : null}

        <ProposalView snapshot={data.snapshot} logoUrl={data.logoUrl} version={data.version} />

        <div className="mt-5 grid gap-3 sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Publicada em {formatDateBR(data.published_at.slice(0, 10))} · Gerada com Orçai
          </p>
          <Button onClick={download} disabled={downloading} size="lg" className="h-12 font-bold">
            {downloading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Download className="size-5" />
            )}
            Baixar PDF
          </Button>
        </div>
      </main>
    </div>
  );
}
