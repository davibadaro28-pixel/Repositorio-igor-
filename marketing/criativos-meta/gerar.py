"""Gera os criativos (HTML) a partir de criativos.py, nos formatos feed (1080x1350) e stories (1080x1920).

Uso: python3 gerar.py <pasta-html>      (depois: node render.cjs <pasta-html> <pasta-png>)
"""
import html
import json
import re
import sys
from pathlib import Path

from PIL import Image

from criativos import C

AQUI = Path(__file__).resolve().parent
TELAS = AQUI / 'telas'
LOGO_APP = AQUI.parent.parent / 'lojas' / 'sua-hamburgueria' / 'public' / 'img' / 'icon-512.png'

FORMATOS = {'feed': (1080, 1350), 'stories': (1080, 1920)}
TAG = {'hb': 'Para hamburguerias', 'dc': 'Para docerias e confeitarias', 'g': 'Para lojas de comida'}

# ---------------------------------------------------------------- ícones

I_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
I_X = '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>'
I_CHAT = ('<svg viewBox="0 0 32 32"><path d="M16 3C8.8 3 3 8.6 3 15.5c0 2.6.8 5 2.2 7L4 29l6.8-1.9c1.6.8 3.4 1.2 5.2 1.2 7.2 0 13-5.6 13-12.5S23.2 3 16 3z" fill="currentColor"/>'
          '<path d="M11.6 10.4c.4 0 .7 0 .9.6l1.1 2.6c.1.3.1.6-.1.8l-.8 1c-.2.2-.2.5 0 .8.8 1.3 1.9 2.4 3.3 3.2.3.2.6.1.8-.1l.9-1.1c.2-.3.5-.3.8-.2l2.5 1.2c.3.1.5.4.4.8-.2 1.4-1.5 2.4-2.9 2.3-4.3-.4-8.4-4.4-8.8-8.6-.1-1.6.8-3.2 1.9-3.3z" fill="var(--ac)"/></svg>')
I_PIN = '<svg viewBox="0 0 24 24"><path d="M12 22s7-6.3 7-12a7 7 0 10-14 0c0 5.7 7 12 7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.6" fill="var(--card)"/></svg>'

# ---------------------------------------------------------------- utilidades

_tam = {}


def tam(nome):
    if nome not in _tam:
        with Image.open(TELAS / f'{nome}.jpg') as im:
            _tam[nome] = im.size
    return _tam[nome]


def src(nome):
    return (TELAS / f'{nome}.jpg').as_uri()


def esc(t):
    return html.escape(t, quote=False)


def rich(t):
    """Texto do gancho: escapa e mantém <em>…</em>."""
    return esc(t).replace('&lt;em&gt;', '<em>').replace('&lt;/em&gt;', '</em>')


_cor = {}


def cor_topo(nome):
    """Cor do alto da tela, para a barra de status do celular não cobrir o conteúdo."""
    if nome not in _cor:
        with Image.open(TELAS / f'{nome}.jpg') as im:
            r, g, b = im.convert('RGB').resize((1, 1), box=(0, 0, im.width, 8)).getpixel((0, 0))
        _cor[nome] = (f'#{r:02x}{g:02x}{b:02x}', '#fff' if (0.299 * r + 0.587 * g + 0.114 * b) < 150 else '#111')
    return _cor[nome]


def phone(nome, w, rolar=0.0, corte=None):
    iw, ih = tam(nome)
    inner = w - 28
    nat = inner * ih / iw
    alt = nat * (1 - rolar)
    if corte:
        alt = min(alt, corte)
    fundo, tinta = cor_topo(nome)
    return (f'<div class="phone" style="width:{w}px"><div class="scr" style="height:{alt + 50:.0f}px;background:{fundo}">'
            f'<div class="sb" style="color:{tinta}"><span>20:47</span><span class="sbi"><i></i><i></i><i></i><b></b></span></div>'
            f'<img src="{src(nome)}" style="margin-top:{-rolar * nat:.0f}px"></div></div>')


def browser(nome, destaque=None, largura=None, alt_max=None):
    hl = ''
    if destaque:
        x, y, w, h, rot = destaque
        acima = (y + h) > 0.8
        pos = f'top:calc({y * 100:.1f}% - 62px)' if acima else f'top:calc({(y + h) * 100:.1f}% + 14px)'
        hl = (f'<div class="hl" style="left:{x * 100:.1f}%;top:{y * 100:.1f}%;width:{w * 100:.1f}%;height:{h * 100:.1f}%"></div>'
              f'<div class="hl-rot" style="left:{max(0, min(x, 0.62)) * 100:.1f}%;{pos}">{esc(rot)}</div>')
    st = []
    if largura:
        st.append(f'width:{largura}px')
    if alt_max:
        st.append(f'max-height:{alt_max}px')
    iw, ih = tam(nome)
    return (f'<div class="browser" data-ar="{iw / ih:.4f}" style="{";".join(st)}"><div class="bar"><i></i><i></i><i></i><b></b></div>'
            f'<div class="shot"><img src="{src(nome)}">{hl}</div></div>')


