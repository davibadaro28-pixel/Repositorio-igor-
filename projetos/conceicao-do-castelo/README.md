# Residencial Conceição do Castelo – vídeo vertical

- **Referência:** https://www.instagram.com/reel/Dd1PFfjNsOO/ (estilo: vídeo em moldura branca sobre fundo desfocado, legenda palavra por palavra, destaques em vermelho)
- **Material bruto:** `IMG_2602.MOV` (Google Drive, id `1ofi38lUJmgBKW9MPyqNJ8aSoSATTT_WK`) + briefing em PDF (imagens 3D da área de lazer)
- **Versão atual:** `Conceicao_do_Castelo_v1.mp4` – 1080×1920, 30 fps, 1min05s

## Arquivos
- `build.py` – monta o vídeo (lista de cenas, legendas e composição final). Uso: `python3 -I build.py <pasta_de_trabalho> [all|video|audio|ass|compose] [nome.mp4]`
- `transcribe.py` – transcreve a fala com tempo por palavra (faster-whisper, modelo `medium`)
- `words.json` – transcrição com tempo de cada palavra
- `legendas.ass` – legendas animadas geradas pelo `build.py`

## Pendências com o cliente
- Confirmar o WhatsApp da tela final: (11) 94023-1550 (lido da placa do stand)
- Música de fundo (a v1 não tem música)
