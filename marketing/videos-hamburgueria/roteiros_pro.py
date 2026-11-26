"""Vídeos para vender a SUA HAMBURGUERIA (a empresa): tráfego pago, cardápio digital, site e sistema.

Tema profissional (grafite, Schibsted Grotesk, brasa), 22 s ou mais, sem locução.
Fecha sempre com a marca e o botão do WhatsApp. Telas reais com dados de demonstração.

Uso: python3 roteiros_pro.py   (gera roteiros/P01.json … e roteiros/textos_pro.json)
"""
import json
from pathlib import Path

from roteiros import (CX, COZ, NOVO, CEL, CHAT, LISTA, NUM, PAINEL, PERG, PRECO, T, pad, tela)  # noqa: F401

AQUI = Path(__file__).resolve().parent


def CARROSSEL(*telas, passo=1.2, rot=None):
    d = {'tipo': 'carrossel', 'telas': [{'img': i, 'legenda': l} for i, l in telas], 'passo': passo}
    if rot:
        d['rot'] = rot
    return d


def AVISOS(texto, itens=None, dur=4.0, tela_='p01_menu'):
    return {'tipo': 'avisos', 'texto': texto, 'tela': tela_, 'dur': dur, 'itens': itens or [
        ['Novo pedido #296', 'Smash Duplo e batata grande', 'R$ 65,80', ''],
        ['Em preparo', '#295 na tela da cozinha', '8 min', 'am'],
        ['Saiu para entrega', '#294 para o Jardim América', 'Rogério', 'vd']]}


def MARCA(dur=4.5, **k):
    return {'tipo': 'marca', 'dur': dur, **k}


V = []


def video(id_, angulo, musica, cenas, texto, titulo, desc):
    V.append({'id': id_, 'angulo': angulo, 'musica': musica, 'cenas': cenas, 'texto': texto, 'titulo': titulo, 'desc': desc})


PED = [tela('p01_menu', 1.2, 'O cliente pede pelo *seu link*', toque=True), tela('p02_produto', 1.2, 'Escolhe o ponto e os adicionais', toque=True, zoom={'x': 0.4, 'y': 0.67, 's': 2.0}),
       tela('p04_bacon', 1.0, toque=True), tela('p11_pagamento', 1.0, toque=True), tela('p12_recebido', 1.3, 'Pedido confirmado')]

video('P01', 'Comissão de aplicativo', 'house', [
    T('Quanto da sua venda fica no *aplicativo de delivery?*', 2.6),
    NUM('de comissão no pedido que chega pelo seu cardápio', 0, prefixo='R$ ', dur=2.8, antes='Com a Sua Hamburgueria:'),
    CEL(*PED),
    PAINEL(tela('d_pedidos_antes', 1.0, 'E chega direto no *seu painel*'), tela('d_pedidos_depois', 2.2, foco=pad(NOVO, 0.03, 0.04), dest=NOVO, rot='Pedido novo', som='ding')),
    PRECO('Cardápio digital', '199,90', ['Pedidos em tempo real', 'Taxa por bairro, cupom e Pix', 'Link e QR Code'], texto='Mensalidade fixa', nota='Sem comissão por pedido.', dur=3.6),
    MARCA()],
    'Quanto do seu faturamento fica com o aplicativo de delivery? 🍔\n\nCom o cardápio digital da Sua Hamburgueria, o pedido que chega pelo seu link não paga comissão. O cliente escolhe o lanche, o ponto da carne e os adicionais, e o pedido cai direto no seu painel.\n\nMensalidade fixa, a partir de R$ 199,90. Fale com a nossa equipe no WhatsApp.',
    'Seu cardápio, sem comissão', 'A partir de R$ 199,90/mês')

