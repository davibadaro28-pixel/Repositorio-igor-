# Como subir os 50 criativos no Meta Ads

São 50 anúncios para vender o cardápio digital e o sistema de gestão. Cada anúncio tem duas imagens:

| Pasta | Tamanho | Onde usar |
| --- | --- | --- |
| Feed 4x5 | 1080 × 1350 | Feed do Instagram e do Facebook |
| Stories e Reels 9x16 | 1080 × 1920 | Stories e Reels (o texto fica fora das faixas de cima e de baixo, onde aparece a interface) |

Os textos de cada anúncio (texto principal, título, descrição e mensagem pronta) estão em **Textos dos anúncios**:
planilha (.csv, abre no Excel/Google Planilhas) e versão para leitura (.md).

## Os três públicos

| Códigos | Para quem | Quantos |
| --- | --- | --- |
| H01–H22 | Hamburguerias | 22 |
| D01–D14 | Docerias e confeitarias | 14 |
| G01–G14 | Lojas de comida em geral (lanchonete, restaurante, açaí, pizzaria) | 14 |

Cada criativo fala de **uma dor** (taxa de entrega, caixa que não bate, cliente que sumiu…). Quem tem aquela dor
para; quem não tem passa reto. Por isso o público do conjunto pode ser aberto: quem segmenta é o criativo.

## Estrutura da campanha

1. **Campanha:** objetivo *Engajamento*, local da conversão *WhatsApp* (anúncio de mensagem).
2. **Três conjuntos de anúncios**, um por público acima.
   - Região: as cidades que você atende. Idade 22–60.
   - Público aberto (Advantage+). Se quiser testar interesses, crie um quarto conjunto à parte e compare.
3. **Anúncios:** em cada anúncio, envie a imagem 4x5 e a 9x16 juntas e use *personalizar por posicionamento*,
   para o feed receber a 4x5 e os stories e reels receberem a 9x16.
4. **Mensagem pronta** no WhatsApp: use a da planilha. Ela traz o código do anúncio (ex.: “Vi o anúncio (H07)…”),
   então você sabe qual criativo trouxe cada conversa.

## Não suba os 50 de uma vez

Suba em rodadas de **6 por conjunto**. Deixe rodar de 5 a 7 dias sem mexer e compare pelo
**custo por conversa iniciada**, não por curtida ou clique.

**Rodada 1 (sugestão)**

| Hamburguerias | Docerias | Geral |
| --- | --- | --- |
| H01 comissão | D01 encomendas de fim de ano | G01 um link, cardápio inteiro |
| H02 pedido no direct | D03 aniversariantes | G02 cardápio em PDF |
| H03 ponto da carne | D04 custo do bolo | G03 tabela de planos |
| H07 lucro do lanche | D06 checklist | G05 a gente monta |
| H19 checklist | D09 perguntas repetidas | G09 demonstração |
| H20 preço do cardápio | D11 preço do cardápio | G14 tudo num lugar só |

Depois de cada rodada:

- Pause os que custam bem mais por conversa que a média do conjunto.
- Mantenha os 2 ou 3 melhores e complete o conjunto com 3 ou 4 criativos novos da lista.
- Quando um ângulo ganhar, peça variações do mesmo tema (outro gancho, outra tela). É ali que está o público.

D01 fala de dezembro: use até a metade do mês e depois pause.

## Orçamento de teste

Para começar, R$ 30 a R$ 50 por dia em cada conjunto. Com menos que isso, a rodada demora para dar número.

## Cuidados

- **Telas reais, dados de demonstração.** Toda tela vem do sistema funcionando, com a etiqueta
  “Tela real do sistema · dados de demonstração”. Desenhos (conversa, post-it, perfil, celular com ícones)
  levam a etiqueta “Ilustração”.
- **Preços** usados: cardápio R$ 199,90, sistema + site R$ 299,90 e sistema + app R$ 599,90 por mês. Se mudar
  algum, avise para refazer H20, H21, D11, G03 e G04.
- **“App”** é o cardápio que o cliente instala na tela do celular, com o ícone da loja. Não é app da Play Store
  ou da App Store, e nenhum anúncio diz que é.
- Os anúncios **não** falam de iFood/99Food nem de nota fiscal, e não prometem resultado em número.
- “Sem comissão por pedido” vale para os pedidos do seu cardápio digital (a mensalidade é fixa).

## Refazer ou mudar um criativo

Os textos ficam em `criativos.py`. Depois de editar:

```bash
python3 gerar.py /tmp/criativos-html
node render.cjs /tmp/criativos-html /tmp/criativos-png
python3 entregar.py /tmp/criativos-png "Criativos Meta Ads"
```

As telas usadas estão em `telas/` (prints do sistema rodando com as lojas de demonstração “Sua Hamburgueria”
e “Sua Doceria Aqui”; `recortes.py` mostra de onde saiu cada recorte). As fontes estão em `fontes/`
(Anton, Caveat, Playfair Display e Poppins, todas de licença livre OFL).
