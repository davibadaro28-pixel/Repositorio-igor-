"""Mixagem individual de um vídeo da campanha: voz, trilha, efeitos e master.

Cada vídeo tem o seu mix.json (EQ e compressão da voz, nível e ducking da trilha, automações,
paleta e processamento dos efeitos). A cadeia é:
  voz    -> passa-altas, EQ (corte de embolado, presença, ar), de-esser dinâmico, compressor, nível
  trilha -> passa-altas, EQ, "bolsão" dinâmico na faixa da voz, ducking pelas palavras, automações
  efeitos-> cada marca da animação vira um som (biblioteca ou sintetizado), barramento com EQ/reverb
  master -> compressor de cola, normalização para -14 LUFS e limitador de pico real (-1,2 dBTP)
Grava <trabalho>/mix.wav (48 kHz, 24 bits) e <trabalho>/mix-relatorio.json.

Uso: python3 mixar.py <pasta-do-video> <pasta-de-trabalho> <biblioteca-de-efeitos>
"""
import json
import os
import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import fftconvolve, resample_poly, sosfilt

SR = 44100
VID, WORK, LIB = sys.argv[1:4]
CFG = json.load(open(os.path.join(VID, 'mix.json')))
REL = json.load(open(os.path.join(WORK, 'narracao-relatorio.json')))
WORDS = json.load(open(os.path.join(WORK, 'legendas.json')))
CUES = json.load(open(os.path.join(WORK, 'cues.json')))['cues']
D = REL['duracao']
N = int(round(D * SR))
rng = np.random.default_rng(CFG.get('seed', 1))
meter = pyln.Meter(SR)


# ---------------------------------------------------------------- filtros (RBJ)
def biquad(kind, f, q=0.707, g=0.0):
    A = 10 ** (g / 40)
    w = 2 * np.pi * f / SR
    c, s = np.cos(w), np.sin(w)
    al = s / (2 * q)
    if kind == 'hp':
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'lp':
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'bp':
        b = [al, 0, -al]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'peak':
        b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    elif kind == 'ls':
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]
        a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
    elif kind == 'hs':
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
        a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    else:
        raise ValueError(kind)
    return np.array(b + a) / a[0]


def eq(x, bands):
    if not bands:
        return x
    sos = np.array([biquad(*b) for b in bands])
    return sosfilt(sos, x, axis=0)


# ---------------------------------------------------------------- dinâmica
HOP = 32


def level_db(x, mode='peak'):
    m = np.abs(x) if x.ndim == 1 else np.max(np.abs(x), axis=1)
    if mode == 'rms':  # RMS em janela deslizante de 10 ms
        m = np.sqrt(np.maximum(uniform_filter1d(m ** 2, int(0.010 * SR)), 0))
    nb = int(np.ceil(len(m) / HOP))
    m = np.pad(m, (0, nb * HOP - len(m)))
    v = m.reshape(nb, HOP).max(axis=1)
    return 20 * np.log10(v + 1e-9)


def ref_level(lv):
    """Nível de referência: percentil 90 dos blocos com sinal (os limiares são relativos a ele)."""
    act = lv[lv > -60]
    return float(np.percentile(act, 90)) if len(act) else -20.0


def smooth_gain(gdb, att_ms, rel_ms):
    """Suaviza a redução de ganho (dB, <= 0): ataque rápido para descer, release para subir."""
    a = np.exp(-HOP / (SR * att_ms / 1000))
    r = np.exp(-HOP / (SR * rel_ms / 1000))
    out = np.empty_like(gdb)
    y = 0.0
    for i, g in enumerate(gdb):
        y = a * y + (1 - a) * g if g < y else r * y + (1 - r) * g
        out[i] = y
    return out


def to_samples(gdb, n):
    t = (np.arange(len(gdb)) + 0.5) * HOP
    return 10 ** (np.interp(np.arange(n), t, gdb) / 20)


def compressor(x, thr, ratio, att, rel, knee=6.0, mode='peak', side=None):
    lv = level_db(x if side is None else side, mode)
    over = lv - (ref_level(lv) + thr)
    gr = np.where(over <= -knee / 2, 0.0, np.where(over >= knee / 2, over * (1 / ratio - 1), (1 / ratio - 1) * (over + knee / 2) ** 2 / (2 * knee)))
    g = to_samples(smooth_gain(gr, att, rel), len(x))
    return (x * (g[:, None] if x.ndim == 2 else g)), gr