def checks(itens, icone=I_CHECK, cls='ok'):
    return '<ul class="checks ' + cls + '">' + ''.join(f'<li><span class="ic">{icone}</span><span>{esc(i)}</span></li>' for i in itens) + '</ul>'


def lbl(t='Tela real do sistema · dados de demonstração'):
    return f'<div class="lbl"><span class="dot"></span>{esc(t)}</div>'


def foot(col=False):
    return (f'<div class="foot{" col" if col else ""}"><div class="what">Cardápio digital + sistema de gestão</div>'
            f'<div class="cta">{I_CHAT}<span>Chame no WhatsApp</span></div></div>')


def head(c, cls='hook', maxh=None):
    m = f' data-max="{maxh}"' if maxh else ''
    return f'<h1 class="{cls}"{m}>{rich(c["hook"])}</h1>'


def sub(c, maxh=None):
    if not c.get('sub'):
        return ''
    m = f' data-max="{maxh}"' if maxh else ''
    return f'<p class="sub"{m}>{esc(c["sub"])}</p>'


# ---------------------------------------------------------------- layouts
# Cada layout devolve o miolo; o "tag" fica fora. fmt = 'feed' | 'stories'

def L_desk(c, fmt):
    st = fmt == 'stories'
    extra = ''
    if c.get('itens'):
        extra = '<div class="chips">' + ''.join(f'<span>{I_CHECK}{esc(i)}</span>' for i in c['itens']) + '</div>'
    larg = 700 if c.get('estreito') else None
    return (f'<div class="txt">{head(c, maxh=330 if st else 250)}{sub(c, 150 if st else 92)}{extra}</div>'
            f'<div class="vis center">{browser(c["tela"], c.get("destaque"), larg)}</div>{lbl()}{foot()}')


def L_phone(c, fmt):
    st = fmt == 'stories'
    w = 470
    side = checks(c.get('itens', [])) if c.get('itens') else ''
    return (f'<div class="g2"><div class="txt">{head(c, maxh=380 if st else 430)}{sub(c, 170 if st else 190)}</div>'
            f'<div class="side">{side}</div>{foot(col=True)}'
            f'<div class="vis">{lbl()}{phone(c["tela"], w, c.get("rolar", 0))}</div></div>')


def L_big(c, fmt):
    st = fmt == 'stories'
    return (f'<div class="g2"><div class="txt"><div class="bignum">{esc(c["big"])}</div>{head(c, maxh=330 if st else 300)}'
            f'{sub(c, 170 if st else 170)}</div><div class="side"></div>{foot(col=True)}'
            f'<div class="vis">{lbl()}{phone(c["tela"], 440 if st else 400, corte=760 if st else None)}</div></div>')


def L_chat(c, fmt):
    st = fmt == 'stories'
    bolhas = ''.join(f'<div class="bub {"cli" if q == "c" else "loja"}">{esc(t)}</div>' for q, t in c['chat'])
    return (f'<div class="g2 chatg"><div class="txt">{head(c, maxh=340 if st else 300)}</div>'
            f'<div class="side"><div class="chat">{bolhas}</div>{lbl("Ilustração")}{sub(c, 120)}</div>{foot(col=True)}'
            f'<div class="vis">{lbl()}{phone(c["tela"], 440 if st else 390)}</div></div>')


def L_note(c, fmt):
    st = fmt == 'stories'
    nome = c['tela']
    pequeno = 'estoque_baixo' in nome
    iw, ih = tam(nome)
    if iw / ih > 3:
        pequeno = True
    larg = 952 if iw / ih > 3 else 760
    vis = (f'<div class="card-tela" style="width:{larg}px">{browser(nome, largura=larg)}</div>' if pequeno else browser(nome))
    return (f'<div class="postit"><span>{esc(c["nota"])}</span></div>'
            f'<div class="txt">{head(c, maxh=300 if st else 210)}{sub(c, 120 if st else 90)}</div>'
            f'<div class="vis center">{vis}</div>{lbl()}{foot()}')


def L_lista(c, fmt):
    st = fmt == 'stories'
    itens = ''.join(f'<li><span class="n">{i + 1}</span><span>{esc(t)}</span></li>' for i, t in enumerate(c['itens']))
    return (f'<div class="txt">{head(c, maxh=420 if st else 330)}</div><div class="grow"></div><ol class="steps">{itens}</ol>'
            f'<div class="vis"></div>{sub(c, 120)}{foot()}')


def L_check(c, fmt):
    st = fmt == 'stories'
    return (f'<div class="txt">{head(c, maxh=260 if st else 200)}</div><div class="grow"></div>{checks(c["itens"], I_X, "no big")}'
            f'<div class="fecho">{I_CHECK}<span>{esc(c["fecho"])}</span></div><div class="vis"></div>{foot()}')


def L_preco(c, fmt):
    st = fmt == 'stories'
    card = (f'<div class="pcard"><div class="pn">{esc(c["plano"])}</div>'
            f'<div class="pv"><small>R$</small><b>{esc(c["preco"])}</b><small>/mês</small></div>'
            f'{checks(c["itens"])}<div class="pnote">{esc(c["nota"])}</div></div>')
    return (f'<div class="g2"><div class="txt">{head(c, maxh=260 if st else 300)}</div><div class="side">{card}</div>'
            f'{foot(col=True)}<div class="vis">{lbl()}{phone(c["tela"], 420 if st else 380)}</div></div>')


