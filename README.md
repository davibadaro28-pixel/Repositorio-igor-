# Laços de Mãe – Sistema de gestão 🎀

Sistema completo de **PDV, delivery, cardápio digital e gestão** feito sob medida para a
**Laços de Mãe – Bolos e Doces** (Av. Boturussu, 1785 – Parque Boturussu, São Paulo), no estilo do Saipos.

O cardápio já vem com os **77 produtos reais** (16 categorias, preços, tamanhos e fotos) importados do
cardápio atual da loja, com as cores e o logo da marca.

## O que o sistema faz

| Módulo | O que faz |
|---|---|
| **Cardápio digital** (`/`) | Vitrine no celular com fotos, busca, “mais pedidos”, tamanhos, adicionais obrigatórios (ex.: sabor do bolo gelado), observação por item, sacola, entrega por bairro com taxa automática, retirada, **encomenda agendada** (respeita produtos que exigem 24h), cupom, troco, Pix. O pedido cai no painel na hora e o cliente acompanha o status em tempo real. |
| **Pedidos (Kanban)** | Quadro Novo → Confirmado → Em preparo → Pronto → Em entrega, com aviso sonoro de pedido novo, cronômetro e alerta de atraso, atribuição de entregador, pagamento, cancelamento com motivo, mensagens prontas de WhatsApp para o cliente e histórico com busca. |
| **PDV (balcão)** | Frente de caixa para tablet/computador: produtos com foto por categoria, cliente pelo telefone (puxa endereço e pontos), balcão/retirada/entrega, encomenda, desconto, cupom, resgate de pontos, pagamento dividido, troco e “pagar na entrega/sinal”. |
| **Cozinha (KDS)** | Tela de produção em tempo real (modo tela cheia para tablet): total a produzir, observações em destaque, botões Iniciar/Pronto e próximas encomendas. |
| **Encomendas** | Agenda semanal de bolos e pedidos agendados, com lista de produção do dia. |
| **Caixa** | Abertura com fundo de troco, sangria, suprimento, fechamento com conferência por forma de pagamento e histórico com diferenças. |
| **Cardápio e produtos** | Cadastro com foto, tamanhos/preços, grupos de adicionais, “só por encomenda com X horas”, disponível/esgotado com um toque, destaque, só no balcão, ordem das categorias. |
| **Estoque e CMV** | Insumos com custo médio, compras (que podem virar despesa no financeiro), perdas, inventário, **ficha técnica por tamanho**, baixa automática a cada venda e estorno no cancelamento, CMV e margem de cada produto, alerta de estoque mínimo. |
| **Financeiro** | Contas a pagar e receber (com recorrência), fluxo de caixa diário, **DRE** com CMV (pelas compras ou pela ficha técnica) e taxas de cartão. |
| **Clientes (CRM)** | Cadastro automático pelos pedidos, histórico, preferidos, aniversário, fidelidade por pontos e segmentos (sumidos há 30 dias, aniversariantes, fiéis…) com mensagem de campanha pronta no WhatsApp. Exporta CSV. |
| **Entregas** | Bairros e taxas, entregadores, entregas em andamento e acerto por período. **App do entregador** (`/entregador`): entregas atribuídas, rota no Google Maps, valor a cobrar e troco, “Saí”/“Entreguei”. |
| **Cupons** | Percentual, valor fixo ou frete grátis; mínimo, validade, limite de usos e “só na 1ª compra”. |
| **Relatórios** | Faturamento por dia, horário e dia da semana, produtos, categorias, formas de pagamento, canais, bairros, ticket médio, cancelamentos. Exporta para Excel (CSV). |
| **iFood e 99Food** | Pedidos dos apps entram sozinhos no quadro de pedidos (com selo e número do app), na cozinha, no estoque e nos relatórios. Aceitar, “pronto”, “saiu” e cancelar no painel avisam o app. Comissão configurável por app; relatório **Faturamento por canal** com bruto, comissão e líquido; comissão como linha própria na DRE. Itens do app são ligados aos produtos da loja pelo código (ex.: V12) ou na tela “Vincular produtos”. |
| **Configurações** | Dados da loja, horários, pausar pedidos, tempos, pedido mínimo, formas de pagamento e taxas, fidelidade, dados fiscais, **link e QR Code do cardápio**, **backup com um clique**. |
| **Usuários** | Logins com perfis: Administrador, Gerente, Caixa, Cozinha e Entregador (cada um vê só o que precisa). |

