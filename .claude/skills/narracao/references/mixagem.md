# Voz + trilha no vídeo

## Níveis

| Faixa | Alvo |
| --- | --- |
| Narração sozinha (antes de mixar) | −16 a −20 LUFS, pico −1 dBTP |
| Trilha sob a voz | 12 a 18 dB abaixo da voz enquanto ela fala |
| Mix final para redes sociais | −14 LUFS integrado, pico real ≤ −1 dBTP |

## Abaixar a música quando a voz entra (sidechain) e entregar em −14 LUFS

```bash
ffmpeg -y -i video_mudo.mp4 -i trilha.wav -i narracao.wav -filter_complex "\
[2:a]aresample=48000,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,asplit=2[voz][chave];\
[1:a]aresample=48000,volume=-6dB[mus];\
[mus][chave]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[musduck];\
[musduck][voz]amix=inputs=2:duration=first:normalize=0,\
loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest video_final.mp4
```

- `highpass=80` tira o grave que embola a voz; o compressor leve iguala frases mais altas e mais baixas.
- `sidechaincompress` abaixa a trilha só enquanto há voz. Com `release` de 300 a 400 ms ela volta sem "bombear".
- Se a voz some na mixagem, suba a voz em 2 dB antes de mexer na trilha.

## Conferir depois de mixar

Rode `avaliar.py --mix` no áudio final (extraia com `ffmpeg -i video_final.mp4 -vn -ac 1 final.wav`) com o mesmo roteiro.
Com `--mix` ele confere só o que dá para medir com música por baixo: se a fala se entende (palavras divergentes) e o
volume/pico. Sem `--mix` as pausas, o ritmo e a sincronia saem errados, porque com trilha não há silêncio.
Se a transcrição piorar muito em relação à narração sozinha, a trilha está alta ou embolando a voz.
