# Produção dos 10 anúncios de Instagram (R01–R10)

Cada pasta `ig/<id>/` tem o roteiro falado (`roteiro.json`), o visual (`estilo.css` + `plano.js`, sobre a
biblioteca `temas/ig.js`), a trilha (`trilha.json`, gerada no ElevenLabs Music) e a mixagem (`mix.json`).
Vertical 1080 × 1920, 30 fps, áudio −14 LUFS e pico real ≤ −1,2 dBTP.

## Narração: conversa, não locutor

As primeiras vozes soavam comerciais. Para estes vídeos:

- vozes de conversa (biblioteca do ElevenLabs), uma por vídeo, com `style` baixo (0,08) e estabilidade média;
- texto reescrito como fala do dia a dia ("tá", "pra", "fala com a gente", frases curtas, perguntas);
- duas gravações por frase e escolha automática pela que bate com o texto (Whisper), tem entonação variada
  e ritmo perto do alvo de cada vídeo (`escolha.json` na pasta de trabalho).

| Vídeo | Formato | Voz | Visual |
| --- | --- | --- | --- |
| R01 | carta do fundador | sem locução (só texto e música) | papel pautado, escrita à mão |
| R02 | cinco ganchos (ADHD) | Lucas | preto e neon, cortes secos, glitch |
| R03 | POV | sem locução | caixas de texto do Reels, noite azul |
| R04 | antes × depois | Raquel | tela dividida: caderno × painel |
| R05 | esquete | quatro vozes (três "caos" e a dona) | quadrinho, personagens post-it |
| R06 | anotações na tela | Davi Andrei | quadro escuro, marcador amarelo e vermelho |
| R07 | tutorial | Ana Alice | rosa-claro, passos 1 · 2 · 3 no celular |
| R08 | 3 erros | Fernanda | editorial, serifa, capítulos 1/3 2/3 3/3 |
| R09 | teste rápido | Roberta | programa de perguntas, cronômetro |
| R10 | um dia na doceria | Nina | vlog quente, telas "coladas" com fita, relógio |

## Adaptações em relação aos roteiros

- **R01 (selfie do fundador):** as frases são do fundador, em primeira pessoa ("eu paguei comissão por anos").
  Uma voz de IA não fala por uma pessoa real, então virou uma carta escrita na tela, assinada
  "— criador do sistema". **Confirme que cada frase é verdadeira para você antes de publicar.**
  Se preferir a versão em vídeo, grave a selfie com o mesmo texto.
- **R05 (esquete):** sem atores, o "caos" virou três personagens de post-it animados; a dona responde
  mostrando as telas reais, e cada caos é "nocauteado" pela função certa.
- **R06 e R10:** sem você na câmera, um narrador fala na terceira pessoa ("na doceria de quem criou o
  sistema"), e as telas reais ocupam o lugar das cenas gravadas.
- **R03:** sem foto de pessoa (não inventamos ninguém); o celular com as mensagens é ilustração.

## Regras mantidas

- Só funções que existem hoje; nada de iFood/99Food nem NFC-e. O DRE aparece sem a linha de comissão de app,
  e nenhum recorte mostra o menu lateral.
- +30% de lucro sempre como "Resultado informado pelo criador do sistema. Cada negócio tem o seu".
- Telas reais com a etiqueta "Tela real · dados de demonstração"; desenhos com "Ilustração".
- Trilhas originais geradas para cada vídeo (nada de áudio em alta do Instagram).

## Como refazer um vídeo

```
python3 shared/narrar2.py ig/<id> <trabalho>      # só vídeos com voz
python3 shared/variacao.py ig/<id> <trabalho>     # gera index.html e assets/narracao.js
python3 shared/trilha.py ig/<id> <trabalho>
node shared/render.cjs ig/<id> video <trabalho>/mudo.mp4
node shared/render.cjs ig/<id> marcas <trabalho>/cues.json
python3 shared/mixar.py ig/<id> <trabalho> <biblioteca-de-efeitos>
```
