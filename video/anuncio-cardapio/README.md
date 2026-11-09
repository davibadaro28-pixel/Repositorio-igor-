# Anúncio: cardápio digital personalizado (Reels, TikTok e anúncios)

Vídeo vertical 1080 x 1920, 40 s, 30 fps, com narração por IA em português, trilha e efeitos sonoros. As telas do celular são o cardápio
**real** deste repositório (marca genérica "Sua Doceria Aqui"), capturadas do sistema rodando, e não imitações.

## Roteiro

| Tempo | Cena | O que aparece |
| --- | --- | --- |
| 0–5 s | Gancho | Fotos reais dos doces em profundidade. "Sua doceria ainda vende pelo cardápio tradicional?" Um cardápio de papel gira e vira o celular. |
| 5–13 s | Solução | O cardápio real no celular em 3D, com camadas da interface saltando da tela. "Transforme a experiência de compra" e "Com um cardápio digital totalmente personalizado." |
| 13–23 s | Demonstração | Toques reais: categoria Bolos, foto e tamanhos do bolo, sacola, encomenda com data e hora, Pix, pedido enviado e a encomenda chegando na agenda do painel. |
| 23–31 s | Benefícios | A mesma plataforma com 4 identidades (logo, cores, fonte, acabamento). Parede com os produtos do cardápio. Painel de encomendas: "Pedidos direto para você, sem comissão por pedido." |
| 31–40 s | Chamada | "Seu cardápio merece ser tão especial quanto seus produtos." "Crie seu cardápio digital personalizado." Botão "Entre em contato" e "e transforme sua doceria." |

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

# 4. narração: voz brasileira nativa do ElevenLabs (plano Starter ou acima: libera as vozes da biblioteca e o uso comercial)
ELEVENLABS_API_KEY=... python3 scripts/narracao_elevenlabs.py /tmp/anuncio/voz /tmp/anuncio/narracao.wav \
  --voz iScHbNW8K33gNo3lGgbo --dono 7e00f51a98997e64678b137e43561da19244070bf4e947a44274e0948ff7673c   # Marianne
#    outras: Roberta ohZOfA9iwlZ5nOsoY7LB (dono 4a19cd68…), Diego rpNe0HOx7heUulPiOEaG (dono e2491119…)
#    alternativa gratuita (soa artificial): scripts/narracao.py com Chatterbox + Kokoro

# 5. mixagem: a trilha abaixa quando a voz fala; volume final -14 LUFS
bash scripts/mixar.sh /tmp/anuncio/video-sem-som.mp4 /tmp/anuncio/trilha.wav /tmp/anuncio/narracao.wav anuncio.mp4
```

**Narração.** Roteiro em `scripts/narracao_elevenlabs.py`, uma frase curta por cena, na voz da Marianne (locutora
brasileira da biblioteca do ElevenLabs, modelo multilingual v2). A voz fala no ritmo natural (no máximo 6% mais rápido);
se uma frase não cabe na cena, entra a versão mais curta que está ao lado dela. A chave nunca vai para o repositório.

- `comp/index.html` + `comp/anuncio.js`: a composição (HTML, CSS 3D e GSAP). `window.renderAt(t)` desenha o
  quadro do tempo `t`, sempre igual, então o render é quadro a quadro, sem perda.
- `scripts/trilha.py`: trilha original sintetizada (120 BPM, fá maior) e efeitos nos mesmos tempos das animações
  (toques, transições, pedido enviado, notificação). Sem música de terceiros.
- Requisitos: Node 22, Playwright com Chromium, ffmpeg, Python 3 com numpy e Pillow. As fontes (Inter Tight,
  Instrument Serif, Courier Prime) e o GSAP vêm da internet na hora do render.

Para outra loja, troque a marca nas capturas (`scripts/capturar.cjs`, função `prepare`) e gere de novo.
