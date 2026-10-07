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