def deesser(x, lo, hi, thr, ratio):
    band = eq(x, [('hp', lo, 0.7), ('lp', hi, 0.7)])
    lv = level_db(band, 'rms')
    over = np.maximum(lv - (ref_level(lv) + thr), 0)
    g = to_samples(smooth_gain(-over * (1 - 1 / ratio), 1.5, 40), len(x))
    return x + band * (g - 1), float(np.max(over * (1 - 1 / ratio)))


def true_peak_db(x):
    up = resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limiter(x, ceiling_db, look_ms=5.0, rel_ms=80.0):
    """Limitador de pico real: detecção com sobreamostragem 4x, lookahead e release suave."""
    ceil = 10 ** (ceiling_db / 20)
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(axis=1)
    pk = up[: 4 * len(x)].reshape(-1, 4).max(axis=1)
    pk = np.pad(pk, (0, len(x) - len(pk)), constant_values=0) if len(pk) < len(x) else pk[: len(x)]
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    look = int(SR * look_ms / 1000)
    need = minimum_filter1d(need, size=2 * look + 1, origin=0)
    gdb = 20 * np.log10(need)
    nb = len(gdb) // HOP
    blk = gdb[: nb * HOP].reshape(nb, HOP).min(axis=1)
    sm = smooth_gain(blk, 0.01, rel_ms)
    sm = np.minimum(sm, blk)  # nunca menos redução do que o necessário
    g = to_samples(sm, len(x))
    return x * g[:, None]


def reverb(x, sec, damp_hz, seed=3):
    """Reverb por convolução com resposta sintética (ruído decaindo, estéreo descorrelacionado)."""
    n = int(sec * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    ir = r.standard_normal((n, 2)) * np.exp(-6.9 * t / sec)[:, None]
    ir = eq(ir, [('lp', damp_hz, 0.6), ('hp', 180, 0.7)])
    ir[: int(0.012 * SR)] = 0  # pré-delay
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True)) + 1e-9
    mono = x if x.ndim == 1 else x.mean(axis=1)
    return np.stack([fftconvolve(mono, ir[:, 0])[: len(mono)], fftconvolve(mono, ir[:, 1])[: len(mono)]], axis=1)


def db(v):
    return 10 ** (v / 20)


def lufs(x):
    try:
        return meter.integrated_loudness(x)
    except ValueError:
        return -70.0


# ---------------------------------------------------------------- efeitos sintetizados
def env_ad(n, a, peak=0.6):
    k = max(1, int(n * peak))
    e = np.concatenate([np.linspace(0, 1, k) ** a, np.linspace(1, 0, n - k) ** 2])
    return e


def noise(n):
    return rng.standard_normal(n)


def sweep_filter(x, f0, f1, q=1.2):
    """Ruído com passa-faixa que varre de f0 a f1 (processado em blocos)."""
    out = np.zeros_like(x)
    blocks = 48
    edges = np.linspace(0, len(x), blocks + 1).astype(int)
    for i in range(blocks):
        f = f0 * (f1 / f0) ** (i / (blocks - 1))
        seg = eq(x[max(0, edges[i] - 256): edges[i + 1]], [('bp', min(f, SR / 2.3), q)])
        out[edges[i]: edges[i + 1]] = seg[-(edges[i + 1] - edges[i]):]
    return out


