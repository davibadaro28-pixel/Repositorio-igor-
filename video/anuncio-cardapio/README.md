# Anúncio: cardápio digital personalizado (Reels, TikTok e anúncios)

Vídeo vertical 1080 x 1920, 39 s, 30 fps, com trilha e efeitos sonoros. As telas do celular são o cardápio
**real** deste repositório (marca genérica "Sua Doceria Aqui"), capturadas do sistema rodando, e não imitações.

## Roteiro

| Tempo | Cena | O que aparece |
| --- | --- | --- |
| 0–5 s | Gancho | Fotos reais dos doces em profundidade. "Sua doceria ainda vende pelo cardápio tradicional?" Um cardápio de papel gira e vira o celular. |
| 5–13 s | Solução | O cardápio real no celular em 3D, com camadas da interface saltando da tela. "Transforme a experiência de compra" e "Com um cardápio digital totalmente personalizado." |
| 13–23 s | Demonstração | Toques reais: categoria Bolos, foto e tamanhos do bolo, sacola, encomenda com data e hora, Pix, pedido enviado e a encomenda chegando na agenda do painel. |
| 23–31 s | Benefícios | A mesma plataforma com 4 identidades (logo, cores, fonte, acabamento). Parede com os produtos do cardápio. Painel de encomendas: "Pedidos direto para você, sem comissão por pedido." |
| 31–39 s | Chamada | "Seu cardápio merece ser tão especial quanto seus produtos." "Crie seu cardápio digital personalizado." Botão "Entre em contato" e "e transforme sua doceria." |

Tudo o que o vídeo mostra existe no sistema: temas por loja (`shared/theme.js`), categorias e busca no cardápio
(`web/src/public/Menu.jsx`), tamanhos e adicionais, sacola, entrega/retirada, encomenda com data e hora,
formas de pagamento, acompanhamento do pedido (`web/src/public/Track.jsx`) e a agenda de encomendas do painel.

## Como gerar de novo

```bash
# 1. sistema de demonstração com a marca genérica (banco separado)
DB_PATH=/tmp/anuncio/demo.db DEMO_MARCA=generica PORT=3400 npm run demo

# 2. capturas das telas reais e arquivos da composição
cd video/anuncio-cardapio
BASE_URL=http://localhost:3400 node scripts/capturar.cjs /tmp/anuncio/capturas
python3 scripts/preparar.py /tmp/anuncio/capturas comp/assets

# 3. quadros de conferência, marcações de som, trilha e vídeo
node scripts/render.cjs quadros /tmp/anuncio/quadros 2,8,16,24,36 --escala 0.5
node scripts/render.cjs marcas /tmp/anuncio/cues.json
python3 scripts/trilha.py /tmp/anuncio/cues.json /tmp/anuncio/trilha.wav
node scripts/render.cjs video /tmp/anuncio/video-sem-som.mp4
ffmpeg -i /tmp/anuncio/video-sem-som.mp4 -i /tmp/anuncio/trilha.wav -map 0:v -map 1:a -c:v copy \
  -af loudnorm=I=-14:TP=-1:LRA=11 -c:a aac -b:a 192k -shortest -movflags +faststart anuncio.mp4
```

- `comp/index.html` + `comp/anuncio.js`: a composição (HTML, CSS 3D e GSAP). `window.renderAt(t)` desenha o
  quadro do tempo `t`, sempre igual, então o render é quadro a quadro, sem perda.
- `scripts/trilha.py`: trilha original sintetizada (120 BPM, fá maior) e efeitos nos mesmos tempos das animações
  (toques, transições, pedido enviado, notificação). Sem música de terceiros.
- Requisitos: Node 22, Playwright com Chromium, ffmpeg, Python 3 com numpy e Pillow. As fontes (Inter Tight,
  Instrument Serif, Courier Prime) e o GSAP vêm da internet na hora do render.

Para outra loja, troque a marca nas capturas (`scripts/capturar.cjs`, função `prepare`) e gere de novo.
