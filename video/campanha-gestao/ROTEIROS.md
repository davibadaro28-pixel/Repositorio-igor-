# Campanha "Controle": 5 anúncios para docerias

Vertical 1080 x 1920, 30 fps, entre 35 e 42 s cada, narração em português do Brasil, legendas integradas,
trilha e sound design próprios. Todas as telas são capturas do sistema real rodando com a marca de exemplo
"Sua Doceria Aqui" e **dados de demonstração** (identificados na tela). Números que não vêm do sistema
aparecem como **simulação**.

## 1. Auditoria do sistema (o que os vídeos podem mostrar)

| Recurso | Onde está | Status | Uso na campanha |
| --- | --- | --- | --- |
| Cardápio digital com logo, cores, fonte e acabamento da loja | `web/src/public/Menu.jsx`, `shared/theme.js` | Pronto | V01, V04, V05 |
| Fotos, categorias, busca, tamanhos e adicionais, sacola | `Menu.jsx` | Pronto | V04 |
| Encomenda com data e hora, entrega ou retirada, Pix/cartão/dinheiro | `Menu.jsx` (Checkout) | Pronto | V04, V05 |
| Acompanhamento do pedido pelo cliente | `web/src/public/Track.jsx` | Pronto | V04 |
| Pedidos em tempo real num quadro (novo, confirmado, preparo, pronto, entrega) | `admin/Orders.jsx` | Pronto | V01, V05 |
| Custo estimado (CMV) de cada pedido | `admin/OrderDrawer.jsx` | Pronto (aparece quando os produtos têm ficha técnica) | V02 |
| Início: vendas hoje, pedidos, ticket médio, faturamento 30 dias, mais vendidos, estoque baixo, contas a pagar | `admin/Dashboard.jsx` | Pronto | V02, V05 |
| Financeiro: contas a pagar e receber, fluxo de caixa, DRE com CMV, taxas, despesas e resultado | `admin/Finance.jsx` | Pronto | V02, V05 |
| Ficha técnica, custo, CMV % e lucro bruto de cada produto (margem alta em vermelho) | `admin/Stock.jsx` | Pronto | V02, V03 |
| Valor em estoque, alerta "abaixo do mínimo", entradas, saídas, perdas, inventário | `admin/Stock.jsx` | Pronto | V03 |
| Baixa automática dos insumos a cada venda (pela ficha técnica) | `server/services/orders.js` | Pronto | V03 |
| Relatórios: faturamento por canal, por dia, por horário, por pagamento, produtos, exportar Excel | `admin/Reports.jsx` | Pronto | V01, V05 |
| Clientes cadastrados a cada pedido: total gasto, ticket, preferidos, pontos, WhatsApp | `admin/Customers.jsx` | Pronto | V01, V05 |
| Cupons de desconto | `admin/Coupons.jsx` | Pronto | V01 |
| Caixa (abertura, sangria, suprimento, fechamento), PDV, cozinha (KDS), encomendas, entregas | `admin/*.jsx` | Pronto | V05 |
| Painel no celular | `admin/AdminApp.jsx` (responsivo) | Pronto | V05 |
| Integração automática com iFood e 99Food (e a comissão calculada a partir dela) | `server/integrations/*` | **Não entra**: testada só com servidores simulados, nunca ligada ao iFood real | — |
| Emissão de NFC-e | `server/fiscal/*` | **Não entra**: depende do certificado e da conta no emissor de cada loja | — |

Regras seguidas: nenhum percentual de taxa de app é citado; nenhuma promessa de lucro ou economia;
números de faturamento aparecem como "dados de demonstração" ou "simulação".

## 2. Os cinco roteiros

Cada vídeo tem conceito, ritmo, paleta, tipografia, legenda, voz e trilha próprios.

### V01 · "A fatia que fica no caminho" (≈38 s) · taxas e canal próprio
Voz: Diego (locutor, firme). Paleta: grafite e laranja-alerta. Legenda: caixa alta, palavra ativa em laranja.
Trilha: pulso tenso em meio-tempo, graves secos; vira confiante quando entra a solução.

