# Arquitetura do Orçai

## Visão geral

O Orçai usa TanStack Start e React. As páginas ficam em `src/routes`, a lógica sensível em funções de servidor e os dados persistentes no Lovable Cloud.

## Limites da aplicação

- **Navegador:** formulários, prévias, autenticação e downloads.
- **Servidor:** validação de acesso, recálculo, publicação, tokens públicos e operações administrativas.
- **Banco:** dados privados por proprietário, versões publicadas e regras de acesso.
- **Armazenamento:** logos em área privada por usuário.

## Publicação imutável

Ao publicar, `publishQuote` cria um objeto completo em `quote_versions.snapshot`. Esse objeto inclui empresa, cliente, itens, valores, condições, texto do cabeçalho e texto do rodapé.

Alterar **Minha empresa** muda somente os dados atuais. Uma proposta já publicada continua lendo o snapshot antigo. Publicar novamente cria outra versão com os novos textos.

`snapshotCompany` centraliza a cópia dos dados da empresa e possui testes de regressão em `src/lib/snapshot-company.test.ts`.

## Proposta pública

O endereço público usa um token aleatório associado a uma versão. O servidor devolve apenas o snapshot autorizado. As tabelas privadas não são abertas para leitura anônima.

## Regras para manutenção

- Nunca montar uma proposta publicada lendo diretamente os dados atuais da empresa.
- Nunca substituir snapshots já gravados.
- Acrescentar novos campos de apresentação ao snapshot antes de usá-los na proposta.
- Manter cálculos e autorização no servidor.
- Aplicar mudanças de estrutura do banco por migração.