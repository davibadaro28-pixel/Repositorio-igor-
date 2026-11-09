"""Trilha original (sintetizada aqui, sem direitos de terceiros) e efeitos sonoros nas marcações da composição.
120 BPM, compasso de 2 s começando em 1,0 s, para as trocas de cena caírem no tempo forte (5, 13, 23, 31, 35, 37 s).
Com narração: os instrumentos abaixam sozinhos quando a voz entra (ver mixar.sh).
Uso: python3 trilha.py <cues.json> <saida.wav>
"""
import json
import sys
import wave

import numpy as np

SR = 48000
data = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
D = float(data['duration'])
N = int(SR * D)
mix = np.zeros((2, N))
send = np.zeros((2, N))  # envio para a reverberação
rng = np.random.default_rng(7)
BEAT = 0.5
BAR0 = 1.0


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def add(sig, t, gain=1.0, pan=0.0, rev=0.0):
    i = int(round(t * SR))
    if i >= N or i < 0:
        return
    sig = np.atleast_2d(sig)
    if sig.shape[0] == 1:
        th = (pan + 1) * np.pi / 4
        sig = np.vstack([sig[0] * np.cos(th), sig[0] * np.sin(th)]) * np.sqrt(2)
    n = min(sig.shape[1], N - i)
    mix[:, i:i + n] += sig[:, :n] * gain
    if rev:
        send[:, i:i + n] += sig[:, :n] * gain * rev


def filt(x, lo=None, hi=None, order=4):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo:
        m *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** order)
    if hi:
        m *= 1 / (1 + (f / hi) ** order)
    return np.fft.irfft(X * m, len(x))


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na) ** 1.5
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e


# ---------- harmonia (fá maior): um acorde por compasso ----------
CH = {
    'Dm9': [50, 53, 57, 60, 64], 'Bbmaj9': [46, 53, 57, 60, 62], 'Fmaj9': [53, 57, 60, 64, 67], 'C69': [48, 55, 60, 62, 64],
}
ROOT = {'Dm9': 38, 'Bbmaj9': 34, 'Fmaj9': 41, 'C69': 36}
PROG = ['Dm9', 'Bbmaj9', 'Dm9', 'Bbmaj9', 'Fmaj9', 'C69', 'Dm9', 'Bbmaj9', 'Fmaj9', 'C69', 'Dm9', 'Bbmaj9', 'Fmaj9', 'C69',
        'Bbmaj9', 'C69', 'Fmaj9', 'Fmaj9']


def chord_at(t):
    k = int((t - BAR0) // 2)
    return PROG[max(0, min(k, len(PROG) - 1))]


def section(t):
    if t < 5: return 'intro'
    if t < 13: return 'a'
    if t < 31: return 'b'
    if t < 35: return 'break'
    if t < 37: return 'final'
    return 'end'


def saw(f, dur, fc, det=(-7, 6), K=16):
    t = tt(dur)
    out = np.zeros_like(t)
    for d in det:
        ff = f * 2 ** (d / 1200)
        ph = rng.random() * 2 * np.pi
        for k in range(1, K + 1):
            if k * ff > 14000:
                break
            out += (1 / k) / (1 + (k * ff / fc) ** 2) * np.sin(2 * np.pi * k * ff * t + ph * k)
    return out / len(det)


# pad: acordes longos, mais fechado na abertura e na pausa, aberto nas cenas cheias
def pad():
    bars = [(-1.0, 'Dm9')] + [(BAR0 + 2 * k, c) for k, c in enumerate(PROG)] + [(37.0, 'Fmaj9')]
    for i, (t0, c) in enumerate(bars):
        dur = 2.6 if t0 < 37 else 2.6
        sec = section(max(t0, 0) + 0.1)
        fc = {'intro': 520, 'a': 1500, 'b': 2300, 'break': 1100, 'final': 2600, 'end': 2000}[sec]
        g = {'intro': 0.05, 'a': 0.045, 'b': 0.042, 'break': 0.06, 'final': 0.045, 'end': 0.06}[sec]
        for m in CH[c]:
            l = saw(mtof(m), dur, fc, det=(-9, 4))
            r = saw(mtof(m), dur, fc, det=(-4, 9))
            e = env_adsr(len(l), 0.35 if t0 > 0 else 1.6, 0.7)
            s = np.vstack([filt(l * e, lo=140), filt(r * e, lo=140)])
            st = max(t0, 0.0)
            if t0 < 0:
                s = s[:, int(-t0 * SR):]
            add(s, st, g, rev=0.35)


def pluck(f, dur=0.42):
    t = tt(dur)
    e = np.exp(-t / 0.12) * (1 - np.exp(-t / 0.002))
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.05) + 0.1 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.03)) * e