| Tempo | Fala | Tela e animação | Som |
| --- | --- | --- | --- |
| 0–2,4 s | "Você trabalha, produz, vende…" | Três cortes secos: foto real de bolo, mãos embalando (fotos do cardápio), notificação genérica de "novo pedido" vibrando | 3 batidas secas no corte, vibração de celular |
| 2,4–6 s | "e ainda entrega uma parte do seu dinheiro para os aplicativos?" | Um bolo real é fatiado em 3D e uma fatia escorrega para fora do quadro com a etiqueta "taxas e comissões" (sem número) | whoosh e impacto grave |
| 6–9 s | "Os apps trazem clientes novos. Isso tem valor." | Mapa de pontos (clientes novos) acendendo em volta do celular | pad sobe, ritmo segura |
| 9–13,5 s | "Mas e o cliente que já ama a sua doceria? Ele pode pedir direto com você." | Zoom para um único ponto: o cliente fiel; câmera mergulha na tela do celular | riser curto |
| 13,5–19 s | "Com um cardápio com a sua marca, o pedido cai na hora no seu painel." | Cardápio real no celular; corte para o quadro de pedidos real e o card "Juliana Prado" entrando em "Novos" | toque, "ding" de pedido |
| 19–25 s | "Sem comissão por pedido do sistema. E o cliente fica na sua base, com histórico e WhatsApp." | Tela real de clientes com total gasto e preferidos, em perspectiva | clique de cadastro |
| 25–29 s | "Crie cupons para trazer o cliente para o seu canal…" | Tela real de cupons; o código PRIMEIRACOMPRA salta em 3D | pop |
| 29–33 s | "e veja nos relatórios quanto vende cada canal." | Relatório real "Faturamento por canal" (cardápio, balcão, WhatsApp) com barras crescendo | ticks de contagem |
| 33–38 s | "Tenha o seu canal próprio. Fale com a gente." | Chamada final com botão "Quero meu canal próprio" | impacto final, cauda |

### V02 · "Faturar não é lucrar" (≈39 s) · visibilidade financeira
Voz: Scheila (séria, direta). Paleta: branco quente, verde-esmeralda e grafite (estilo fintech).
Legenda: minúscula, limpa, sublinhado verde. Trilha: piano mínimo com pulso grave, cresce até o DRE.

| Tempo | Fala | Tela e animação | Som |
| --- | --- | --- | --- |
| 0–4 s | "Faturar dez mil reais não significa colocar dez mil no bolso." | "R$ 10.000" gigante contando de 0, etiqueta "simulação"; uma mão-cursor tenta "pegar" e o número escorre | contador rápido, batida |
| 4–9 s | "Sai o custo dos ingredientes, das embalagens, as taxas, as contas do mês…" | Cascata (waterfall) descendo em blocos: ingredientes, embalagens, taxas, contas (sem valores, só as barras da simulação) | cada bloco com um tique grave |
| 9–11,5 s | "E no fim, quanto sobra de verdade?" | Sobra um "?" pequeno; zoom-out revela o painel real atrás | silêncio curto, riser |
| 11,5–16,5 s | "No início, você vê as vendas do dia, os pedidos e o ticket médio." | Painel real em 3D; os 4 indicadores saltam da tela em camadas; gráfico de 30 dias desenhando | ticks de dados |
| 16,5–23 s | "Cada produto mostra quanto custa produzir e o lucro bruto. O que está com margem apertada salta aos olhos." | Lista real de CMV; a linha "Bolo de cenoura 55%" fica em destaque vermelho | alerta suave |
| 23–26,5 s | "Cada pedido mostra o seu custo estimado." | Pedido real #324: Total R$ 206,98 e Custo estimado R$ 75,11 lado a lado | dois cliques |
| 26,5–32 s | "E o DRE junta tudo: vendas, custos, despesas e o resultado do período." | DRE real rolando; a linha "Resultado do período" acende | cordas sobem |
| 32–39 s | "Pare de adivinhar. Saiba quanto a sua doceria lucra. Peça uma demonstração." | Chamada final com indicador verde | resolução do piano |

### V03 · "Dinheiro parado na prateleira" (≈37 s) · estoque e custo
Voz: Paulo (grave, explicativo). Paleta: azul-marinho de planta técnica e âmbar. Legenda: fonte
monoespaçada, estilo etiqueta de inventário. Trilha: pulso mecânico, plucks metálicos, tique-taque.

