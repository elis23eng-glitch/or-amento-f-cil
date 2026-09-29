# Orçai — MVP de orçamentos para construtores

Aplicativo web em português do Brasil, feito para o celular, onde o profissional monta o orçamento na visita à obra e compartilha a proposta por WhatsApp. Banco de dados, login, armazenamento da logo e regras de servidor pelo Lovable Cloud.

## Telas

**Público**
- **Início (`/`)** — título "Do atendimento à proposta: seu orçamento pronto para enviar.", subtítulo, botões "Testar por 7 dias" e "Ver exemplo", três passos, benefícios, plano piloto R$ 29,90/mês, perguntas frequentes, formulário de interesse, links de acesso e cadastro.
- **Exemplo (`/exemplo`)** — proposta fictícia, marcada como exemplo.
- **Privacidade (`/privacidade`)** — apenas os dados realmente coletados.
- **Proposta pública (`/orcamento/TOKEN`)** — sem login, mostra só a versão publicada, aviso de validade vencida, mensagem neutra para link inválido ou revogado, sem indexação.
- **Entrar / Criar conta / Recuperar senha (`/auth`)**

**Área do profissional**
- Visão geral: propostas por situação, recentes, soma das aprovadas (rótulo "valor de propostas aprovadas", nunca "receita"), lembretes.
- Orçamentos: lista com busca e filtros por cliente, período e situação.
- Editor de orçamento: dados do cliente, itens, condições, ajustes avançados, prévia ao lado que atualiza em tempo real, aviso de alterações não salvas.
- Clientes, Serviços frequentes (catálogo privado com preços próprios), Minha empresa, Meu plano.

**Administração (`/admin`)**
- Leads com situação (Novo, Contatado, Em teste, Pagante, Inativo), usuários e datas do teste, solicitações de assinatura, pagamentos confirmados à mão, vigência, lembretes, número de WhatsApp da administradora, indicadores. Sem abrir o conteúdo das propostas.

## Modelo de dados

`profiles` (dono, teste iniciado/vence), `user_roles` (tabela separada; papel nunca escolhido no cadastro), `companies`, `clients`, `catalog_services`, `quotes`, `quote_items`, `quote_versions` (cópia congelada), `share_tokens`, `leads`, `subscriptions`, `manual_payments`, `reminders`, `admin_audit`, `app_settings` (WhatsApp da administradora).

Valores guardados em centavos. Números de orçamento sequenciais por profissional.

## Regras de acesso

- Cada profissional lê e altera só o que é dele, inclusive a logo enviada.
- Leads nunca podem ser lidos publicamente; o envio público tem validação e limite de requisições.
- Nenhuma tabela é lida direto sem login: o token da proposta é resolvido no servidor, que devolve só os campos autorizados.
- Teste gratuito, vigência e confirmação de pagamento existem apenas no servidor; o usuário não ativa plano pela tela nem por chamada direta.
- Administração exclusiva de quem tem o papel de administradora, concedido por procedimento no banco.

## Fluxos

- **Profissional**: cria conta → cadastra empresa → monta orçamento (rascunho) → publica (gera versão congelada e link) → compartilha no WhatsApp, copia link, copia mensagem ou baixa PDF → marca envio, aprovação ou recusa à mão.
- **Cliente da obra**: abre o link, vê a proposta publicada, sem login.
- **Administradora**: recebe o lead, conversa no WhatsApp dela, confirma pagamento e define vigência; tudo fica registrado com autor e data.

Os dois WhatsApp ficam separados: o do cliente da obra e o da administradora.

## Cálculos

Total do item = quantidade × preço unitário. Subtotal = soma dos itens. Impostos e BDI em percentual, opcionais, começando em zero, calculados separadamente sobre o subtotal. Total = subtotal + impostos + BDI + adicionais − desconto. A fórmula aparece explicada na tela, com aviso para não somar impostos já embutidos no BDI e sem chamar BDI de margem líquida. Sem valores negativos, sem desconto maior que o valor antes do desconto. O servidor recalcula antes de salvar e publicar.

Caso obrigatório verificado em tela, banco, página pública e PDF: 10 × R$ 25,50 + R$ 30,00 − R$ 15,00 = R$ 270,00.

## Ordem de implementação

1. Ligar o Lovable Cloud e criar o banco com todas as regras de acesso.
2. Identidade visual (azul #15324F, laranja #EA580C, fundo #F8FAFC, texto #0F172A, verde para WhatsApp), pensada primeiro em 360 px.
3. Landing page, exemplo fictício, privacidade e captura de leads.
4. Cadastro, login, recuperação de senha, perfil e controle do teste de 7 dias.
5. Minha empresa, com envio e validação da logo.
6. Editor de orçamento com itens, cálculos, prévia e catálogo de serviços.
7. Publicação, versões congeladas, link público e revogação.
8. Compartilhamento no WhatsApp e geração real do PDF em A4 com várias páginas.
9. Painel do profissional com busca, filtros e lembretes.
10. Administração, pagamentos manuais e indicadores.
11. Revisão de segurança e correções, README e relato honesto dos testes.

## Detalhes técnicos

- TanStack Start + React, Tailwind com tokens semânticos no design system.
- Supabase (Lovable Cloud) com RLS em todas as tabelas; token de compartilhamento gerado no servidor com alta entropia.
- Lógica sensível em server functions; leitura pública da proposta por função de servidor com chave publicável e política restrita.
- PDF gerado no cliente a partir da versão publicada, com paginação A4 real.
- Sem gateway de pagamento, marketplace, BIM ou IA paga.

## Fora do escopo / dependente da proprietária

- Número de WhatsApp da administradora: precisa ser configurado por ela no painel; sem isso o pedido é salvo e informamos que o contato está pendente.
- Concessão do papel de administradora à conta dela.
- Cobrança e confirmação de pagamento seguem manuais nesta versão.
