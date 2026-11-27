#!/usr/bin/env python3
"""Junta trechos de narração (um arquivo por frase) numa faixa só, com pausas naturais ou nas janelas de tempo do vídeo.

  python3 montar.py --roteiro roteiro.txt  --trechos pasta/ --saida narracao.wav             # em sequência
  python3 montar.py --roteiro roteiro.json --trechos pasta/ --saida narracao.wav             # cada frase no "inicio" da sua janela
  python3 montar.py --roteiro r.txt --trechos 01.mp3 02.mp3 03.mp3 --saida n.wav --pausa 0.4

Os trechos são pareados com as frases do roteiro na ordem (numere os arquivos: 01.mp3, 02.mp3…).
Cada trecho tem o silêncio das bordas aparado. Grava também <saida>.marcas.json com o início e o fim reais de cada
frase, pronto para avaliar.py --roteiro (confere a sincronia).
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import texto_falado as tf  # noqa: E402

TAXA = 48000


def carregar(caminho, sr=TAXA):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(caminho), '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).copy()


def aparar(x, sr=TAXA, limiar_db=-45, folga=0.03, com_folga=False):
    """Tira o silêncio do começo e do fim (mantém uma folga curta para não cortar consoantes).
    Com com_folga=True devolve também (folga_inicio, folga_fim) em segundos."""
    hop = int(0.01 * sr)
    env = np.array([np.sqrt(np.mean(np.square(x[i:i + hop]))) for i in range(0, max(1, len(x) - hop), hop)])
    if not len(env):
        return (x, (0.0, 0.0)) if com_folga else x
    lim = max(env.max() * 10 ** (limiar_db / 20), 1e-5)
    ativo = np.where(env > lim)[0]
    if not len(ativo):
        return (x, (0.0, 0.0)) if com_folga else x
    a = max(0, ativo[0] * hop - int(folga * sr))
    b = min(len(x), (ativo[-1] + 1) * hop + int(folga * 2 * sr))
    y = x[a:b].copy()
    n = int(0.005 * sr)                       # rampa de 5 ms nas bordas: evita estalo
    if len(y) > 2 * n:
        y[:n] *= np.linspace(0, 1, n)
        y[-n:] *= np.linspace(1, 0, n)
    if com_folga:
        # início e fim da fala pelo mesmo critério do avaliador (-30 dB do pico): o rabicho baixo não conta como fala
        fala = np.where(env > max(env.max() * 10 ** (-30 / 20), 1e-5))[0]
        return y, ((fala[0] * hop - a) / sr, (b - (fala[-1] + 1) * hop) / sr)
    return y


def tempo_de_fala(x, sr=TAXA, limiar_db=-35, buraco=0.1):
    """Segundos com voz (sem as pausas), com o mesmo critério do avaliador (silêncios do Praat a -30 dB, mínimo 0,10 s)."""
    try:
        import parselmouth
        from parselmouth.praat import call
        snd = parselmouth.Sound(x.astype(np.float64), sampling_frequency=sr)
        tg = call(snd, 'To TextGrid (silences)', 100, 0.01, -30, 0.10, 0.05, 'silent', 'sounding')
        n = int(call(tg, 'Get number of intervals', 1))
        return float(sum(call(tg, 'Get end time of interval', 1, i) - call(tg, 'Get start time of interval', 1, i)
                         for i in range(1, n + 1) if call(tg, 'Get label of interval', 1, i) == 'sounding'))
    except ImportError:
        pass
    hop = int(0.01 * sr)
    env = np.array([np.sqrt(np.mean(np.square(x[i:i + hop]))) for i in range(0, max(1, len(x) - hop), hop)])
    if not len(env):
        return 0.0
    ativo = env > max(env.max() * 10 ** (limiar_db / 20), 1e-5)
    idx = np.where(ativo)[0]
    if not len(idx):
        return 0.0
    ativo[idx[0]:idx[-1] + 1] |= False
    seg = ativo[idx[0]:idx[-1] + 1].copy()
    # buracos curtos (oclusivas, respiro de consoante) contam como fala
    k, n = 0, len(seg)
    while k < n:
        if not seg[k]:
            j = k
            while j < n and not seg[j]:
                j += 1
            if (j - k) * 0.01 < buraco:
                seg[k:j] = True
            k = j
        else:
            k += 1
    return float(seg.sum()) * 0.01


def pausa_depois(texto):
    t = texto.rstrip()
    if t.endswith(('?', '!')):
        return 0.5
    if t.endswith(('.', '…', ':')):
        return 0.45
    if t.endswith((',', ';', '—', '-')):
        return 0.22
    return 0.35


def montar(frases, arquivos, saida, pausa=None, inicio=0.15, fim=0.4, sr=TAXA):
    if len(arquivos) != len(frases):
        raise SystemExit(f'{len(arquivos)} trechos para {len(frases)} frases: precisam ser iguais (um arquivo por frase).')
    pecas, marcas, t = [], [], inicio
    for fr, arq in zip(frases, arquivos):
        y, (f0, f1) = aparar(carregar(arq, sr), sr, com_folga=True)
        if 'inicio' in fr:
            t = float(fr['inicio']) + 0.1            # entra 0,1 s depois do texto aparecer na tela
        pecas.append((t, y))
        # "inicio"/"fim" só existem quando o roteiro tinha janelas (assim o avaliador confere a sincronia com elas);
        # o tempo real da fala fica em falado_ini/falado_fim
        marcas.append({'texto': fr['texto'], 'falado_ini': round(t + f0, 3), 'falado_fim': round(t + len(y) / sr - f1, 3), 'arquivo': str(arq),
                       **({'inicio': fr['inicio'], 'fim': fr['fim']} if 'inicio' in fr and 'fim' in fr else {})})
        t += len(y) / sr + (pausa if pausa is not None else pausa_depois(fr['texto']))
    total = max(p + len(y) / sr for p, y in pecas) + fim
    if any('fim' in fr for fr in frases):
        total = max(total, max(float(fr.get('fim', 0)) for fr in frases))
    out = np.zeros(int(total * sr) + 1, np.float32)
    for p, y in pecas:
        i = int(p * sr)
        out[i:i + len(y)] += y
    pico = float(np.max(np.abs(out))) or 1.0
    out *= min(1.0, 0.89 / pico)                    # pico de amostra em -1 dBFS
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', str(saida)],
                   input=out.tobytes(), check=True)
    sobre = [f'frase {i + 1} passa {m["falado_fim"] - m["fim"]:.2f} s da janela' if m['falado_fim'] > m['fim']
             else f'frase {i + 1} termina a {m["fim"] - m["falado_fim"]:.2f} s do corte (deixe 0,15 s ou mais)'
             for i, m in enumerate(marcas) if 'fim' in m and m['falado_fim'] > m['fim'] - 0.15]
    Path(str(saida) + '.marcas.json').write_text(json.dumps({'frases': marcas}, ensure_ascii=False, indent=1), encoding='utf-8')
    return marcas, sobre


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--roteiro', required=True)
    ap.add_argument('--trechos', nargs='+', required=True, help='uma pasta (arquivos em ordem alfabética) ou a lista de arquivos')
    ap.add_argument('--saida', required=True)
    ap.add_argument('--pausa', type=float, help='pausa fixa entre frases (padrão: pela pontuação, 0,22 a 0,5 s)')
    a = ap.parse_args()
    frases = tf.ler_roteiro(a.roteiro)
    arqs = a.trechos
    if len(arqs) == 1 and Path(arqs[0]).is_dir():
        arqs = sorted(str(p) for p in Path(arqs[0]).iterdir() if p.suffix.lower() in ('.wav', '.mp3', '.m4a', '.ogg', '.flac'))
    marcas, sobre = montar(frases, arqs, a.saida, a.pausa)
    for m in marcas:
        print(f'{m["falado_ini"]:6.2f}–{m["falado_fim"]:6.2f}  {m["texto"][:70]}')
    for s in sobre:
        print('ATENÇÃO:', s)
    print('gravado:', a.saida, '+', a.saida + '.marcas.json')


if __name__ == '__main__':
    main()