ARP = [0, 2, 4, 2, 3, 1, 4, 2, 0, 3, 4, 2, 1, 4, 3, 2]


def arp():
    t = 3.0
    step = BEAT / 4
    i = 0
    while t < 37.0:
        sec = section(t)
        g = {'intro': 0.05, 'a': 0.075, 'b': 0.085, 'break': 0.06, 'final': 0.09}[sec]
        if sec == 'intro':
            g *= (t - 3.0) / 2.0
        notes = sorted(CH[chord_at(t)])
        m = notes[ARP[i % 16] % len(notes)] + 24
        if ARP[i % 16] == 4 and sec in ('b', 'final'):
            m += 12
        acc = 1.0 if i % 4 == 0 else 0.72
        sig = pluck(mtof(m))
        if sec == 'break':
            sig = filt(sig, hi=2600)
        pan = 0.32 if i % 2 else -0.32
        add(sig, t, g * acc, pan=pan, rev=0.3)
        add(sig, t + 3 * step, g * acc * 0.32, pan=-pan, rev=0.2)  # eco
        t += step
        i += 1


def kick():
    t = tt(0.5)
    f = 46 + 115 * np.exp(-t / 0.032)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.17)
    click = filt(rng.standard_normal(len(t)), lo=2000) * np.exp(-t / 0.0025) * 0.25
    return np.tanh(1.8 * (s + click))


def clap():
    t = tt(0.35)
    n = filt(rng.standard_normal(len(t)), lo=900, hi=4200)
    e = sum(np.exp(-np.clip(t - d, 0, None) / 0.007) * (t >= d) for d in (0, 0.011, 0.023)) + 0.8 * np.exp(-t / 0.1)
    return n * e * 0.6


def hat(open_=False):
    t = tt(0.3 if open_ else 0.08)
    n = filt(rng.standard_normal(len(t)), lo=7000)
    return n * np.exp(-t / (0.09 if open_ else 0.018))


def bassnote(f, dur):
    t = tt(dur)
    e = env_adsr(len(t), 0.006, min(0.08, dur / 2))
    return np.tanh(1.4 * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t))) * e


KICK, CLAP = kick(), clap()
HC, HO = hat(), hat(True)
kicks = []


def drums_and_bass():
    t = 5.0
    while t < 37.0 - 1e-6:
        sec = section(t)
        b = round((t - BAR0) / BEAT) % 4  # tempo dentro do compasso
        if sec == 'a':
            if b in (0, 2):
                add(KICK, t, 0.8)
                kicks.append(t)
            if b in (1, 3):
                add(CLAP, t, 0.5, rev=0.15)
            add(HC, t + BEAT / 2, 0.12, pan=0.25)
            add(HC, t, 0.07, pan=-0.2)
            if b == 0:
                add(bassnote(mtof(ROOT[chord_at(t)]), 1.9), t, 0.22)
        elif sec in ('b', 'final'):
            add(KICK, t, 0.85)
            kicks.append(t)
            if b in (1, 3):
                add(CLAP, t, 0.52, rev=0.15)
            for k, g in ((0, 0.06), (1, 0.1), (2, 0.06), (3, 0.08)):
                add(HC, t + k * BEAT / 4, g, pan=0.25 if k % 2 else -0.2)
            add(HO, t + BEAT / 2, 0.07, pan=0.3)
            add(bassnote(mtof(ROOT[chord_at(t)]), 0.22), t + BEAT / 2, 0.36)
        t += BEAT
    # rufada antes da volta (34 → 35 s)
    for k in range(8):
        tk = 34.0 + k * 0.125
        add(CLAP, tk, 0.12 + 0.05 * k, rev=0.2)