def L_planos(c, fmt):
    st = fmt == 'stories'
    P = [('Cardápio digital', '199,90', 'Cardápio com fotos, pedidos no painel, link e QR Code', False),
         ('Sistema + cardápio em site', '299,90', 'Tudo do cardápio + balcão, caixa, cozinha, estoque, financeiro e relatórios', True),
         ('Sistema + cardápio em app', '599,90', 'Tudo do sistema + app com o ícone da sua loja no celular do cliente', False)]
    cards = ''.join(
        f'<div class="plan{" top" if t else ""}">{"<em class=sel>Mais escolhido</em>" if t else ""}'
        f'<div class="pl"><div class="pn">{esc(n)}</div><div class="pd">{esc(d)}</div></div>'
        f'<div class="pv"><small>R$</small><b>{p}</b><small>/mês</small></div></div>' for n, p, d, t in P)
    return (f'<div class="txt">{head(c, maxh=240)}</div><div class="grow"></div><div class="plans">{cards}</div>'
            f'<div class="pfoot">Sem comissão por pedido · Montagem do cardápio inclusa · Suporte pelo WhatsApp</div>'
            f'<div class="vis"></div>{foot()}')


def L_split(c, fmt):
    st = fmt == 'stories'
    ra, rd = c.get('rotulos', ('Antes', 'Depois'))
    antes = ''.join(f'<li>{esc(t)}</li>' for t in c['antes'])
    depois = checks(c['depois'])
    return (f'<div class="txt">{head(c, maxh=280 if st else 200)}</div>'
            f'<div class="sp"><div class="sa"><div class="sh">{esc(ra)}</div><ul class="hand">{antes}</ul>'
            f'<div class="lbl il">Ilustração</div></div>'
            f'<div class="sd"><div class="sh">{esc(rd)}</div>{depois}<div class="mini">{phone(c["tela"], 300 if st else 260, corte=560 if st else 370)}</div></div></div>'
            f'{foot()}')


def L_bio(c, fmt):
    st = fmt == 'stories'
    perfil = ('<div class="ig"><div class="ig-top"><div class="av">SH</div><div class="ig-st">'
              '<div><b>312</b><span>posts</span></div><div><b>8.420</b><span>seguidores</span></div><div><b>156</b><span>seguindo</span></div></div></div>'
              '<div class="ig-n">sua.hamburgueria</div><div class="ig-b">Smash e artesanal · Delivery e retirada<br>Ter a dom, 18h às 23h</div>'
              '<div class="ig-l">🔗 cardapio.sualoja.com.br</div></div>')
    perfil = perfil.replace('🔗 ', '')
    return (f'<div class="g2"><div class="txt">{head(c, maxh=330 if st else 300)}{sub(c, 150)}</div>'
            f'<div class="side">{perfil}<div class="arrow">↓ toca no link, cai no cardápio</div>{lbl("Perfil: ilustração")}</div>'
            f'{foot(col=True)}<div class="vis">{lbl()}{phone(c["tela"], 420 if st else 380)}</div></div>')


def L_quiz(c, fmt):
    st = fmt == 'stories'
    stk = (f'<div class="stk"><div class="stk-h">Pergunta rápida</div><div class="stk-q">{esc(c["pergunta"])}</div>'
           f'<div class="stk-a">Toque para responder</div></div>')
    if c['tela'].startswith('hb_m_') or c['tela'] in ('hb_menu', 'dc_menu'):
        return (f'<div class="g2"><div class="txt">{stk}{head(c, maxh=300 if st else 260)}{sub(c, 130)}</div>'
                f'<div class="side"></div>{foot(col=True)}<div class="vis">{lbl()}{phone(c["tela"], 420 if st else 380)}</div></div>')
    return (f'{stk}<div class="txt">{head(c, maxh=260 if st else 180)}{sub(c, 120 if st else 90)}</div>'
            f'<div class="vis center">{browser(c["tela"])}</div>{lbl()}{foot()}')


def L_duo(c, fmt):
    st = fmt == 'stories'
    a, b = c['telas']
    w = 400 if st else 340
    corte = 860 if st else 560
    return (f'<div class="txt">{head(c, maxh=330 if st else 240)}{sub(c, 120 if st else 92)}</div>'
            f'<div class="vis duo"><div class="p1">{phone(a, w, corte=corte)}</div><div class="p2">{phone(b, w, corte=corte)}</div></div>'
            f'{lbl("Telas reais do sistema · lojas de demonstração")}{foot()}')