Também: comanda/cupom não fiscal para **impressora térmica 80 mm**, painel inicial com vendas do dia,
encomendas, contas vencendo, estoque baixo e aniversariantes.

## Comparação honesta com o Saipos

Feito: cardápio digital, delivery próprio, PDV, KDS, Kanban, caixa, estoque com ficha técnica, CMV teórico e real,
financeiro/DRE, CRM e fidelidade, cupons, app do entregador, relatórios, perfis de acesso, impressão.

**Ainda não incluído** (precisam de contratos/credenciais de terceiros):

- **NFC-e** – a tela de dados fiscais já existe; falta integrar um emissor (Focus NFe, NFE.io ou PlugNotas) com
  certificado A1 e CSC da SEFAZ-SP.
- **TEF/maquininha integrada**, **robô de WhatsApp com IA**, **roteirização automática** e **totem**.

## iFood e 99Food

A integração está pronta; para ligar é preciso ter as credenciais de cada app (passo a passo na tela
**iFood e 99Food** do painel) e o sistema publicado num endereço HTTPS.

| | iFood | 99Food |
|---|---|---|
| Como chegam os pedidos | Busca a cada 30 s (polling) e confirma os eventos. Enquanto roda, a loja fica aberta no iFood. Webhook opcional em `/api/hooks/ifood`. | Webhook em `https://<seu-domínio>/api/hooks/99food`, assinatura MD5 conferida |
| Credenciais | Client ID, Client Secret e Merchant ID (Portal do Desenvolvedor iFood) | App ID, App Secret e código da loja `app_shop_id` (developer-food.99app.com) |
| O painel avisa o app | aceitar (`confirm`), preparo, pronto (`readyToPickup`), saiu (`dispatch`, entrega própria), cancelar | aceitar (`confirm`, em até 5 min), pronto, saiu e entregue (entrega própria), cancelar |

- Os preços e totais vêm do app (o cardápio dos apps costuma ter preços próprios). Quando a entrega é feita pelo app,
  a taxa de entrega não entra no faturamento da loja.
- Ids de pedido da 99Food têm 64 bits e são tratados como texto para não perder dígitos.
- Se avisar o app falhar, o pedido mostra o erro e o botão “Tentar de novo”.
- “Simular pedido de teste” cria um pedido no formato real de cada app, sem conexão, para treinar a equipe.
- Os testes (`npm test`) usam servidores que imitam as duas APIs; `IFOOD_API_URL` e `FOOD99_API_URL` trocam o endereço das APIs.
- Antes de usar com pedidos reais, valide no ambiente de testes de cada plataforma: a 99Food exige certificação do
  aplicativo, e as regras do iFood para aplicativos podem pedir homologação.
- Ainda não sincroniza o cardápio (preços, fotos, esgotados) com os apps nem o repasse financeiro; isso continua no portal de cada app.

## Como rodar no computador

