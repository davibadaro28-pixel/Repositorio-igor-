#!/usr/bin/env python3
"""Narração grátis e local com o Kokoro (vozes pt-BR mais naturais que o Piper). Gera frase a frase e, com janelas,
ajusta a velocidade de cada frase para ela PREENCHER a sua cena: começa 0,1 s depois do corte e termina 0,35 s antes do
próximo. Assim as pausas entre as frases ficam curtas e iguais (é isso que dá ritmo a uma narração).

  python3 gerar_kokoro.py --roteiro roteiro.json --voz pm_alex --saida narracao.wav --tentativas 3
  python3 gerar_kokoro.py --roteiro roteiro.json --saida narracao.wav --so 2,5        # refaz só as frases 2 e 5
  python3 gerar_kokoro.py --roteiro roteiro.txt --saida narracao.wav                  # sem janelas: em sequência

Vozes pt-BR: pm_alex (masculina, a mais estável), pm_santa (masculina, mais grave e irregular), pf_dora (feminina).
Na primeira vez baixa o modelo (~350 MB) para ~/.cache/narracao/kokoro.
Precisa de: pip install --break-system-packages kokoro-onnx soundfile
"""
import argparse
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gerar_piper as gp  # noqa: E402  (confere() pela transcrição)
import montar as mt  # noqa: E402
import texto_falado as tf  # noqa: E402

DIR = Path.home() / '.cache' / 'narracao' / 'kokoro'
URL = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
ARQS = ('kokoro-v1.0.onnx', 'voices-v1.0.bin')
FOLGA_FIM = 0.35        # silêncio antes do corte da cena
ENTRADA = 0.1           # a voz entra 0,1 s depois do texto aparecer
VEL = (0.85, 1.22)      # faixa de velocidade que ainda soa natural


def modelo():
    DIR.mkdir(parents=True, exist_ok=True)
    for a in ARQS:
        if not (DIR / a).exists():
            print('baixando', a, file=sys.stderr)
            urllib.request.urlretrieve(URL + a, DIR / a)
    from kokoro_onnx import Kokoro
    return Kokoro(str(DIR / ARQS[0]), str(DIR / ARQS[1]))


def sintetizar(k, texto, voz, vel, caminho):
    import soundfile as sf
    a, sr = k.create(texto, voice=voz, speed=float(vel), lang='pt-br')
    sf.write(str(caminho), a, sr)


def duracao_fala(caminho):
    y, (f0, f1) = mt.aparar(mt.carregar(caminho, 24000), 24000, com_folga=True)
    return len(y) / 24000 - f0 - f1


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--roteiro', required=True)
    ap.add_argument('--saida', required=True)
    ap.add_argument('--voz', default='pm_alex')
    ap.add_argument('--velocidade', type=float, default=1.0, help='velocidade base (sem janelas, ou como ponto de partida)')
    ap.add_argument('--pronuncias', help='json extra de grafias; o Kokoro usa as mesmas grafias do Piper (os dois leem pelo espeak)')
    ap.add_argument('--tentativas', type=int, default=1, help='versões por frase; fica com a que a transcrição confere')
    ap.add_argument('--so', help='refazer só estas frases (ex.: 2,5); as outras vêm de <saida>_trechos/')
    a = ap.parse_args()
    k = modelo()
    pron = tf.carregar_pronuncias(a.pronuncias, 'piper')
    frases = tf.ler_roteiro(a.roteiro)
    tmp = Path(str(a.saida) + '_trechos')
    tmp.mkdir(parents=True, exist_ok=True)
    so = {int(x) for x in a.so.split(',')} if a.so else None
    arqs = []
    for i, fr in enumerate(frases, 1):
        texto, trocas = tf.para_fala(fr['texto'], 'piper', 'anuncio', pron)
        arq = tmp / f'{i:02d}.wav'
        if so and i not in so and arq.exists():
            arqs.append(arq)
            continue
        vel = float(fr.get('velocidade', a.velocidade))
        sintetizar(k, texto, a.voz, vel, arq)
        disp = None
        if 'inicio' in fr and 'fim' in fr:
            disp = (fr['fim'] - FOLGA_FIM) - (fr['inicio'] + ENTRADA)
            for _ in range(4):                    # acerta a velocidade para a frase preencher a janela sem passar dela
                d = duracao_fala(arq)
                if 0.95 * disp <= d <= disp:
                    break
                nova = float(np.clip(vel * d / (0.98 * disp), *VEL))
                if abs(nova - vel) < 0.01:
                    break
                vel = nova
                sintetizar(k, texto, a.voz, vel, arq)
        nota = ''
        if a.tentativas > 1:
            melhor = gp.confere(arq, fr['texto'])
            for t in range(2, a.tentativas + 1):
                if melhor[0] >= 0.999:
                    break
                outra = tmp / f'{i:02d}_t{t}.wav'
                sintetizar(k, texto, a.voz, vel, outra)
                c = gp.confere(outra, fr['texto'])
                if c[0] > melhor[0]:
                    outra.replace(arq)
                    melhor = c
                else:
                    outra.unlink()
            nota = f' · confere {melhor[0]:.2f}' + ('' if melhor[0] >= 0.999 else f' (ouvido: "{melhor[1]}")')
        d = duracao_fala(arq)
        sil = tf.silabas(tf.para_fala(fr['texto'], 'generico', 'anuncio')[0])
        cabe = ''
        if disp is not None:
            sobra = disp - d
            if sobra < -0.05:
                cabe = f' · NÃO CABE: passa {-sobra:.2f} s em {vel:.2f}x (corte ~{int(-sobra * sil / d) + 1} sílabas)'
            elif sobra > 0.6:
                cabe = f' · CURTA: sobram {sobra:.2f} s em {vel:.2f}x (acrescente ~{int(sobra * sil / d)} sílabas)'
        print(f'{i:02d} vel {vel:.2f} · {sil / max(d, 0.1):.1f} sílabas/s · {d:.2f} s{nota}{cabe} · {texto}'
              + (f'  [trocas: {", ".join(f"{x}→{y}" for x, y in trocas)}]' if trocas else ''))
        arqs.append(arq)
    marcas, sobre = mt.montar(frases, arqs, a.saida, None)
    for s in sobre:
        print('ATENÇÃO:', s)
    subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.saida])
    print('gravado:', a.saida, '+', a.saida + '.marcas.json', '· trechos em', tmp)


if __name__ == '__main__':
    main()