video('P02', 'Do anúncio à entrega', 'pop', [
    T('Do anúncio à entrega. *A gente cuida de tudo.*', 2.6),
    CARROSSEL(('ad_V07', 'O anúncio atrai'), ('ad_V03', 'feito para *hamburgueria*'), passo=1.1, rot='Exemplos de anúncios'),
    CEL(tela('p01_menu', 1.1, 'O cliente pede no *cardápio digital*', toque=True), tela('p02_produto', 1.0, toque=True), tela('p12_recebido', 1.1)),
    PAINEL(tela('d_pedidos_depois', 2.0, 'O pedido cai no *painel*', foco=pad(NOVO, 0.03, 0.04), dest=NOVO, som='ding'),
           tela('k01_cozinha', 1.6, 'A cozinha prepara', foco=COZ, toque=True), tela('k02_cozinha_pronto', 1.0, foco=COZ, som='success')),
    CEL(tela('p15_saiu', 2.0, 'E o cliente *acompanha*', zoom={'x': 0.45, 'y': 0.5, 's': 1.7})),
    MARCA(4.8)],
    'Anúncio, cardápio, cozinha e entrega: tudo conectado. 🚀\n\nA Sua Hamburgueria cria os anúncios que trazem o cliente, entrega o cardápio digital onde ele pede, o sistema onde o pedido chega e a tela da cozinha onde ele é preparado. E o cliente acompanha até a porta.\n\nFale com a nossa equipe no WhatsApp.',
    'Do anúncio à entrega', 'Tráfego, cardápio e sistema')

video('P03', 'Quatro serviços', 'house', [
    T('Sua hamburgueria merece *mais que um app de delivery.*', 2.6),
    LISTA('Quatro serviços, *uma operação*', ['Cardápio digital sem comissão', 'Sistema de gestão completo', 'Site com a sua marca', 'Tráfego pago no Instagram'], icone='ok', gap=0.55),
    CARROSSEL(('p01_menu', 'Cardápio digital'), ('d_pedidos_depois', 'Sistema de gestão'), ('site_desktop', 'Site'), ('ad_V22', 'Tráfego pago'), passo=1.4),
    AVISOS('E os pedidos *chegando*', dur=3.8),
    {'tipo': 'planos', 'texto': 'Planos a partir de *R$ 199,90*', 'dur': 4.2},
    MARCA()],
    'Cardápio digital, sistema de gestão, site e tráfego pago num parceiro só. 🍔\n\nA Sua Hamburgueria monta o seu cardápio sem comissão, organiza pedidos, cozinha, caixa e estoque, coloca a sua marca no Google e cria anúncios que trazem cliente.\n\nPlanos a partir de R$ 199,90 por mês. Fale com a nossa equipe no WhatsApp.',
    'Tudo para a sua hamburgueria', 'Planos a partir de R$ 199,90')

video('P04', 'Tráfego pago', 'pop', [
    T('Anúncio bonito não paga as contas. *Conversa no WhatsApp paga.*', 3.0),
    PERG('Quanto custa cada conversa que o seu anúncio traz?', 'não sei…', dur=3.0),
    CARROSSEL(('ad_V07', 'Vídeos feitos para *hamburgueria*'), ('ad_V02', 'Cada um fala de *um problema*'), ('ad_V03', 'Testamos *vários ângulos*'), ('ad_V22', 'e ficamos com os que *trazem conversa*'), passo=1.4, rot='Exemplos de anúncios'),
    LISTA('Como funciona, *todo mês*', ['Diagnóstico da sua hamburgueria', 'Criação dos anúncios', 'Campanhas na sua região', 'Relatório com o custo de cada conversa'], icone='ok', gap=0.5),
    PRECO('Tráfego pago', '999,99', ['Criação dos anúncios', 'Gestão das campanhas', 'Relatório mensal'], texto='Soma a qualquer plano', nota='A verba dos anúncios é paga direto ao Meta.', dur=3.6),
    MARCA()],
    'Curtida não paga fornecedor. Conversa no WhatsApp, sim. 📲\n\nNo tráfego pago da Sua Hamburgueria, criamos vídeos feitos para hamburgueria, cada um falando de um problema real do cliente, testamos vários ângulos e ficamos com os que trazem conversa mais barata. Todo mês você recebe o relatório com o custo de cada conversa.\n\nR$ 999,99 por mês, somando a qualquer plano (a verba dos anúncios é paga direto ao Meta). Fale com a nossa equipe.',
    'Anúncios que trazem conversa', 'Tráfego pago para hamburguerias')

