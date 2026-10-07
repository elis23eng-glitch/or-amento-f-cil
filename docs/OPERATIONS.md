# Operação do Orçai

## Configuração inicial

1. Conectar o projeto ao Lovable Cloud.
2. Criar a conta da proprietária pelo cadastro normal.
3. Conceder o papel administrativo por operação privilegiada.
4. Configurar o WhatsApp administrativo no painel.
5. Conferir domínio e URLs de autenticação antes da publicação.

## Pagamentos

O plano piloto é manual. A administradora recebe o pedido, confirma o pagamento fora do aplicativo e registra valor e vigência. Usuários comuns não ativam a própria assinatura.

## Personalização das propostas

Em **Minha empresa**, o profissional configura os dados gerais, a logo, o texto do cabeçalho e o texto do rodapé. Os textos são congelados no momento da publicação.

Para alterar uma proposta futura:

1. Atualizar os textos em **Minha empresa**.
2. Salvar.
3. Publicar uma nova versão do orçamento.

O link da versão anterior mantém os textos anteriores.

## Verificações antes de publicar o aplicativo

```bash
bun install
bun run test
bun run build
```

Também devem ser verificados manualmente: cadastro, recuperação de senha, publicação, revogação, WhatsApp, PDF extenso, acesso em janela anônima e isolamento entre duas contas.

## GitHub

Conecte pelo editor Lovable em **+ → GitHub → Connect project → Create Repository**. Depois da conexão, alterações no Lovable e no repositório são sincronizadas automaticamente.

Segredos e dados do banco não são enviados ao GitHub. Para hospedagem fora do Lovable, configure as variáveis de ambiente equivalentes no serviço escolhido.