Precisa do [Node.js 22.13 ou mais novo](https://nodejs.org).

```bash
npm install
npm run build        # gera o site
npm start            # http://localhost:3000
```

Na primeira vez o terminal mostra o login `admin` e uma senha gerada (também salva em
`server/data/PRIMEIRO_ACESSO.txt`). Para escolher a senha: `ADMIN_PASSWORD=minhasenha npm start`.

- Cardápio: `http://localhost:3000/`
- Painel: `http://localhost:3000/admin`
- Entregador: `http://localhost:3000/entregador`

### Modo demonstração (para apresentar à cliente)

```bash
npm run build
npm run demo         # usa um banco separado: server/data/demo.db
```

Cria 30 dias de vendas, clientes, encomendas, entregadores e contas de exemplo.
Logins: `admin / demo1234` · `caixa / caixa123` · `cozinha / cozinha123` · `motoboy / moto123`.
Os dados de demonstração **não se misturam** com o banco real (`server/data/lacos.db`).

### Prévia no navegador (sem servidor)

```bash
npm run build:preview      # gera preview-dist/
```

Gera uma página estática em que o sistema inteiro roda no navegador: as mesmas rotas e regras de `server/`
sobre um SQLite em memória ([sql.js](https://sql.js.org)), com os dados de demonstração e uma barra para alternar
entre cardápio, painel da loja e app do entregador. Serve para mostrar o sistema sem hospedar nada; os dados
ficam só no navegador de quem abre. Os adaptadores estão em `preview/`.

### Desenvolvimento

```bash
npm run dev          # API com recarga automática (porta 3000)
npm run dev:web      # front-end com Vite (porta 5173, usa a API acima)
npm test             # testes da API
```

## Colocar no ar

O sistema é um único servidor Node com banco SQLite em arquivo — barato de hospedar.
**O importante é o disco persistente**: o banco e as fotos enviadas ficam em `/data`.

**Com Docker** (Railway, Render, Fly.io, VPS):

```bash
docker build -t lacos-de-mae .
docker run -d -p 3000:3000 -v lacos_dados:/data -e ADMIN_PASSWORD=troque-esta-senha lacos-de-mae
```

No Railway/Render: crie o serviço a partir deste repositório (detecta o `Dockerfile`), adicione um
**volume/disco montado em `/data`** e a variável `ADMIN_PASSWORD`. Depois aponte um domínio
(ex.: `pedidos.lacosdemae.com.br`) e troque o link da bio do Instagram.

Variáveis de ambiente:

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` | `3000` | Porta HTTP |
| `DB_PATH` | `server/data/lacos.db` | Arquivo do banco |
| `UPLOAD_DIR` | `server/data/uploads` | Fotos enviadas pelo painel |
| `ADMIN_PASSWORD` | gerada | Senha do primeiro `admin` |

**Backup:** Configurações → Fiscal e integrações → “Baixar backup agora” (ou copie o arquivo do banco).

## Primeiros passos na loja

1. Entrar como `admin` e trocar a senha (clique no seu nome no topo).
2. Configurações: conferir horários, WhatsApp, **chave Pix** e as **taxas das maquininhas**.
3. Entregas → Bairros e taxas: conferir os bairros (vieram das faixas atuais: até 4 km R$ 12; 5–12 km R$ 20).
4. Usuários: criar logins da equipe (caixa, cozinha, entregadores).
5. Estoque: ajustar o custo dos insumos (os iniciais são **estimativas**) e completar as fichas técnicas.
6. Divulgar o link/QR Code do cardápio (Configurações → Divulgar cardápio).

## Tecnologia

- Back-end: Node.js 22 + Express 5 + SQLite nativo (`node:sqlite`), atualizações em tempo real por SSE.
- Front-end: React 19 + Vite + Tailwind CSS 4 (o painel é carregado só por quem entra nele).
- Preços e totais são sempre recalculados no servidor; valores em centavos; senhas com scrypt;
  horário de São Paulo em todo o sistema.

```
server/            API, banco (schema.sql), regras de pedido, seed e demonstração
  routes/          rotas por módulo
  services/        pedidos, estoque, pagamentos, fidelidade
  seed/catalog.json  cardápio real da loja
web/src/public     cardápio digital e acompanhamento do pedido
web/src/admin      painel de gestão
web/src/courier    app do entregador
```