def L_app(c, fmt):
    st = fmt == 'stories'
    cores = ['#7aa7ff', '#ffb36b', '#7be0b0', '#c69cff', '#ff8f8f', '#6fd3e6', '#ffd56b', '#9bb0c9',
             '#b5e37a', '#f7a8d0', '#8fd0ff', '#d8b48a']
    icons = ''.join(f'<div class="ap"><i style="background:{k}"></i><span></span></div>' for k in cores[:11])
    icons = icons[:0] + ''.join(f'<div class="ap"><i style="background:{k}"></i><span></span></div>' for k in cores[:6]) + \
        f'<div class="ap me"><img src="{LOGO_APP.as_uri()}"><span>Sua loja</span></div>' + \
        ''.join(f'<div class="ap"><i style="background:{k}"></i><span></span></div>' for k in cores[6:11])
    home = (f'<div class="phone homeph" style="width:{420 if st else 380}px"><div class="scr home">'
            f'<div class="clock">20:47</div><div class="grid">{icons}</div></div></div>')
    card = (f'<div class="pcard"><div class="pn">{esc(c["plano"])}</div>'
            f'<div class="pv"><small>R$</small><b>{esc(c["preco"])}</b><small>/mês</small></div>'
            + checks(['Ícone e nome da sua loja', 'Abre direto no cardápio', 'Sistema completo junto']) + '</div>')
    return (f'<div class="g2"><div class="txt">{head(c, maxh=330 if st else 300)}{sub(c, 130)}</div>'
            f'<div class="side">{card}</div>{foot(col=True)}<div class="vis">{lbl("Ilustração")}{home}</div></div>')


def L_colagem(c, fmt):
    st = fmt == 'stories'
    cel = []
    for nome, rot in c['telas']:
        cel.append(f'<div class="cg"><div class="cgi"><img src="{src(nome)}"></div><div class="cgr">{esc(rot)}</div></div>')
    return (f'<div class="txt">{head(c, maxh=320 if st else 220)}</div><div class="vis cgrid">{"".join(cel)}</div>'
            f'{lbl()}{foot()}')


LAYOUTS = {k[2:]: v for k, v in globals().items() if k.startswith('L_')}

# ---------------------------------------------------------------- CSS

