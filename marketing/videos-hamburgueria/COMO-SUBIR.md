# Como subir os 50 vídeos no Meta Ads (hamburguerias)

São 50 vídeos de 10 a 18 segundos para vender o cardápio digital e o sistema a donos de hamburgueria.
Cada um tem duas versões com o mesmo nome:

| Pasta | Tamanho | Onde usar |
| --- | --- | --- |
| Reels e Stories 9x16 | 1080 × 1920 | Reels e Stories (o texto fica fora das faixas onde aparece a interface) |
| Feed 4x5 | 1080 × 1350 | Feed do Instagram e do Facebook |

Os vídeos não têm locução: o texto aparece na tela, como a maioria assiste no feed (sem som). Trilha e efeitos
sonoros são originais, feitos para estes vídeos, com volume padronizado (−14 LUFS).

## O que aparece nos vídeos

- **Telas reais do sistema**, gravadas da loja de demonstração "Sua Hamburgueria": pedido pelo celular,
  quadro de pedidos, tela da cozinha, caixa, estoque, custo dos lanches, clientes, cupons, relatórios e app do entregador.
  Os dados são de demonstração, e a etiqueta "Tela real do sistema · dados de demonstração" aparece em cada uma.
- **Ilustrações** (conversa no direct, post-it, perfil do Instagram, tela inicial do celular e o hambúrguer em 3D)
  levam a etiqueta "Ilustração". O custo de cada camada do hambúrguer vem da ficha técnica de demonstração do sistema.
- Nada de iFood/99Food, nota fiscal ou resultado prometido em número.

## Estrutura da campanha

1. **Campanha:** objetivo *Engajamento*, local da conversão *WhatsApp*.
2. **Um conjunto de anúncios** para hamburguerias: região que você atende, 22–60 anos, público aberto (Advantage+).
   Quem segmenta é o vídeo: cada um fala de uma dor.
3. **Anúncios:** envie o 9x16 e o 4x5 do mesmo vídeo e use *personalizar por posicionamento*.
4. **Texto e mensagem pronta:** use os da planilha. A mensagem pronta traz o código do vídeo (ex.: "Vi o vídeo (V07)").

## Teste em rodadas

Suba 6 a 8 vídeos por rodada, deixe 5 a 7 dias sem mexer e compare pelo **custo por conversa iniciada**.

**Rodada 1 (sugestão):** V01 comissão · V02 pedido no direct · V03 ponto da carne · V07 lucro do lanche ·
V19 checklist · V20 oferta do cardápio · V29 custo do cheese bacon · V47 caminho do pedido.

Depois de cada rodada, pause os mais caros, mantenha os 2 ou 3 melhores e entre com novos da lista.
Quando um tema ganhar, use os outros vídeos do mesmo tema:

| Tema | Vídeos |
| --- | --- |
| Pedido e cardápio | V01, V02, V10, V11, V22, V23, V32, V45 |
| Cozinha e pico | V03, V04, V05, V36, V42, V44 |
| Custo e lucro | V07, V08, V24, V29, V41 |
| Entrega | V06, V12, V13, V37, V38, V43 |
| Gestão e dinheiro | V09, V25, V26, V27, V28, V40 |
| Clientes e vendas | V14, V15, V16, V30, V31, V35, V39 |
| Visão geral | V17, V18, V19, V21, V33, V34, V46, V47, V48 |
| Oferta e preço | V20, V21, V49, V50 |

## Cuidados

- **Preços** nos vídeos: cardápio R$ 199,90, sistema + site R$ 299,90 e sistema + app R$ 599,90 por mês
  (V01, V19, V20, V21, V46, V49, V50). Se mudar algum, avise para refazer esses vídeos.
- **"App"** é o cardápio que o cliente instala na tela do celular, com o ícone da loja (V49). Não é app de loja de aplicativos.
- "Menos de R$ 7 por dia" (V20) é o plano de R$ 199,90 dividido por 30 dias.

## Refazer ou mudar um vídeo

Roteiros em `roteiros.py`. O demo precisa estar no ar só para recapturar telas (`capturar.cjs`).

```bash
npm install                                   # three.js e GSAP
python3 roteiros.py                           # gera roteiros/*.json
node render.cjs quadros /tmp/q V07 auto       # quadros para conferir
node render.cjs video /tmp/r V07              # vídeo sem som + marcas de efeito
python3 som.py /tmp/r /tmp/f V07              # trilha, efeitos, mixagem, 9x16 e 4x5
```
