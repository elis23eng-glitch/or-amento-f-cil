# Testes de versões e documentação para GitHub

## O que será feito

- Extrair a montagem dos dados da empresa para uma função testável, mantendo a publicação atual.
- Criar testes automatizados que comprovem:
  - a proposta publicada conserva os textos originais;
  - alterações em Minha empresa aparecem somente em uma nova versão;
  - cabeçalho e rodapé são copiados de forma independente;
  - propostas antigas sem os novos campos continuam compatíveis.
- Adicionar o comando de testes ao projeto e executá-lo.
- Atualizar o README com os campos configuráveis, comandos de teste e o comportamento de versões.
- Criar documentação técnica curta sobre arquitetura, publicação imutável, banco, segurança e operação manual.
- Adicionar um fluxo de verificação contínua para o GitHub executar compilação e testes automaticamente.

## Verificação

- Executar a suíte automatizada.
- Conferir a compilação do aplicativo.
- Registrar no README somente os resultados realmente obtidos.

## Envio ao GitHub

O código e a documentação ficarão prontos para sincronização. Para criar o repositório novo, será necessário concluir uma única ação na interface do Lovable: **+ → GitHub → Connect project → Create Repository**. Após essa conexão, o Lovable envia o projeto e mantém a sincronização automática.
