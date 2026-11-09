"""Trilha original de cada vídeo com o ElevenLabs Music (instrumental), em seções alinhadas às cenas.
Lê <pasta-do-video>/trilha.json ({"global": [...], "evitar": [...], "secoes": [{"nome","ate","estilo":[...]}]})
e grava <pasta-de-trabalho>/trilha.wav (44,1 kHz estéreo). A duração total segue a narração (+ cauda).
Chave: ELEVENLABS_API_KEY ou ELEVEN_HDR. Uso: python3 trilha.py <pasta-do-video> <pasta-de-trabalho>
"""
import json
import os
import subprocess
import sys
import urllib.request

VID, WORK = sys.argv[1], sys.argv[2]
os.makedirs(WORK, exist_ok=True)
cfg = json.load(open(os.path.join(VID, 'trilha.json')))
D = json.load(open(os.path.join(WORK, 'narracao-relatorio.json')))['duracao']
KEY = os.environ.get('ELEVENLABS_API_KEY') or open(os.environ['ELEVEN_HDR']).read().split(':', 1)[1].strip()

secs, t0 = [], 0.0
for k, s in enumerate(cfg['secoes']):
    end = D + 1.0 if k == len(cfg['secoes']) - 1 else s['ate']
    secs.append({'section_name': s['nome'], 'positive_local_styles': s['estilo'], 'negative_local_styles': s.get('evitar', []),
                 'duration_ms': int(round((end - t0) * 1000)), 'lines': []})
    t0 = end
body = {'composition_plan': {'positive_global_styles': cfg['global'], 'negative_global_styles': cfg.get('evitar', []) + ['vocals', 'singing', 'spoken word'],
                             'sections': secs}, 'model_id': 'music_v1'}
out = os.path.join(WORK, 'trilha.mp3')
if not os.path.exists(out):
    req = urllib.request.Request('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', data=json.dumps(body).encode(),
                                 headers={'xi-api-key': KEY, 'content-type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            open(out, 'wb').write(r.read())
    except urllib.error.HTTPError as e:
        print('ERRO', e.code, e.read()[:600].decode(errors='replace'))
        sys.exit(1)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-ar', '44100', '-ac', '2', os.path.join(WORK, 'trilha.wav')], check=True)
print('trilha', out, [(s['section_name'], s['duration_ms']) for s in secs])
