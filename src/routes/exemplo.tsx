import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/orcai/brand";
import { ProposalView } from "@/components/orcai/proposal-view";
import { DEMO_SNAPSHOT } from "@/lib/demo-snapshot";

export const Route = createFileRoute("/exemplo")({
  head: () => ({
    meta: [
      { title: "Exemplo de proposta — Orçai" },
      {
        name: "description",
        content:
          "Demonstração fictícia de como o cliente recebe uma proposta criada no Orçai, com itens, condições e total.",
      },
      { property: "og:title", content: "Exemplo de proposta — Orçai" },
      {
        property: "og:description",
        content: "Proposta de demonstração, com dados inventados, no formato que o cliente recebe.",
      },
      { property: "og:url", content: "/exemplo" },
    ],
    links: [{ rel: "canonical", href: "/exemplo" }],
  }),
  component: ExamplePage,
});

function ExamplePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Link to="/">
            <BrandMark />
          </Link>
          <Button asChild size="sm" className="shrink-0 bg-accent text-accent-foreground">
            <Link to="/auth" search={{ modo: "cadastro" }}>
              Testar por 7 dias
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-xl border border-warning/50 bg-warning/15 p-4">
          <h1 className="font-display text-lg font-extrabold text-warning-foreground">
            Exemplo fictício de proposta
          </h1>
          <p className="mt-1 text-sm text-warning-foreground/90">
            Empresa, cliente, serviços e valores abaixo são inventados, apenas para demonstrar o
            formato. Não representam uma obra, um cliente ou preços reais.
          </p>
        </div>

        <div className="mt-5">
          <ProposalView snapshot={DEMO_SNAPSHOT} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12 bg-accent font-bold text-accent-foreground">
            <Link to="/auth" search={{ modo: "cadastro" }}>
              Criar meu primeiro orçamento
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 font-bold">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