# ---------- efeitos ----------
def bands_noise(dur, bands, weights_fn):
    t = tt(dur)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    for j, (lo, hi) in enumerate(bands):
        out += filt(n, lo=lo, hi=hi) * weights_fn(j, t / dur)
    return out


def whoosh(dur=0.7, up=True):
    bands = [(150, 700), (700, 2500), (2500, 9000)]
    def w(j, x):
        c = x if up else 1 - x
        return np.exp(-((c * 2.2 - j * 0.9) ** 2) * 2.2)
    s = bands_noise(dur, bands, w)
    x = tt(dur) / dur
    return s * np.sin(np.pi * np.clip(x, 0, 1)) ** 2.2


def riser(dur):
    t = tt(dur)
    x = t / dur
    bands = [(200, 800), (800, 2500), (2500, 6000), (6000, 12000)]
    s = bands_noise(dur, bands, lambda j, xx: np.exp(-((xx * 3.2 - j) ** 2) * 1.6)) * x ** 2
    f = 180 * 2 ** (x * 2.2)
    s += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) * x ** 3
    return s


def impact(v=1.0):
    t = tt(2.0)
    f = 38 + 30 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    nz = filt(rng.standard_normal(len(t)), hi=1800) * np.exp(-t / 0.12) * 0.5
    return np.tanh(1.5 * (boom + nz)) * v


def bell(f, dur=1.4, bright=1.0):
    t = tt(dur)
    s = np.zeros_like(t)
    for r, a, d in ((1, 1, 0.9), (2.0, 0.45 * bright, 0.35), (2.76, 0.3 * bright, 0.22), (5.4, 0.12 * bright, 0.09)):
        s += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d)
    return s * (1 - np.exp(-t / 0.002))


def tap_snd():
    t = tt(0.06)
    return (np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.005) + 0.5 * filt(rng.standard_normal(len(t)), lo=3000) * np.exp(-t / 0.003)
            + 0.45 * np.sin(2 * np.pi * 520 * t) * np.exp(-t / 0.012))


def pop_snd():
    t = tt(0.09)
    f = 360 + 620 * (t / 0.09) ** 0.6
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03) * (1 - np.exp(-t / 0.002))


def blip():
    t = tt(0.25)
    return (np.sin(2 * np.pi * 1318 * t) + 0.25 * np.sin(2 * np.pi * 2636 * t)) * np.exp(-t / 0.06) * (1 - np.exp(-t / 0.003))


