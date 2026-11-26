"""Monta a pasta de entrega dos vídeos: 9:16 e 4:5 com nome legível, planilha com os textos e visão geral.

Uso: python3 entregar.py <pasta-final> <pasta-entrega>          (50 anúncios para hamburguerias, V01…V50)
     python3 entregar.py <pasta-final> <pasta-entrega> pro      (12 vídeos da Sua Hamburgueria, P01…P12)
"""
import csv
import json
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

AQUI = Path(__file__).resolve().parent


def slug(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')[:40]


def duracao(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)], capture_output=True, text=True)
    return float(r.stdout.strip())


CONJ = {
    'v': {'textos': 'textos.json', 'titulo': 'Textos dos 50 vídeos (hamburguerias)', 'cols': 10,
          'msg': 'Oi! Vi o vídeo ({vid}) e quero saber mais sobre o sistema.'},
    'pro': {'textos': 'textos_pro.json', 'titulo': 'Textos dos 12 vídeos da Sua Hamburgueria', 'cols': 6,
            'msg': 'Oi! Vi o vídeo ({vid}) e quero saber mais sobre a Sua Hamburgueria.'},
}


def main(final, out, conj='v'):
    final, out, cf = Path(final), Path(out), CONJ[conj]
    textos = json.loads((AQUI / 'roteiros' / cf['textos']).read_text())
    if out.exists():
        shutil.rmtree(out)
    p916, p45 = out / 'Reels e Stories 9x16 (1080x1920)', out / 'Feed 4x5 (1080x1350)'
    p916.mkdir(parents=True)
    p45.mkdir(parents=True)
    linhas, capas = [], []
    for vid, tx in textos.items():
        nome = f'{vid}-{slug(tx["angulo"])}'
        a, b = final / f'{vid}-9x16.mp4', final / f'{vid}-4x5.mp4'
        if not a.exists():
            print('faltou', vid)
            continue
        shutil.copy(a, p916 / f'{nome}.mp4')
        shutil.copy(b, p45 / f'{nome}.mp4')
        capa = final / f'{vid}-capa.jpg'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1.6', '-i', str(a), '-frames:v', '1', '-q:v', '3', str(capa)], check=True)
        capas.append((vid, tx['angulo'], capa))
        linhas.append({'id': vid, 'angulo': tx['angulo'], 'arquivo': nome + '.mp4', 'duracao_s': f'{duracao(a):.1f}'.replace('.', ','),
                       'texto_principal': tx['texto'], 'titulo': tx['titulo'], 'descricao': tx['desc'],
                       'botao': 'Enviar mensagem (WhatsApp)', 'mensagem_pronta': cf['msg'].format(vid=vid)})
    with open(out / 'Textos dos anúncios.csv', 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0].keys()), delimiter=';')
        w.writeheader()
        w.writerows(linhas)
    md = [f'# {cf["titulo"]}', '',
          'Cada vídeo tem duas versões com o mesmo nome: 9:16 (Reels e Stories) e 4:5 (Feed).',
          'Botão em todos: **Enviar mensagem** (WhatsApp). A mensagem pronta traz o código do vídeo.', '']
    for l in linhas:
        md += [f'## {l["id"]} · {l["angulo"]} ({l["duracao_s"]} s)', '', f'*Arquivo:* `{l["arquivo"]}`', '',
               '**Texto principal**', '', l['texto_principal'].replace('\n', '  \n'), '',
               f'**Título:** {l["titulo"]}  ', f'**Descrição:** {l["descricao"]}  ', f'**Mensagem pronta:** {l["mensagem_pronta"]}', '']
    (out / 'Textos dos anúncios.md').write_text('\n'.join(md), encoding='utf-8')
    # visão geral
    tw, th, cols = 216, 384, cf['cols']
    rows = (len(capas) + cols - 1) // cols
    g = Image.new('RGB', (cols * (tw + 10) + 10, rows * (th + 34) + 10), '#ffffff')
    d = ImageDraw.Draw(g)
    try:
        fonte = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 13)
    except OSError:
        fonte = ImageFont.load_default()
    for i, (vid, ang, capa) in enumerate(capas):
        x, y = 10 + (i % cols) * (tw + 10), 10 + (i // cols) * (th + 34)
        g.paste(Image.open(capa).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + 22))
        d.text((x, y + 4), f'{vid} · {ang}'[:30], fill='#222', font=fonte)
        capa.unlink()
    g.save(out / 'Visão geral.jpg', quality=86)
    shutil.copy(AQUI / ('COMO-SUBIR-PRO.md' if conj == 'pro' else 'COMO-SUBIR.md'), out / 'Como subir no Meta Ads.md')
    print(len(linhas), 'vídeos em', out)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], *(sys.argv[3:4]))
