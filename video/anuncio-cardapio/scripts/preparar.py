"""Prepara os arquivos da composição: telas capturadas em WebP, fotos dos produtos e as medidas (meta.js).
Uso: python3 preparar.py <pasta-das-capturas> <pasta-comp/assets>
"""
import json
import os
import shutil
import sys

from PIL import Image

cap, out = sys.argv[1], sys.argv[2]
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
os.makedirs(os.path.join(out, 'cap'), exist_ok=True)
os.makedirs(os.path.join(out, 'fotos'), exist_ok=True)

for name in sorted(os.listdir(cap)):
    if not name.endswith('.png'):
        continue
    im = Image.open(os.path.join(cap, name)).convert('RGB')
    im.save(os.path.join(out, 'cap', name.replace('.png', '.webp')), 'WEBP', quality=94, method=6)

# Fotos reais dos produtos do cardápio de exemplo (sem marcas de terceiros)
FOTOS = [
    'bolo-premium-brigadeiro-com-morango', 'brownie-ninho-com-nutella', 'bombom-de-morango-chocolate',
    'fatia-ninho-c-frutas-vermelhas', 'bolo-de-cenoura-com-calda', 'cookie-nutella', 'tortinha-de-morango',
    'pudim-tradicional', 'bolo-premium-ninho-com-morango', 'fatia-brigadeiro-de-chocolate', 'brownie-brigadeiro-ao-leite',
    'bolo-premium-prestigio',
]
for f in FOTOS:
    shutil.copy(os.path.join(root, 'lojas', 'lacos-de-mae', 'public', 'img', 'produtos', f + '.webp'), os.path.join(out, 'fotos', f + '.webp'))

meta = json.load(open(os.path.join(cap, 'meta.json')))
open(os.path.join(out, 'meta.js'), 'w').write('window.META = ' + json.dumps(meta) + ';\n')
print('ok', len(os.listdir(os.path.join(out, 'cap'))), 'telas,', len(FOTOS), 'fotos')
