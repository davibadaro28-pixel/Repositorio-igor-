# Como subir os 12 vídeos da Sua Hamburgueria no Meta Ads

São 12 vídeos de 22 a 26 segundos que vendem a **Sua Hamburgueria**: cardápio digital, sistema de gestão,
site e tráfego pago para hamburguerias. Visual da marca (grafite, laranja brasa e fagulhas), o mesmo do site.
Cada um tem duas versões com o mesmo nome:

| Pasta | Tamanho | Onde usar |
| --- | --- | --- |
| Reels e Stories 9x16 | 1080 × 1920 | Reels e Stories (o texto fica fora das faixas onde aparece a interface) |
| Feed 4x5 | 1080 × 1350 | Feed do Instagram e do Facebook |

Sem locução: o texto aparece na tela. Trilha e efeitos sonoros originais, com volume padronizado (−14 LUFS).
Todos terminam com a marca, os quatro serviços e o botão "Fale com a equipe".

## Os 12 vídeos

| Vídeo | Assunto | Serviço em destaque |
| --- | --- | --- |
| P01 | Comissão de aplicativo | Cardápio digital (R$ 199,90) |
| P02 | Do anúncio à entrega | Tudo conectado |
| P03 | Quatro serviços | Visão geral e planos |
| P04 | Tráfego pago | Tráfego (R$ 999,99) |
| P05 | Sexta 21h, pico de pedidos | Sistema de gestão |
| P06 | Custo de cada lanche | Sistema + site (R$ 299,90) |
| P07 | Site com a sua marca | Site |
| P08 | Teste antes de contratar | Demonstração no site |
| P09 | A gente monta tudo | Implantação |
| P10 | Delivery próprio | Entrega e acerto |
| P11 | Dono no celular | Painel e relatórios |
| P12 | Planos | Todos os preços |

## O que aparece nos vídeos

- **Telas reais do sistema**, da loja de demonstração "Sua Hamburgueria", com a etiqueta
  "Tela real do sistema · dados de demonstração".
- **Anúncios de exemplo** (P02, P04, P12): quadros dos vídeos feitos para hamburguerias, com a etiqueta "Exemplos de anúncios".
- Nada de iFood/99Food, nota fiscal ou resultado prometido em número.

## Estrutura da campanha

1. **Campanha:** objetivo *Engajamento*, local da conversão *WhatsApp*.
2. **Conjunto de anúncios:** donos de hamburgueria na região que você atende, 22–60 anos, público aberto (Advantage+).
3. **Anúncios:** envie o 9x16 e o 4x5 do mesmo vídeo e use *personalizar por posicionamento*.
4. **Texto e mensagem pronta:** use os da planilha. A mensagem pronta traz o código do vídeo (ex.: "Vi o vídeo (P05)").

**Rodada 1 (sugestão):** P01 comissão · P03 quatro serviços · P05 pico de pedidos · P06 custo do lanche ·
P08 teste antes de contratar · P12 planos. Compare pelo **custo por conversa iniciada** depois de 5 a 7 dias.

## Cuidados

- **Preços** nos vídeos: cardápio R$ 199,90, sistema + site R$ 299,90, sistema + app R$ 599,90 e tráfego pago
  + R$ 999,99 por mês (P01, P03, P04, P06, P12). Se mudar algum, avise para refazer esses vídeos.
- O site não tem preço nos vídeos: P07 pede orçamento pelo WhatsApp.
- P08 diz que a demonstração está no site: deixe o site no ar antes de subir esse vídeo.

## Refazer ou mudar um vídeo

Roteiros em `roteiros_pro.py` (usa as funções de `roteiros.py`).

```bash
python3 roteiros_pro.py                       # gera roteiros/P*.json e roteiros/textos_pro.json
node render.cjs quadros /tmp/q P05 auto       # quadros para conferir
node render.cjs video /tmp/r P05              # vídeo sem som + marcas de efeito
python3 som.py /tmp/r /tmp/f P05              # trilha, efeitos, mixagem, 9x16 e 4x5
python3 entregar.py /tmp/f /tmp/entrega pro   # pasta de entrega com planilha e visão geral
```