video('P05', 'Sistema de gestão', 'house', [
    T('Sistema de gestão feito para *hamburgueria*', 2.4),
    {'tipo': 'relogio', 'dia': 'Sexta-feira', 'de': '20:59', 'para': '21:00', 'texto': 'Pico de pedidos. *Tudo sob controle?*', 'dur': 2.9},
    AVISOS('Cada pedido chega *com aviso*', dur=4.2),
    PAINEL(tela('d_pedidos_depois', 2.2, 'Todos os pedidos *num quadro só*', foco=[0.19, 0.08, 0.8, 0.55]),
           tela('k01_cozinha', 1.6, 'A cozinha vê *na tela*', foco=COZ, toque=True), tela('k02_cozinha_pronto', 1.0, foco=COZ, som='success'),
           tela('d_cmv', 2.0, 'O custo de *cada lanche*', foco=[0.19, 0.2, 0.62, 0.55]),
           tela('d_caixa', 2.2, 'E o caixa *fecha certinho*', foco=[0.19, 0.08, 0.8, 0.45])),
    MARCA()],
    'Sexta, 21h, pico de pedidos. Está tudo sob controle? 🔥\n\nNo sistema da Sua Hamburgueria, cada pedido chega com aviso num quadro só, a cozinha vê tudo numa tela, o estoque baixa sozinho, o custo de cada lanche aparece na ficha técnica e o caixa fecha conferido.\n\nFale com a nossa equipe e veja funcionando com os seus lanches.',
    'Sua operação num sistema só', 'Pedidos, cozinha e caixa')

video('P06', 'Custo de cada lanche', 'lofi', [
    PERG('Quanto custa fazer o seu cheese bacon?', 'uns 10 reais?', dur=3.2),
    T('Sem ficha técnica, *o preço é um chute.*', 2.4),
    PAINEL(tela('d_cmv', 2.8, 'O sistema calcula o *CMV de cada lanche*', foco=[0.19, 0.2, 0.62, 0.55], dest=[0.655, 0.255, 0.082, 0.5], rot='CMV'),
           tela('d_ficha', 2.6, 'Pela *ficha técnica*', foco=[0.28, 0.12, 0.44, 0.66]),
           tela('d_estoque', 2.2, 'E dá baixa no *estoque* a cada venda', foco=[0.19, 0.14, 0.62, 0.5])),
    PRECO('Sistema + cardápio em site', '299,90', ['Ficha técnica e custo por lanche', 'Estoque com alerta', 'Financeiro e relatórios'], texto='Tudo isso no plano', dur=3.8),
    MARCA(4.8)],
    'Quanto custa fazer o seu cheese bacon? Se a resposta foi "uns 10 reais", o preço pode estar errado. 🍔\n\nNo sistema da Sua Hamburgueria, a ficha técnica calcula o custo e a margem de cada lanche, e o estoque baixa sozinho a cada venda. Você vê onde está o lucro e onde ajustar o preço.\n\nPlano completo por R$ 299,90 por mês. Fale com a nossa equipe.',
    'O custo real de cada lanche', 'Ficha técnica e CMV')

video('P07', 'Site', 'pop', [
    T('O cliente procura. *A sua marca aparece?*', 2.4),
    PERG('Quem procura sua hamburgueria no Google encontra o quê?', 'só o Instagram…', dur=3.2),
    PAINEL(tela('site_desktop', 3.0, 'Um site com *a sua marca*'), tela('site_desktop', 2.4, 'Cardápio, horários e *botão de pedir*', foco=[0.12, 0.32, 0.76, 0.42])),
    CEL(tela('m_menu_longo', 3.4, 'E no celular, *rápido*', rolar=[0, 0.35])),
    LISTA('O que vem no site', ['A sua identidade visual', 'Cardápio e pedido direto', 'Horários e endereço'], icone='ok', gap=0.55),
    MARCA(4.6, rodape='Orçamento do site pelo WhatsApp')],
    'Quem procura a sua hamburgueria no Google encontra o quê? 🔎\n\nA Sua Hamburgueria cria o seu site com a sua identidade visual, cardápio, horários, endereço e um botão de pedir direto, rápido no celular. Junto com o cardápio digital e o sistema, tudo conectado.\n\nPeça um orçamento pelo WhatsApp.',
    'Sua marca no Google', 'Site para hamburguerias')

