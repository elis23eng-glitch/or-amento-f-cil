# Testes

## Testes automatizados

Execute:

```bash
bun run test
```

A suíte `src/lib/snapshot-company.test.ts` comprova que:

1. textos de uma versão publicada não mudam quando a empresa é editada;
2. os novos textos entram somente em outra versão;
3. cabeçalho e rodapé são independentes;
4. snapshots antigos sem os campos novos continuam legíveis.

## Verificação manual recomendada

1. Cadastre uma empresa com “Cabeçalho A” e “Rodapé A”.
2. Crie e publique uma proposta; guarde o link da versão 1.
3. Altere a empresa para “Cabeçalho B” e “Rodapé B”.
4. Reabra o link da versão 1 e confirme que A permanece na tela e no PDF.
5. Publique novamente o orçamento.
6. Abra o novo link e confirme que a versão 2 mostra B.
7. Reabra o primeiro link e confirme novamente que ele continua com A.

## Integração contínua

O arquivo `.github/workflows/verify.yml` executa testes e compilação em propostas de alteração e envios para a branch principal.
## Isolamento entre usuários

- `src/lib/access-guards.test.ts` (sempre roda): confere que toda função de backend privada exige login, filtra pelo dono e que as funções administrativas checam o papel de administradora.
- `src/lib/isolation.integration.test.ts` (banco real): duas contas de teste tentam ler, alterar, excluir e criar orçamentos, itens, empresa, versões, links e logos uma da outra; também confere que visitantes sem login não leem tabelas privadas. Para rodar, cadastre duas contas de teste e defina:

```
ISOLATION_A_EMAIL=... ISOLATION_A_PASSWORD=... ISOLATION_B_EMAIL=... ISOLATION_B_PASSWORD=... bun run test
```

Sem essas variáveis o teste aparece como "skipped" (ignorado), nunca como aprovado.
