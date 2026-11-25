"""Os 50 vídeos para vender o sistema a hamburguerias (Meta Ads, 9:16, sem locução).

Gera roteiros/<id>.json (lido pelo motor) e roteiros/textos.json (texto do anúncio, título e descrição).
Cada vídeo fala de UMA dor, com gancho nos primeiros 2 s, prova com telas reais (dados de demonstração)
e chamada final para o WhatsApp. Nada de iFood/99Food, nota fiscal ou resultado prometido em número.

Uso: python3 roteiros.py
"""
import json
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parent / 'criativos-meta'))
from criativos import C as ESTATICOS  # noqa: E402  (textos dos anúncios estáticos que têm o mesmo ângulo)

EST = {c['id']: c for c in ESTATICOS}
FL = json.loads((AQUI / 'telas' / 'fluxos.json').read_text())
CX = json.loads((AQUI / 'telas' / 'caixas.json').read_text())
TOQUE = {s['tela']: s.get('toque') for v in FL.values() for s in v}


def pad(b, m=0.015, my=None):
    my = m if my is None else my
    x, y, w, h = b
    x0, y0 = max(0, x - m), max(0, y - my)
    return [round(x0, 4), round(y0, 4), round(min(1, x + w + m) - x0, 4), round(min(1, y + h + my) - y0, 4)]


def tela(img, dur, leg=None, toque=False, zoom=None, rolar=None, foco=None, dest=None, rot=None, som=None, **k):
    d = {'img': img, 'dur': dur}
    if leg:
        d['legenda'] = leg
    if toque:
        d['toque'] = TOQUE[img] if toque is True else toque
    if zoom:
        d['zoom'] = zoom
    if rolar:
        d['rolar'] = rolar
    if foco:
        d['foco'] = foco
    if dest:
        d['destaque'] = {'caixa': dest, 'rotulo': rot} if rot else {'caixa': dest}
    if som:
        d['som'] = som
    d.update(k)
    return d


def T(texto, dur=2.4, **k):
    return {'tipo': 'texto', 'texto': texto, 'dur': dur, **k}


def CHAT(msgs, texto=None, selo=None, gap=0.5, **k):
    d = {'tipo': 'chat', 'msgs': msgs, 'gap': gap, 'dur': round(0.75 + len(msgs) * gap + (0.75 if selo else 0.45), 2), **k}
    if texto:
        d['texto'] = texto
    if selo:
        d['selo'] = selo
    return d


def NOTA(nota, texto=None, dur=2.8, **k):
    return {'tipo': 'nota', 'nota': nota, 'texto': texto, 'dur': dur, **k}


def LISTA(texto, itens, icone='x', gap=0.4, **k):
    vira = any(isinstance(i, list) for i in itens)
    d = round(0.8 + len(itens) * gap + (0.6 + len(itens) * 0.22 + 0.5 if vira else 0.5), 2)
    return {'tipo': 'lista', 'texto': texto, 'itens': itens, 'icone': icone, 'gap': gap, 'dur': d, **k}


def CEL(*telas, **k):
    return {'tipo': 'celular', 'telas': list(telas), **k}


def PAINEL(*telas, **k):
    return {'tipo': 'painel', 'telas': list(telas), **k}


def CTA(preco=None, texto=None, sub=None, rodape=None, dur=3.0):
    d = {'tipo': 'cta', 'dur': dur}
    for k, v in (('preco', preco), ('texto', texto), ('sub', sub), ('rodape', rodape)):
        if v:
            d[k] = v
    return d


def NUM(texto, para, de=None, prefixo='', sufixo='', casas=0, dur=2.6, antes=None):
    d = {'tipo': 'numero', 'texto': texto, 'para': para, 'prefixo': prefixo, 'sufixo': sufixo, 'casas': casas, 'dur': dur}
    if de is not None:
        d['de'] = de
    if antes:
        d['antes'] = antes
    return d


def PERG(pergunta, resposta, texto=None, dur=3.0):
    return {'tipo': 'pergunta', 'pergunta': pergunta, 'resposta': resposta, 'texto': texto, 'dur': dur}


def SPLIT(texto, antes, depois, rotulos=None, dur=None):
    d = {'tipo': 'split', 'texto': texto, 'antes': antes, 'depois': depois, 'dur': dur or round(1.4 + len(antes) * 0.3 + len(depois) * 0.28 + 0.6, 2)}
    if rotulos:
        d['rotulos'] = rotulos
    return d


def PRECO(plano, valor, itens, texto=None, nota=None, dur=None):
    return {'tipo': 'preco', 'plano': plano, 'valor': valor, 'itens': itens, 'texto': texto, 'nota': nota, 'dur': dur or round(1.9 + len(itens) * 0.22 + 0.6, 2)}


def BURGER(texto=None, camadas=None, total=None, dur=4.4, **k):
    d = {'tipo': 'burger', 'dur': dur, **k}
    if texto:
        d['texto'] = texto
    if camadas:
        d['camadas'] = camadas
    if total:
        d['total'] = total
    return d


def CARROSSEL(*telas, passo=1.1):
    return {'tipo': 'carrossel', 'telas': [{'img': i, 'legenda': l} for i, l in telas], 'passo': passo}


