"""Narração de uma variação com escolha da melhor gravação de cada frase.

Para cada frase gera 2 gravações no ElevenLabs (sementes diferentes, mesmo contexto) e escolhe a melhor por:
  - reconhecimento de fala (Whisper): a frase ouvida tem de bater com o texto;
  - entonação: variação de altura (voz monótona perde pontos);
  - ritmo: velocidade perto do alvo e sem pausa longa no meio da frase.
Se nenhuma das duas bater com o texto, gera uma terceira. O relatório da escolha fica em escolha.json.

Lê <pasta>/roteiro.json e grava em <trabalho>: narracao.wav, legendas.json, narracao-relatorio.json, escolha.json.
Roda no ambiente com faster-whisper e librosa. Chave: ELEVENLABS_API_KEY ou ELEVEN_HDR.
Uso: python3 narrar2.py <pasta-da-variacao> <pasta-de-trabalho>
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import unicodedata
import urllib.request

import librosa
import numpy as np
from faster_whisper import WhisperModel

VID, WORK = sys.argv[1], sys.argv[2]
os.makedirs(WORK, exist_ok=True)
CFG = json.load(open(os.path.join(VID, 'roteiro.json')))
SR = 44100
KEY = os.environ.get('ELEVENLABS_API_KEY') or open(os.environ['ELEVEN_HDR']).read().split(':', 1)[1].strip()
MODEL = CFG.get('modelo', 'eleven_multilingual_v2')
SPEED = CFG.get('velocidade', 1.0)
ALVO = CFG.get('ritmo_alvo', 2.7)  # palavras por segundo
WM = WhisperModel('small', device='cpu', compute_type='int8')

NUM = {'0': 'zero', '1': 'um', '2': 'dois', '3': 'tres', '4': 'quatro', '5': 'cinco', '6': 'seis', '7': 'sete', '8': 'oito', '9': 'nove',
       '10': 'dez', '12': 'doze', '15': 'quinze', '18': 'dezoito', '30': 'trinta', '100': 'cem'}


def canon(t):
    t = unicodedata.normalize('NFKD', t.lower())
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = t.replace('%', ' por cento ')
    t = re.sub(r'(\d+)h', r'\1 ', t)
    t = re.sub(r'\d+', lambda m: ' ' + NUM.get(m.group(0), m.group(0)) + ' ', t)
    t = re.sub(r'[^a-z ]', ' ', t)
    t = re.sub(r'\bem comenda', 'encomenda', t)
    t = re.sub(r'\biora\b', 'e hora', t)
    t = re.sub(r'\bpra\b', 'para', t)
    t = re.sub(r'\bpro\b', 'para o', t)
    t = re.sub(r'\bta\b', 'esta', t)
    t = re.sub(r'\btao\b', 'estao', t)
    return t.split()


def wer(ref, hyp):
    d = list(range(len(hyp) + 1))
    for i, x in enumerate(ref, 1):
        prev, d[0] = d[0], i
        for j, y in enumerate(hyp, 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (x != y))
            prev, d[j] = d[j], cur
    return d[len(hyp)] / max(1, len(ref))


def call_tts(text, prev, nxt, seed, voz=None, ajustes=None, speed=None):
    voz, ajustes, speed = voz or CFG['voz'], ajustes or CFG['ajustes'], speed or SPEED
    key = hashlib.sha1(json.dumps([voz, ajustes, text, prev, nxt, speed, MODEL, seed]).encode()).hexdigest()[:16]
    f = os.path.join(WORK, f'take-{key}.json')
    if not os.path.exists(f):
        body = {'text': text, 'model_id': MODEL, 'previous_text': prev, 'next_text': nxt, 'seed': seed,
                'voice_settings': {**ajustes, 'use_speaker_boost': True, 'speed': speed}}
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voz}/with-timestamps?output_format=mp3_44100_128",
                                     data=json.dumps(body).encode(), headers={'xi-api-key': KEY, 'content-type': 'application/json'})
        with urllib.request.urlopen(req, timeout=180) as r:
            d = json.loads(r.read())
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


def avaliar(text, x, words):
    tmp = os.path.join(WORK, 'avaliar.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', '-ar', '16000', tmp],
                   input=x.astype('<f4').tobytes(), check=True)
    heard = ' '.join(s.text.strip() for s in WM.transcribe(tmp, beam_size=5, language='pt')[0])
    w = wer(canon(text), canon(heard))
    y, sr = librosa.load(tmp, sr=16000)
    f0, _, _ = librosa.pyin(y, fmin=65, fmax=420, sr=sr, frame_length=1024)
    f0 = f0[~np.isnan(f0)]
    var = float(np.std(12 * np.log2(f0 / np.median(f0)))) if len(f0) > 10 else 0.0
    dur = max(0.3, words[-1]['e'] - words[0]['s'])
    rate = len(canon(text)) / dur
    gaps = [b['s'] - a['e'] for a, b in zip(words, words[1:]) if not re.search(r'[.,:;?!…]$', a['w'])]
    maxgap = max(gaps) if gaps else 0.0
    nota = w * 10 + max(0, maxgap - 0.45) * 4 + max(0, 2.2 - var) * 1.0 + abs(rate - ALVO) * 0.5
    return {'ouvido': heard, 'erro_palavras': round(w, 3), 'variacao_st': round(var, 2), 'ritmo': round(rate, 2), 'maior_pausa': round(maxgap, 2), 'nota': round(nota, 3)}


falas = CFG['falas']
chosen, takes, escolha, t = [], [], [], 0.0
for k, f in enumerate(falas):
    text = f['texto']
    voz = f.get('voz', CFG['voz'])
    same = [falas[j]['texto'] for j in range(k) if falas[j].get('voz', CFG['voz']) == voz]
    prev = ' '.join(same[-2:])
    nxt = falas[k + 1]['texto'] if k + 1 < len(falas) and falas[k + 1].get('voz', CFG['voz']) == voz else ''
    cands = []
    for seed in (101, 202, 303):
        if seed == 303 and min(c[2]['erro_palavras'] for c in cands) <= 0.08:
            break
        x, words = call_tts(text, prev, nxt, seed, voz, f.get('ajustes'), f.get('velocidade'))
        ev = avaliar(text, x, words)
        cands.append((x, words, ev, seed))
    best = min(cands, key=lambda c: c[2]['nota'])
    x, words, ev, seed = best
    t = max(f.get('inicio_min', 0.0), t + (f.get('pausa', 0.28) if k else 0.25))
    takes.append((t, text, x, words))
    chosen.append(text)
    escolha.append({'frase': k, 'texto': text, 'escolhida': seed, 'gravacoes': [{'semente': c[3], **c[2]} for c in cands]})
    print(f"{t:5.2f}s  [{seed}] nota {ev['nota']:.2f} erro {ev['erro_palavras']:.2f} var {ev['variacao_st']:.1f}st ritmo {ev['ritmo']:.2f}  {text}", flush=True)
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

# legendas: trechos falados por extenso aparecem como número/sigla ("trinta por cento" -> "30%")
def strip(w):
    return re.sub(r'[^\wÀ-ú]', '', w).lower()
for src, dst in CFG.get('legenda', {}).items():
    pat = [strip(p) for p in src.split()]
    i = 0
    while i <= len(legendas) - len(pat):
        seg = legendas[i:i + len(pat)]
        if all(s['frase'] == seg[0]['frase'] for s in seg) and [strip(s['w']) for s in seg] == pat:
            tail = re.sub(r'^.*?([.,:;?!…]*)$', r'\1', seg[-1]['w'])
            legendas[i:i + len(pat)] = [{'w': dst + tail, 's': seg[0]['s'], 'e': seg[-1]['e'], 'frase': seg[0]['frase']}]
        i += 1

track = track[:int(D * SR)]
track /= np.max(np.abs(track)) / 0.9
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', os.path.join(WORK, 'narracao.wav')],
               input=(track * 32767).astype('<i2').tobytes(), check=True)
json.dump(legendas, open(os.path.join(WORK, 'legendas.json'), 'w'), ensure_ascii=False)
json.dump({'duracao': D, 'falas': report}, open(os.path.join(WORK, 'narracao-relatorio.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(escolha, open(os.path.join(WORK, 'escolha.json'), 'w'), ensure_ascii=False, indent=1)
print('duração', D, 's ·', os.path.join(WORK, 'narracao.wav'))
