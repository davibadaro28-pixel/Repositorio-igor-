"""Prepara a pasta de uma variação: index.html (tema + plano) e assets/narracao.js a partir da narração gerada.
Uso: python3 variacao.py <pasta-da-variacao> <pasta-de-trabalho>
"""
import json
import os
import sys

VAR, WORK = sys.argv[1], sys.argv[2]
cfg = json.load(open(os.path.join(VAR, 'roteiro.json')))
tema = cfg['tema']
os.makedirs(os.path.join(VAR, 'assets'), exist_ok=True)
rel = json.load(open(os.path.join(WORK, 'narracao-relatorio.json')))
words = json.load(open(os.path.join(WORK, 'legendas.json')))
open(os.path.join(VAR, 'assets', 'narracao.js'), 'w').write('window.NARR = ' + json.dumps(rel, ensure_ascii=False) + ';\nwindow.WORDS = ' + json.dumps(words, ensure_ascii=False) + ';\n')
open(os.path.join(VAR, 'index.html'), 'w').write(f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>{os.path.basename(VAR.rstrip('/'))}</title>
<link rel="stylesheet" href="../../shared/lib.css">
<link rel="stylesheet" href="../../temas/{tema}.css">
<script>window.ASSETS = '../../assets/';</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="../../assets/meta.js"></script>
<script src="./assets/narracao.js"></script>
<script src="../../shared/lib.js"></script>
<script src="../../temas/{tema}.js"></script>
</head>
<body>
<div id="frame"></div>
<script src="plano.js"></script>
</body>
</html>
""")
print(VAR, tema, rel['duracao'], 's')