# custos da ficha técnica do Cheese Bacon (loja de demonstração, mesmos números da tela de CMV)
CAMADAS_CB = [
    {'camada': 'pao_cima', 'nome': 'Pão brioche', 'valor': 'R$ 1,60'},
    {'camada': 'molho', 'nome': 'Maionese da casa', 'valor': 'R$ 0,36'},
    {'camada': 'bacon', 'nome': 'Bacon (40 g)', 'valor': 'R$ 2,60'},
    {'camada': 'queijo', 'nome': 'Cheddar (2 fatias)', 'valor': 'R$ 1,50'},
    {'camada': 'carne', 'nome': 'Blend 180 g', 'valor': 'R$ 9,50'},
]
TOTAL_CB = 'Custo do Cheese Bacon: R$ 16,69 · vende a R$ 38,90'

# telas e regiões
NOVO = [0.200, 0.213, 0.136, 0.198]          # cartão do pedido novo no quadro
REL_H = 0.2735                                # rolagem do relatório até "Pedidos por horário"
REL_B = 0.56                                  # rolagem até "Entregas por bairro"
COZ = [0.19, 0.20, 0.80, 0.62]

# blocos de fluxo no celular
def pedido_ate_carrinho(l1='O cliente escolhe *no seu cardápio*', l2='O *ponto da carne* é obrigatório', l3='E o *adicional* entra com um toque'):
    return [tela('p01_menu', 1.1, l1, toque=True), tela('p02_produto', 1.3, l2, toque=True, zoom={'x': 0.4, 'y': 0.67, 's': 2.0}),
            tela('p03_adicionais', 1.0, l3, toque=True), tela('p04_bacon', 1.0, toque=True, zoom={'x': 0.66, 'y': 0.93, 's': 2.0})]


V = []


def video(id_, angulo, tema, musica, cenas, est=None, texto=None, titulo=None, desc=None):
    V.append({'id': id_, 'angulo': angulo, 'tema': tema, 'musica': musica, 'cenas': cenas, 'est': est,
              'texto': texto, 'titulo': titulo, 'desc': desc})


# ------------------------------------------------------------------ 1–10
video('V01', 'Comissão por pedido', 'brasa', 'funk', [
    NUM('de comissão no pedido que chega pelo *seu* cardápio', 0, prefixo='R$ ', dur=2.6, antes='Quanto o seu cardápio cobra por pedido?'),
    CEL(*pedido_ate_carrinho('O cliente pede *pelo seu link*')),
    PAINEL(tela('d_pedidos_antes', 0.9, 'E o pedido *cai no seu painel*'), tela('d_pedidos_depois', 2.0, foco=pad(NOVO, 0.03, 0.04), dest=NOVO, rot='Pedido novo', som='ding')),
    CTA(preco='199,90', sub='Mensalidade fixa. Sem comissão por pedido.')], est='H01')

video('V02', 'Pedido digitado do direct', 'noite', 'trap', [
    T('Seu cliente pede pelo direct e você *digita tudo* de novo?', 2.3),
    CHAT([['c', 'Boa noite! Me manda o cardápio?'], ['c', 'Quanto tá o cheese bacon?'], ['c', 'Entrega no Jardim América?'], ['c', 'Pode ser sem cebola?']], selo='Toda noite'),
    CEL(tela('p01_menu', 1.1, 'Manda o link: ele *pede sozinho*', toque=True), tela('p02_produto', 1.2, toque=True),
        tela('p10_endereco', 1.6, 'A *taxa do bairro* entra no total', zoom={'x': 0.35, 'y': 0.2, 's': 2.2}),
        tela('p11_pagamento', 0.9, toque=True), tela('p12_recebido', 1.1, 'E chega *pronto* no seu painel')),
    CTA()], est='H02')

video('V03', 'Ponto da carne errado', 'ketchup', 'pop', [
    T('Pediu *ao ponto*.\nChegou *bem passado*.', 2.4, foto='cheese-bacon', modo='bate'),
    CEL(tela('p01_menu', 1.0, 'No seu cardápio', toque=True), tela('p02_produto', 2.0, 'o *ponto da carne* é obrigatório', toque=True, zoom={'x': 0.4, 'y': 0.67, 's': 2.2})),
    PAINEL(tela('d_cozinha', 2.6, 'E vai *escrito* na tela da cozinha', foco=[0.19, 0.30, 0.42, 0.33])),
    CTA()], est='H03')

video('V04', 'Pico de sexta à noite', 'noite', 'house', [
    {'tipo': 'relogio', 'dia': 'SEXTA-FEIRA', 'de': '20:59', 'para': '21:00', 'texto': 'Chapa lotada. *Qual pedido sai primeiro?*', 'dur': 2.9},
    PAINEL(tela('d_pedidos_antes', 1.0, 'Todos os pedidos *num quadro só*'), tela('d_pedidos_depois', 1.9, 'Pedido novo chega *com aviso*', foco=pad(NOVO, 0.03, 0.04), dest=NOVO, rot='Novo', som='ding'),
           tela('d_pedidos_depois', 1.8, 'Cada coluna: *novo, preparo, pronto, entrega*', foco=[0.19, 0.08, 0.80, 0.55])),
    CTA()], est='H04')

video('V05', 'Comanda de papel', 'creme', 'boombap', [
    NOTA('A comanda caiu na chapa. De novo.', 'Sua cozinha ainda depende de *papelzinho?*', dur=3.0),
    PAINEL(tela('k01_cozinha', 2.2, 'A cozinha vê *tudo numa tela*', foco=COZ, toque=True), tela('k02_cozinha_pronto', 1.6, 'Ficou pronto? *Um toque.*', foco=COZ, som='success')),
    CTA()], est='H05')

