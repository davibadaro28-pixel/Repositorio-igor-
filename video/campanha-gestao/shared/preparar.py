"""Prepara os arquivos da campanha: telas capturadas em WebP, fotos, medidas e a narração de cada vídeo.
Uso: python3 preparar.py <capturas-painel> <capturas-cardapio> <pasta-de-trabalho-das-narracoes>
"""
import json
import os
import shutil
import sys

from PIL import Image

painel, menu, work = sys.argv[1:4]
here = os.path.dirname(os.path.abspath(__file__))
camp = os.path.dirname(here)
root = os.path.abspath(os.path.join(camp, '..', '..'))
A = os.path.join(camp, 'assets')


def conv(src_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for n in sorted(os.listdir(src_dir)):
        if n.endswith('.png'):
            Image.open(os.path.join(src_dir, n)).convert('RGB').save(os.path.join(out_dir, n[:-4] + '.webp'), 'WEBP', quality=94, method=6)


conv(painel, os.path.join(A, 'painel'))
conv(menu, os.path.join(A, 'menu'))
os.makedirs(os.path.join(A, 'fotos'), exist_ok=True)
for f in os.listdir(os.path.join(root, 'lojas', 'lacos-de-mae', 'public', 'img', 'produtos')):
    shutil.copy(os.path.join(root, 'lojas', 'lacos-de-mae', 'public', 'img', 'produtos', f), os.path.join(A, 'fotos', f))
mp = json.load(open(os.path.join(painel, 'meta.json')))
mp.update(json.load(open(os.path.join(painel, 'meta-extra.json'))))
mm = json.load(open(os.path.join(menu, 'meta.json')))
open(os.path.join(A, 'meta.js'), 'w').write('window.MP = ' + json.dumps(mp) + ';\nwindow.MM = ' + json.dumps(mm) + ';\n')

for v in sorted(d for d in os.listdir(camp) if d.startswith('v0')):
    w = os.path.join(work, v)
    if not os.path.exists(os.path.join(w, 'legendas.json')):
        continue
    os.makedirs(os.path.join(camp, v, 'assets'), exist_ok=True)
    rel = json.load(open(os.path.join(w, 'narracao-relatorio.json')))
    words = json.load(open(os.path.join(w, 'legendas.json')))
    open(os.path.join(camp, v, 'assets', 'narracao.js'), 'w').write('window.NARR = ' + json.dumps(rel, ensure_ascii=False) + ';\nwindow.WORDS = ' + json.dumps(words, ensure_ascii=False) + ';\n')
    print(v, rel['duracao'], 's,', len(words), 'palavras')
print('ok')
