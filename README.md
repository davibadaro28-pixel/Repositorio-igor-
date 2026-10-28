# Sistema de gestão para lojas de comida 🎀🍔

Sistema completo de **PDV, delivery, cardápio digital e gestão**, no estilo do Saipos. O mesmo código atende
várias lojas: cada cliente tem uma pasta em [`lojas/`](lojas/) com o cardápio, as fotos, o logo, as cores e os dados da loja.

| Loja | Pasta | Cardápio |
|---|---|---|
| **Laços de Mãe – Bolos e Doces** (Parque Boturussu, São Paulo) | `lojas/lacos-de-mae` (padrão) | 77 produtos em 16 categorias |
| **VS Burger e Gelato** – hamburgueria gamer (Centro, Carapicuíba) | `lojas/vs-burger` | 75 produtos em 13 categorias, com ponto da carne, adicionais e combos família |

Os cardápios vieram dos cardápios online atuais de cada loja (produtos, preços, adicionais e fotos).

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
| **Notas fiscais (NFC-e)** | Emissão da nota do consumidor pela **Focus NFe** (homologação e produção) com **CPF/CNPJ na nota** no PDV, no pedido e no cardápio digital. Emissão **manual** (botão no pedido) ou **automática** quando o pedido sai para entrega ou é concluído; iFood e 99Food saem com o app como intermediador. DANFE para impressão, consulta, cancelamento em até 30 min (cancelar o pedido cancela a nota), aviso quando falta NCM ou a SEFAZ rejeita, e **.zip com os XMLs e o resumo para o contador**. Tributação por produto (NCM, CEST e perfis com CFOP, CSOSN/CST e PIS/COFINS) já sugerida para confeitaria no Simples Nacional. **Modo treinamento** para a equipe aprender sem valor fiscal. |
| **Configurações** | Dados da loja, horários, pausar pedidos, tempos, pedido mínimo, formas de pagamento e taxas, fidelidade, **link e QR Code do cardápio**, **backup com um clique**. |
| **Usuários** | Logins com perfis: Administrador, Gerente, Caixa, Cozinha e Entregador (cada um vê só o que precisa). |

Também: comanda/cupom não fiscal para **impressora térmica 80 mm**, painel inicial com vendas do dia,
encomendas, contas vencendo, estoque baixo e aniversariantes.

## Comparação honesta com o Saipos

Feito: cardápio digital, delivery próprio, PDV, KDS, Kanban, caixa, estoque com ficha técnica, CMV teórico e real,
financeiro/DRE, CRM e fidelidade, cupons, app do entregador, relatórios, perfis de acesso, impressão,
pedidos do iFood e da 99Food, NFC-e.

**Ainda não incluído** (precisam de contratos/credenciais de terceiros):

- **NF-e (modelo 55)** para vendas a empresas e **NFS-e**; hoje o sistema emite só NFC-e (consumidor).
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
npm start            # http://localhost:3000 (Laços de Mãe)
LOJA=vs-burger npm start   # outra loja: a pasta lojas/vs-burger (banco separado: server/data/vs-burger.db)
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

Cria 30 dias de vendas, clientes, encomendas, entregadores e contas de exemplo, com a NFC-e no
modo treinamento (notas simuladas, sem valor fiscal).
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

### Demonstração para vender a outras docerias (marca genérica)

```bash
node preview/build.mjs demo-vendas --marca=generica --contato=5511912345678
DEMO_MARCA=generica npm run demo     # mesmo efeito no servidor de demonstração
```

Troca a loja de exemplo por **“Sua Doceria Aqui”**: sem nome, logo, WhatsApp, Instagram, endereço nem fotos com a
marca da loja original (nem no código da página publicada). Abre com uma tela de boas-vindas e, com `--contato`,
mostra o botão “Quero para minha doceria”, que abre o seu WhatsApp. Quem testa pode trocar nome, logo e cores
em Configurações e ver o próprio nome no sistema na hora.

