---
name: narracao
description: Cria e avalia narrações (locução, voz em off, voiceover, TTS) em português do Brasil para vídeos, anúncios, Reels, apresentações e tutoriais, e diz com medidas objetivas se a narração está boa e natural. Confere se a voz falou o roteiro certo (pronúncia, palavra trocada, faltando ou repetida), o ritmo em sílabas por segundo, as pausas, a entonação (monótona, robótica, pergunta sem cara de pergunta), falhas técnicas (estouro, ruído, corte seco) e a sincronia com o texto na tela, e indica o que refazer. Use sempre que o usuário pedir narração, locução, voz para um vídeo, áudio falado, texto para a voz ler, gerar voz com ElevenLabs ou Piper, ou quiser saber se uma narração gerada ou gravada está boa, natural, rápida demais, robótica, ou comparar takes, mesmo que não fale em "skill".
---

# Narração natural em português

Você não ouve áudio. Esta skill transforma a escuta em medidas: a transcrição automática (faster-whisper) mostra o que
a voz realmente falou e quando, e o Praat mede tom, pausas e ritmo. Com isso você consegue julgar uma narração, apontar
os trechos ruins com o tempo exato e refazer só o que falhou. O que as medidas não pegam (timbre, emoção, se a voz
combina com a marca) continua dependendo de ouvido humano. Por isso todo resultado termina com a lista de trechos para
o usuário ouvir, e você nunca diz "está natural" só porque os números passaram.

## Preparar a máquina (uma vez)

```bash
pip install --break-system-packages faster-whisper praat-parselmouth piper-tts   # ffmpeg também precisa estar instalado
```

Na primeira avaliação o modelo de transcrição `small` (~470 MB) é baixado para `~/.cache/narracao/`. Os scripts estão em
`scripts/` (ao lado deste arquivo) e todos aceitam `--help`.

## Roteiro: o formato que os scripts leem

- **.txt:** uma frase por linha (linhas com várias frases são divididas no ponto final). A pontuação comanda as pausas.
- **.json:** `{"frases": [{"texto": "…", "inicio": 2.4, "fim": 5.1}]}`. Use quando a narração precisa caber em cenas de
  um vídeo: `inicio`/`fim` são a janela de cada frase (quando o texto aparece e quando a cena acaba). O avaliador confere a
  sincronia com essas janelas e o `montar.py` posiciona cada frase nelas.

## O fluxo

### 1. Escrever para o ouvido

Leia `references/escrever-para-ouvir.md` sempre que for escrever ou adaptar o texto: texto de tela e texto falado
são diferentes (frases curtas, uma ideia por frase, números e siglas do jeito que se falam). Depois confira se cabe:

```bash
python3 scripts/texto_falado.py roteiro.json --estilo anuncio --motor elevenlabs
```

Ele mostra o texto que vai para a voz, as trocas feitas (R$ 199,90 → "cento e noventa e nove e noventa", CMV → "cê-ême-vê"),
a duração estimada de cada frase e, com janelas, se a frase cabe ou quantas sílabas cortar. Corte texto antes de gerar:
acelerar o áudio depois deixa a voz atropelada e com cara de robô.

### 2. Gerar a voz

- **ElevenLabs (melhor qualidade, gasta créditos):** leia `references/elevenlabs.md`. Em resumo: veja os créditos
  (`account_get_usage`), escolha a voz com `creative_list_voices` (idioma `pt`), gere **uma frase por chamada** com o
  texto que o `texto_falado.py --motor elevenlabs` devolveu, acompanhe com `creative_get_flow_run_status` e baixe os áudios
  como `01.mp3`, `02.mp3`…
- **Piper (grátis, local, mais sintético):** para rascunho, teste de tempo ou quando não há crédito.
  ```bash
  python3 scripts/gerar_piper.py --roteiro roteiro.json --voz cadu --ritmo 5.8 --saida narracao.wav
  python3 scripts/gerar_piper.py --roteiro roteiro.json --saida narracao.wav --so 1,4    # refaz só as frases 1 e 4
  ```
  Ele já gera frase a frase, acerta a velocidade pela meta de sílabas por segundo e monta a faixa. Os trechos ficam em
  `narracao.wav_trechos/`, e `--so` refaz só as frases pedidas e reaproveita as outras. No .json, `"ritmo": 6.6`
  dentro de uma frase vale só para ela, útil para a frase que precisa caber numa cena curta. As vozes (faber, cadu,
  jeff) erram algumas palavras ("cliente", gírias, nomes em inglês): quando a avaliação apontar, troque por sinônimo.
