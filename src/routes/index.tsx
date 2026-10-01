import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  FileText,
  MessageCircle,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BrandMark } from "@/components/orcai/brand";
import { LeadForm } from "@/components/orcai/lead-form";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orçai — do atendimento à proposta, pelo celular" },
      {
        name: "description",
        content:
          "Crie orçamentos de obras e serviços pelo celular, com a identidade da sua empresa, e compartilhe por WhatsApp. Teste 7 dias sem cartão.",
      },
      { property: "og:title", content: "Orçai — do atendimento à proposta, pelo celular" },
      {
        property: "og:description",
        content:
          "Orçamentos de obra na visita ao cliente e propostas profissionais enviadas por WhatsApp.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: Building2,
    title: "1. Cadastre sua empresa",
    text: "Nome, cidade, contato e logo. Sem CNPJ também funciona.",
  },
  {
    icon: FileText,
    title: "2. Monte o orçamento",
    text: "Itens com unidade, quantidade e preço seu. O total aparece na hora.",
  },
  {
    icon: Share2,
    title: "3. Compartilhe",
    text: "Publique a proposta, envie o link por WhatsApp ou baixe o PDF.",
  },
];

const BENEFITS = [
  {
    icon: Smartphone,
    title: "Organização",
    text: "Seus orçamentos, clientes e serviços frequentes em um só lugar, com busca e filtros.",
  },
  {
    icon: Sparkles,
    title: "Apresentação profissional",
    text: "A proposta sai com o nome e a logo da sua empresa, em link e em PDF A4.",
  },
  {
    icon: MessageCircle,
    title: "Facilidade de envio",
    text: "Mensagem pronta no WhatsApp com o número, o valor e o link da proposta.",
  },
];

const FAQ = [
  {
    q: "Preciso de cartão de crédito para testar?",
    a: "Não. O teste é gratuito por 7 dias e começa no momento do cadastro.",
  },
  {
    q: "Quanto custa depois do teste?",
    a: "O plano piloto custa R$ 29,90 por mês. A contratação e o atendimento acontecem pelo WhatsApp da administradora, e o pagamento é confirmado manualmente nesta primeira versão.",
  },
  {
    q: "Funciona sem CNPJ?",
    a: "Sim. Você pode usar seu nome como profissional autônomo; o CNPJ é opcional.",
  },
  {
    q: "O cliente precisa criar conta para ver a proposta?",
    a: "Não. Ele abre o link da proposta em qualquer celular ou computador, sem login.",
  },
  {
    q: "O que acontece quando o teste vence?",
    a: "Você continua consultando e exportando os orçamentos existentes, e os links já enviados continuam funcionando. A criação e a publicação de novos orçamentos ficam bloqueadas até a contratação.",
  },
  {
    q: "O WhatsApp envia o PDF automaticamente?",
    a: "Não. O WhatsApp abre com uma mensagem e o link da proposta. O PDF é um arquivo que você baixa e pode anexar manualmente, se quiser.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <BrandMark />
          <nav className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:brightness-95">
              <Link to="/auth" search={{ modo: "cadastro" }}>
                Criar conta
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="brand-gradient px-4 py-12 text-brand-foreground sm:py-16">
          <div className="mx-auto max-w-5xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <ShieldCheck className="size-4" aria-hidden="true" /> Teste 7 dias, sem cartão
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-5xl">
              Do atendimento à proposta: seu orçamento pronto para enviar.
            </h1>
            <p className="mt-4 max-w-xl text-base opacity-90 sm:text-lg">
              Crie orçamentos de obras e serviços pelo celular, com a identidade da sua empresa, e
              compartilhe por WhatsApp.
            </p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="h-14 bg-accent text-base font-bold text-accent-foreground hover:brightness-95"
              >
                <Link to="/auth" search={{ modo: "cadastro" }}>
                  Testar por 7 dias
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 border-brand-foreground/40 bg-transparent text-base font-bold text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
              >
                <Link to="/exemplo">Ver exemplo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Passos */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="font-display text-2xl font-extrabold text-brand sm:text-3xl">
            Em três passos
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="surface p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-accent/12 text-accent">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 font-display text-base font-bold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefícios */}
        <section className="bg-secondary px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-2xl font-extrabold text-brand sm:text-3xl">
              Por que usar o Orçai
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {BENEFITS.map((b) => (
                <div key={b.title} className="surface p-5">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                    <b.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold">{b.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Exemplo */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="surface grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="inline-flex rounded-full bg-warning/25 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-warning-foreground">
                Exemplo fictício
              </p>
              <h2 className="mt-3 font-display text-xl font-extrabold text-brand">
                Veja como o cliente recebe a proposta
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Montamos uma proposta de demonstração com empresa, cliente e preços inventados, só
                para você ver o formato. Nenhum dado real é usado.
              </p>
            </div>
            <Button asChild size="lg" variant="outline" className="h-12 shrink-0 font-bold">
              <Link to="/exemplo">Abrir exemplo</Link>
            </Button>
          </div>
        </section>

        {/* Plano */}
        <section className="mx-auto max-w-5xl px-4 pb-12" id="plano">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="surface p-6">
              <h2 className="font-display text-2xl font-extrabold text-brand">Plano piloto</h2>
              <p className="mt-2 font-display text-4xl font-extrabold text-foreground">
                R$ 29,90
                <span className="text-base font-semibold text-muted-foreground"> /mês</span>
              </p>
              <ul className="mt-4 grid gap-2 text-sm">
                {[
                  "7 dias de teste gratuito, sem cartão",
                  "Orçamentos ilimitados durante o período ativo",
                  "Proposta em link público e PDF A4",
                  "Clientes e serviços frequentes salvos",
                  "Contratação e atendimento pelo WhatsApp",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Nesta primeira versão o pagamento e a confirmação são feitos manualmente pela
                administradora. Não há cobrança automática.
              </p>
            </div>
            <LeadForm />
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-secondary px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-extrabold text-brand sm:text-3xl">
              Perguntas frequentes
            </h2>
            <Accordion type="single" collapsible className="mt-5">
              {FAQ.map((item, i) => (
                <AccordionItem key={item.q} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-semibold">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <BrandMark />
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-brand">
            <Link to="/auth">Entrar</Link>
            <Link to="/auth" search={{ modo: "cadastro" }}>
              Criar conta
            </Link>
            <Link to="/exemplo">Ver exemplo</Link>
            <Link to="/privacidade">Política de privacidade</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