video('V06', 'Taxa de entrega no chute', 'mostarda', 'funk', [
    CHAT([['c', 'Quanto fica a entrega pro Jardim América?'], ['c', 'E pra Vila Nova?'], ['c', 'Tem taxa pra Bela Vista?']], texto='Toda hora a *mesma pergunta*:', selo='Na mão?'),
    CEL(tela('p10_endereco', 2.2, 'O cliente escolhe o bairro e *a taxa entra sozinha*', zoom={'x': 0.35, 'y': 0.2, 's': 2.3})),
    PAINEL(tela('d_bairros', 2.4, 'Você define *a taxa de cada bairro*', foco=pad(CX['bairros_tabela'], 0.01, 0.02))),
    CTA()], est='H06')

video('V07', 'Lanche que vende e não dá lucro', 'brasa', 'trap', [
    T('Seu lanche mais vendido *dá lucro* mesmo?', 2.3),
    BURGER('Quanto custa *cada camada*?', CAMADAS_CB, TOTAL_CB, dur=4.6, explode=1.0),
    PAINEL(tela('d_cmv', 2.6, 'O sistema calcula o *CMV de cada lanche*', foco=[0.19, 0.2, 0.62, 0.55], dest=[0.655, 0.255, 0.082, 0.5], rot='CMV')),
    CTA()], est='H07')

video('V08', 'Pão acabou no sábado', 'noite', 'pop', [
    NOTA('Sábado, 20h: acabou o pão brioche.', 'Faltou insumo *no meio do serviço?*', dur=3.0),
    PAINEL(tela('d_inicio', 2.6, 'O estoque baixa *a cada venda*', foco=pad(CX['inicio_estoque'], 0.02, 0.02), dest=[0.4611, 0.7722, 0.2556, 0.2], rot='Estoque baixo'),
           tela('d_estoque', 2.0, 'E avisa *antes de acabar*', foco=[0.19, 0.14, 0.62, 0.5])),
    CTA()], est='H08')

video('V09', 'Caixa que não bate', 'creme', 'lofi', [
    NOTA('Fechei o caixa. Faltou R$ 30.', 'O caixa de ontem *bateu?*', dur=3.0),
    PAINEL(tela('d_caixa', 2.3, 'Abertura com *fundo de troco*', foco=[0.19, 0.05, 0.8, 0.3]),
           tela('d_caixa', 2.4, 'E o fechamento mostra *o que deveria ter na gaveta*', foco=pad(CX['caixa_gaveta'], 0.03, 0.04), dest=CX['caixa_gaveta'])),
    CTA()], est='H09')

video('V10', 'Combo virando quebra-cabeça', 'ketchup', 'house', [
    CHAT([['c', 'Quero o combo casal'], ['c', 'Um clássico e um cheese bacon'], ['c', 'Ah, troca a coca por guaraná'], ['c', 'E a batata é grande?']], texto='Combo pelo WhatsApp:', selo='Confuso?'),
    CEL(tela('c01_menu', 1.0, 'No cardápio, *ele monta o combo*', toque=True), tela('c02_combo', 0.9, toque=True), tela('c03_um', 0.9, toque=True),
        tela('c04_lanches', 0.9, 'Escolhe *os lanches e as bebidas*', toque=True), tela('c05_bebida1', 0.9, toque=True),
        tela('c06_pronto', 1.5, 'Sem faltar nada', zoom={'x': 0.5, 'y': 0.6, 's': 1.8})),
    CTA()], est='H10')

# ------------------------------------------------------------------ 11–20
video('V11', 'Adicionais que ninguém oferece', 'brasa', 'funk', [
    T('O *bacon extra* que ninguém ofereceu.', 2.4, foto='smash-bacon'),
    CEL(tela('p02_produto', 1.1, 'No cardápio, os adicionais *aparecem em cada lanche*'), tela('p03_adicionais', 1.4, toque=True, zoom={'x': 0.6, 'y': 0.5, 's': 1.9}),
        tela('p04_bacon', 1.8, 'E o valor *soma sozinho*', zoom={'x': 0.66, 'y': 0.93, 's': 2.2})),
    CTA()], est='H11')

video('V12', '"Meu lanche já saiu?"', 'noite', 'lofi', [
    CHAT([['c', 'Moço, meu lanche já saiu?'], ['c', 'Já tá vindo?'], ['c', '??']], texto='Dez vezes por noite:', gap=0.55),
    CEL(tela('p12_recebido', 1.2, 'O cliente acompanha *pelo celular*', zoom={'x': 0.45, 'y': 0.32, 's': 1.7}),
        tela('p13_preparo', 1.2, '*Em preparo*', zoom={'x': 0.45, 'y': 0.36, 's': 1.7}),
        tela('p15_saiu', 1.6, '*Saiu para entrega*', zoom={'x': 0.45, 'y': 0.5, 's': 1.7})),
    CTA(sub='O status muda sozinho quando você avança o pedido.')], est='H12')

video('V13', 'Acerto com o motoboy', 'mostarda', 'boombap', [
    T('O motoboy voltou. *Quanto ele tem que te passar?*', 2.5),
    CEL(tela('e01_entregador', 2.4, 'No app do entregador: *valor a cobrar e troco*', zoom={'x': 0.4, 'y': 0.27, 's': 1.6})),
    PAINEL(tela('d_acerto', 2.4, 'E o *acerto* sai pronto', foco=pad(CX['acerto_tabela'], 0.01, 0.06))),
    CTA()], est='H13')

