"""Biblioteca de efeitos sonoros da campanha.
Orgânicos (gaveta de caixa, sino de cozinha, papel, carimbo...) vêm do ElevenLabs Sound Effects;
os de interface (whoosh, impacto, pop, tique, riser...) são sintetizados aqui, com variações por vídeo.
Uso: python3 efeitos.py <pasta-da-biblioteca>   (grava <nome>.wav, 44,1 kHz mono; só gera o que falta)
"""
import json
import os
import subprocess
import sys
import time
import urllib.request

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
KEY = os.environ.get('ELEVENLABS_API_KEY') or open(os.environ['ELEVEN_HDR']).read().split(':', 1)[1].strip()

GERADOS = {
    'vibrate': ('smartphone vibrating on a wooden table, short double buzz', 1.0),
    'knife': ('sharp knife slicing cleanly through a soft cake, crisp single cut', 0.8),
    'ding': ('clean modern app notification ding, bright single tone', 0.8),
    'coins': ('handful of coins clinking and dropping, short', 1.0),
    'stamp': ('rubber stamp hitting paper on a desk, firm single thump', 0.5),
    'alarm': ('short digital warning alarm, two urgent beeps', 1.0),
    'bell': ('restaurant kitchen order bell, single ring', 1.3),
    'register': ('cash register drawer opening with a ka-ching', 1.2),
    'page': ('crisp paper page flip', 0.6),
    'sticker': ('sticky note slapped onto a surface, quick', 0.4),
    'boom': ('deep cinematic boom impact with sub bass', 1.6),
    'bubble': ('soft chat message bubble pop, user interface sound', 0.4),
    'scribble': ('quick pen scribble on paper', 0.7),
    'silk': ('soft silk fabric swoosh', 1.0),
    'sparkle': ('magical sparkle shimmer twinkle, short', 1.2),
    'chimes': ('delicate wind chimes glissando, bright and short', 1.5),
    'success': ('gentle elegant success chime, two ascending notes', 1.0),
    'poof': ('soft poof, things vanishing in a puff of air', 0.6),
    'flip': ('split flap clock display flipping, mechanical clack', 0.5),
    'scan': ('barcode scanner beep with laser sweep', 0.6),
    'type': ('fast smartphone keyboard typing burst', 0.8),
    'slam': ('heavy laptop slammed down on a desk, punchy thud', 0.7),
    'count': ('fast digital counter ticking up, slot machine numbers rolling', 1.1),
}


def gen(name, text, dur):
    f = os.path.join(OUT, name + '.wav')
    if os.path.exists(f):
        return
    body = {'text': text, 'duration_seconds': max(0.5, dur), 'prompt_influence': 0.6}  # mínimo da API: 0,5 s
    for tent in range(4):
        req = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', data=json.dumps(body).encode(),
                                     headers={'xi-api-key': KEY, 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                mp3 = r.read()
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3 + tent * 3)
                continue
            raise
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'pipe:0', '-ac', '1', '-ar', '44100', f], input=mp3, check=True)
    print('gerado', name)


for n, (txt, d) in GERADOS.items():
    gen(n, txt, d)
print('ok', len(os.listdir(OUT)), 'arquivos')
