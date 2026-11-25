"""Monta a pasta de entrega: imagens com nome legível, planilha com os textos e visão geral.

Uso: python3 entregar.py <pasta-png> <pasta-saida>
"""
import csv
import re
import shutil
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from criativos import C

PUB = {'hb': 'Hamburguerias', 'dc': 'Docerias e confeitarias', 'g': 'Lojas de comida (geral)'}
CONSC = {'frio': 'Não sabe que tem o problema', 'problema': 'Sente o problema', 'solucao': 'Procura solução',
         'produto': 'Já conhece / quer preço'}


def slug(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')[:40]


def limpa(t):
    return re.sub(r'</?em>', '', t)


def main(png, out):
    png, out = Path(png), Path(out)
    if out.exists():
        shutil.rmtree(out)
    pastas = {'feed': out / 'Feed 4x5 (1080x1350)', 'stories': out / 'Stories e Reels 9x16 (1080x1920)'}
    for p in pastas.values():
        p.mkdir(parents=True)

    linhas = []
    for c in C:
        nome = f'{c["id"]}-{slug(c["angulo"])}'
        for fmt, pasta in pastas.items():
            shutil.copy(png / f'{c["id"]}-{fmt}.png', pasta / f'{nome}.png')
        linhas.append({
            'id': c['id'],
            'publico': PUB[c['pub']],
            'angulo': c['angulo'],
            'temperatura': CONSC[c['consciencia']],
            'arquivo': nome + '.png',
            'texto_principal': c['texto'],
            'titulo': c['titulo'],
            'descricao': c['desc'],
            'botao': 'Enviar mensagem (WhatsApp)',
            'mensagem_pronta': f'Oi! Vi o anúncio ({c["id"]}) e quero saber mais sobre o sistema.',
            'texto_da_imagem': ' '.join(x for x in (c.get('nota'), c.get('pergunta'), c.get('big'), limpa(c['hook'])) if x),
        })

    campos = list(linhas[0].keys())
    with open(out / 'Textos dos anúncios.csv', 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=campos, delimiter=';')
        w.writeheader()
        w.writerows(linhas)

    md = ['# Textos dos 50 anúncios', '',
          'Cada anúncio tem duas imagens com o mesmo nome: uma na pasta Feed 4x5 e outra na pasta Stories e Reels 9x16.',
          'Botão em todos: **Enviar mensagem** (WhatsApp). A mensagem pronta traz o código do anúncio, para você saber '
          'de qual anúncio veio cada conversa.', '']
    for grupo in ('hb', 'dc', 'g'):
        md += [f'## {PUB[grupo]}', '']
        for l, c in zip(linhas, C):
            if c['pub'] != grupo:
                continue
            md += [f'### {l["id"]} · {l["angulo"]}', '',
                   f'*Imagem:* `{l["arquivo"]}` · *Público:* {l["temperatura"].lower()}', '',
                   '**Texto principal**', '', l['texto_principal'].replace('\n', '  \n'), '',
                   f'**Título:** {l["titulo"]}  ', f'**Descrição:** {l["descricao"]}  ',
                   f'**Mensagem pronta:** {l["mensagem_pronta"]}', '']
    (out / 'Textos dos anúncios.md').write_text('\n'.join(md), encoding='utf-8')

    # visão geral: todas as artes de feed numa folha só
    tw, th, pad, cols = 270, 338, 14, 8
    rows = (len(C) + cols - 1) // cols
    g = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + 40) + pad), '#ffffff')
    d = ImageDraw.Draw(g)
    try:
        fonte = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    except OSError:
        fonte = ImageFont.load_default()
    for i, c in enumerate(C):
        x, y = pad + (i % cols) * (tw + pad), pad + (i // cols) * (th + 40)
        g.paste(Image.open(png / f'{c["id"]}-feed.png').convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + 30))
        d.text((x, y + 4), c['id'] + ' · ' + c['angulo'][:24], fill='#222', font=fonte)
    g.save(out / 'Visão geral.jpg', quality=88)
    print(len(linhas), 'anúncios em', out)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