SFX = {}
for c in data['cues']:
    t, ty, v = c['t'], c['type'], c.get('v', 1.0)
    if ty == 'tap':
        add(tap_snd(), t, 0.42, pan=0.1)
    elif ty == 'pop':
        add(pop_snd(), t, 0.32 * v, pan=-0.15, rev=0.15)
    elif ty == 'blip':
        add(blip(), t, 0.16, rev=0.3)
    elif ty == 'whoosh':
        add(whoosh(0.75), t - 0.18, 0.5 * v, pan=0.0, rev=0.2)
    elif ty == 'swoosh':
        add(whoosh(0.45), t - 0.08, 0.32 * v, pan=0.15, rev=0.1)
    elif ty == 'swish':
        add(whoosh(0.38), t - 0.05, 0.3, pan=0.4)
        add(tap_snd(), t + 0.3, 0.18, pan=0.3)
    elif ty == 'scroll':
        add(whoosh(0.9, up=False), t, 0.14, rev=0.1)
    elif ty == 'flip':
        add(whoosh(0.6), t - 0.2, 0.55, rev=0.2)
        add(filt(rng.standard_normal(int(0.08 * SR)), lo=300, hi=3000) * np.exp(-tt(0.08) / 0.02), t + 0.28, 0.3)
    elif ty == 'shimmer':
        for k, m in enumerate([84, 88, 91, 96, 100]):
            add(bell(mtof(m), 0.8, 0.6), t + k * 0.045, 0.05, pan=-0.4 + 0.2 * k, rev=0.5)
    elif ty == 'riser':
        dur = c['end'] - t
        add(riser(dur), t, 0.4, rev=0.25)
    elif ty == 'impact':
        add(impact(v), t, 0.85, rev=0.3)
        add(filt(rng.standard_normal(int(1.6 * SR)), lo=4000) * np.exp(-tt(1.6) / 0.35) * v, t, 0.06, rev=0.4)  # prato
    elif ty == 'success':
        add(bell(mtof(84), 1.4), t, 0.16, pan=-0.1, rev=0.4)
        add(bell(mtof(89), 1.6), t + 0.12, 0.16, pan=0.1, rev=0.4)
    elif ty == 'notify':
        for k, m in enumerate([81, 84, 89]):
            add(bell(mtof(m), 1.0, 0.7), t + k * 0.075, 0.1, pan=0.3, rev=0.35)
    elif ty == 'swell':
        add(impact(0.6), t, 0.6, rev=0.5)
    elif ty == 'cta':
        for k, m in enumerate([77, 81, 84, 89]):
            add(bell(mtof(m), 1.8, 0.8), t + k * 0.06, 0.08, pan=-0.3 + 0.2 * k, rev=0.5)
    elif ty == 'end':
        add(impact(0.9), t, 0.7, rev=0.5)
        for m in CH['Fmaj9'] + [65, 72, 77]:
            add(bell(mtof(m), 2.0, 0.5), t, 0.035, rev=0.6)
    elif ty == 'intro':
        add(filt(rng.standard_normal(int(4.5 * SR)), hi=900) * env_adsr(int(4.5 * SR), 2.0, 1.5), t, 0.05, rev=0.3)

pad()
arp()
drums_and_bass()

# compressão por "sidechain": pad e graves respiram a cada bumbo
duck = np.ones(N)
for k in kicks:
    i = int(k * SR)
    seg = 1 - 0.38 * np.exp(-np.arange(int(0.3 * SR)) / SR / 0.09)
    n = min(len(seg), N - i)
    duck[i:i + n] = np.minimum(duck[i:i + n], seg[:n])

# reverberação: resposta ao impulso sintética (2,4 s)
ir_t = tt(2.4)
ir = np.vstack([rng.standard_normal(len(ir_t)), rng.standard_normal(len(ir_t))]) * np.exp(-ir_t / 0.55)
ir[:, :int(0.012 * SR)] = 0
size = 1 << int(np.ceil(np.log2(N + len(ir_t))))
wet = np.vstack([np.fft.irfft(np.fft.rfft(filt(send[c], lo=200, hi=7000), size) * np.fft.rfft(ir[c], size), size)[:N] for c in range(2)])
wet /= np.max(np.abs(wet)) + 1e-9
out = mix * duck + wet * 0.22

# fim: o acorde soa e some no último segundo
fade = np.ones(N)
fs = int((D - 0.9) * SR)
fade[fs:] = np.linspace(1, 0, N - fs) ** 2
out *= fade
out = np.vstack([filt(out[c], lo=28) for c in range(2)])
out = np.tanh(out * 1.25) / np.tanh(1.25)
out /= np.max(np.abs(out)) / 0.89
pcm = (out.T * 32767).astype('<i2')
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('trilha:', OUT, f'{D:.1f} s')