| Tempo | Fala | Tela e animação | Som |
| --- | --- | --- | --- |
| 0–4 s | "Você sabe quanto dinheiro está parado no estoque da sua doceria?" | Prateleira em grade técnica com etiquetas de insumos; uma linha de scanner atravessa | bip de scanner |
| 4–8,5 s | "Leite condensado, chocolate, morango, embalagem… tudo isso é dinheiro." | Etiquetas reais de insumos voam e empilham, cada uma vira um "R$" | plucks metálicos por item |
| 8,5–11,5 s | "Aqui você vê o valor do seu estoque na hora." | Zoom na tela real: "Valor em estoque: R$ 9.511,23" (dados de demonstração) | impacto e contador |
| 11,5–15,5 s | "E o sistema avisa quando um insumo fica abaixo do mínimo." | Selo real "3 abaixo do mínimo" pulsa; cartão "Estoque baixo" do Início | alarme discreto |
| 15,5–21,5 s | "Com a ficha técnica, cada venda dá baixa sozinha nos ingredientes." | Ficha real do bolo; corte para Movimentações com linhas "Venda" descendo | engrenagens |
| 21,5–25,5 s | "Registre compras, perdas e inventário…" | Abas reais Entrada, Saída/perda, Inventário | carimbos |
| 25,5–30 s | "…e saiba o custo real de cada produto." | Lista real de CMV e lucro bruto | tique |
| 30–37 s | "Estoque organizado é menos surpresa e mais controle. Fale com a gente." | Chamada final sobre a grade técnica | batida final |

### V04 · "Seus doces merecem mais" (≈35 s) · vitrine e experiência de compra
Voz: Marianne (doce, elegante). Paleta: creme, rosé e chocolate, estilo revista. Legenda: serifada
itálica, palavra a palavra. Trilha: cordas dedilhadas, sinos, batida leve.

| Tempo | Fala | Tela e animação | Som |
| --- | --- | --- | --- |
| 0–2,5 s | "Seus doces podem ser incríveis…" | Macro de fotos reais (bombom de morango cortado, brownie) com movimento lento | sino suave |
| 2,5–6,5 s | "mas o seu cardápio está valorizando seus produtos?" | Tela dividida: à esquerda, foto de cardápio impresso tremida dentro de uma conversa genérica | nota dissonante |
| 6,5–10 s | "Foto borrada, lista de preços, pedido perdido na conversa…" | Mensagens empilhando, a foto fica ainda mais borrada | bolhas de mensagem |
| 10–12,5 s | "Agora imagine a sua vitrine assim:" | Cortina de creme varre a tela e revela o cardápio real em destaque | swoosh de seda |
| 12,5–16,5 s | "Com a sua marca, as suas cores e as suas fotos." | Quatro identidades reais em leque, com amostras de cor | sinos em escala |
| 16,5–22 s | "Categorias organizadas, tamanhos, encomenda com data e hora…" | Folha real do bolo com tamanhos; finalização com data e horário | toques suaves |
| 22–27 s | "…e o pedido chega certinho, sem perder nenhuma mensagem." | Tela real "Pedido enviado com sucesso" | acorde de sucesso |
| 27–35 s | "Quem vê, tem vontade. Crie o seu cardápio personalizado." | Mosaico editorial das fotos reais e chamada final | resolução |

### V05 · "Um dia inteiro sob controle" (≈40 s) · plataforma completa
Voz: Roberta (animada). Paleta: preto, branco e magenta da marca. Legenda: condensada, caixa de
destaque. Trilha: pop/house acelerado, risers a cada "hora do dia".

| Tempo | Fala | Tela e animação | Som |
| --- | --- | --- | --- |
| 0–6,5 s | "Você abriu uma doceria para empreender… ou para passar o dia apagando incêndio com pedido, estoque e dinheiro?" | Tipografia cinética rápida; relógio girando; post-its e alertas se acumulando | batidas aceleradas |
| 6,5–8,5 s | "Oito da manhã: abre o caixa." | Relógio 08:00; tela real do Caixa | clique de gaveta |
| 8,5–11,5 s | "Dez: as encomendas do dia, por horário." | 10:00; agenda real de Encomendas | virar de página |
| 11,5–15 s | "Meio-dia: pedidos do cardápio e do balcão no mesmo quadro." | 12:00; quadro real de Pedidos | notificações |
| 15–17,5 s | "A cozinha recebe tudo na tela." | Tela real da Cozinha (KDS) num tablet | sino de cozinha |
| 17,5–20,5 s | "Três da tarde: alerta de estoque baixo." | 15:00; cartão real de Estoque baixo | alerta |
| 20,5–24 s | "Clientes com histórico, cupons e fidelidade." | Tela real de Clientes | pop |
| 24–28 s | "Seis da tarde: o resultado do dia na tela." | 18:00; Início real com vendas e ticket médio | contador |
| 28–31,5 s | "No fim do mês, o DRE mostra se sobrou dinheiro." | DRE real | impacto |
| 31,5–35 s | "Tudo numa plataforma só, no computador e no celular." | Painel real no notebook e no celular, lado a lado | riser |
| 35–40 s | "Gestão de verdade para docerias. Fale com a gente e veja funcionando." | Chamada final | batida final |
