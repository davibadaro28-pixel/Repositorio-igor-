#!/bin/bash
# Monta o site da Sua Hamburgueria em dist/ (pasta estática, pronta para publicar em qualquer hospedagem).
# Junta o código do site, as bibliotecas (GSAP e three.js), telas reais do sistema, fotos, vídeos
# dos anúncios (comprimidos e sem som) e a demonstração do sistema que roda no navegador.
#
# Uso: ./montar.sh [pasta-com-os-videos-9x16]
#   Os vídeos vêm do render de marketing/videos-hamburgueria (V07, V47, V02, V03, V11, V22).
#   Sem a pasta, o site é montado sem a faixa de vídeos.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(cd "$AQUI/../.." && pwd)"
DIST="$AQUI/dist"
VIDEOS="${1:-}"

rm -rf -- "${DIST:?}"
mkdir -p "$DIST"/{vendor,img,telas,videos,fontes}

# código do site
cp "$AQUI"/index.html "$AQUI"/site.css "$AQUI"/site.js "$AQUI"/burger3d.js "$DIST"/
cp "$AQUI"/fontes/* "$DIST"/fontes/

# bibliotecas (instaladas em marketing/videos-hamburgueria/node_modules)
NM="$RAIZ/marketing/videos-hamburgueria/node_modules"
[ -d "$NM/three" ] || (cd "$RAIZ/marketing/videos-hamburgueria" && npm install --no-audit --no-fund)
cp "$NM/gsap/dist/gsap.min.js" "$NM/gsap/dist/ScrollTrigger.min.js" "$DIST"/vendor/
cp "$NM/three/build/three.module.min.js" "$DIST"/vendor/
cp "$NM/three/build/three.core.min.js" "$DIST"/vendor/ 2>/dev/null || true
cp "$NM/three/examples/jsm/environments/RoomEnvironment.js" "$DIST"/vendor/

# marca e fotos dos lanches
L="$RAIZ/lojas/sua-hamburgueria/public/img"
cp "$L/logo.webp" "$L/icon-192.png" "$L/icon-512.png" "$L/favicon.png" "$DIST"/img/
for f in cheese-bacon smash-duplo combo-casal monstro-duplo; do cp "$L/produtos/$f.webp" "$DIST"/img/; done

# telas reais do sistema (capturadas da loja de demonstração), em webp
T="$RAIZ/marketing/videos-hamburgueria/telas"
python3 - "$T" "$DIST/telas" <<'PY'
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
desk = ['d_pedidos_depois', 'k01_cozinha', 'd_cmv', 'd_caixa', 'd_clientes', 'd_relatorios_longo']
mob = ['p01_menu', 'p02_produto', 'p10_endereco', 'p12_recebido', 'p15_saiu', 'm_inicio', 'e01_entregador']
for n in desk:
    im = Image.open(f'{src}/{n}.jpg').convert('RGB')
    if n == 'd_relatorios_longo':
        im = im.crop((0, 0, im.width, 1800))
    im.thumbnail((1600, 1600)); im.save(f'{dst}/{n}.webp', quality=82)
for n in mob:
    im = Image.open(f'{src}/{n}.jpg').convert('RGB'); im.thumbnail((600, 1300)); im.save(f'{dst}/{n}.webp', quality=84)
print(len(desk) + len(mob), 'telas')
PY

# vídeos dos anúncios: 540x960, sem som (tocam mudos e em loop)
if [ -n "$VIDEOS" ] && [ -d "$VIDEOS" ]; then
  for v in V07 V47 V02 V03 V11 V22; do
    # só a versão 9:16 (a pasta pode ter também a 4:5 com o mesmo código)
    f=$(ls "$VIDEOS"/$v-9x16.mp4 "$VIDEOS"/$v-*-9x16.mp4 "$VIDEOS"/$v-*.mp4 2>/dev/null | grep -v 4x5 | head -1 || true)
    [ -n "$f" ] || continue
    ffmpeg -v error -y -i "$f" -an -vf scale=540:960,setsar=1 -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart "$DIST/videos/$v.mp4"
    ffmpeg -v error -y -ss 1.6 -i "$f" -frames:v 1 -vf scale=540:960,setsar=1 -q:v 4 "$DIST/videos/$v.jpg"
  done
fi

# demonstração do sistema (roda inteira no navegador, com dados de exemplo)
(cd "$RAIZ" && node preview/build.mjs "$DIST/demo" --loja=sua-hamburgueria >/dev/null)
# a demonstração do site não mostra integrações de apps nem nota fiscal (ainda não são oferecidas)
python3 - "$DIST/demo/index.html" <<'PY'
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
css = '<style>a[href*="integracoes"],a[href*="fiscal"]{display:none!important}</style>'
if css not in s: s = s.replace('</head>', css + '</head>', 1)
open(p, 'w', encoding='utf-8').write(s)
PY

du -sh "$DIST"
echo "site em $DIST"
