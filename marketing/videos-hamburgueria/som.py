"""Trilha original e efeitos sonoros dos vídeos, sintetizados aqui (numpy), e mixagem final.

Para cada vídeo: lê <id>.cues.json (gerado pelo render), compõe a trilha no estilo do roteiro
(funk, trap, house, pop, lofi, boombap), com tom e padrões variando por vídeo, põe cada efeito no
instante exato da marca da animação, mixa, normaliza para -14 LUFS (pico real -1,5 dBTP) e junta ao vídeo.
Também exporta o recorte 4:5 (1080x1350) para o feed.

Uso: python3 som.py <pasta-render> <pasta-final> V01 V02 ...
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
AQUI = Path(__file__).resolve().parent


# ------------------------------------------------------------------ utilidades
def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tempo(d):
    return np.arange(int(d * SR)) / SR


def filtro(x, lo=None, hi=None, ordem=2):
    if len(x) < 8:
        return x
    n = 1 << int(np.ceil(np.log2(len(x) + 256)))
    X = np.fft.rfft(x, n)
    f = np.fft.rfftfreq(n, 1 / SR)
    H = np.ones_like(f)
    if hi:
        H /= np.sqrt(1 + (f / hi) ** (2 * ordem))
    if lo:
        H /= np.sqrt(1 + (lo / np.maximum(f, 1e-6)) ** (2 * ordem))
    return np.fft.irfft(X * H, n)[: len(x)]


def filtro_var(x, centros, larg=1.2):
    """passa-faixa que anda no tempo (centros: frequência por amostra), por sobreposição de janelas"""
    N, hop = 2048, 512
    y = np.zeros(len(x) + N)
    w = np.hanning(N)
    f = np.fft.rfftfreq(N, 1 / SR)
    xp = np.concatenate([x, np.zeros(N)])
    for i in range(0, len(x), hop):
        c = centros[min(i + N // 2, len(centros) - 1)]
        H = np.exp(-0.5 * (np.log2(np.maximum(f, 1) / c) / larg) ** 2)
        y[i:i + N] += np.fft.irfft(np.fft.rfft(xp[i:i + N] * w) * H, N) * w
    return y[: len(x)] / 1.5


def serra(f, t, fase=0.0):
    ph = (f * t + fase) % 1.0
    dt = f / SR
    y = 2 * ph - 1
    a = ph < dt
    b = ph > 1 - dt
    t1 = ph[a] / dt
    y[a] -= t1 + t1 - t1 * t1 - 1
    t2 = (ph[b] - 1) / dt
    y[b] -= t2 * t2 + t2 + t2 + 1
    return y


def quadrada(f, t):
    return serra(f, t) - serra(f, t, 0.5)


def env(n, a=0.005, d=0.1, s=0.0, r=0.05, dur=None):
    t = np.arange(n) / SR
    dur = dur if dur is not None else n / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((t - dur) / max(r, 1e-4), 0, 1)
    return e * (1 - rel)


def coloca(buf, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0:
        return
    j = min(len(buf), i + len(x))
    s = max(0, -i)
    buf[max(0, i):j] += x[s:j - i] * g


def db(v):
    return 10 ** (v / 20)


# ------------------------------------------------------------------ instrumentos
class Kit:
    def __init__(self, rng, caract):
        self.rng = rng
        self.c = caract

    def bumbo(self, forte=1.0):
        t = tempo(0.45)
        f = self.c.get('kick_f', 48) + 110 * np.exp(-t * 32)
        ph = 2 * np.pi * np.cumsum(f) / SR
        x = np.sin(ph) * np.exp(-t * self.c.get('kick_d', 7.5))
        x += filtro(self.rng.standard_normal(len(t)), lo=2500) * np.exp(-t * 180) * 0.25
        return np.tanh(x * 1.6) * forte

    def caixa(self, forte=1.0):
        t = tempo(0.3)
        n = filtro(self.rng.standard_normal(len(t)), lo=900, hi=9000) * np.exp(-t * self.c.get('snare_d', 17))
        tom = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28)
        return (n * 0.8 + tom * 0.5) * forte

    def palma(self, forte=1.0):
        t = tempo(0.35)
        n = filtro(self.rng.standard_normal(len(t)), lo=900, hi=5000)
        e = np.zeros(len(t))
        for k, a in enumerate([0, 0.011, 0.022]):
            e += np.where(t >= a, np.exp(-(t - a) * (160 if k < 2 else 14)), 0)
        return n * e * 0.9 * forte

    def chimbal(self, aberto=False, forte=1.0):
        t = tempo(0.5 if aberto else 0.09)
        n = filtro(self.rng.standard_normal(len(t)), lo=7000)
        return n * np.exp(-t * (11 if aberto else 70)) * 0.45 * forte

    def prato(self, forte=1.0):
        t = tempo(2.2)
        n = filtro(self.rng.standard_normal(len(t)), lo=4500)
        return n * np.exp(-t * 2.2) * 0.4 * forte

    def chocalho(self, forte=1.0):
        t = tempo(0.12)
        n = filtro(self.rng.standard_normal(len(t)), lo=5000, hi=12000)
        return n * np.sin(np.pi * np.clip(t / 0.12, 0, 1)) * 0.25 * forte


def baixo(m, dur, tipo='saw', brilho=700):
    t = tempo(dur + 0.08)
    f = hz(m)
    if tipo == '808':
        fe = f * (1 + 0.6 * np.exp(-t * 40))
        x = np.sin(2 * np.pi * np.cumsum(fe) / SR)
        x = np.tanh(x * 2.2) * 0.8 * env(len(t), 0.003, dur * 1.2, 0, 0.06, dur)
        return x
    if tipo == 'sub':
        return np.sin(2 * np.pi * f * t) * env(len(t), 0.01, 0.4, 0.6, 0.06, dur)
    x = serra(f, t) * 0.7 + np.sin(2 * np.pi * f * t) * 0.6
    x = filtro(x, hi=brilho)
    return x * env(len(t), 0.004, 0.25, 0.45, 0.05, dur)


def pluck(m, dur, forma='saw', brilho=3000):
    t = tempo(dur + 0.25)
    f = hz(m)
    o = serra(f, t) if forma == 'saw' else quadrada(f, t) * 0.7
    claro = filtro(o, hi=brilho) * np.exp(-t * 14)
    escuro = filtro(o, hi=brilho / 4) * np.exp(-t * 5)
    return (claro + escuro * 0.8) * env(len(t), 0.002, 1.0, 1.0, 0.12, dur)


def rhodes(m, dur, vel=1.0):
    t = tempo(dur + 0.6)
    f = hz(m)
    idx = 1.8 * np.exp(-t * 3) + 0.2
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    x += 0.15 * np.sin(2 * np.pi * f * 7 * t) * np.exp(-t * 18)
    x *= 1 + 0.08 * np.sin(2 * np.pi * 4.5 * t)
    return x * env(len(t), 0.004, 1.6, 0.25, 0.4, dur) * 0.5 * vel


def sino(m, dur):
    t = tempo(dur + 0.8)
    f = hz(m)
    x = np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t * 6) * np.sin(2 * np.pi * f * 3.5 * t))
    return x * np.exp(-t * 3.2) * 0.45


def pad(ms, dur, brilho=1600):
    t = tempo(dur + 0.4)
    x = np.zeros(len(t))
    for m in ms:
        for d in (-0.08, 0.0, 0.08):
            x += serra(hz(m + d), t, np.random.rand())
    x = filtro(x / (len(ms) * 3), hi=brilho)
    return x * env(len(t), 0.25, 1.0, 1.0, 0.35, dur)


def estrofe(ms, dur, brilho=2200):
    t = tempo(dur + 0.15)
    x = np.zeros(len(t))
    for m in ms:
        x += serra(hz(m), t) + serra(hz(m + 0.1), t)
    x = filtro(x / (len(ms) * 2), hi=brilho)
    return x * env(len(t), 0.003, 0.12, 0.2, 0.08, dur)


# ------------------------------------------------------------------ estilos
PROG = {
    'funk': [[(50, [62, 65, 69, 72, 76]), (55, [59, 62, 65, 69])], [(45, [57, 60, 64, 67]), (50, [62, 65, 69, 72])]],
    'trap': [[(48, [60, 63, 67]), (44, [56, 60, 63]), (46, [58, 62, 65]), (43, [55, 59, 62])], [(45, [57, 60, 64]), (41, [53, 57, 60]), (43, [55, 59, 62]), (40, [52, 55, 59])]],
    'house': [[(45, [57, 60, 64, 67]), (41, [53, 57, 60, 64]), (48, [55, 60, 64]), (43, [55, 59, 62])], [(50, [57, 62, 65, 69]), (46, [58, 62, 65, 69]), (48, [60, 64, 67]), (45, [57, 61, 64])]],
    'pop': [[(40, [56, 59, 64]), (47, [54, 59, 63]), (49, [56, 61, 64]), (45, [57, 61, 64])], [(43, [55, 59, 62]), (38, [54, 57, 62]), (40, [52, 55, 59]), (36, [52, 55, 60])]],
    'lofi': [[(41, [53, 57, 60, 64]), (40, [52, 55, 59, 62]), (38, [50, 53, 57, 60]), (36, [52, 55, 59, 60])], [(43, [55, 59, 62, 65]), (45, [57, 60, 64, 67]), (41, [53, 57, 60, 64]), (40, [52, 56, 59, 62])]],
    'boombap': [[(45, [57, 60, 64]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])], [(50, [57, 62, 65]), (50, [57, 62, 65]), (46, [58, 62, 65]), (45, [57, 61, 64])]],
}
BPM = {'funk': 104, 'trap': 140, 'house': 124, 'pop': 116, 'lofi': 84, 'boombap': 92}


def trilha(estilo, D, seed, t_cta):
    rng = np.random.default_rng(seed)
    np.random.seed(seed)
    bpm = BPM[estilo] + int(rng.integers(-3, 4))
    beat = 60 / bpm
    bar = 4 * beat
    s16 = beat / 4
    tr = int(rng.integers(-2, 3))
    prog = PROG[estilo][int(rng.integers(0, len(PROG[estilo])))]
    N = int((D + 1.2) * SR)
    st = {k: np.zeros(N) for k in ('dr', 'bs', 'ch', 'ld', 'pd', 'fx')}
    kit = Kit(rng, {'kick_f': 44 if estilo in ('trap', 'house') else 50, 'kick_d': 5 if estilo == 'trap' else 7.5})
    nbar = int(np.ceil((D + 0.6) / bar)) + 1
    swing = {'lofi': 0.14, 'boombap': 0.1}.get(estilo, 0.0)

    def st16(k):
        return k * s16 + (swing * beat if k % 2 == 1 else 0)

    for b in range(nbar):
        t0 = b * bar
        raiz, acorde = prog[b % len(prog)]
        raiz += tr
        acorde = [m + tr for m in acorde]
        cta = t0 >= t_cta - 0.05
        if estilo == 'funk':
            for k in (0, 7, 10):
                coloca(st['dr'], kit.bumbo(), t0 + st16(k))
            for k in (4, 12):
                coloca(st['dr'], kit.caixa(), t0 + st16(k))
            coloca(st['dr'], kit.caixa(0.25), t0 + st16(14))
            for k in range(16):
                coloca(st['dr'], kit.chimbal(k == 14, 1.0 if k % 2 == 0 else 0.55), t0 + st16(k))
            for k, iv, d in ((0, 0, 3), (3, 12, 1), (6, 0, 2), (10, 7, 1), (12, 10, 1), (14, 12, 1)):
                coloca(st['bs'], baixo(raiz + iv, d * s16, brilho=900), t0 + st16(k))
            for k in (2, 6, 10, 14):
                coloca(st['ch'], estrofe(acorde[1:4], s16 * 0.8, 2600), t0 + st16(k), 0.5)
            coloca(st['pd'], pad(acorde, bar, 1200), t0, 0.35)
        elif estilo == 'trap':
            for k in ([0, 10] if b % 2 == 0 else [0, 3, 10]):
                coloca(st['dr'], kit.bumbo(0.9), t0 + st16(k))
                coloca(st['bs'], baixo(raiz - 12 + 12, 4 * s16 if k == 0 else 2 * s16, '808'), t0 + st16(k), 0.9)
            coloca(st['dr'], kit.palma(), t0 + st16(8))
            coloca(st['dr'], kit.caixa(0.6), t0 + st16(8))
            k = 0
            while k < 16:
                if rng.random() < 0.18 and k % 4 == 2:
                    for r in range(4):
                        coloca(st['dr'], kit.chimbal(False, 0.6), t0 + k * s16 + r * s16 / 2)
                    k += 2
                else:
                    coloca(st['dr'], kit.chimbal(False, 0.8 if k % 4 == 0 else 0.6), t0 + k * s16)
                    k += 2
            mel = [acorde[0] + 12, acorde[2] + 12, acorde[1] + 12, acorde[2] + 12, acorde[0] + 24, acorde[2] + 12, acorde[1] + 12, acorde[0] + 12]
            for i, m in enumerate(mel):
                if rng.random() < 0.8:
                    coloca(st['ld'], sino(m, 2 * s16), t0 + i * 2 * s16, 0.35)
            coloca(st['pd'], pad([acorde[0], acorde[2]], bar, 900), t0, 0.3)
        elif estilo == 'house':
            for k in (0, 4, 8, 12):
                coloca(st['dr'], kit.bumbo(), t0 + st16(k))
            for k in (4, 12):
                coloca(st['dr'], kit.palma(0.8), t0 + st16(k))
            for k in range(16):
                coloca(st['dr'], kit.chimbal(k % 4 == 2, 0.7 if k % 4 == 2 else 0.35), t0 + st16(k))
            for k in (2, 6, 10, 14):
                coloca(st['bs'], baixo(raiz, 1.6 * s16, brilho=600), t0 + st16(k))
            for k in (3, 6, 11):
                coloca(st['ch'], estrofe(acorde, s16 * 1.1, 3000), t0 + st16(k), 0.55)
            coloca(st['pd'], pad(acorde, bar, 1800), t0, 0.3)
        elif estilo == 'pop':
            for k in (0, 7, 8):
                coloca(st['dr'], kit.bumbo(), t0 + st16(k))
            for k in (4, 12):
                coloca(st['dr'], kit.caixa(0.8), t0 + st16(k))
                coloca(st['dr'], kit.palma(0.6), t0 + st16(k))
            for k in range(0, 16, 2):
                coloca(st['dr'], kit.chimbal(False, 0.6), t0 + st16(k))
            for k in range(0, 16, 2):
                coloca(st['bs'], baixo(raiz, 1.8 * s16, brilho=800), t0 + st16(k), 0.9)
            arp = acorde + [acorde[0] + 12]
            for k in range(16):
                coloca(st['ld'], pluck(arp[k % len(arp)] + 12, s16 * 0.9, 'square', 3500), t0 + st16(k), 0.28)
            coloca(st['pd'], pad(acorde, bar, 2000), t0, 0.3)
        elif estilo == 'lofi':
            for k in (0, 9):
                coloca(st['dr'], kit.bumbo(0.8), t0 + st16(k))
            for k in (4, 12):
                coloca(st['dr'], kit.caixa(0.55), t0 + st16(k))
            for k in range(0, 16, 2):
                coloca(st['dr'], kit.chimbal(False, 0.4), t0 + st16(k))
            for i, m in enumerate(acorde):
                coloca(st['ch'], rhodes(m, bar * 0.95), t0 + i * 0.025, 0.55)
            coloca(st['bs'], baixo(raiz, 2.5 * beat, 'sub'), t0, 0.7)
            coloca(st['bs'], baixo(raiz + 7, beat, 'sub'), t0 + st16(10), 0.5)
        elif estilo == 'boombap':
            for k in (0, 7, 10):
                coloca(st['dr'], kit.bumbo(), t0 + st16(k))
            for k in (4, 12):
                coloca(st['dr'], kit.caixa(), t0 + st16(k))
            for k in range(0, 16, 2):
                coloca(st['dr'], kit.chimbal(False, 0.55), t0 + st16(k))
            for k in (0, 7, 10):
                coloca(st['bs'], baixo(raiz, 2 * s16, brilho=500), t0 + st16(k))
            for k in (0, 6):
                for i, m in enumerate(acorde):
                    coloca(st['ch'], rhodes(m + 12, 3 * s16, 0.9), t0 + st16(k) + i * 0.012, 0.45)
        if cta and b * bar < t_cta + bar:
            pass
    # prato e impacto no começo e na chamada final
    for tt in (0.0, t_cta):
        coloca(st['fx'], kit.prato(), tt, 0.6)
    # textura
    if estilo == 'lofi':
        cr = np.zeros(N)
        idx = rng.integers(0, N, int(N / SR * 30))
        cr[idx] = rng.uniform(-0.5, 0.5, len(idx))
        st['fx'] += filtro(cr, lo=1500) * 0.6 + filtro(rng.standard_normal(N), hi=300) * 0.01
    ganhos = {'dr': 0.9, 'bs': 0.8, 'ch': 0.55, 'ld': 0.6, 'pd': 0.5, 'fx': 0.7}
    mix = sum(st[k] * g for k, g in ganhos.items())
    if estilo == 'house':   # bombeamento pelo bumbo
        t = np.arange(N) / SR
        fase = (t % beat) / beat
        mix = st['dr'] * 0.9 + (mix - st['dr'] * 0.9) * (0.55 + 0.45 * np.clip(fase / 0.35, 0, 1))
    if estilo == 'lofi':
        mix = filtro(mix, hi=6500)
    # final: fade nos últimos 0,5 s
    t = np.arange(N) / SR
    mix *= np.clip((D + 0.5 - t) / 0.7, 0, 1)
    mix = np.tanh(mix * 1.3) / 1.3
    return mix[: int((D + 0.4) * SR)]


# ------------------------------------------------------------------ efeitos
def sfx(tipo, rng):
    def ruido(d):
        return rng.standard_normal(int(d * SR))
    if tipo == 'tick':
        t = tempo(0.03)
        return (np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 300) + filtro(ruido(0.03), lo=3000) * np.exp(-t * 400) * 0.3) * db(-19)
    if tipo == 'pop':
        t = tempo(0.12)
        f = 280 + 700 * np.exp(-t * 60)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * db(-11)
    if tipo == 'tap':
        t = tempo(0.06)
        return (filtro(ruido(0.06), lo=1500, hi=6000) * np.exp(-t * 220) + np.sin(2 * np.pi * 1300 * t) * np.exp(-t * 120) * 0.5) * db(-11)
    if tipo in ('whoosh', 'swipe', 'send', 'zoom'):
        d = {'whoosh': 0.45, 'swipe': 0.3, 'send': 0.28, 'zoom': 0.5}[tipo]
        n = ruido(d)
        t = tempo(d)
        sobe = tipo in ('zoom', 'send')
        c = np.geomspace(500, 5000, len(n)) if sobe else np.geomspace(3500, 600, len(n))
        x = filtro_var(n, c, 1.0) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
        return x / (np.abs(x).max() + 1e-9) * db({'whoosh': -12, 'swipe': -17, 'send': -16, 'zoom': -16}[tipo])
    if tipo == 'impact':
        t = tempo(0.9)
        f = 32 + 70 * np.exp(-t * 9)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
        x += filtro(ruido(0.9), hi=2500) * np.exp(-t * 14) * 0.5
        return np.tanh(x * 1.8) * db(-6)
    if tipo == 'ding':
        t = tempo(1.2)
        x = np.sin(2 * np.pi * 1318 * t + 1.6 * np.exp(-t * 5) * np.sin(2 * np.pi * 1318 * 2.0 * t)) * np.exp(-t * 4.5)
        x += 0.5 * np.sin(2 * np.pi * 1976 * t) * np.exp(-t * 6)
        return x * db(-12)
    if tipo == 'success':
        t = tempo(0.9)
        x = np.sin(2 * np.pi * 1047 * t) * np.exp(-t * 7)
        t2 = tempo(0.9)
        y = np.zeros(len(t))
        y[int(0.09 * SR):] = (np.sin(2 * np.pi * 1568 * t2) * np.exp(-t2 * 6))[: len(t) - int(0.09 * SR)]
        return (x + y) * db(-14)
    if tipo == 'bubble':
        t = tempo(0.1)
        f = 420 + 650 * (t / 0.1)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.1) * db(-13)
    if tipo in ('stamp', 'slap'):
        t = tempo(0.35)
        x = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-t * 40)) / SR) * np.exp(-t * 16)
        x += filtro(ruido(0.35), lo=600, hi=4000) * np.exp(-t * (40 if tipo == 'slap' else 25)) * (0.9 if tipo == 'slap' else 0.5)
        return np.tanh(x * 1.5) * db(-8 if tipo == 'stamp' else -9)
    if tipo == 'scribble':
        t = tempo(0.3)
        mod = 0.5 + 0.5 * np.sin(2 * np.pi * 22 * t + 3 * np.sin(2 * np.pi * 7 * t))
        return filtro(ruido(0.3), lo=1800, hi=7000) * mod * np.sin(np.pi * t / 0.3) * db(-17)
    if tipo == 'count':
        out = np.zeros(int(1.0 * SR))
        for k, tt in enumerate(np.arange(0, 0.95, 0.055)):
            tk = tempo(0.02)
            coloca(out, np.sin(2 * np.pi * (1400 + k * 60) * tk) * np.exp(-tk * 250), tt)
        return out * db(-20)
    if tipo == 'cash':
        t = tempo(1.0)
        x = (np.sin(2 * np.pi * 2093 * t) + 0.7 * np.sin(2 * np.pi * 2637 * t)) * np.exp(-t * 6)
        x += filtro(ruido(1.0), lo=4000) * np.exp(-t * 25) * 0.4
        return x * db(-14)
    if tipo == 'type':
        t = tempo(0.04)
        return filtro(ruido(0.04), lo=2000, hi=8000) * np.exp(-t * 200) * db(-20)
    if tipo == 'riser':
        d = 0.9
        n = ruido(d)
        t = tempo(d)
        x = filtro_var(n, np.geomspace(400, 7000, len(n)), 0.8) * (t / d) ** 2
        return x / (np.abs(x).max() + 1e-9) * db(-15)
    if tipo == 'flip':
        out = np.zeros(int(0.25 * SR))
        for tt in (0, 0.07):
            tk = tempo(0.05)
            coloca(out, filtro(ruido(0.05), lo=800, hi=5000) * np.exp(-tk * 120), tt)
        return out * db(-10)
    return np.zeros(10)


# ------------------------------------------------------------------ mixagem
def grava_wav(path, x):
    x = np.clip(x, -1, 1)
    est = np.stack([x[0], x[1]], axis=1) if x.ndim == 2 else np.stack([x, x], axis=1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((est * 32767).astype('<i2').tobytes())


def loudnorm(entrada, saida):
    med = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(entrada), '-af', 'loudnorm=I=-14:TP=-2:LRA=11:print_format=json', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    j = json.loads(med[med.rindex('{'):med.rindex('}') + 1])
    af = (f"loudnorm=I=-14:TP=-2:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.70:level=false:attack=1:release=50")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(entrada), '-af', af, '-ar', '48000', str(saida)], check=True)
    return j


def processa(vid, pasta, final):
    rot = json.loads((AQUI / 'roteiros' / f'{vid}.json').read_text())
    cues = json.loads((pasta / f'{vid}.cues.json').read_text())
    D = cues['duracao']
    cta = [c for c in cues['cenas'] if c['tipo'] == 'cta']
    t_cta = cta[-1]['t0'] if cta else D - 3
    seed = int(vid[1:]) * 7919
    musica = trilha(rot['musica'], D, seed, t_cta)
    rng = np.random.default_rng(seed + 1)
    fx = np.zeros(len(musica))
    usados = {}
    for c in cues['cues']:
        # evita amontoar o mesmo som (ex.: tique de palavras muito próximas)
        if c['tipo'] in usados and c['t'] - usados[c['tipo']] < (0.06 if c['tipo'] in ('tick', 'type') else 0.12):
            continue
        usados[c['tipo']] = c['t']
        coloca(fx, sfx(c['tipo'], rng), c['t'])
    coloca(fx, sfx('impact', rng) * 0.6, 0.0)
    # abaixa a trilha um pouco sob os impactos
    env_fx = np.convolve(np.abs(fx), np.ones(2400) / 2400, mode='same')
    duck = 1 - 0.35 * np.clip(env_fx / 0.05, 0, 1)
    mix = musica * db(-6) * duck + fx
    atraso = np.concatenate([np.zeros(240), musica[:-240]]) * db(-6) * 0.12
    esq = mix + atraso
    dir_ = mix - atraso
    est = np.stack([esq, dir_])
    est /= max(1e-9, np.abs(est).max()) / db(-3)
    bruto = final / f'{vid}.bruto.wav'
    grava_wav(bruto, est)
    norm = final / f'{vid}.wav'
    j = loudnorm(bruto, norm)
    bruto.unlink()
    out = final / f'{vid}-9x16.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(pasta / f'{vid}.mudo.mp4'), '-i', str(norm), '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', str(out)], check=True)
    out45 = final / f'{vid}-4x5.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(out), '-vf', 'crop=1080:1350:0:220', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium',
                    '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', str(out45)], check=True)
    norm.unlink()
    return {'id': vid, 'lufs_entrada': j['input_i'], 'duracao': D}


if __name__ == '__main__':
    pasta, final = Path(sys.argv[1]), Path(sys.argv[2])
    final.mkdir(parents=True, exist_ok=True)
    for v in sys.argv[3:]:
        r = processa(v, pasta, final)
        print(v, f"{r['duracao']:.1f} s", 'ok')
