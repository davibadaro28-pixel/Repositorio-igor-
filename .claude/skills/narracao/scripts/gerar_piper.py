#!/usr/bin/env python3
"""Narração grátis e local com o Piper (vozes pt-BR). Gera frase a frase, acerta o ritmo e monta a faixa.

  python3 gerar_piper.py --roteiro roteiro.txt --saida narracao.wav
  python3 gerar_piper.py --roteiro roteiro.json --voz cadu --ritmo 5.6 --saida narracao.wav   # json com janelas: posiciona cada frase
  python3 gerar_piper.py --roteiro roteiro.json --saida narracao.wav --so 1,4                  # refaz só as frases 1 e 4

Os trechos ficam em <saida>_trechos/ (01.wav, 02.wav…): com --so, os outros são reaproveitados.
Num roteiro .json, "ritmo" dentro de uma frase vale só para ela.

Vozes: faber, cadu, jeff (masculinas, baixadas na primeira vez para ~/.cache/narracao/vozes, 63 MB cada).
O Piper soa mais sintético que o ElevenLabs: serve para rascunho, teste de tempo e quando não há crédito.
--ritmo é a meta em sílabas por segundo; o script mede cada frase e corrige a velocidade uma vez.
"""
import argparse
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import montar as mt  # noqa: E402
import texto_falado as tf  # noqa: E402

VOZES = {'faber': 'faber/medium/pt_BR-faber-medium', 'cadu': 'cadu/medium/pt_BR-cadu-medium', 'jeff': 'jeff/medium/pt_BR-jeff-medium'}
BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/'
DIR = Path.home() / '.cache' / 'narracao' / 'vozes'


def voz(nome):
    if nome.endswith('.onnx') and Path(nome).exists():
        return Path(nome)
    DIR.mkdir(parents=True, exist_ok=True)
    arq = DIR / (Path(VOZES[nome]).name + '.onnx')
    for ext in ('.onnx', '.onnx.json'):
        p = DIR / (Path(VOZES[nome]).name + ext)
        if not p.exists():
            print('baixando voz', p.name, file=sys.stderr)
            urllib.request.urlretrieve(BASE + VOZES[nome] + ext, p)
    return arq


def sintetizar(v, texto, caminho, length_scale):
    from piper import SynthesisConfig
    with wave.open(str(caminho), 'wb') as w:
        v.synthesize_wav(texto, w, syn_config=SynthesisConfig(length_scale=length_scale))


def taxa_medida(caminho, texto):
    x = mt.carregar(caminho, 22050)
    return tf.silabas(texto) / max(0.1, mt.tempo_de_fala(x, 22050))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--roteiro', required=True)
    ap.add_argument('--saida', required=True)
    ap.add_argument('--voz', default='cadu', help='faber, cadu, jeff ou caminho de um .onnx')
    ap.add_argument('--ritmo', type=float, default=5.8, help='sílabas por segundo (anúncio ~5,8; institucional ~5,0)')
    ap.add_argument('--pronuncias', help='json extra de grafias (ver pronuncias.json)')
    ap.add_argument('--pausa', type=float)
    ap.add_argument('--so', help='refazer só estas frases (ex.: 1,4); as outras vêm de <saida>_trechos/')
    a = ap.parse_args()
    from piper import PiperVoice
    v = PiperVoice.load(str(voz(a.voz)))
    pron = tf.carregar_pronuncias(a.pronuncias, 'piper')
    frases = tf.ler_roteiro(a.roteiro)
    tmp = Path(str(a.saida) + '_trechos')
    tmp.mkdir(parents=True, exist_ok=True)
    so = {int(k) for k in a.so.split(',')} if a.so else None
    arqs = []
    for i, fr in enumerate(frases, 1):
        texto, trocas = tf.para_fala(fr['texto'], 'piper', 'anuncio', pron)
        arq = tmp / f'{i:02d}.wav'
        if so and i not in so and arq.exists():
            arqs.append(arq)
            continue
        ls = 1.35                                         # o Piper fala rápido (~8,5 sílabas/s em 1,0)
        sintetizar(v, texto, arq, ls)
        meta = float(fr.get('ritmo', a.ritmo))           # "ritmo" numa frase do json vale só para ela
        r = taxa_medida(arq, texto)
        if abs(r / meta - 1) > 0.08:
            ls = min(2.2, max(0.7, ls * r / meta))
            sintetizar(v, texto, arq, ls)
            r = taxa_medida(arq, texto)
        print(f'{i:02d} ritmo {r:.1f} sílabas/s (escala {ls:.2f}) · {texto}' + (f'  [trocas: {", ".join(f"{d}→{p}" for d, p in trocas)}]' if trocas else ''))
        arqs.append(arq)
    marcas, sobre = mt.montar(frases, arqs, a.saida, a.pausa)
    for s in sobre:
        print('ATENÇÃO:', s)
    subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.saida])
    print('gravado:', a.saida, '+', a.saida + '.marcas.json', '· trechos em', tmp)


if __name__ == '__main__':
    main()
