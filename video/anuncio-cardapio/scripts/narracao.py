"""Narração por IA (pt-BR) alinhada às cenas do anúncio.
Voz: Chatterbox Multilingual (Resemble AI, licença MIT, com marca d'água inaudível de IA), com o timbre e o sotaque
de uma voz brasileira de referência gerada pelo Kokoro (licença Apache 2.0). Uso comercial permitido pelas duas licenças.
Cada frase é gerada em 3 tentativas; fica a que o Whisper transcreve igual ao roteiro e que cabe no tempo da cena.

Uso (no ambiente com chatterbox-tts, kokoro e faster-whisper):
  python narracao.py <pasta-de-trabalho> <saida.wav> [--voz pf_dora|pm_alex] [--duracao 40]
"""
import json
import os
import re
import sys
import unicodedata

import numpy as np
import soundfile as sf
import torch

WORK, OUT = sys.argv[1], sys.argv[2]
VOZ = sys.argv[sys.argv.index('--voz') + 1] if '--voz' in sys.argv else 'pf_dora'
DUR = float(sys.argv[sys.argv.index('--duracao') + 1]) if '--duracao' in sys.argv else 40.0
os.makedirs(WORK, exist_ok=True)
SR = 24000

# início de cada frase (s) e até quando ela pode ir, no tempo das cenas
ROTEIRO = [
    (0.30, 4.7, 'Sua doceria ainda vende pelo cardápio tradicional?'),
    (5.20, 12.6, 'Transforme a experiência de compra dos seus clientes com um cardápio digital totalmente personalizado.'),
    (13.10, 17.4, 'Seu cliente navega pelas categorias, vê as fotos e escolhe o tamanho.'),
    (18.50, 21.2, 'Escolhe o dia da encomenda e paga como quiser.'),
    (21.30, 23.3, 'E o pedido chega direto no seu painel.'),
    (23.40, 26.2, 'Sua marca em cada detalhe.'),
    (26.40, 28.5, 'Seus produtos valorizados.'),
    (28.70, 31.2, 'E pedidos direto para você, sem comissão.'),
    (31.20, 34.75, 'Seu cardápio merece ser tão especial quanto os seus produtos.'),
    (34.75, 37.5, 'Crie seu cardápio digital personalizado.'),
    (37.55, 39.85, 'Entre em contato e transforme sua doceria.'),
]


def norm(t):
    t = unicodedata.normalize('NFKD', t.lower())
    t = ''.join(c for c in t if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9 ]', '', t).split()


def wer(ref, hyp):
    r, h = norm(ref), norm(hyp)
    d = np.arange(len(h) + 1)
    for i, rw in enumerate(r, 1):
        prev, d[0] = d.copy(), i
        for j, hw in enumerate(h, 1):
            d[j] = min(prev[j] + 1, d[j - 1] + 1, prev[j - 1] + (rw != hw))
    return d[len(h)] / max(1, len(r))


def trim(x, thr=0.012):
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx):
        return x
    a, b = max(0, idx[0] - int(0.03 * SR)), min(len(x), idx[-1] + int(0.12 * SR))
    return x[a:b]


# 1. voz de referência brasileira (Kokoro)
ref = os.path.join(WORK, f'ref-{VOZ}.wav')
if not os.path.exists(ref):
    from kokoro import KPipeline
    kp = KPipeline(lang_code='p', repo_id='hexgrad/Kokoro-82M')
    txt = ('Oi! Que bom ter você por aqui. Hoje eu quero te mostrar uma novidade muito especial para a sua confeitaria, '
           'com bolos, doces e encomendas do jeitinho que os seus clientes gostam.')
    sf.write(ref, np.concatenate([a for _, _, a in kp(txt, voice=VOZ, speed=1.0)]), SR)

# 2. frases com o Chatterbox, conferidas pelo Whisper
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel

tts = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
asr = WhisperModel('small', device='cpu', compute_type='int8')
track = np.zeros(int(DUR * SR) + SR)
report = []
prev_end = 0.0
for k, (t0, t1, text) in enumerate(ROTEIRO):
    best = None
    for seed in (11, 23, 37):
        f = os.path.join(WORK, f'frase{k:02d}-s{seed}.wav')
        if not os.path.exists(f):
            torch.manual_seed(seed)
            w = tts.generate(text, language_id='pt', audio_prompt_path=ref, exaggeration=0.55, cfg_weight=0.45, temperature=0.7)
            sf.write(f, trim(w.squeeze().numpy()), SR)
        x, _ = sf.read(f)
        segs, info = asr.transcribe(f, beam_size=5, language='pt')
        heard = ' '.join(s.text.strip() for s in segs)
        e = wer(text, heard)
        length = len(x) / SR
        fits = length <= (t1 - t0)
        score = e * 10 + (0 if fits else (length - (t1 - t0)) * 2)
        if best is None or score < best[0]:
            best = (score, f, heard, e, length)
        if e == 0 and fits:
            break
    _, f, heard, e, length = best
    x, _ = sf.read(f)
    t0 = max(t0, prev_end + 0.08)  # nunca encosta na frase anterior
    room = t1 - t0
    rate = 1.0
    if length > room:  # acelera de leve (no máximo 12%) para caber
        rate = min(1.12, length / room)
        import librosa
        x = librosa.effects.time_stretch(x.astype(np.float32), rate=rate)  # mantém o tom da voz
    i = int(t0 * SR)
    track[i:i + len(x)] += x[: len(track) - i]
    prev_end = t0 + len(x) / SR
    report.append({'t': t0, 'texto': text, 'ouvido': heard, 'erro': round(e, 3), 'dur': round(length / rate, 2), 'cabe': round(room, 2), 'acelerado': round(rate, 3), 'arquivo': os.path.basename(f)})
    print(f'{t0:5.2f}s  erro {e:.2f}  {length:.2f}s/{room:.2f}s  {heard}', flush=True)

track = track[: int(DUR * SR)]
track /= np.max(np.abs(track)) / 0.9
sf.write(OUT, track, SR)
json.dump(report, open(os.path.join(WORK, 'narracao.json'), 'w'), ensure_ascii=False, indent=2)
print('narração:', OUT)