def tone(f0, f1, dur, decay, kind='sine'):
    n = int(dur * SR)
    f = f0 * (f1 / f0) ** (np.arange(n) / n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    w = np.sin(ph) if kind == 'sine' else np.tanh(3 * np.sin(ph))
    return w * np.exp(-np.arange(n) / (decay * SR))


def fm_bell(f, dur, ratio=3.5, index=2.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    e = np.exp(-t / (dur / 4))
    return np.sin(2 * np.pi * f * t + index * e * np.sin(2 * np.pi * f * ratio * t)) * e


def syn(kind, p):
    d = p.get('dur')
    if kind == 'whoosh':
        n = int((d or 0.5) * SR)
        x = sweep_filter(noise(n), p.get('f0', 300), p.get('f1', 5000), 0.9) * env_ad(n, 2, p.get('peak', 0.62))
        return x
    if kind == 'riser':
        n = int((d or 1.2) * SR)
        x = sweep_filter(noise(n), 400, 9000, 1.4) * np.linspace(0, 1, n) ** 2
        x += 0.35 * tone(220, 1400, n / SR, 99) * np.linspace(0, 1, n) ** 3
        return x
    if kind == 'swell':
        n = int((d or 0.9) * SR)
        return eq(noise(n), [('hp', 3000, 0.7)]) * np.linspace(0, 1, n) ** 3
    if kind == 'impact':
        n = int((d or 1.0) * SR)
        x = tone(110, 42, n / SR, 0.35) * 1.0
        x[: int(0.12 * SR)] += eq(noise(int(0.12 * SR)), [('lp', 2500, 0.7)]) * np.exp(-np.arange(int(0.12 * SR)) / (0.025 * SR)) * 0.8
        x[: 60] += np.linspace(1, 0, 60)
        return x
    if kind == 'hit':
        n = int((d or 0.45) * SR)
        x = tone(160, 48, n / SR, 0.16)
        nn = int(0.1 * SR)
        x[:nn] += eq(noise(nn), [('bp', 1800, 0.8)]) * np.exp(-np.arange(nn) / (0.03 * SR)) * 0.5
        return x
    if kind == 'pop':
        x = tone(p.get('f', 900), p.get('f', 900) * 0.45, 0.09, 0.03)
        x[:30] += np.linspace(0.6, 0, 30)
        return x
    if kind == 'tick':
        x = tone(p.get('f', 2600), p.get('f', 2600), 0.03, 0.005)
        x += eq(noise(len(x)), [('hp', 3000, 0.7)]) * np.exp(-np.arange(len(x)) / (0.002 * SR)) * 0.5
        return x
    if kind == 'tap':
        n = int(0.05 * SR)
        x = eq(noise(n), [('bp', 3500, 1.0)]) * np.exp(-np.arange(n) / (0.004 * SR))
        x += 0.6 * tone(220, 140, 0.05, 0.015)
        return x
    if kind == 'beep':
        n = int(0.09 * SR)
        return np.sin(2 * np.pi * p.get('f', 1900) * np.arange(n) / SR) * np.minimum(1, np.linspace(0, 12, n)) * np.linspace(1, 0.6, n)
    if kind == 'blips':
        out = []
        for f in p.get('fs', [1320, 1760]):
            n = int(0.075 * SR)
            out.append(np.sin(2 * np.pi * f * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.03 * SR)))
            out.append(np.zeros(int(0.03 * SR)))
        return np.concatenate(out)
    if kind == 'thump':
        return tone(p.get('f', 90), p.get('f', 90) * 0.6, 0.35, 0.09)
    if kind == 'drop':
        x = tone(120, 60, 0.3, 0.07)
        nn = int(0.04 * SR)
        x[:nn] += eq(noise(nn), [('bp', 1600, 1.2)]) * np.exp(-np.arange(nn) / (0.008 * SR)) * 0.7
        return x
    if kind == 'rise':
        n = int((d or 0.5) * SR)
        return tone(300, 900, n / SR, 99) * env_ad(n, 1.5, 0.8) * 0.7
    if kind == 'dots':
        n = int((d or 1.2) * SR)
        x = np.zeros(n)
        for _ in range(p.get('k', 26)):
            i = int(rng.uniform(0, n - 3000))
            f = rng.uniform(2200, 5200)
            g = tone(f, f, 0.04, 0.01) * rng.uniform(0.3, 0.8)
            x[i: i + len(g)] += g
        return x
    if kind == 'fan':
        out = np.zeros(int(0.5 * SR))
        for i in range(4):
            w = syn('whoosh', {'dur': 0.16, 'f0': 1500, 'f1': 6000})
            k = int(i * 0.075 * SR)
            out[k: k + len(w)] += w
        return out
    if kind == 'chime':
        return fm_bell(p.get('f', 1568), p.get('dur', 1.4), 3.5, 1.8)
    if kind == 'shimmer':
        n = int(1.6 * SR)
        x = np.zeros(n)
        for i, f in enumerate([2093, 2637, 3136, 3951, 4699]):
            b = fm_bell(f, 1.1, 2.0, 1.2) * 0.5
            k = int(i * 0.06 * SR)
            x[k: k + len(b)] += b[: n - k]
        return x
    raise ValueError(kind)


SFX_CACHE = {}


def load_sfx(spec, n_idx):
    """spec: {"src": "lib:ding" | "syn:whoosh", ...}; variação leve de tom nas repetições."""
    src = spec['src']
    if src.startswith('lib:'):
        key = src
        if key not in SFX_CACHE:
            x, sr = sf.read(os.path.join(LIB, src[4:] + '.wav'))
            x = x if x.ndim == 1 else x.mean(axis=1)
            # recorta silêncio inicial
            th = np.max(np.abs(x)) * 0.02
            i0 = int(np.argmax(np.abs(x) > th))
            x = x[max(0, i0 - 40):]
            if spec.get('max'):
                m = int(spec['max'] * SR)
                x = x[:m] * np.concatenate([np.ones(max(0, m - 2000)), np.linspace(1, 0, min(2000, m))])[: len(x[:m])]
            SFX_CACHE[key] = x
        x = SFX_CACHE[key].copy()
    else:
        x = syn(src[4:], spec)
    x = x / (np.max(np.abs(x)) + 1e-9) * db(-1)
    var = spec.get('vary', 1.0)
    if n_idx and var:
        semis = [0, 1, -1, 2, -2, 3, 1.5][n_idx % 7] * var
        if semis:
            r = 2 ** (semis / 12)
            x = resample_poly(x, 1000, int(round(1000 * r)))
    if spec.get('eq'):
        x = eq(x, spec['eq'])
    return x


# ---------------------------------------------------------------- voz
vcfg = CFG['voz']
v, sr = sf.read(os.path.join(WORK, 'narracao.wav'))
v = v if v.ndim == 1 else v.mean(axis=1)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
v = eq(v, vcfg['eq'])
v, ess_gr = deesser(v, *vcfg['deesser'])
v, comp_gr = compressor(v, *vcfg['comp'], mode='rms')
if vcfg.get('comp2'):
    v, _ = compressor(v, *vcfg['comp2'], mode='peak')
VOICE_LUFS = -18.0
v *= db(VOICE_LUFS - lufs(v))

# máscara de fala (pelas palavras): base do ducking e do "bolsão" na trilha
mask_t = np.zeros(int(D * 1000) + 1)
pre, post = CFG['trilha'].get('pre', 0.08), CFG['trilha'].get('post', 0.12)
for w in WORDS:
    a, b = int(max(0, (w['s'] - pre) * 1000)), int(min(D, w['e'] + post) * 1000)
    mask_t[a:b] = 1
# fecha buracos curtos entre palavras (respiros < 220 ms não soltam a trilha)
gap = 0
for i in range(len(mask_t)):
    if mask_t[i] == 0:
        gap += 1
    else:
        if 0 < gap < 220:
            mask_t[i - gap: i] = 1
        gap = 0


def ms_env(points_db, att_ms, rel_ms):
    """Envelope em dB na grade de 1 ms, suavizado (ataque para descer, release para subir)."""
    a, r = np.exp(-1 / att_ms), np.exp(-1 / rel_ms)
    out = np.empty_like(points_db)
    y = points_db[0]
    for i, g in enumerate(points_db):
        y = a * y + (1 - a) * g if g < y else r * y + (1 - r) * g
        out[i] = y
    return out


def at_samples(ms_curve):
    return np.interp(np.arange(N) / SR * 1000, np.arange(len(ms_curve)), ms_curve)


# ---------------------------------------------------------------- trilha
tcfg = CFG['trilha']
m, sr = sf.read(os.path.join(WORK, 'trilha.wav'))
m = m if m.ndim == 2 else np.stack([m, m], axis=1)
m = np.pad(m, ((0, max(0, N - len(m))), (0, 0)))[:N]
fade_out = int(tcfg.get('fade_out', 1.2) * SR)
m[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None] ** 1.5
m = eq(m, tcfg['eq'])
# "fader rider": ganho lento que nivela as seções da trilha (até +9/-6 dB), sem mexer no final
rider = tcfg.get('rider', 0.85)
if rider:
    mono = m.mean(axis=1)
    hop, w = SR // 10, int(0.4 * SR)
    pw = uniform_filter1d(eq(mono, [('hp', 100, 0.7), ('hs', 2000, 0.7, 3)]) ** 2, w)[::hop]
    lvl = 10 * np.log10(np.maximum(pw, 1e-12))
    lvl = uniform_filter1d(lvl, 15)
    ok = lvl > -55
    target = float(np.percentile(lvl[ok], 70)) if ok.any() else -20.0
    gr = np.where(ok, np.clip(target - lvl, -6, tcfg.get('rider_max', 14)) * rider, 0.0)
    gr[int((D - 2.6) * 10):] = np.minimum(gr[int((D - 2.6) * 10):], 0)
    gr = uniform_filter1d(gr, 9)
    m *= db(np.interp(np.arange(N), np.arange(len(gr)) * hop, gr))[:, None]
# compressor da trilha: aproxima as seções (a introdução gerada costuma vir bem mais baixa)
m, mus_gr = compressor(m, *tcfg.get('comp', [-10, 2.5, 30, 400]), mode='rms')
m *= db(VOICE_LUFS - 8 - lufs(m))
# ducking + automações
duck_ms = np.where(mask_t > 0, tcfg['duck'], 0.0)
for a, b, g in tcfg.get('automacao', []):
    duck_ms[int(a * 1000): int(b * 1000)] += g
duck_ms = ms_env(duck_ms, tcfg.get('ataque_ms', 90), tcfg.get('release_ms', 380))
gain = db(at_samples(duck_ms))
# bolsão dinâmico: a faixa de 1,5–4 kHz da trilha abre espaço quando a voz fala
pocket = eq(m, [('hp', 1400, 0.7), ('lp', 4200, 0.7)])
pk_ms = ms_env(np.where(mask_t > 0, tcfg['bolsao'], 0.0), 60, 300)
m = m + pocket * (db(at_samples(pk_ms)) - 1)[:, None]
# filtro automatizado (ex.: trilha "encolhe" num trecho)
for a, b, fc in tcfg.get('passa_baixas', []):
    lpd = eq(m, [('lp', fc, 0.7), ('lp', fc, 0.7)])
    k = np.zeros(int(D * 1000) + 1)
    k[int(a * 1000): int(b * 1000)] = 1
    k = at_samples(ms_env(-k * 10, 250, 400) / -10)[:, None]
    m = m * (1 - k) + lpd * k
m *= gain[:, None]
# nível final da trilha pelo alvo de relação voz/trilha medido só durante a fala
sp_mask = np.interp(np.arange(N) / SR * 1000, np.arange(len(mask_t)), mask_t) > 0.5
v_sp = lufs(np.stack([v, v], axis=1)[sp_mask])
m *= db(v_sp - tcfg['voz_sobre_trilha'] - lufs(m[sp_mask]))

# ---------------------------------------------------------------- efeitos
ecfg = CFG['efeitos']
fx = np.zeros((N, 2))
placed = []
count = {}
for c in CUES:
    spec = ecfg['tipos'].get(c['type'])
    if not spec:
        continue
    k = count.get(c['type'], 0)
    count[c['type']] = k + 1
    x = load_sfx(spec, c.get('n', k))
    t = c['t'] + spec.get('offset', 0.0)
    if spec['src'] == 'syn:swell' or spec.get('ate_o_ponto'):
        t -= len(x) / SR  # termina exatamente na marca
    i = int(round(t * SR))
    if i < 0:
        x = x[-i:]
        i = 0
    x = x[: max(0, N - i)]
    g = db(spec['db'])
    pan = spec.get('pan', 0.0)
    if pan == 'alterna':
        pan = 0.35 if k % 2 else -0.35
    if pan == 'varre':
        lr = np.linspace(-0.7, 0.7, len(x)) * (1 if k % 2 == 0 else -1)
        L_, R_ = np.cos((lr + 1) * np.pi / 4), np.sin((lr + 1) * np.pi / 4)
    else:
        L_, R_ = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    fx[i: i + len(x), 0] += x * g * L_ * np.sqrt(2)
    fx[i: i + len(x), 1] += x * g * R_ * np.sqrt(2)
    placed.append({'t': round(t, 3), 'tipo': c['type'], 'som': spec['src'], 'db': spec['db']})
fx = eq(fx, ecfg.get('eq', []))
if ecfg.get('drive'):
    fx = np.tanh(fx * db(ecfg['drive'])) / db(ecfg['drive'])
if ecfg.get('reverb'):
    sec, damp, send = ecfg['reverb']
    fx = fx + reverb(fx, sec, damp) * db(send)
# efeitos levemente abaixados enquanto a voz fala (sem sumir)
fx_duck = db(at_samples(ms_env(np.where(mask_t > 0, ecfg.get('duck', -3.0), 0.0), 30, 200)))
fx *= fx_duck[:, None]

# ---------------------------------------------------------------- voz com reverb opcional e soma
vs = np.stack([v, v], axis=1)
if vcfg.get('reverb'):
    sec, damp, send = vcfg['reverb']
    vs = vs + reverb(v, sec, damp, seed=9) * db(send)
mix = vs + m + fx

# ---------------------------------------------------------------- master
mcfg = CFG.get('master', {})
mix, glue_gr = compressor(mix, *mcfg.get('cola', [-3, 1.8, 25, 220]), mode='rms')
mix = eq(mix, mcfg.get('eq', [('hp', 28, 0.7)]))
TARGET, CEIL = -14.0, -1.2
g = TARGET - lufs(mix)
for _ in range(4):
    out = limiter(mix * db(g), CEIL)
    err = TARGET - lufs(out)
    if abs(err) < 0.05:
        break
    g += err
# 48 kHz para o vídeo
out48 = resample_poly(out, 160, 147, axis=0)
out48 = limiter(out48 * 1.0, CEIL) if true_peak_db(out48) > CEIL else out48
sf.write(os.path.join(WORK, 'mix.wav'), out48, 48000, subtype='PCM_24')
sf.write(os.path.join(WORK, 'stem-voz.wav'), vs, SR, subtype='PCM_16')
sf.write(os.path.join(WORK, 'stem-trilha.wav'), m, SR, subtype='PCM_16')
sf.write(os.path.join(WORK, 'stem-efeitos.wav'), fx, SR, subtype='PCM_16')

# ---------------------------------------------------------------- relatório
sp = at_samples(mask_t) > 0.5
def seg_lufs(x, sel):
    y = x[sel]
    return lufs(y) if len(y) > SR else -70.0
st = []
win, hop = 3 * SR, SR // 10
for i in range(0, len(out) - win, hop):
    st.append(lufs(out[i: i + win]))
st = np.array([s for s in st if s > -70])
rel_gate = st[st > np.mean(st) - 20] if len(st) else st
rep = {
    'video': os.path.basename(VID.rstrip('/')),
    'duracao_s': D,
    'lufs_integrado': round(lufs(out), 2),
    'pico_real_dbtp': round(true_peak_db(out48), 2),
    'lra_lu_aprox': round(float(np.percentile(rel_gate, 95) - np.percentile(rel_gate, 10)), 1) if len(rel_gate) else None,
    'voz_lufs_na_fala': round(seg_lufs(vs, sp), 1),
    'trilha_lufs_na_fala': round(seg_lufs(m, sp), 1),
    'trilha_lufs_nos_respiros': round(seg_lufs(m, ~sp), 1),
    'voz_sobre_trilha_db': round(seg_lufs(vs, sp) - seg_lufs(m, sp), 1),
    'deesser_max_reducao_db': round(ess_gr, 1),
    'compressor_trilha_max_reducao_db': round(float(-np.min(mus_gr)), 1),
    'compressor_voz_max_reducao_db': round(float(-np.min(comp_gr)), 1),
    'cola_master_max_reducao_db': round(float(-np.min(glue_gr)), 1),
    'ganho_master_db': round(g, 2),
    'efeitos_posicionados': len(placed),
    'efeitos': placed,
    'config': CFG,
}
json.dump(rep, open(os.path.join(WORK, 'mix-relatorio.json'), 'w'), ensure_ascii=False, indent=1)
print({k: rep[k] for k in list(rep)[:13]})
