"""Recorta as telas reais do sistema para os criativos.

Entrada: pasta com os prints (capturados do sistema rodando em modo demonstração:
LOJA=sua-hamburgueria e DEMO_MARCA=generica). Painel em 1440x900 com escala 2;
celular em 390x844 com escala 3.
Saída: telas/<nome>.jpg

Os recortes evitam o menu lateral e os trechos que mostram iFood/99Food
(integração que não entra nos anúncios).

Uso: python3 recortes.py <pasta-prints> <pasta-saida>
"""
import sys
from pathlib import Path
from PIL import Image

# painel: (arquivo, x, y, largura, altura) em pixels de tela (1440x900)
DESK = {
    'hb_inicio': ('hb-d-inicio', 256, 60, 1184, 600),
    'hb_pedidos': ('hb-d-pedidos', 256, 80, 1184, 460),
    'hb_cozinha': ('hb-d-cozinha', 256, 80, 784, 820),
    'hb_caixa': ('hb-d-caixa', 256, 60, 1184, 250),
    'hb_cmv': ('hb-d-cmv', 256, 60, 1184, 840),
    'hb_clientes': ('hb-d-clientes', 256, 60, 1184, 840),
    'hb_cupons': ('hb-d-cupons', 256, 60, 1184, 280),
    'hb_relatorios': ('hb-d-relatorios', 256, 60, 1184, 400),
    'hb_produtos': ('hb-d-produtos', 256, 60, 1184, 840),
    'hb_pdv': ('hb-d-pdv', 256, 0, 1184, 900),
    'hb_contas': ('hb-d-financeiro', 256, 60, 1184, 840),
    'hb_fluxo': ('hb-d-fin-fluxo', 256, 40, 1184, 620),
    'hb_usuarios': ('hb-d-usuarios', 256, 40, 1184, 290),
    'hb_estoque_baixo': ('hb-d-inicio', 660, 688, 392, 122),
    'dc_inicio': ('dc-d-inicio', 256, 60, 1184, 600),
    'dc_encomendas': ('dc-d-encomendas', 256, 60, 1184, 600),
    'dc_aniversariantes': ('dc-d-aniversariantes', 256, 60, 1184, 420),
    'dc_clientes': ('dc-d-clientes', 256, 60, 1184, 840),
    'dc_cozinha': ('dc-d-cozinha', 256, 80, 790, 740),
    'dc_caixa': ('dc-d-caixa', 256, 60, 1184, 250),
    'dc_estoque': ('dc-d-estoque', 256, 60, 1184, 840),
    'dc_estoque_baixo': ('dc-d-inicio', 1048, 698, 392, 95),
    # recortes mais fechados: texto da tela legível no celular de quem vê o anúncio
    'hb_pedidos_z': ('hb-d-pedidos', 256, 80, 614, 460),
    'hb_cmv_z': ('hb-d-cmv', 256, 150, 1068, 540),
    'hb_clientes_z': ('hb-d-clientes', 256, 160, 744, 480),
    'hb_clientes_w': ('hb-d-clientes', 256, 160, 1184, 540),
    'hb_relatorios_z': ('hb-d-relatorios', 256, 60, 924, 410),
    'hb_produtos_z': ('hb-d-produtos', 590, 60, 850, 720),
    'hb_contas_z': ('hb-d-financeiro', 256, 160, 944, 560),
    'hb_caixa_z': ('hb-d-caixa', 256, 60, 1184, 200),
    'hb_cupons_z': ('hb-d-cupons', 256, 60, 1184, 230),
    'dc_encomendas_z': ('dc-d-encomendas', 256, 60, 594, 580),
    'dc_aniversariantes_z': ('dc-d-aniversariantes', 256, 160, 944, 320),
    'dc_estoque_z': ('dc-d-estoque', 256, 160, 744, 600),
    'dc_caixa_z': ('dc-d-caixa', 256, 60, 1184, 200),
}

# celular: (arquivo, altura máxima em pixels de tela, ou None = inteira)
MOB = {
    'hb_menu': ('hb-menu-top', None),
    'hb_produto': ('hb-produto', None),
    'hb_combo': ('hb-combo', None),
    'hb_combo2': ('hb-combo2', None),
    'hb_sacola': ('hb-sacola-barra', None),
    'hb_checkout': ('hb-checkout', None),
    'hb_checkout2': ('hb-checkout2', None),
    'hb_acompanhar': ('hb-acompanhar', None),
    'hb_m_inicio': ('hb-m-inicio', None),
    'hb_m_relatorios': ('hb-m-relatorios', None),
    'hb_m_pedidos': ('hb-m-pedidos', 560),  # corta antes do card com selo do iFood
    'dc_menu': ('dc-menu-top', None),
    'dc_produto': ('dc-produto', None),
    'dc_checkout': ('dc-checkout', None),
    'dc_m_inicio': ('dc-m-inicio', None),
}


def main(src, dst):
    src, dst = Path(src), Path(dst)
    dst.mkdir(parents=True, exist_ok=True)
    for name, (f, x, y, w, h) in DESK.items():
        im = Image.open(src / f'{f}.png').convert('RGB')
        im.crop((x * 2, y * 2, (x + w) * 2, (y + h) * 2)).save(dst / f'{name}.jpg', quality=90)
    for name, (f, hmax) in MOB.items():
        im = Image.open(src / f'{f}.png').convert('RGB')
        if hmax:
            im = im.crop((0, 0, im.width, hmax * 3))
        im = im.resize((780, round(im.height * 780 / im.width)), Image.LANCZOS)
        im.save(dst / f'{name}.jpg', quality=90)
    print(len(DESK) + len(MOB), 'telas em', dst)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