video('V14', 'Cliente fiel que sumiu', 'creme', 'pop', [
    T('Aquele cliente de toda sexta *sumiu.*\nVocê percebeu?', 2.6),
    PAINEL(tela('d_clientes', 2.3, 'O sistema guarda o *histórico de cada cliente*', foco=[0.19, 0.2, 0.8, 0.5]),
           tela('d_clientes', 2.4, 'E separa *quem sumiu há 30 dias*', foco=pad(CX['clientes_abas'], 0.02, 0.06), dest=CX['clientes_sumidos'], rot='Sumidos')),
    CTA(sub='Chame no WhatsApp com a mensagem pronta.')], est='H14')

video('V15', 'Terça parada', 'ketchup', 'funk', [
    NOTA('Terça-feira. Chapa fria.', 'Crie um cupom *só pro dia fraco*', dur=3.0),
    PAINEL(tela('d_cupons', 2.0, 'Cupons de desconto *no seu cardápio*', foco=pad(CX['cupons_tabela'], 0.02, 0.04)),
           tela('d_cupom_novo', 2.4, 'Com *validade, mínimo e limite de usos*', foco=[0.3, 0.2, 0.42, 0.5])),
    CTA()], est='H15')

video('V16', 'Horário de pico no palpite', 'noite', 'house', [
    PERG('Que horas sua chapa mais trabalha?', 'acho que umas 20h…', dur=3.0),
    PAINEL(tela('d_relatorios_longo', 2.8, 'O relatório *mostra o horário de pico*', rolar=[REL_H, REL_H], foco=[0.19, 0.36, 0.39, 0.3]),
           tela('d_relatorios_longo', 2.2, 'E o *dia da semana* mais forte', rolar=[REL_H, REL_H], foco=[0.59, 0.36, 0.39, 0.3])),
    CTA()], est='H16')

video('V17', 'A loja no bolso', 'brasa', 'lofi', [
    T('Saiu da hamburgueria?\nEla vai *no seu bolso.*', 2.4),
    CEL(tela('m_inicio_longo', 4.2, 'Vendas, pedidos e *mais vendidos*, de onde você estiver', rolar=[0, 0.55])),
    CTA()], est='H17')

video('V18', 'Antes e depois', 'creme', 'pop', [
    SPLIT('Antes e depois de *organizar a hamburgueria*', ['Pedido no caderno', 'Taxa no chute', 'Caixa no olho'], ['Pedido pelo cardápio', 'Taxa por bairro', 'Caixa conferido']),
    CARROSSEL(('p01_menu', 'Cardápio'), ('d_pedidos_depois', 'Pedidos'), ('d_cozinha', 'Cozinha'), ('d_caixa', 'Caixa')),
    CTA()], est='H18')

video('V19', 'Checklist de dores', 'brasa', 'trap', [
    LISTA('Sua hamburgueria *ainda…*', [['anota pedido no WhatsApp?', 'pedido chega pelo cardápio'], ['calcula a taxa na mão?', 'taxa por bairro automática'],
                                         ['descobre que o pão acabou?', 'estoque avisa antes'], ['não sabe o custo do lanche?', 'ficha técnica e CMV']], gap=0.38),
    CTA(preco='199,90')], est='H19')

video('V20', 'Oferta: cardápio digital', 'ketchup', 'funk', [
    T('Cardápio digital pra sua hamburgueria por *menos de R$ 7 por dia*', 2.6),
    CEL(tela('m_menu_longo', 3.0, 'Com fotos, *ponto da carne e adicionais*', rolar=[0, 0.35])),
    PRECO('Cardápio digital', '199,90', ['Pedidos no painel em tempo real', 'Taxa por bairro, cupom e Pix', 'Link e QR Code'], nota='Sem comissão por pedido.'),
    CTA()], est='H20')

# ------------------------------------------------------------------ 21–30
video('V21', 'Oferta: sistema completo', 'noite', 'house', [
    T('Cardápio, cozinha, caixa e estoque.\n*Um sistema só.*', 2.5, modo='bate'),
    CARROSSEL(('p01_menu', 'Cardápio digital'), ('d_pedidos_depois', 'Quadro de pedidos'), ('k01_cozinha', 'Tela da cozinha'), ('d_cmv', 'Custo de cada lanche'), ('d_caixa', 'Caixa'), passo=1.0),
    PRECO('Sistema + cardápio em site', '299,90', ['Balcão, caixa e cozinha', 'Estoque com ficha técnica', 'Financeiro e relatórios'], nota='Sem comissão por pedido.'),
    CTA()], est='H21')

video('V22', 'Link da bio que não vende', 'mostarda', 'pop', [
    {'tipo': 'perfil', 'texto': 'Um link na bio que *recebe pedido*', 'dur': 3.2},
    CEL(tela('m_menu_longo', 3.2, 'Tocou no link, *caiu no cardápio*', rolar=[0, 0.3])),
    CTA(sub='Link e QR Code para o Instagram, o WhatsApp e o balcão.')], est='H22')

video('V23', 'Pedido em poucos toques', 'brasa', 'house', [
    T('Do link ao pedido.\n*Conta os toques.*', 2.2, modo='bate'),
    CEL(tela('p01_menu', 0.85, 'Toque *1*: o lanche', toque=True), tela('p02_produto', 0.85, 'Toque *2*: o ponto', toque=True), tela('p04_bacon', 0.85, 'Toque *3*: adicionar', toque=True),
        tela('p08_sacola', 0.85, 'Toque *4*: a sacola', toque=True), tela('p11_pagamento', 0.95, 'Toque *5*: enviar', toque=True), tela('p12_recebido', 1.3, '*Pedido feito.*')),
    CTA()],
    texto='Quanto menos passo, mais pedido. 👆\n\nNo cardápio digital, o cliente escolhe o lanche, o ponto da carne, o adicional, informa o endereço e envia, em poucos toques e sem precisar baixar nada. O pedido chega organizado no seu painel.\n\nQuer ver com os seus lanches? Chama no WhatsApp.',
    titulo='Do link ao pedido', desc='Sem baixar aplicativo')

