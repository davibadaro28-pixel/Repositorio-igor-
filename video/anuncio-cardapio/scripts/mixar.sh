#!/usr/bin/env bash
# Junta vídeo, trilha e narração. A trilha abaixa sozinha quando a voz fala (sidechain) e o volume final fica em -14 LUFS.
# Uso: bash mixar.sh <video-sem-som.mp4> <trilha.wav> <narracao.wav> <saida.mp4>
set -euo pipefail
VID=$1; MUS=$2; VOX=$3; OUT=$4
ffmpeg -v error -y -i "$VID" -i "$MUS" -i "$VOX" -filter_complex "
  [1:a]aresample=48000[mus];
  [2:a]aresample=48000,pan=stereo|c0=c0|c1=c0,highpass=f=85,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=2.5,
       acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=2,asplit=2[vox][sc];
  [mus][sc]sidechaincompress=threshold=0.012:ratio=9:attack=10:release=420[duck];
  [duck][vox]amix=inputs=2:weights='0.8 1.9':normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 19 -tune film -maxrate 14M -bufsize 28M -profile:v high -level 4.2 \
  -pix_fmt yuv420p -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
echo "pronto: $OUT"
