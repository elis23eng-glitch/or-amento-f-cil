# Orçai

Aplicação web responsiva, em português do Brasil, para construtores e profissionais autônomos criarem, organizarem e compartilharem orçamentos de obras e serviços pelo celular.

## Proposta do produto

O Orçai reduz o trabalho entre a visita ao cliente e o envio de uma proposta profissional. O profissional cadastra a própria empresa, monta o orçamento, publica uma versão imutável e compartilha o link pelo WhatsApp ou em PDF.

O MVP foi criado para validar a procura por uma ferramenta simples com teste gratuito de 7 dias e plano piloto de **R$ 29,90/mês**, sem cartão e sem cobrança automática.

## Público

- construtores e pequenas construtoras;
- pedreiros e empreiteiros;
- pintores, eletricistas e instaladores hidráulicos;
- profissionais de reformas, acabamentos e manutenção predial;
- autônomos que precisam apresentar propostas com a própria identidade.

## Funcionalidades entregues

### Site público

- página inicial com apresentação, plano piloto, perguntas frequentes e formulário de interesse;
- proposta fictícia separada e identificada como demonstração;
- política de privacidade;
- captura de leads com validação, consentimento de marketing separado e limitação de requisições;
- salvamento do interesse mesmo quando o WhatsApp da administradora ainda não foi configurado.

### Conta e período de teste

- cadastro, entrada, recuperação de senha e encerramento de sessão;
- perfil do profissional;
- teste gratuito de 7 dias calculado no servidor;
- bloqueio de novas criações e publicações após o vencimento, preservando consulta e exportação do que já existe;
- ativação de assinatura restrita à administração.

### Empresa, clientes e serviços

- cadastro da empresa ou do profissional, sem obrigatoriedade de CNPJ;
- logo opcional em armazenamento privado, com validação de arquivo;
- dados da empresa usados nas propostas e nos PDFs;
- cadastro de clientes;
- catálogo privado de serviços frequentes e preços próprios.

### Orçamentos e propostas

- número sequencial por profissional;
- cliente pessoa física ou jurídica, local e tipo de projeto;
- itens com unidade, quantidade, preço unitário e total calculado;
- inclusão, remoção e reordenação de itens;
- rascunho, edição, duplicação e exclusão confirmada de rascunhos;
- condições de pagamento, prazo, validade, inclusões, exclusões e observações;
- impostos e BDI opcionais, despesas adicionais e desconto;
- recálculo e validação dos totais no servidor;
- prévia atualizada durante a edição e aviso de alterações não salvas;
- publicação em versão congelada: mudanças posteriores não alteram a proposta já enviada;
- versões sucessivas, revogação do link e situações manuais de aprovação, recusa, vencimento e envio;
- proposta pública por token aleatório, sem login e sem leitura anônima direta das tabelas;
- aviso de validade vencida e mensagem neutra para link inválido ou revogado;
- compartilhamento pelo WhatsApp, cópia do link, cópia da mensagem e confirmação manual de envio;
- PDF A4 real, com logo, dados da empresa, cabeçalho e rodapé inspirados no modelo comercial, itens, totais, condições e paginação.

### Painel do profissional

- visão geral com propostas por situação, recentes e valor de propostas aprovadas;
- busca e filtros de orçamentos;
- páginas de clientes, serviços frequentes, empresa e plano;
- lembretes no painel, sem disparo automático de mensagens.

### Administração

- acesso separado por papel de administradora;
- leads e respectivas situações;
- usuários e datas do teste;
- solicitações de assinatura;
- confirmação manual de pagamentos e vigência dos planos;
- registro de quem alterou pagamentos e quando;
- configuração do WhatsApp de atendimento;
- indicadores do MVP sem abrir o conteúdo detalhado das propostas.

## Cálculos

Valores monetários são armazenados em centavos. Quantidades aceitam até duas casas decimais.

```text
total do item = quantidade × preço unitário
subtotal = soma dos itens
total = subtotal + impostos + BDI + despesas adicionais − desconto
```

Impostos e BDI são calculados separadamente sobre o subtotal. O BDI não é apresentado como margem líquida. O desconto não pode ultrapassar o valor anterior ao desconto.