**Para cada doceria nova:** em Configurações → Loja, troque nome, slogan, WhatsApp, Instagram, endereço e envie o
logo (sem logo, o sistema mostra as iniciais do nome).

### Várias lojas no mesmo sistema

Cada instalação atende **uma** loja, escolhida pela variável `LOJA` (nome da pasta em `lojas/`; sem ela, `lacos-de-mae`).
O banco de dados, as fotos enviadas e as configurações ficam separados por instalação.

```bash
LOJA=vs-burger npm run demo                          # demonstração da hamburgueria (server/data/demo-vs-burger.db)
node preview/build.mjs preview-vs --loja=vs-burger   # prévia no navegador da hamburgueria
```

**Cliente novo:** copie uma pasta de `lojas/` e troque:

- `loja.json` – nome, contatos, endereço, horários, `segment` (`doceria`, `hamburgueria` ou `outro`: muda exemplos e
  textos do sistema), `theme` (cor principal, fonte do nome e borda do topo do cardápio), bairros e taxas de entrega,
  insumos e fichas técnicas, sugestões de NCM e dados de exemplo da demonstração.
- `catalogo.json` – categorias (com a seção do cardápio), produtos, preços, tamanhos e grupos de adicionais.
  Um grupo com `"repeat": true` aceita a mesma opção mais de uma vez (2x bacon, 4 lanches no combo família).
- `public/img/` – `logo`, `favicon.png`, `icon-192.png`, `icon-512.png` e as fotos em `produtos/`.

Esses arquivos só valem na **primeira** vez que a loja sobe (banco vazio). Depois, a loja muda tudo pelo painel,
inclusive a aparência em **Configurações → Aparência** (a tela mostra como fica antes de salvar).

### Desenvolvimento

```bash
npm run dev          # API com recarga automática (porta 3000)
npm run dev:web      # front-end com Vite (porta 5173, usa a API acima)
npm test             # testes da API
```

## Nota fiscal (NFC-e)

A emissão é feita pela **Focus NFe** (emissor terceirizado): ela guarda o certificado digital A1 e o CSC da loja,
assina o XML, fala com a SEFAZ-SP e gera o DANFE. O sistema só precisa do **token** e do **CNPJ**.
Em São Paulo o SAT deixou de ser aceito em 2026, então a NFC-e é o caminho para o balcão e o delivery.

Para ligar (passo a passo também na tela **Notas fiscais → Configuração**):

1. **Contador**: confirmar o regime, o credenciamento para NFC-e na SEFAZ-SP e conferir NCM/perfis em **Tributação**
   (as sugestões iniciais são de confeitaria no Simples Nacional: bolos e doces CFOP 5101/CSOSN 102; bebidas
   CFOP 5405/CSOSN 500 com PIS/COFINS monofásico; bebidas com substituição tributária costumam exigir CEST).
2. **Certificado A1** (e-CNPJ .pfx) e **CSC** da SEFAZ-SP; cadastrar a empresa na Focus NFe com eles.
3. Colar o **token de homologação**, testar a conexão e emitir alguns pedidos (homologação não tem valor fiscal).
4. Colar o **token de produção** e mudar para Produção. Ligar a emissão automática se quiser.

Como a nota é montada:

- Itens com NCM, CFOP e impostos do perfil do produto; desconto distribuído entre os itens; taxa de entrega da loja
  como "outras despesas" (quando o entregador é do app, a taxa não é da loja e fica fora).
- Formas de pagamento convertidas para os códigos da nota (configurável: Pix estático ou dinâmico, vale-refeição…);
  cartão e Pix entram como "não integrados" (maquininha separada).
- Delivery sai como "entrega a domicílio"; iFood e 99Food como intermediadores (CNPJ do app + identificador da loja).
- Regime normal: o grupo **IBS/CBS** da reforma tributária (obrigatório desde agosto de 2026) é preenchido a partir
  do CST e da classificação informados no perfil. No Simples Nacional a exigência começa em 2027.