video('V24', 'Esgotado com um toque', 'creme', 'boombap', [
    NOTA('Acabou o Smash Triplo.', 'E o cliente *continua pedindo?*', dur=2.8),
    PAINEL(tela('g01_produtos', 1.9, 'Um toque e ele fica *esgotado*', foco=[0.38, 0.3, 0.6, 0.38], toque=True),
           tela('g02_esgotado', 2.0, 'e *sai do cardápio* na hora', foco=[0.38, 0.3, 0.6, 0.38], dest=CX['produtos_triplo'], rot='Esgotado')),
    CTA()], est='G06')

video('V25', 'Fila no balcão', 'ketchup', 'trap', [
    T('Fila no balcão e *pedido anotado no papel?*', 2.4),
    PAINEL(tela('v01_pdv', 1.4, 'No balcão: *toca no lanche*', toque=True, foco=[0.17, 0.05, 0.56, 0.6]), tela('v02_pdv', 1.3, toque=True, foco=[0.17, 0.05, 0.56, 0.6]),
           tela('v03_pdv', 2.2, 'e o pedido *já sai somado*', foco=pad(CX['pdv_carrinho'], 0.01, 0.0))),
    CTA()],
    texto='Fila no balcão, papelzinho na mão e conta de cabeça. 🧾\n\nNo PDV do sistema, o atendente toca nos lanches com foto, escolhe o ponto da carne e o pedido já sai somado, com desconto, troco e forma de pagamento. Vai direto para a tela da cozinha e para o caixa.\n\nChama no WhatsApp e peça uma demonstração.',
    titulo='Balcão rápido e somado', desc='PDV com foto')

video('V26', 'Equipe com acesso a tudo', 'noite', 'lofi', [
    NOTA('Funcionário vendo o faturamento do mês?', 'Cada um vê *só o que precisa*', dur=3.0),
    PAINEL(tela('d_usuarios', 2.4, 'Um login para *cada função*', foco=pad(CX['usuarios_tabela'], 0.02, 0.04)),
           tela('d_usuarios', 2.2, 'Caixa, cozinha e entregador com *acesso próprio*', foco=pad(CX['usuarios_perfis'], 0.02, 0.03), dest=CX['usuarios_perfis'])),
    CTA()], est='G07')

video('V27', 'Boleto esquecido', 'mostarda', 'boombap', [
    T('O boleto do gás vence *quando?*', 2.2, modo='bate'),
    PAINEL(tela('d_contas', 2.6, 'Contas a pagar e a receber *num lugar só*', foco=[0.19, 0.12, 0.8, 0.5]),
           tela('d_fluxo', 2.4, 'E o *saldo de cada dia*', foco=pad(CX['fluxo_grafico'], 0.01, 0.03))),
    CTA()], est='G10')

video('V28', 'Sobrou dinheiro no mês?', 'creme', 'lofi', [
    PERG('Sobrou dinheiro esse mês?', 'acho que sim…', dur=3.0),
    PAINEL(tela('d_fluxo', 2.4, 'O fluxo de caixa mostra *entradas e saídas*', foco=pad(CX['fluxo_cards'], 0.02, 0.05)),
           tela('d_fluxo', 2.4, 'e o *saldo de cada dia*', foco=pad(CX['fluxo_grafico'], 0.01, 0.03))),
    CTA()],
    texto='"Acho que sobrou." Achar não paga o fornecedor. 💸\n\nNo financeiro do sistema, entradas e saídas ficam lançadas e o fluxo de caixa mostra o saldo de cada dia. Você vê o que entrou, o que saiu e o que vence na semana.\n\nChama no WhatsApp e peça uma demonstração.',
    titulo='Saiba quanto sobrou', desc='Fluxo de caixa')

video('V29', 'Quanto custa o cheese bacon?', 'brasa', 'trap', [
    PERG('Quanto custa fazer o seu cheese bacon?', 'uns 10 reais?', dur=2.9),
    BURGER('O sistema calcula *camada por camada*', CAMADAS_CB, TOTAL_CB, dur=4.8, explode=1.0),
    PAINEL(tela('d_ficha', 2.4, 'Pela *ficha técnica* de cada lanche', foco=[0.28, 0.12, 0.44, 0.66])),
    CTA()],
    texto='Quanto custa fazer o seu cheese bacon? Se a resposta foi "uns 10 reais", o preço pode estar errado. 🍔\n\nCom a ficha técnica, o sistema soma o custo de cada ingrediente (pão, carne, queijo, bacon, molho e embalagem) e mostra o custo e a margem de cada lanche. Quando o custo do insumo muda, a conta muda junto.\n\nChama no WhatsApp.',
    titulo='O custo real de cada lanche', desc='Ficha técnica')

video('V30', 'Aniversariantes', 'ketchup', 'pop', [
    T('Tem cliente seu *fazendo aniversário* este mês.', 2.4),
    PAINEL(tela('d_clientes', 1.6, 'O sistema guarda *a data de cada cliente*', foco=[0.19, 0.18, 0.8, 0.45]),
           tela('d_aniversariantes', 2.4, 'E lista os *aniversariantes do mês*', foco=pad(CX['aniv_tabela'], 0.01, 0.04))),
    CTA(sub='Mande um cupom de presente pelo WhatsApp.')],
    texto='Tem cliente seu fazendo aniversário este mês. Quem vai lembrar dele: você ou a concorrência? 🎂\n\nO sistema guarda o histórico e a data de aniversário de quem pede, lista os aniversariantes do mês e abre o WhatsApp com uma mensagem pronta. Dá para mandar um cupom de presente.\n\nChama no WhatsApp.',
    titulo='Aniversariantes do mês', desc='Mensagem pronta')

