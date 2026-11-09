"""Narração do anúncio com o ElevenLabs (voz nativa brasileira da biblioteca), alinhada às cenas.
A chave vem da variável ELEVENLABS_API_KEY ou de um arquivo de cabeçalho (ELEVEN_HDR, linha "xi-api-key: ...").
Nunca grave a chave no repositório.

Uso:
  python3 narracao_elevenlabs.py <pasta-de-trabalho> <saida.wav> --voz <voice_id> [--dono <public_owner_id>] [--duracao 40]
  python3 narracao_elevenlabs.py <pasta> <amostra.mp3> --voz <voice_id> --amostra     (só uma frase, para comparar vozes)
"""
import base64
import json
import os
import subprocess
import sys
import urllib.request

import numpy as np

WORK, OUT = sys.argv[1], sys.argv[2]
arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
VOICE = arg('--voz')
OWNER = arg('--dono')
DUR = float(arg('--duracao', 40))
MODEL = arg('--modelo', 'eleven_multilingual_v2')
SR = 44100
os.makedirs(WORK, exist_ok=True)

if os.environ.get('ELEVENLABS_API_KEY'):
    KEY = os.environ['ELEVENLABS_API_KEY']
else:
    KEY = open(os.environ['ELEVEN_HDR']).read().split(':', 1)[1].strip()

# roteiro por cena: (início, até quando pode ir, [texto preferido, versões mais curtas de reserva])
# a voz fala no ritmo natural (no máximo 6% mais rápido); se não couber, usa a versão mais curta
ROTEIRO = [
    (0.30, 4.7, ['Sua doceria ainda vende pelo cardápio tradicional?']),
    (5.20, 12.6, ['Transforme a experiência de compra com um cardápio digital totalmente personalizado.',
                  'Transforme a experiência de compra com um cardápio digital personalizado.']),
    (13.10, 17.5, ['Seu cliente vê as fotos e escolhe o tamanho.', 'Seu cliente escolhe pelas fotos.']),
    (18.40, 21.35, ['Escolhe o dia e paga como quiser.']),
    (21.40, 23.62, ['E o pedido chega direto no seu painel.', 'Direto no seu painel.']),
    (23.70, 26.30, ['Sua marca em cada detalhe.']),
    (26.40, 28.6, ['Seus produtos valorizados.']),
    (28.70, 31.0, ['Sem comissão por pedido.']),
    (31.00, 35.0, ['Seu cardápio merece ser tão especial quanto seus produtos.', 'Um cardápio tão especial quanto seus produtos.']),
    (35.05, 37.35, ['Peça o seu agora mesmo.']),
    (37.42, 39.92, ['Entre em contato e transforme sua doceria.', 'Entre em contato.']),
]


def call(path, body=None, method=None):
    req = urllib.request.Request('https://api.elevenlabs.io' + path, method=method or ('POST' if body is not None else 'GET'),
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={'xi-api-key': KEY, 'content-type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def ensure_voice():
    mine = {v['voice_id'] for v in call('/v1/voices')['voices']}
    if VOICE not in mine and OWNER:
        call(f'/v1/voices/add/{OWNER}/{VOICE}', {'new_name': f'anuncio-{VOICE[:6]}'})


def tts(text, prev='', nxt='', speed=1.0):
    body = {'text': text, 'model_id': MODEL, 'previous_text': prev, 'next_text': nxt,
            'voice_settings': {'stability': 0.42, 'similarity_boost': 0.8, 'style': 0.3, 'use_speaker_boost': True, 'speed': speed}}
    d = call(f'/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128', body)
    return base64.b64decode(d['audio_base64']), d.get('alignment') or {}


def decode(mp3):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'pipe:0', '-f', 's16le', '-ac', '1', '-ar', str(SR), 'pipe:1'], input=mp3, capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype='<i2').astype(np.float32) / 32768


def trim(x, al):
    if al.get('character_end_times_seconds'):
        a = max(0.0, al['character_start_times_seconds'][0] - 0.04)
        b = al['character_end_times_seconds'][-1] + 0.14
        return x[int(a * SR):int(b * SR)]
    return x


ensure_voice()
if '--amostra' in sys.argv:
    mp3, _ = tts('Sua doceria ainda vende pelo cardápio tradicional? Transforme a experiência de compra dos seus clientes.')
    open(OUT, 'wb').write(mp3)
    print('amostra:', OUT)
    sys.exit()

track = np.zeros(int((DUR + 1) * SR))
report, prev_end, chosen = [], 0.0, []


def take(k, text, speed, prev, nxt):
    f = os.path.join(WORK, f'frase{k:02d}-{abs(hash(text)) % 10**6:06d}-v{speed:.2f}.mp3')
    if os.path.exists(f) and os.path.exists(f + '.json'):
        mp3, al = open(f, 'rb').read(), json.load(open(f + '.json'))
    else:
        mp3, al = tts(text, prev, nxt, speed)
        open(f, 'wb').write(mp3)
        json.dump(al, open(f + '.json', 'w'))
    x = trim(decode(mp3), al)
    return x, len(x) / SR, f


for k, (t0, t1, options) in enumerate(ROTEIRO):
    prev = chosen[-1] if chosen else ''
    nxt = ROTEIRO[k + 1][2][0] if k + 1 < len(ROTEIRO) else ''
    t0 = max(t0, prev_end + 0.12)
    room = t1 - t0
    pick = None
    for j, text in enumerate(options):
        x, length, f = take(k, text, 1.0, prev, nxt)
        if length > room:
            speed = round(min(1.06, length / room + 0.01), 2)
            x, length, f = take(k, text, speed, prev, nxt)
        else:
            speed = 1.0
        if length <= room or j == len(options) - 1:
            pick = (text, x, length, f, speed)
            break
    text, x, length, f, speed = pick
    if length > room:
        print(f'   ATENÇÃO: frase {k} cortada ({length:.2f}s em {room:.2f}s)', flush=True)
        x = x[:int(room * SR)]  # último recurso: nunca invade a frase seguinte
        x[-int(0.08 * SR):] *= np.linspace(1, 0, int(0.08 * SR))
        length = room
    chosen.append(text)
    i = int(t0 * SR)
    track[i:i + len(x)] += x
    prev_end = t0 + length
    report.append({'t': round(t0, 2), 'texto': text, 'dur': round(length, 2), 'cabe': round(room, 2), 'velocidade': speed, 'arquivo': os.path.basename(f)})
    print(f'{t0:5.2f}s  {length:.2f}s/{room:.2f}s  vel {speed:.2f}  {text}', flush=True)

track = track[:int(DUR * SR)]
track /= np.max(np.abs(track)) / 0.9
pcm = (track * 32767).astype('<i2').tobytes()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', OUT], input=pcm, check=True)
json.dump(report, open(os.path.join(WORK, 'narracao.json'), 'w'), ensure_ascii=False, indent=2)
print('narração:', OUT)