- Rejeitada? O motivo aparece no pedido; corrigido o cadastro, "Emitir de novo" reenvia com a mesma referência.
  Sem resposta da SEFAZ, a nota fica "processando" e o sistema consulta de novo sozinho.
- Os XMLs autorizados e de cancelamento ficam guardados no banco e saem no **.zip para o contador**.
- `FOCUS_API_URL` troca o endereço da API (os testes usam um servidor que imita a Focus NFe).

## Colocar no ar

O sistema é um único servidor Node com banco SQLite em arquivo — barato de hospedar.
**O importante é o disco persistente**: o banco e as fotos enviadas ficam em `/data`.

**Com Docker** (Railway, Render, Fly.io, VPS):

```bash
docker build -t sistema-lojas .
docker run -d -p 3000:3000 -v lacos_dados:/data -e ADMIN_PASSWORD=troque-esta-senha sistema-lojas
docker run -d -p 3001:3000 -v vsburger_dados:/data -e LOJA=vs-burger -e ADMIN_PASSWORD=outra-senha sistema-lojas
```

No Railway/Render: crie **um serviço por loja** a partir deste repositório (detecta o `Dockerfile`), adicione um
**volume/disco montado em `/data`** e as variáveis `LOJA` e `ADMIN_PASSWORD`. Depois aponte o domínio da loja
(ex.: `pedidos.lacosdemae.com.br`) e troque o link da bio do Instagram.

Variáveis de ambiente:

| Variável | Padrão | Para quê |
|---|---|---|
| `LOJA` | `lacos-de-mae` | Pasta da loja em `lojas/` (cardápio inicial, fotos, logo e tema) |
| `PORT` | `3000` | Porta HTTP |
| `DB_PATH` | `server/data/lacos.db` (outras lojas: `server/data/<loja>.db`) | Arquivo do banco |
| `UPLOAD_DIR` | `server/data/uploads` | Fotos enviadas pelo painel |
| `ADMIN_PASSWORD` | gerada | Senha do primeiro `admin` |
| `FOCUS_API_URL` | Focus NFe (homologação/produção) | Só para testes da emissão de NFC-e |

**Backup:** Configurações → Fiscal e integrações → “Baixar backup agora” (ou copie o arquivo do banco).

## Primeiros passos na loja

1. Entrar como `admin` e trocar a senha (clique no seu nome no topo).
2. Configurações: conferir horários, WhatsApp, **chave Pix** e as **taxas das maquininhas**.
3. Entregas → Bairros e taxas: conferir os bairros (vieram das faixas atuais: até 4 km R$ 12; 5–12 km R$ 20).
4. Usuários: criar logins da equipe (caixa, cozinha, entregadores).
5. Estoque: ajustar o custo dos insumos (os iniciais são **estimativas**) e completar as fichas técnicas.
6. Divulgar o link/QR Code do cardápio (Configurações → Divulgar cardápio).
7. Notas fiscais: treinar a equipe no **modo treinamento** e, com o contador, ligar a NFC-e (ver acima).

## Tecnologia

- Back-end: Node.js 22 + Express 5 + SQLite nativo (`node:sqlite`), atualizações em tempo real por SSE.
- Front-end: React 19 + Vite + Tailwind CSS 4 (o painel é carregado só por quem entra nele).
- Preços e totais são sempre recalculados no servidor; valores em centavos; senhas com scrypt;
  horário de São Paulo em todo o sistema.

```
server/            API, banco (schema.sql), regras de pedido, seed e demonstração
  routes/          rotas por módulo
  services/        pedidos, estoque, pagamentos, fidelidade
  fiscal/          NFC-e: montagem da nota, Focus NFe, modo treinamento, .zip do contador
  integrations/    iFood e 99Food
  seed/catalog.json  cardápio real da loja
web/src/public     cardápio digital e acompanhamento do pedido
web/src/admin      painel de gestão
web/src/courier    app do entregador
```