# ------------------------------------------------------------------ 31–40
video('V31', 'Fidelidade sem cartão de papel', 'mostarda', 'funk', [
    T('Cartão fidelidade *sem carimbo e sem papel.*', 2.3),
    PAINEL(tela('d_clientes', 2.8, 'Cada pedido soma *pontos* para o cliente', foco=[0.55, 0.26, 0.44, 0.5], dest=[0.861, 0.278, 0.072, 0.45], rot='Pontos')),
    CTA()], est='G13')

video('V32', 'Cardápio em PDF', 'creme', 'boombap', [
    SPLIT('Seu cardápio ainda é *um PDF no WhatsApp?*', ['Zoom no PDF', 'Pergunta o preço', 'Você digita'], ['Fotos e preços', 'Adicionais', 'Pedido no painel'], rotulos=['PDF', 'Cardápio digital']),
    CEL(tela('m_menu_longo', 3.0, 'Com foto, preço e *pedido com um toque*', rolar=[0, 0.3])),
    CTA(sub='A gente transforma o seu PDF em cardápio digital.')], est='G02')

video('V33', 'Veja antes de assinar', 'noite', 'lofi', [
    NOTA('Antes de assinar, veja funcionando.', 'Demonstração com *o seu cardápio*', dur=3.0),
    CARROSSEL(('p01_menu', 'O seu cardápio'), ('d_pedidos_depois', 'Os seus pedidos'), ('k01_cozinha', 'A sua cozinha'), ('d_inicio', 'O seu painel')),
    CTA(rodape='Demonstração sem compromisso')], est='G09')

video('V34', 'A gente monta o cardápio', 'ketchup', 'pop', [
    NOTA('Manda as fotos e os preços. A gente monta.', 'Seu cardápio digital *montado por nós*', dur=3.0),
    PAINEL(tela('d_produtos', 2.4, 'Lanches, tamanhos e adicionais *cadastrados*', foco=[0.19, 0.12, 0.8, 0.55])),
    CEL(tela('p01_menu', 2.2, 'E o link *pronto pra divulgar*')),
    CTA()], est='G05')

video('V35', 'O cliente é seu', 'brasa', 'house', [
    T('Quem pede no seu link vira *seu cliente.*', 2.3),
    PAINEL(tela('d_clientes', 2.6, 'Nome, telefone e *histórico de cada um*', foco=[0.19, 0.25, 0.7, 0.45]),
           tela('d_clientes', 2.2, 'Pra você chamar *de volta no WhatsApp*', foco=[0.6, 0.25, 0.39, 0.45])),
    CTA()],
    texto='Quem pede pelo seu cardápio digital vira cliente seu: nome, telefone, bairro, o que pediu e quanto gastou ficam no sistema. 📇\n\nDá para ver quem compra mais, quem sumiu e quem faz aniversário, e chamar no WhatsApp com uma mensagem pronta.\n\nChama no WhatsApp e peça uma demonstração.',
    titulo='O cliente fica com você', desc='Histórico e WhatsApp')

video('V36', 'Cozinha lotada', 'noite', 'trap', [
    T('Cozinha lotada e *pedido chegando sem parar?*', 2.4),
    PAINEL(tela('h01_recebendo', 1.6, 'Pause os pedidos *com um toque*', foco=[0.1, 0.0, 0.5, 0.25], toque=True),
           tela('h02_pausado', 2.2, 'e retome quando der conta', foco=[0.1, 0.0, 0.5, 0.25], dest=CX['pedidos_toggle'])),
    CTA()],
    texto='Sexta à noite, cozinha no limite e o pedido continua chegando. 🔥\n\nNo painel, um toque pausa os pedidos do cardápio digital. Quando a cozinha respirar, outro toque e a loja volta a receber.\n\nChama no WhatsApp e veja funcionando.',
    titulo='Pause os pedidos', desc='Com um toque')

video('V37', 'Retirada no balcão', 'creme', 'funk', [
    T('Cliente que vem buscar *não precisa esperar na fila.*', 2.4),
    CEL(tela('p09_checkout', 2.0, 'Ele escolhe *retirar na loja*', zoom={'x': 0.72, 'y': 0.48, 's': 2.0}),
        tela('p14_pronto', 2.0, 'E vê quando *ficou pronto*', zoom={'x': 0.45, 'y': 0.48, 's': 1.7})),
    CTA()],
    texto='Pedido para retirar: o cliente chega e fica esperando no balcão, perguntando se está pronto. 🛍️\n\nNo cardápio digital ele escolhe "Retirar na loja" e acompanha o pedido pelo celular. Quando a cozinha marca como pronto, ele vê na hora.\n\nChama no WhatsApp.',
    titulo='Retirada sem fila', desc='Acompanhamento ao vivo')

video('V38', 'Troco pra 50', 'mostarda', 'boombap', [
    CHAT([['c', 'Leva troco pra 50?'], ['c', 'Ah, e aceita cartão?'], ['c', 'Ou pode ser Pix?']], texto='Na hora de pagar:', selo='Anotou?'),
    CEL(tela('p11_pagamento', 2.0, 'O cliente escolhe *como vai pagar*', zoom={'x': 0.4, 'y': 0.74, 's': 1.8}),
        tela('e01_entregador', 2.0, 'E o motoboy sai *sabendo quanto cobrar*', zoom={'x': 0.4, 'y': 0.27, 's': 1.6})),
    CTA()], est='G08')