CSS = r"""
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:var(--W);height:var(--H);overflow:hidden}
body{font-family:Poppins,sans-serif;-webkit-font-smoothing:antialiased}
.pub-hb.tema-escuro{--bg:#15100c;--tx:#fff6ec;--mu:#d8c4b0;--ac:#ff6a1f;--ac2:#ffc23d;--card:#231a13;--line:rgba(255,255,255,.12);--ctatx:#1a0f08;--paper:#fffaf0}
.pub-hb.tema-claro{--bg:#f7efe5;--tx:#1d130c;--mu:#6d5847;--ac:#e2520f;--ac2:#c98a00;--card:#ffffff;--line:rgba(0,0,0,.09);--ctatx:#ffffff;--paper:#fffdf7}
.pub-dc.tema-escuro{--bg:#4a0f2a;--tx:#fff3f7;--mu:#f1c6d6;--ac:#ff9cc2;--ac2:#ffd27a;--card:#5d1838;--line:rgba(255,255,255,.14);--ctatx:#4a0f2a;--paper:#fffaf3}
.pub-dc.tema-claro{--bg:#fcf0f3;--tx:#3d0d22;--mu:#7d5566;--ac:#b8235f;--ac2:#d48a1a;--card:#ffffff;--line:rgba(0,0,0,.08);--ctatx:#ffffff;--paper:#fffdf7}
.pub-g.tema-escuro{--bg:#1c2040;--tx:#ffffff;--mu:#c4c7e0;--ac:#ff8a4c;--ac2:#7ce0c3;--card:#272c55;--line:rgba(255,255,255,.13);--ctatx:#1c2040;--paper:#fffdf6}
.pub-g.tema-claro{--bg:#f3f1ec;--tx:#1b1d2b;--mu:#5d6072;--ac:#e8632b;--ac2:#2f6fd6;--card:#ffffff;--line:rgba(0,0,0,.08);--ctatx:#ffffff;--paper:#fffdf7}

.c{position:relative;width:var(--W);height:var(--H);overflow:hidden;color:var(--tx);display:flex;flex-direction:column;
  padding:var(--pt) 64px var(--pb);background:
  radial-gradient(900px 760px at 105% -5%, color-mix(in srgb,var(--ac) 26%,transparent), transparent 62%),
  radial-gradient(760px 760px at -10% 105%, color-mix(in srgb,var(--ac2) 12%,transparent), transparent 60%), var(--bg)}
.tema-claro .c{background:radial-gradient(900px 760px at 105% -5%, color-mix(in srgb,var(--ac) 14%,transparent), transparent 62%),
  radial-gradient(760px 760px at -10% 105%, color-mix(in srgb,var(--ac2) 10%,transparent), transparent 60%), var(--bg)}
.fmt-feed{--pt:58px;--pb:52px}
.fmt-stories{--pt:200px;--pb:300px}

.tag{align-self:flex-start;display:inline-flex;align-items:center;gap:10px;font:700 20px/1 Poppins;letter-spacing:.16em;text-transform:uppercase;
  color:var(--ac);background:color-mix(in srgb,var(--ac) 14%,transparent);padding:11px 18px;border-radius:999px;margin-bottom:26px;flex:none}
.tag:before{content:"";width:9px;height:9px;border-radius:50%;background:var(--ac)}

.hook{font-size:var(--hs);color:var(--tx)}
.hook em{color:var(--ac)}
.pub-hb .hook{font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;line-height:1.02;letter-spacing:.3px;--hs:104px}
.pub-hb .hook em{font-style:normal}
.pub-dc .hook{font-family:'Playfair Display',Georgia,serif;font-weight:800;line-height:1.08;--hs:80px}
.pub-dc .hook em{font-style:italic}
.pub-g .hook{font-family:Poppins;font-weight:800;line-height:1.07;letter-spacing:-1.6px;--hs:74px}
.pub-g .hook em{font-style:normal}
.g2 .hook{--hs:86px}
.pub-dc .g2 .hook{--hs:66px}
.pub-g .g2 .hook{--hs:60px}
.sub{font-size:31px;line-height:1.36;color:var(--mu);margin-top:22px;font-weight:500}
.g2 .sub{font-size:28px}

.vis{flex:1;min-height:0;position:relative;margin-top:30px;display:flex;flex-direction:column}
.vis.center{align-items:center;justify-content:center}
.vis.top{justify-content:flex-start}
.lbl{font-size:17px;font-weight:500;color:var(--mu);opacity:.9;display:flex;align-items:center;gap:8px;margin-top:12px;flex:none}
.lbl .dot,.lbl:before{flex:none}
.lbl .dot{width:8px;height:8px;border-radius:50%;background:var(--ac)}
.lbl.il:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--mu)}

.foot{display:flex;align-items:center;justify-content:space-between;margin-top:26px;flex:none;gap:18px}
.foot.col{flex-direction:column;align-items:flex-start;gap:14px}
.what{font-size:21px;font-weight:600;color:var(--mu);letter-spacing:.01em}
.cta{display:inline-flex;align-items:center;gap:14px;background:var(--ac);color:var(--ctatx);font:700 30px/1 Poppins;
  padding:19px 34px 19px 24px;border-radius:999px;box-shadow:0 14px 34px color-mix(in srgb,var(--ac) 38%,transparent)}
.cta svg{width:40px;height:40px;color:var(--ctatx)}

/* telefone */
.phone{background:#0b0b0d;border-radius:58px;padding:14px;box-shadow:0 34px 80px rgba(0,0,0,.45),inset 0 0 0 2px #2b2b30;flex:none}
.tema-claro .phone{box-shadow:0 30px 70px rgba(40,20,10,.28),inset 0 0 0 2px #2b2b30}
.scr{border-radius:45px;overflow:hidden;position:relative;background:#fff}
.scr img{width:100%;display:block}
.scr:before{content:"";position:absolute;top:11px;left:50%;transform:translateX(-50%);width:104px;height:30px;border-radius:20px;background:#0b0b0d;z-index:2}
.sb{height:50px;display:flex;align-items:center;justify-content:space-between;padding:2px 30px 0 36px;font:600 18px/1 Poppins}
.sbi{display:flex;align-items:flex-end;gap:3px}
.sbi i{width:4px;background:currentColor;border-radius:1px}
.sbi i:nth-child(1){height:7px}.sbi i:nth-child(2){height:10px}.sbi i:nth-child(3){height:13px}
.sbi b{width:24px;height:12px;border:2px solid currentColor;border-radius:4px;margin-left:6px;position:relative}
.sbi b:after{content:"";position:absolute;inset:1px 5px 1px 1px;background:currentColor;border-radius:1px}

/* navegador */
.browser{background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.42);width:100%;max-height:100%;display:flex;flex-direction:column}
.tema-claro .browser{box-shadow:0 26px 60px rgba(40,20,10,.2);outline:1px solid var(--line)}
.bar{height:42px;background:#eeeae6;display:flex;align-items:center;gap:9px;padding:0 18px;flex:none}
.bar i{width:13px;height:13px;border-radius:50%;background:#d6d0ca}
.bar i:nth-child(1){background:#ff6058}.bar i:nth-child(2){background:#ffbd2e}.bar i:nth-child(3){background:#28c940}
.bar b{margin-left:14px;height:22px;flex:1;max-width:340px;border-radius:11px;background:#fff}
.shot{position:relative;overflow:hidden;min-height:0}
.shot img{width:100%;display:block}
.hl{position:absolute;border:5px solid var(--ac);border-radius:14px;box-shadow:0 0 0 2400px rgba(12,8,5,.3)}
.hl-rot{position:absolute;background:var(--ac);color:var(--ctatx);font:700 24px/1 Poppins;padding:12px 18px;border-radius:12px;white-space:nowrap;box-shadow:0 10px 24px rgba(0,0,0,.3)}
.card-tela{transform:rotate(-1.5deg)}
.grow{flex:1}

.chips{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
.chips span{display:inline-flex;align-items:center;gap:8px;font:600 23px/1 Poppins;padding:12px 18px 12px 14px;border-radius:999px;
  background:color-mix(in srgb,var(--ac) 14%,transparent);color:var(--tx)}
.chips svg{width:24px;height:24px;color:var(--ac)}

.checks{list-style:none;display:flex;flex-direction:column;gap:16px}
.checks li{display:flex;align-items:center;gap:16px;font:600 28px/1.25 Poppins}
.checks .ic{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--ac);color:var(--ctatx)}
.checks .ic svg{width:26px;height:26px}
.checks.no .ic{background:#e5484d;color:#fff}
.checks.big{gap:20px;margin-top:34px}
.checks.big li{font-size:38px;background:var(--card);padding:24px 28px;border-radius:22px;border:1px solid var(--line)}
.checks.big .ic{width:56px;height:56px}
.checks.big .ic svg{width:32px;height:32px}
.fecho{display:flex;align-items:center;gap:16px;margin-top:30px;font:700 34px/1.25 Poppins;color:var(--ac)}
.fecho svg{flex:none;width:48px;height:48px;padding:8px;border-radius:50%;background:var(--ac);color:var(--ctatx)}

/* duas colunas: no feed o texto fica à esquerda; nos stories o texto vai em cima */
.g2{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) var(--pw,470px);column-gap:34px;
  grid-template-areas:"txt vis" "side vis" "foot vis";grid-template-rows:auto 1fr auto}
.g2 .txt{grid-area:txt}.g2 .side{grid-area:side;min-height:0;padding-top:30px}.g2 .foot{grid-area:foot}
.g2 .vis{grid-area:vis;margin:0;align-items:center;justify-content:center;margin-right:-10px;padding-bottom:40px}
.g2 .vis .lbl{margin:0 0 12px}
.fmt-stories .g2{grid-template-areas:"txt txt" "side vis" "foot vis";--pw:470px}
.fmt-stories .g2 .vis{padding-top:34px;justify-content:flex-start;padding-bottom:0}
.fmt-stories .g2 .hook{--hs:96px}
.fmt-stories.pub-dc .g2 .hook{--hs:76px}
.fmt-stories.pub-g .g2 .hook{--hs:70px}

.bignum{white-space:nowrap;font:400 236px/0.9 Anton,Impact;color:var(--ac);letter-spacing:-4px;margin-bottom:18px}
.pub-dc .bignum{font-family:'Playfair Display';font-weight:800;font-size:200px}
.pub-g .bignum{font-family:Poppins;font-weight:800;font-size:200px;letter-spacing:-8px}

/* conversa */
.chat{display:flex;flex-direction:column;gap:14px}
.bub{max-width:92%;font:500 26px/1.3 Poppins;padding:16px 22px;border-radius:24px;background:#fff;color:#1d1d1f;box-shadow:0 6px 16px rgba(0,0,0,.12);align-self:flex-start;border-bottom-left-radius:6px}
.bub.loja{align-self:flex-end;background:#d8fdd2;border-bottom-left-radius:24px;border-bottom-right-radius:6px;font-weight:600}
.tema-claro .bub.cli{outline:1px solid var(--line)}
.chatg .side .sub{margin-top:18px}

/* post-it */
.postit{align-self:flex-start;background:#ffd84d;color:#2a2108;font:700 60px/1.06 Caveat,cursive;padding:34px 40px 38px;width:640px;
  transform:rotate(-3deg);box-shadow:0 22px 40px rgba(0,0,0,.35);margin:6px 0 34px 8px;position:relative}
.postit:before{content:"";position:absolute;top:-16px;left:50%;width:150px;height:36px;transform:translateX(-50%) rotate(2deg);background:rgba(255,255,255,.55)}
.fmt-stories .postit{font-size:70px;width:760px}
.t-note .hook{--hs:72px}
.pub-dc.t-note .hook{--hs:58px}
.pub-g.t-note .hook{--hs:56px}
.fmt-stories.t-note .hook{--hs:84px}

/* lista numerada */
.steps{list-style:none;display:flex;flex-direction:column;gap:18px;margin-top:40px}
.steps li{display:flex;align-items:center;gap:22px;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:24px 28px;font:600 34px/1.25 Poppins}
.steps .n{flex:none;width:62px;height:62px;border-radius:50%;background:var(--ac);color:var(--ctatx);display:grid;place-items:center;font:800 32px/1 Poppins}

/* preço */
.pcard{background:var(--card);border:2px solid var(--ac);border-radius:28px;padding:30px 32px;box-shadow:0 24px 50px rgba(0,0,0,.2)}
.pn{font:700 22px/1.2 Poppins;letter-spacing:.12em;text-transform:uppercase;color:var(--ac)}
.pv{display:flex;align-items:baseline;gap:8px;margin:10px 0 18px;color:var(--tx)}
.pv b{font:800 104px/1 Poppins;letter-spacing:-4px}
.pv small{font:700 30px/1 Poppins;color:var(--mu)}
.pcard .checks li{font-size:24px}
.pcard .checks .ic{width:38px;height:38px}
.pcard .checks .ic svg{width:22px;height:22px}
.pnote{margin-top:20px;font:600 22px/1.35 Poppins;color:var(--mu)}

.plans{display:flex;flex-direction:column;gap:18px;margin-top:34px}
.plan{position:relative;display:flex;align-items:center;justify-content:space-between;gap:24px;background:var(--card);border:1px solid var(--line);border-radius:26px;padding:28px 32px}
.plan.top{border:3px solid var(--ac);box-shadow:0 20px 46px rgba(0,0,0,.3)}
.plan .sel{position:absolute;top:-17px;left:30px;background:var(--ac);color:var(--ctatx);font:700 19px/1 Poppins;font-style:normal;padding:9px 14px;border-radius:999px;letter-spacing:.04em}
.plan .pd{font:500 22px/1.35 Poppins;color:var(--mu);margin-top:8px;max-width:520px}
.plan .pv{margin:0;flex:none}
.plan .pv b{font-size:70px;letter-spacing:-2px}
.plan .pv small{font-size:22px}
.pfoot{margin-top:24px;font:600 23px/1.4 Poppins;color:var(--mu)}
.fmt-stories .plans{gap:26px;margin-top:50px}
.fmt-stories .plan{flex-direction:column;align-items:flex-start;padding:34px}

/* antes x depois */
.sp{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:34px}
.sa,.sd{border-radius:26px;padding:28px;display:flex;flex-direction:column;min-height:0;overflow:hidden}
.sa{background:var(--paper) repeating-linear-gradient(transparent 0 47px,#c9d9ee 47px 49px);background-position:0 70px;color:#2b2b2b;transform:rotate(-1.2deg);box-shadow:0 18px 40px rgba(0,0,0,.25)}
.sd{background:var(--card);border:2px solid var(--ac)}
.sh{font:800 22px/1 Poppins;letter-spacing:.16em;text-transform:uppercase;margin-bottom:22px}
.sa .sh{color:#e5484d}.sd .sh{color:var(--ac)}
.hand{list-style:none;display:flex;flex-direction:column;gap:12px}
.hand li{font:700 44px/1.08 Caveat,cursive;color:#2b2b2b;text-decoration:line-through;text-decoration-color:#e5484d;text-decoration-thickness:4px}
.sa .lbl{margin-top:auto;color:#7a7a7a}
.sd .checks li{font-size:24px}
.sd .checks .ic{width:38px;height:38px}
.sd .checks .ic svg{width:22px;height:22px}
.sd .mini{margin-top:24px;display:flex;justify-content:center}

/* perfil do Instagram (ilustração) */
.ig{background:#fff;color:#111;border-radius:26px;padding:26px;box-shadow:0 20px 44px rgba(0,0,0,.3)}
.ig-top{display:flex;align-items:center;gap:22px}
.av{width:104px;height:104px;border-radius:50%;background:var(--ac);color:#fff;display:grid;place-items:center;font:800 34px/1 Poppins;box-shadow:0 0 0 4px #fff,0 0 0 7px #f28b2a}
.ig-st{display:flex;gap:18px;flex:1;justify-content:space-around}
.ig-st div{display:flex;flex-direction:column;align-items:center}
.ig-st b{font:700 26px/1 Poppins}.ig-st span{font:500 17px/1.6 Poppins;color:#555}
.ig-n{font:700 23px/1.2 Poppins;margin-top:18px}
.ig-b{font:500 21px/1.4 Poppins;color:#333;margin-top:6px}
.ig-l{font:600 21px/1.4 Poppins;color:#00376b;margin-top:6px;background:#fff3c4;display:inline-block;padding:2px 8px;border-radius:6px}
.arrow{font:700 26px/1.3 Poppins;color:var(--ac);margin:20px 0 4px}

/* pergunta (caixinha) */
.stk{width:600px;border-radius:26px;overflow:hidden;background:#fff;box-shadow:0 22px 46px rgba(0,0,0,.3);transform:rotate(-2deg);margin:4px 0 34px 6px;flex:none}
.stk-h{background:linear-gradient(90deg,#7b3fe4,#e1306c,#f58529);color:#fff;font:700 22px/1 Poppins;padding:18px 24px;letter-spacing:.04em}
.stk-q{font:800 42px/1.15 Poppins;color:#151515;padding:26px 26px 12px;letter-spacing:-.5px}
.stk-a{margin:8px 26px 24px;background:#f1f1f3;color:#8a8a8f;font:500 21px/1 Poppins;padding:16px 18px;border-radius:14px}
.fmt-stories .stk{width:700px}
.g2 .stk{width:auto;max-width:100%;transform:rotate(-1.5deg);margin-left:0}
.g2 .stk-q{font-size:36px}
.mini .sb span{visibility:hidden}
.t-quiz .hook{--hs:70px}
.pub-dc.t-quiz .hook{--hs:56px}
.pub-g.t-quiz .g2 .hook{--hs:50px}

/* dois celulares */
.duo{flex-direction:row;justify-content:center;align-items:flex-start;gap:0}
.duo .p1{transform:rotate(-5deg) translateX(30px);z-index:1}
.duo .p2{transform:rotate(5deg) translate(-30px,60px)}

/* app (ilustração) */
.home{height:var(--homeh,800px);background:linear-gradient(160deg,#ffb37a,#ff6f61 40%,#7b5cff);padding:90px 26px 0}
.homeph{--homeh:760px}
.fmt-stories .homeph{--homeh:880px}
.clock{font:600 76px/1 Poppins;color:#fff;text-align:center;margin-bottom:50px;letter-spacing:-2px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:26px 18px}
.ap{display:flex;flex-direction:column;align-items:center;gap:8px}
.ap i{width:70px;height:70px;border-radius:18px;display:block;opacity:.9;box-shadow:inset 0 -8px 0 rgba(0,0,0,.08)}
.ap span{width:54px;height:8px;border-radius:4px;background:rgba(255,255,255,.65)}
.ap.me img{width:70px;height:70px;border-radius:18px;box-shadow:0 0 0 4px #fff,0 0 0 8px var(--ac),0 12px 24px rgba(0,0,0,.35)}
.ap.me span{width:auto;height:auto;background:none;font:700 15px/1 Poppins;color:#fff;margin-top:6px}

/* colagem */
.cgrid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:20px}
.cg{background:#fff;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 44px rgba(0,0,0,.35);min-height:0}
.cgi{flex:1;min-height:0;overflow:hidden}
.cgi img{width:100%;height:100%;object-fit:cover;object-position:top}
.cgr{font:700 24px/1 Poppins;color:#1b1d2b;padding:16px 20px;background:#fff;border-top:1px solid #eee}
"""