video('P08', 'Teste antes de contratar', 'lofi', [
    T('Teste o sistema *antes de contratar.*', 2.4),
    CEL(tela('p01_menu', 1.0, 'Faça um pedido de teste', toque=True), tela('p02_produto', 1.0, toque=True), tela('p04_bacon', 0.9, toque=True),
        tela('p08_sacola', 0.9, toque=True), tela('p11_pagamento', 0.9, toque=True), tela('p12_recebido', 1.2, 'Pedido enviado')),
    PAINEL(tela('d_pedidos_depois', 2.2, 'Veja chegar no *painel*', foco=pad(NOVO, 0.03, 0.04), dest=NOVO, rot='Novo', som='ding'),
           tela('k01_cozinha', 1.6, 'Marque como *pronto* na cozinha', foco=COZ, toque=True), tela('k02_cozinha_pronto', 1.0, foco=COZ, som='success')),
    T('Está tudo *no nosso site*, aberto para testar.', 2.6),
    MARCA(4.8, rodape='Teste agora no nosso site')],
    'Não quer contratar no escuro? Justo. 👀\n\nNo site da Sua Hamburgueria tem o sistema de verdade, aberto para testar: faça um pedido no cardápio, veja ele chegar no painel e marque como pronto na cozinha. Se quiser, mostramos com os seus lanches numa conversa.\n\nFale com a nossa equipe no WhatsApp.',
    'Teste antes de contratar', 'Demonstração no site')

video('P09', 'Implantação', 'house', [
    T('Trocar de sistema *dá trabalho?*', 2.4),
    T('Com a gente, *não.*', 1.6, modo='bate'),
    LISTA('Como funciona a implantação', ['Você manda o cardápio e as fotos', 'A gente cadastra lanches e adicionais', 'Configura entrega e pagamento', 'Entrega o link e o QR Code'], icone='ok', gap=0.55),
    PAINEL(tela('d_produtos', 2.4, 'Cardápio *cadastrado*', foco=[0.19, 0.12, 0.8, 0.55]), tela('d_bairros', 2.2, 'Taxas por bairro *configuradas*', foco=pad(CX['bairros_tabela'], 0.01, 0.02))),
    CEL(tela('p01_menu', 2.2, 'E o link *pronto para divulgar*')),
    AVISOS('Os primeiros pedidos *chegando*', dur=3.8),
    MARCA()],
    '"Trocar de sistema deve dar um trabalhão." Com a gente, não. ✍️\n\nVocê manda o cardápio que já tem e as fotos. A equipe da Sua Hamburgueria cadastra os lanches, os adicionais, as taxas de entrega e as formas de pagamento, e entrega o link e o QR Code prontos para divulgar.\n\nFale com a nossa equipe no WhatsApp.',
    'A gente monta tudo', 'Implantação inclusa')