- **Gravação humana ou áudio pronto:** vá direto para a avaliação.

Gerar frase a frase permite refazer só o trecho ruim e encaixar cada frase na sua cena. O custo é que o tom pode variar
entre frases: o avaliador aponta isso como "ritmo irregular entre as frases".

### 3. Montar (quando gerou frase a frase)

```bash
python3 scripts/montar.py --roteiro roteiro.json --trechos pasta_dos_trechos/ --saida narracao.wav
```

Apara o silêncio das bordas, põe pausas pela pontuação (ou cada frase 0,1 s depois do início da sua janela), deixa o
pico em −1 dBFS e grava `narracao.wav.marcas.json` com o tempo real de cada frase.

### 4. Avaliar

```bash
python3 scripts/avaliar.py --audio narracao.wav --roteiro roteiro.json --estilo anuncio --saida aval/
python3 scripts/avaliar.py --audio take1.mp3 take2.mp3 take3.mp3 --roteiro roteiro.txt --saida aval/    # compara takes
python3 scripts/avaliar.py --audio nova.wav --roteiro r.txt --referencia uma_que_eu_gosto.mp3 --saida aval/
```

Leia `aval/relatorio.md` e **olhe o `aval/prosodia.png`**: o desenho mostra a forma de onda, a curva do tom, as
pausas com a duração, cada palavra no seu tempo (em vermelho as divergentes) e os problemas numerados como no relatório.
Uma curva de tom quase reta é voz robótica; degraus bruscos são falha da voz; pausa larga no meio de uma frase salta aos olhos.

Estilos: `anuncio` (4,4–7,2 sílabas/s), `conversa` (4,3–6,8), `institucional` (4,0–6,3). Sem `--roteiro`, avalia ritmo,
pausas, entonação e técnica usando a própria transcrição como texto. `references/criterios.md` explica cada medida,
de onde vêm as faixas e os alarmes falsos conhecidos. Leia esse arquivo antes de discordar do relatório ou de explicar
uma medida ao usuário.

Veredito: **Aprovada** (nota ≥ 85, nenhum problema), **Aprovada com ressalvas** (só itens de atenção), **Refazer os trechos
com problema**, **Refazer a narração** (nota < 50).

### 5. Corrigir só o que falhou

| Apontado | O que fazer |
| --- | --- |
| Palavra trocada ou pouco clara | Ouça o trecho. Se a voz errou, reescreva a palavra como se fala num arquivo de pronúncias (`--pronuncias`, mesmo formato de `scripts/pronuncias.json`) ou troque por sinônimo; gere de novo só aquela frase. |
| Palavra faltando ou repetida | Gere de novo a frase (falha comum de voz sintética). |
| Frase corrida ou lenta | Corte palavras. Se não der, ajuste a velocidade só daquela frase (Piper `"ritmo"` no .json + `--so N`; ElevenLabs `[slowly]` no v4 ou `speed` 0,9 a 1,1 no v2). |
| Pausa no meio da frase | Gere de novo; se a pausa for intencional, ponha vírgula no roteiro. |
| Frases emendadas | Separe em duas gerações ou deixe o `montar.py` pôr a pausa. |
| Monótona ou sem variação | Voz mais expressiva, tag de emoção (v4), estabilidade menor (v2), ênfase numa palavra (MAIÚSCULA com moderação). |
| Pergunta sem tom de pergunta | Gere de novo; no v4, `[curious]` antes da frase. |
| Estouro, ruído, corte seco | Gere ou exporte de novo; normalize com limitador em −1 dBTP. |
| Passa do tempo da cena ou termina colada no corte | Corte texto, suba o ritmo daquela frase até 6,5–7 sílabas/s ou alongue a cena. Não acelere o áudio pronto mais que 5%. |

Refaça e avalie de novo. Pare em três rodadas: se o mesmo problema volta, troque a voz, o motor ou o texto, e explique
ao usuário. Com várias versões do mesmo trecho, avalie todas juntas (`--audio a b c`) e fique com a melhor.

### 6. Entregar

Diga ao usuário, curto:
- o veredito e a nota, com as medidas principais (ritmo, variação de tom, pausas, sincronia);
- o que foi corrigido entre as rodadas;
- os **trechos para ouvir** (tempo + motivo), inclusive os itens de atenção que você decidiu manter;
- onde estão o áudio, o relatório e o gráfico (envie o gráfico quando puder: ele explica melhor que números).

Quando a narração vai para um vídeo com trilha, `references/mixagem.md` traz os níveis e o comando do ffmpeg com abaixamento
automático da música sob a voz.
