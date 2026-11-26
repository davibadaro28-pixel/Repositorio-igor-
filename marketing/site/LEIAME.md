# Site da Sua Hamburgueria

Site de uma página para a empresa: tráfego pago, cardápio digital, site e sistema de gestão para hamburguerias.
HTML, CSS e JavaScript puros, com GSAP (animação na rolagem) e three.js (o hambúrguer 3D). Não precisa de servidor:
qualquer hospedagem de site estático serve.

## O que tem na página

| Seção | O que faz |
| --- | --- |
| Montagem | O hambúrguer 3D se monta enquanto a pessoa rola. Cada camada traz um serviço numa comanda presa no espeto: sistema (pão de baixo), cardápio digital (carne), site (queijo e bacon), tráfego pago (pão de cima). |
| Teste o sistema | O sistema de verdade rodando dentro de um celular na página, com a loja de demonstração. Nada é enviado: fica no navegador de quem testa. |
| O que você vê no painel | Telas reais trocando conforme a rolagem: pedidos, cozinha, custo de cada lanche, caixa, clientes e relatórios. |
| Calculadora | A pessoa coloca pedidos por mês, ticket médio e comissão; a comanda faz a conta do que vai para o aplicativo. |
| Anúncios | Seis vídeos dos anúncios rodando em celulares numa faixa que anda com a rolagem, e os 4 passos do tráfego. |
| Planos | Um quadro de cardápio com os três planos e o tráfego como adicional. |
| Perguntas e chamada final | Perguntas frequentes e o botão do WhatsApp. |

Quem prefere menos movimento (configuração do celular/computador) vê a página sem a animação presa na rolagem.

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

- `index.html`, `site.css`, `site.js`, `burger3d.js`: o site.
- `fontes/`: Bricolage Grotesque e Courier Prime (licença livre OFL).
- `montar.sh`: junta tudo em `dist/` (bibliotecas, telas reais do sistema, fotos, vídeos e a demonstração do sistema).