Caso de referência: `10 × R$ 25,50 + R$ 30,00 − R$ 15,00 = R$ 270,00`.

## Stack

- **Frontend e servidor:** TanStack Start, React 19 e TypeScript;
- **Estilos:** Tailwind CSS v4 e componentes Radix UI;
- **Dados, autenticação e armazenamento:** Lovable Cloud com PostgreSQL, autenticação, políticas de acesso e armazenamento privado;
- **Validação:** Zod;
- **PDF:** jsPDF;
- **Ícones:** Lucide React;
- **Build:** Vite.

## Configuração

### Requisitos locais

- Bun recente;
- um projeto conectado ao Lovable Cloud;
- variáveis públicas do projeto fornecidas pelo ambiente do Lovable Cloud.

```bash
bun install
bun run dev
```

Para gerar uma versão de produção:

```bash
bun run build
```

As migrações do banco estão em `drizzle/migrations`. Elas criam as tabelas, tipos, índices, gatilhos e políticas de acesso. O bucket privado `logos` deve existir com limite de 2 MB; as políticas limitam cada arquivo à pasta do respectivo proprietário.

### Configuração da proprietária

1. Criar a conta normalmente pelo aplicativo.
2. Conceder o papel `admin` à conta da proprietária por uma operação privilegiada no banco. Não existe opção de escolher esse papel no cadastro.
3. Entrar em **Admin** e configurar o WhatsApp da administradora.
4. Manter a confirmação de e-mail e as URLs públicas de autenticação ajustadas ao domínio usado na publicação.

Nunca coloque chaves privilegiadas no navegador ou no repositório.

## Pagamento manual

O MVP não possui gateway de pagamento. O fluxo é:

1. o interessado solicita o plano;
2. a administradora atende pelo WhatsApp configurado;
3. o pagamento acontece fora do aplicativo;
4. a administradora confirma o pagamento e define a vigência no painel;
5. a alteração fica registrada com responsável e data.

O usuário comum não consegue ativar a própria assinatura pela tela nem pelas funções protegidas do servidor.

## Segurança e controle de acesso

- políticas de acesso em todas as tabelas privadas;
- dados vinculados ao proprietário autenticado;
- papéis armazenados separadamente do perfil;
- funções sensíveis verificam a sessão e a autorização no servidor;
- logos em armazenamento privado com URLs temporárias;
- token público de alta entropia resolvido no servidor;
- leads não possuem leitura pública;
- captura pública de leads com validação e limitação por IP;
- páginas públicas de proposta marcadas para não indexação.

## Testes realizados

Até a última atualização deste README:

- a compilação de produção foi concluída sem erros;
- a página inicial e a proposta fictícia foram abertas no ambiente de prévia;
- as fórmulas de valores usam a mesma função compartilhada na prévia e no snapshot salvo;
- o cabeçalho e o rodapé do PDF foram conferidos visualmente após a adaptação ao modelo enviado.

O projeto ainda **não possui uma suíte automatizada**. Os 15 cenários completos de aceite descritos para o MVP ainda não foram executados ponta a ponta; portanto, persistência entre sessões, isolamento entre duas contas reais, revogação em janela anônima, fluxo de assinatura administrativa e PDFs extensos devem ser considerados pendentes de validação integral antes da publicação.

## Limitações conhecidas

- pagamento e confirmação são manuais;
- não há gateway, cobrança recorrente ou emissão fiscal;
- o WhatsApp abre a conversa, mas não anexa o PDF nem confirma o envio automaticamente;
- não há envio automático de lembretes;
- o WhatsApp da administradora e o papel da conta proprietária exigem configuração inicial;
- exportação consolidada de todos os dados da conta e exclusão automática da conta ainda não estão disponíveis;
- não há marketplace, BIM, Data Lake, Databricks ou recursos pagos de IA;
- a revisão final de segurança do Lovable e os 15 testes de aceite ainda precisam ser concluídos antes da publicação.

## Estado do MVP

O fluxo principal está implementado, mas a aplicação deve permanecer em prévia até a configuração da proprietária, a revisão final de segurança e a execução documentada dos testes de aceite.