FIT_JS = r"""
document.fonts.ready.then(()=>{
  for (const el of document.querySelectorAll('[data-max]')) {
    const max = +el.dataset.max; let fs = parseFloat(getComputedStyle(el).fontSize);
    while ((el.offsetHeight > max || el.scrollWidth > el.clientWidth + 1) && fs > 22) { fs -= 2; el.style.fontSize = fs + 'px'; }
  }
  for (const b of document.querySelectorAll('.vis.center > .browser[data-ar]')) {
    const v = b.parentElement; const ar = +b.dataset.ar;
    const w = Math.min(v.clientWidth, (v.clientHeight - 42) * ar);
    b.style.width = Math.floor(w) + 'px';
  }
  const cEl = document.querySelector('.c');
  const c = cEl.getBoundingClientRect();
  const lim = c.bottom - parseFloat(getComputedStyle(cEl).paddingBottom);
  // celular que passa da área útil: corta a tela (a moldura continua inteira)
  for (const ph of document.querySelectorAll('.phone')) {
    const over = ph.getBoundingClientRect().bottom - lim;
    if (over > 0) { const sc = ph.querySelector('.scr'); sc.style.height = (sc.offsetHeight - over - 2) + 'px'; }
  }
  const foot = document.querySelector('.foot').getBoundingClientRect();
  const probs = [];
  if (foot.bottom > c.bottom - 8) probs.push('rodapé saiu da tela');
  for (const el of document.querySelectorAll('.txt,.side,.checks,.steps,.plans,.fecho,.pfoot,.postit,.stk,.sp')) {
    const r = el.getBoundingClientRect();
    if (r.height && r.bottom > foot.top + 2 && !el.closest('.vis') && !el.closest('.sp') ) probs.push(el.className + ' encosta no rodapé');
  }
  for (const el of document.querySelectorAll('[data-max]')) if (el.offsetHeight > +el.dataset.max) probs.push(el.tagName + ' acima do limite');
  const ctaTop = document.querySelector('.cta').getBoundingClientRect().top;
  for (const el of document.querySelectorAll('.phone,.browser,.cg,.pcard,.plans,.sp,.ig')) {
    const r = el.getBoundingClientRect();
    if (r.bottom > lim + 4 || r.right > c.right + 2) probs.push(el.className + ' sai da área útil');
    const cr = document.querySelector('.cta').getBoundingClientRect();
    if (r.bottom > cr.top + 2 && r.right > cr.left && r.left < cr.right && r.top < cr.bottom) probs.push(el.className + ' cobre o botão');
  }
  window.__probs = probs; window.__ok = true;
});
"""


