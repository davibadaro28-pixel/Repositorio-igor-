# Site da Sua Hamburgueria

Site de uma página para a empresa: tráfego pago, cardápio digital, site e sistema de gestão para hamburguerias.
HTML, CSS e JavaScript puros, com GSAP (animações e rolagem) e three.js (as fagulhas de brasa da abertura). Não precisa de servidor:
qualquer hospedagem de site estático serve.

## O que tem na página

| Seção | O que faz |
| --- | --- |
| Abertura | O produto de verdade: painel num navegador e cardápio num celular, com avisos de pedido chegando em sequência. Ao fundo, fagulhas de brasa em 3D (three.js) subindo devagar. |
| Serviços | Cardápio digital, sistema de gestão, site e tráfego pago. A tela ao lado troca conforme a rolagem. |
| Plataforma | Mosaico com telas reais: pedidos, cozinha, custo de cada lanche, caixa, clientes, painel no celular e relatórios. |
| Demonstração | O sistema de verdade rodando dentro de um celular na página, com a loja de demonstração. Nada é enviado: fica no navegador de quem testa. |
| Anúncios | Seis vídeos dos anúncios numa faixa que anda com a rolagem, e as 4 etapas do tráfego. |
| Calculadora | Pedidos por mês, ticket médio e comissão: mostra quanto vai para o aplicativo por mês e em 12 meses. |
| Planos | Três planos, tabela comparativa e o tráfego como adicional. |
| Perguntas e chamada final | Perguntas frequentes e o botão do WhatsApp. |

Quem prefere menos movimento (configuração do celular/computador) vê a página sem as animações.

## Antes de publicar

1. **WhatsApp:** abra `site.js` e coloque o número na linha `const WHATSAPP = '';`, com DDI e DDD, só números
   (ex.: `'5511912345678'`). Sem número, o botão abre o WhatsApp com a mensagem pronta para a pessoa escolher o contato.
2. Rode `./montar.sh <pasta-dos-videos>` (a pasta com os MP4 9x16 dos anúncios). Ele cria a pasta `dist/` com tudo.

## Publicar

A pasta `dist/` inteira é o site. Opções gratuitas que aceitam pasta estática:

- **Netlify** (app.netlify.com → Add new site → Deploy manually → arraste a pasta `dist`).
- **Vercel** (vercel.com → Add New → Project, ou `npx vercel dist`).
- **Cloudflare Pages** (dash.cloudflare.com → Workers & Pages → Create → Pages → Upload assets).

Depois, aponte o seu domínio (ex.: `suahamburgueria.com.br`) nas configurações do serviço escolhido.

## Arquivos

- `index.html`, `site.css`, `site.js`, `brasa.js`: o site.
- `fontes/`: Schibsted Grotesk (licença livre OFL).
- `assets/`: imagens próprias do site (o cardápio no computador).
- `montar.sh`: junta tudo em `dist/` (bibliotecas, telas reais do sistema, fotos, vídeos e a demonstração do sistema).