video('P10', 'Delivery próprio', 'house', [
    T('Delivery próprio *sem bagunça.*', 2.2),
    NUM('de comissão nos pedidos do seu cardápio', 0, prefixo='R$ ', dur=2.8),
    CEL(tela('p10_endereco', 2.2, 'Taxa por bairro *automática*', zoom={'x': 0.35, 'y': 0.2, 's': 2.2}),
        tela('p11_pagamento', 1.8, 'Pagamento e troco *no pedido*', zoom={'x': 0.4, 'y': 0.74, 's': 1.8}),
        tela('e01_entregador', 2.2, 'O entregador vê *rota e valor*', zoom={'x': 0.4, 'y': 0.27, 's': 1.6}),
        tela('p15_saiu', 2.0, 'E o cliente *acompanha*', zoom={'x': 0.45, 'y': 0.5, 's': 1.7})),
    PAINEL(tela('d_acerto', 2.4, 'No fim do dia, *o acerto pronto*', foco=pad(CX['acerto_tabela'], 0.01, 0.06))),
    AVISOS('Cada entrega *no lugar*', dur=3.6, itens=[['Pronto para entrega', '#297 no balcão', '2 min', 'am'], ['Saiu para entrega', '#297 com o Rogério', 'R$ 48,90', 'vd'], ['Entregue', '#296 no Jardim América', 'Pix', 'vd']]),
    MARCA()],
    'Delivery próprio dá lucro, mas vira bagunça sem controle. 🛵\n\nCom a Sua Hamburgueria: taxa por bairro no cardápio, pagamento e troco no pedido, app do entregador com rota e valor a cobrar, cliente acompanhando pelo celular e o acerto pronto no fim do dia. Sem comissão por pedido.\n\nFale com a nossa equipe no WhatsApp.',
    'Delivery próprio organizado', 'Sem comissão por pedido')

video('P11', 'Dono no celular', 'lofi', [
    PERG('Quanto você vendeu ontem?', 'preciso abrir o caderno…', dur=3.0),
    T('Sua loja *na palma da mão.*', 2.2),
    CEL(tela('m_inicio_longo', 4.2, 'Vendas e pedidos *de onde você estiver*', rolar=[0, 0.55])),
    CEL(tela('m_relatorios_longo', 3.6, 'Relatórios por dia e *por horário*', rolar=[0.15, 0.5])),
    AVISOS('E aviso de *cada pedido*', dur=4.0),
    MARCA()],
    'Quanto você vendeu ontem? Se precisou abrir o caderno, tem jeito melhor. 📱\n\nNo sistema da Sua Hamburgueria, o painel abre no celular: vendas do dia, ticket médio, pedidos em aberto, mais vendidos e relatórios por dia e por horário, de onde você estiver.\n\nFale com a nossa equipe no WhatsApp.',
    'Sua hamburgueria no celular', 'Painel em tempo real')

video('P12', 'Planos', 'house', [
    T('Quanto custa ter *tudo isso?*', 2.2),
    CARROSSEL(('p01_menu', 'Cardápio digital'), ('d_pedidos_depois', 'Sistema de gestão'), ('site_desktop', 'Site'), ('ad_V07', 'Tráfego pago'), passo=1.1),
    {'tipo': 'planos', 'texto': 'Escolha *o seu plano*', 'dur': 4.4},
    PRECO('Adicional: tráfego pago', '999,99', ['Criação dos anúncios', 'Gestão das campanhas', 'Relatório mensal'], nota='A verba dos anúncios é paga direto ao Meta.', dur=3.6),
    NUM('de comissão por pedido, em todos os planos', 0, prefixo='R$ ', dur=2.8),
    MARCA()],
    'Quanto custa organizar a sua hamburgueria? 👇\n\n📱 Cardápio digital: R$ 199,90/mês\n💻 Sistema + cardápio em site: R$ 299,90/mês\n📲 Sistema + cardápio em app: R$ 599,90/mês\n🎯 Tráfego pago: + R$ 999,99/mês (verba paga direto ao Meta)\n\nNenhum plano cobra comissão por pedido, e a montagem do cardápio está incluída. Fale com a nossa equipe no WhatsApp.',
    'Planos a partir de R$ 199,90', 'Sem comissão por pedido')


def main():
    out = AQUI / 'roteiros'
    textos = {}
    for v in V:
        (out / f'{v["id"]}.json').write_text(json.dumps({'id': v['id'], 'tema': 'pro', 'musica': v['musica'], 'cenas': v['cenas']}, ensure_ascii=False, indent=1))
        textos[v['id']] = {'angulo': v['angulo'], 'texto': v['texto'], 'titulo': v['titulo'], 'desc': v['desc']}
    (out / 'textos_pro.json').write_text(json.dumps(textos, ensure_ascii=False, indent=1))
    print(len(V), 'roteiros')


if __name__ == '__main__':
    main()
