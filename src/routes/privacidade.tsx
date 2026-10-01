import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/orcai/brand";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — Orçai" },
      {
        name: "description",
        content:
          "Quais dados o Orçai coleta, para que servem, quem tem acesso e como solicitar exportação ou exclusão.",
      },
      { property: "og:title", content: "Política de privacidade — Orçai" },
      {
        property: "og:description",
        content: "Dados coletados, finalidade, acesso, exportação e exclusão no Orçai.",
      },
      { property: "og:url", content: "/privacidade" },
    ],
    links: [{ rel: "canonical", href: "/privacidade" }],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="font-display text-lg font-extrabold text-brand">{title}</h2>
      <div className="mt-2 grid gap-2 text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <Link to="/">
            <BrandMark />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-extrabold text-brand sm:text-3xl">
          Política de privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta política descreve apenas os dados que o Orçai realmente coleta nesta versão.
        </p>

        <Section title="Quem somos">
          <p>
            O Orçai é uma ferramenta para profissionais da construção criarem e enviarem orçamentos.
            A operação é feita diretamente pela administradora do serviço, que atende os interessados
            por WhatsApp.
          </p>
        </Section>

        <Section title="Dados que coletamos">
          <p>
            <strong>Formulário de interesse:</strong> nome, WhatsApp, profissão ou tipo de serviço,
            cidade, quantidade aproximada de orçamentos por mês, qual é o seu interesse (testar ou
            contratar) e, se você marcar, o consentimento opcional para receber novidades. Também
            registramos o endereço de origem da requisição para evitar abuso do formulário.
          </p>
          <p>
            <strong>Conta:</strong> e-mail e senha (a senha é guardada de forma cifrada pelo serviço
            de autenticação), além de nome e telefone se você preencher o perfil.
          </p>
          <p>
            <strong>Sua empresa:</strong> nome comercial, nome do responsável, WhatsApp, cidade e,
            opcionalmente, logo, CNPJ, e-mail, endereço e site ou rede social.
          </p>
          <p>
            <strong>Orçamentos:</strong> dados que você digita sobre o cliente da obra (nome,
            telefone, tipo de cliente, local do serviço), itens, valores, condições comerciais e
            observações. Também guardamos as versões publicadas e os links de compartilhamento.
          </p>
          <p>
            <strong>Assinatura:</strong> situação do teste gratuito, situação do plano e os
            pagamentos confirmados manualmente pela administradora, com data, valor e quem confirmou.
          </p>
        </Section>

        <Section title="Para que usamos">
          <p>
            Para atender à sua solicitação de teste ou contratação, permitir que você crie e envie
            orçamentos, exibir a proposta publicada a quem tiver o link e controlar a vigência do
            teste e do plano. O consentimento para novidades é separado e opcional: recusá-lo não
            impede o atendimento nem o uso do produto.
          </p>
        </Section>

        <Section title="Quem tem acesso">
          <p>
            Cada profissional acessa apenas os próprios dados. A administradora do Orçai acessa os
            pedidos de interesse, os cadastros, a situação do teste e dos pagamentos — e não vê o
            conteúdo detalhado das propostas dos profissionais.
          </p>
          <p>
            Os dados ficam na infraestrutura de nuvem usada pela aplicação (banco de dados,
            autenticação e armazenamento de arquivos).
          </p>
        </Section>

        <Section title="Link público da proposta">
          <p>
            Quando você publica uma proposta, geramos um link com um código aleatório. Qualquer
            pessoa com esse link pode visualizar a proposta publicada, sem login. O link pode ser
            revogado por você a qualquer momento. Essas páginas não são indexadas por buscadores.
          </p>
        </Section>

        <Section title="Dados do cliente da obra">
          <p>
            Os dados do cliente da obra são informados por você. Não exigimos CPF nem CNPJ do
            cliente para gerar uma proposta simples. Use apenas o necessário e avise seu cliente de
            que a proposta será compartilhada por link.
          </p>
        </Section>

        <Section title="Seus direitos">
          <p>
            Dentro do painel, em “Meu plano”, você pode exportar seus dados em arquivo. Para
            solicitar correção ou exclusão da conta e dos dados, fale com a administradora pelo
            WhatsApp de atendimento informado no painel ou no formulário de interesse.
          </p>
        </Section>

        <Section title="Alterações">
          <p>
            Esta política pode ser atualizada conforme o produto evoluir. Mudanças relevantes serão
            comunicadas aos usuários ativos.
          </p>
        </Section>

        <p className="mt-8 text-sm">
          <Link to="/" className="font-semibold text-brand underline">
            Voltar ao início
          </Link>
        </p>
      </main>
    </div>
  );
}