video('V39', 'Qual bairro mais pede?', 'ketchup', 'house', [
    PERG('Qual bairro mais pede o seu lanche?', 'o centro, eu acho', dur=2.9),
    PAINEL(tela('d_relatorios_longo', 3.2, 'O relatório mostra *as entregas por bairro*', rolar=[REL_B, REL_B], foco=[0.71, 0.2, 0.28, 0.6])),
    CTA(sub='Aí o anúncio vai pro bairro certo.')],
    texto='Qual bairro mais pede o seu lanche? Se a resposta veio no "acho", tem coisa melhor. 📍\n\nOs relatórios mostram quantos pedidos e quanto faturou cada bairro, além dos horários e dias mais fortes. Dá para escolher onde anunciar e onde vale a pena entregar.\n\nChama no WhatsApp.',
    titulo='Os bairros que mais pedem', desc='Relatórios prontos')

video('V40', 'Ticket médio', 'brasa', 'lofi', [
    T('Quanto *cada cliente gasta* por pedido?', 2.3),
    PAINEL(tela('d_inicio', 2.6, 'O *ticket médio* aparece todo dia', foco=pad(CX['inicio_ticket'], 0.05, 0.05), dest=CX['inicio_ticket']),
           tela('d_inicio', 2.2, 'junto com as *vendas do dia*', foco=[0.19, 0.12, 0.8, 0.22])),
    CTA(sub='Combo e adicional ajudam a subir o ticket.')],
    texto='Você sabe quanto cada cliente gasta, em média, por pedido? 🧾\n\nO painel mostra o ticket médio do dia, as vendas, os pedidos em aberto e os mais vendidos. Combos e adicionais no cardápio ajudam esse número a subir, e você acompanha.\n\nChama no WhatsApp.',
    titulo='Ticket médio na tela', desc='Painel do dia')

# ------------------------------------------------------------------ 41–50
video('V41', 'O lanche que segura a semana', 'noite', 'funk', [
    T('Qual lanche *segura a sua semana?*', 2.2, foto='smash-duplo'),
    PAINEL(tela('d_inicio', 2.8, 'Os *mais vendidos* dos últimos 7 dias', foco=pad(CX['inicio_maisvendidos'], 0.02, 0.03), dest=CX['inicio_maisvendidos'])),
    CTA()],
    texto='Qual lanche segura a sua semana? E qual só ocupa espaço no cardápio? 🍔\n\nO painel mostra os mais vendidos dos últimos 7 dias, com quantidade e faturamento. Com a ficha técnica, você também vê a margem de cada um.\n\nChama no WhatsApp.',
    titulo='Seus campeões de venda', desc='Mais vendidos')

video('V42', 'O chapeiro e o ponto', 'ketchup', 'trap', [
    T('Seu chapeiro sabe o *ponto de cada carne?*', 2.3, foto='cheese-bacon'),
    PAINEL(tela('d_cozinha', 3.0, 'Na tela da cozinha, *cada lanche com o ponto*', foco=[0.19, 0.30, 0.42, 0.33])),
    CTA()],
    texto='Ao ponto, ao ponto para bem, bem passado. Na correria, alguém troca. 🥩\n\nNo cardápio digital, o ponto da carne é obrigatório. Na tela da cozinha, cada lanche aparece com o ponto escrito e as observações em destaque, do jeito que o cliente pediu.\n\nChama no WhatsApp.',
    titulo='O ponto certo na chapa', desc='Tela da cozinha')

video('V43', 'Delivery próprio sem bagunça', 'mostarda', 'house', [
    T('Delivery próprio *sem bagunça.*', 2.0, modo='bate'),
    CARROSSEL(('p10_endereco', 'Taxa por bairro'), ('d_pedidos_depois', 'Pedidos em ordem'), ('e01_entregador', 'App do entregador'), ('p15_saiu', 'Cliente acompanha')),
    CTA()],
    texto='Delivery próprio dá lucro, mas vira bagunça sem controle. 🛵\n\nNo sistema: taxa por bairro no cardápio, pedidos em ordem no painel, app do entregador com rota e valor a cobrar, e o cliente acompanhando o pedido pelo celular.\n\nChama no WhatsApp e peça uma demonstração.',
    titulo='Delivery próprio organizado', desc='Sem comissão por pedido')

video('V44', 'Cardápio, cozinha, caixa', 'brasa', 'trap', [
    T('Cardápio.', 0.8, modo='bate', corte=False), T('Cozinha.', 0.8, modo='bate'), T('*Caixa.*', 0.9, modo='bate'),
    PAINEL(tela('d_pedidos_depois', 1.6, 'O pedido entra', foco=pad(NOVO, 0.03, 0.04), dest=NOVO),
           tela('k01_cozinha', 1.5, 'a cozinha prepara', foco=COZ), tela('d_caixa', 1.7, 'e o caixa *fecha certinho*', foco=[0.19, 0.08, 0.8, 0.45])),
    CTA()],
    texto='Cardápio, cozinha e caixa conversando entre si. ⚙️\n\nO pedido que entra pelo cardápio aparece no quadro de pedidos, vai para a tela da cozinha e cai no caixa, já na forma de pagamento certa. Sem redigitar nada.\n\nChama no WhatsApp.',
    titulo='Tudo conectado', desc='Cardápio, cozinha e caixa')