FONTES = (AQUI / 'fontes' / 'fontes.css').read_text()
FONTES = re.sub(r'url\(([^)]+\.woff2)\)', lambda m: f"url('{(AQUI / 'fontes' / m.group(1)).as_uri()}')", FONTES)


def pagina(c, fmt):
    W, H = FORMATOS[fmt]
    corpo = LAYOUTS[c['tpl']](c, fmt)
    return (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{FONTES}:root{{--W:{W}px;--H:{H}px}}{CSS}</style></head>'
            f'<body class="pub-{c["pub"]} tema-{c["tema"]} fmt-{fmt} t-{c["tpl"]}">'
            f'<div class="c"><div class="tag">{esc(TAG[c["pub"]])}</div>{corpo}</div>'
            f'<script>{FIT_JS}</script></body></html>')


def main(out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    lista = []
    for c in C:
        for fmt in FORMATOS:
            nome = f'{c["id"]}-{fmt}'
            (out / f'{nome}.html').write_text(pagina(c, fmt), encoding='utf-8')
            lista.append({'nome': nome, 'w': FORMATOS[fmt][0], 'h': FORMATOS[fmt][1]})
    (out / 'lista.json').write_text(json.dumps(lista))
    print(len(lista), 'páginas em', out)


if __name__ == '__main__':
    main(sys.argv[1])
