"""Narração de um vídeo da campanha com o ElevenLabs (voz brasileira da biblioteca) e o tempo de cada palavra.
Lê <pasta-do-video>/narracao.json e grava, na pasta de trabalho, narracao.wav (44,1 kHz mono) e legendas.json.
A voz fala no ritmo natural e as cenas do vídeo seguem os tempos da fala (narracao-relatorio.json).
Chave: ELEVENLABS_API_KEY ou ELEVEN_HDR (arquivo com "xi-api-key: ..."). Nunca grave a chave no repositório.

Uso: python3 narrar.py <pasta-do-video> <pasta-de-trabalho>
"""
import base64
import hashlib
import json
import os
import subprocess
import sys
import urllib.request

import numpy as np

VID, WORK = sys.argv[1], sys.argv[2]
os.makedirs(WORK, exist_ok=True)
CFG = json.load(open(os.path.join(VID, 'narracao.json')))
SR = 44100
KEY = os.environ.get('ELEVENLABS_API_KEY') or open(os.environ['ELEVEN_HDR']).read().split(':', 1)[1].strip()
MODEL = CFG.get('modelo', 'eleven_multilingual_v2')


def call(path, body=None, method=None):
    req = urllib.request.Request('https://api.elevenlabs.io' + path, method=method or ('POST' if body is not None else 'GET'),
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={'xi-api-key': KEY, 'content-type': 'application/json'})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read())


def ensure_voice():
    mine = {v['voice_id'] for v in call('/v1/voices')['voices']}
    if CFG['voz'] not in mine and CFG.get('dono'):
        call(f"/v1/voices/add/{CFG['dono']}/{CFG['voz']}", {'new_name': f"campanha-{CFG['nome'].lower()}"})


def tts(text, prev, nxt, speed):
    key = hashlib.sha1(json.dumps([CFG['voz'], CFG['ajustes'], text, prev, nxt, speed, MODEL]).encode()).hexdigest()[:16]
    f = os.path.join(WORK, f'take-{key}.json')
    if not os.path.exists(f):
        body = {'text': text, 'model_id': MODEL, 'previous_text': prev, 'next_text': nxt,
                'voice_settings': {**CFG['ajustes'], 'use_speaker_boost': True, 'speed': speed}}
        d = call(f"/v1/text-to-speech/{CFG['voz']}/with-timestamps?output_format=mp3_44100_128", body)
        json.dump({'audio': d['audio_base64'], 'al': d.get('alignment') or {}}, open(f, 'w'))
    d = json.load(open(f))
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'pipe:0', '-f', 's16le', '-ac', '1', '-ar', str(SR), 'pipe:1'],
                         input=base64.b64decode(d['audio']), capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype='<i2').astype(np.float32) / 32768
    al = d['al']
    a = max(0.0, al['character_start_times_seconds'][0] - 0.04)
    b = al['character_end_times_seconds'][-1] + 0.14
    words, cur = [], None
    for ch, s, e in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
        if ch.isspace():
            cur = None
            continue
        if cur is None:
            cur = {'w': '', 's': s, 'e': e}
            words.append(cur)
        cur['w'] += ch
        cur['e'] = e
    for w in words:
        w['s'] -= a
        w['e'] -= a
    return x[int(a * SR):int(b * SR)], words


ensure_voice()
# ritmo natural: cada frase entra depois da anterior com uma pausa curta; as cenas do vídeo seguem estes tempos
falas = CFG['falas']
chosen, takes, t = [], [], 0.0
for k, f in enumerate(falas):
    prev = chosen[-1] if chosen else ''
    text = f['textos'][0]
    nxt = falas[k + 1]['textos'][0] if k + 1 < len(falas) else ''
    x, words = tts(text, prev, nxt, 1.0)
    t = max(f.get('inicio_min', 0.0), t + (f.get('pausa', 0.28) if k else 0.25))
    takes.append((t, text, x, words))
    chosen.append(text)
    t += len(x) / SR
D = round(t + CFG.get('cauda', 2.4), 2)
track = np.zeros(int((D + 1) * SR))
legendas, report = [], []
for k, (t0, text, x, words) in enumerate(takes):
    i = int(t0 * SR)
    track[i:i + len(x)] += x
    for w in words:
        legendas.append({'w': w['w'], 's': round(t0 + w['s'], 3), 'e': round(t0 + w['e'], 3), 'frase': k})
    report.append({'inicio': round(t0, 3), 'fim': round(t0 + len(x) / SR, 3), 'texto': text})
    print(f"{t0:5.2f}-{t0 + len(x) / SR:5.2f}s  {text}", flush=True)
print('duração do vídeo:', D, 's')

track = track[:int(D * SR)]
track /= np.max(np.abs(track)) / 0.9
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', os.path.join(WORK, 'narracao.wav')],
               input=(track * 32767).astype('<i2').tobytes(), check=True)
json.dump(legendas, open(os.path.join(WORK, 'legendas.json'), 'w'), ensure_ascii=False)
json.dump({'duracao': D, 'falas': report}, open(os.path.join(WORK, 'narracao-relatorio.json'), 'w'), ensure_ascii=False, indent=1)
print('ok', os.path.join(WORK, 'narracao.wav'), len(legendas), 'palavras')