video('V45', 'Foto que dá fome', 'ketchup', 'pop', [
    T('Lanche *com foto* dá água na boca.\nLista de texto, não.', 2.6, foto='monstro-duplo'),
    CEL(tela('m_menu_longo', 3.4, 'Seu cardápio com *a foto de cada lanche*', rolar=[0, 0.4])),
    CTA()],
    texto='Lanche com foto dá água na boca. Lista de texto, não. 🤤\n\nNo cardápio digital, cada lanche aparece com foto, descrição e preço, com adicionais e ponto da carne. O cliente vê, escolhe e pede pelo link.\n\nA gente monta o cardápio com as suas fotos. Chama no WhatsApp.',
    titulo='Cardápio com foto', desc='Montamos para você')

video('V46', 'Hamburgueria nova', 'creme', 'house', [
    T('Vai abrir sua hamburgueria?\n*Comece organizado.*', 2.5),
    CARROSSEL(('p01_menu', 'Cardápio digital'), ('d_pedidos_depois', 'Pedidos'), ('d_cmv', 'Custo dos lanches'), ('d_caixa', 'Caixa')),
    CTA(preco='199,90')],
    texto='Vai abrir sua hamburgueria? Comece com tudo no lugar. 🚀\n\nCardápio digital com o seu link, pedidos num quadro, tela da cozinha, caixa, ficha técnica com o custo de cada lanche e relatórios desde o primeiro dia.\n\nPlanos a partir de R$ 199,90 por mês, sem comissão por pedido. Chama no WhatsApp.',
    titulo='Abra já organizado', desc='A partir de R$ 199,90/mês')

video('V47', 'O caminho de um pedido', 'noite', 'funk', [
    T('O caminho de um *Smash Duplo:*', 1.9),
    CEL(tela('p02_produto', 1.0, '1. O cliente pede', toque=True), tela('p04_bacon', 0.9, toque=True), tela('p12_recebido', 1.1)),
    PAINEL(tela('d_pedidos_depois', 1.6, '2. Cai no painel', foco=pad(NOVO, 0.03, 0.04), dest=NOVO, som='ding'),
           tela('k01_cozinha', 1.5, '3. A cozinha prepara', foco=COZ, toque=True), tela('k02_cozinha_pronto', 1.0, foco=COZ)),
    CEL(tela('p15_saiu', 1.6, '4. O cliente acompanha', zoom={'x': 0.45, 'y': 0.5, 's': 1.7})),
    CTA()],
    texto='Do cardápio ao caixa, o caminho de um pedido sem papel. 🍔\n\nO cliente pede pelo link, o pedido cai no painel com aviso, a cozinha vê na tela e marca pronto, e o cliente acompanha até chegar. No fim do dia, está tudo no caixa e nos relatórios.\n\nChama no WhatsApp.',
    titulo='Um pedido sem papel', desc='Do cardápio ao caixa')

video('V48', 'Sábado sem caderno', 'mostarda', 'boombap', [
    SPLIT('Sábado à noite *sem caderno*', ['Pedido anotado', 'Comanda perdida', 'Conta de cabeça'], ['Pedido no painel', 'Tela da cozinha', 'Caixa somado'], rotulos=['Caderno', 'Sistema']),
    PAINEL(tela('d_pedidos_depois', 2.4, 'Todos os pedidos *num quadro só*', foco=[0.19, 0.08, 0.8, 0.55])),
    CTA()],
    texto='Sábado à noite com caderno, comanda de papel e conta de cabeça: alguma coisa se perde. 📓\n\nNo sistema, os pedidos chegam num quadro só, a cozinha vê tudo numa tela e o caixa soma sozinho.\n\nChama no WhatsApp e peça uma demonstração.',
    titulo='Sábado sem caderno', desc='Pedidos num quadro só')

video('V49', 'Oferta: app', 'brasa', 'pop', [
    T('Sua hamburgueria *na tela do celular* do cliente.', 2.4),
    {'tipo': 'appicone', 'legenda1': 'O cliente instala o cardápio *com o seu ícone*', 'legenda2': 'Tocou, *abriu o cardápio*', 'durHome': 1.8, 'durMenu': 1.8},
    PRECO('Sistema + cardápio em app', '599,90', ['Ícone e nome da sua loja', 'Abre direto no cardápio', 'Sistema completo junto']),
    CTA()], est='G04')

video('V50', 'Planos', 'noite', 'house', [
    T('Quanto custa *organizar* sua hamburgueria?', 2.3),
    {'tipo': 'planos', 'texto': 'Escolha *o seu plano*', 'dur': 3.4},
    CTA(sub='Mensalidade fixa. Sem comissão por pedido.')], est='G03')


def main():
    out = AQUI / 'roteiros'
    out.mkdir(exist_ok=True)
    textos = {}
    for v in V:
        (out / f'{v["id"]}.json').write_text(json.dumps({'id': v['id'], 'tema': v['tema'], 'musica': v['musica'], 'cenas': v['cenas']}, ensure_ascii=False, indent=1))
        e = EST.get(v['est']) if v['est'] else None
        textos[v['id']] = {'angulo': v['angulo'], 'texto': v['texto'] or e['texto'], 'titulo': v['titulo'] or e['titulo'], 'desc': v['desc'] or e['desc']}
    (out / 'textos.json').write_text(json.dumps(textos, ensure_ascii=False, indent=1))
    assert len(V) == 50 and len({v['id'] for v in V}) == 50
    print(len(V), 'roteiros')


if __name__ == '__main__':
    main()
