"""Narração dos 12 vídeos da Sua Hamburgueria (P01–P12): uma fala por cena (duas nas cenas longas), escrita para o ouvido.

A fala completa a tela em vez de repetir palavra por palavra. O encerramento diz a marca devagar, como assinatura
(a voz grátis só pronuncia "Hamburgueria" com clareza assim), e a chamada em seguida. Perguntas de sim/não foram evitadas:
a voz grátis não sobe o tom no fim, e a pergunta soa como afirmação. Cada fala tem a janela da sua cena
(o montar.py da skill de narração encaixa a fala 0,1 s depois do começo da cena e confere se ela termina antes do corte).

Uso: python3 narracao_pro.py <pasta-com-os-cues>     (os P*.cues.json do render)
     → narracao/P01.json … (roteiros com janelas, prontos para gerar_piper.py ou para o ElevenLabs)
"""
import json
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent

# (cena, texto, opções). Opções: de/ate = segundos a partir do início da cena (divide cenas longas); ritmo = sílabas/s só dessa fala.
F = {
    'P01': [(0, 'Quanto da venda fica no aplicativo?', {}),
            (1, 'No seu cardápio, a comissão é zero.', {}),
            (2, 'Pelo seu link, ele pede com o ponto da carne e os adicionais.', {'ate': 4.6}),
            (2, 'Pedido confirmado.', {'de': 4.6}),
            (3, 'E o pedido chega direto no seu painel.', {}),
            (4, 'Mensalidade fixa de R$ 199,90.', {'ritmo': 6.6}),
            (5, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (5, 'Fale com a gente no WhatsApp.', {'de': 1.9})],
    'P02': [(0, 'Do anúncio à entrega, tudo com a gente.', {'ritmo': 6.9}),
            (1, 'O anúncio atrai quem está com fome.', {}),
            (2, 'Ele pede no seu cardápio digital, sem comissão.', {}),
            (3, 'O pedido cai no painel, e a cozinha já vê o que preparar.', {}),
            (4, 'E ele acompanha até a porta.', {}),
            (5, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (5, 'Fale com a gente.', {'de': 1.9})],
    'P03': [(0, 'Seu negócio merece mais que um app.', {}),
            (1, 'São quatro serviços numa operação só.', {}),
            (2, 'Cardápio digital, sistema de gestão, site e tráfego pago, tudo conectado.', {}),
            (3, 'E os pedidos chegando, um atrás do outro.', {}),
            (4, 'Planos a partir de R$ 199,90 por mês.', {'ritmo': 6.3}),
            (5, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (5, 'Chama a gente no WhatsApp.', {'de': 1.9})],
    'P04': [(0, 'Seguidor não paga conta. Conversa paga.', {'ritmo': 6.5}),
            (1, 'Quanto custa cada conversa que chega?', {}),
            (2, 'A gente cria vídeos sob medida, testa várias ideias e fica com os que trazem conversa.', {}),
            (3, 'E todo mês você recebe o relatório.', {'ritmo': 6.5}),
            (4, 'R$ 999,99 por mês.', {'ritmo': 6.6}),
            (5, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (5, 'Fale com a nossa equipe.', {'de': 1.9})],
    'P05': [(0, 'Um sistema feito pro seu delivery.', {}),
            (1, 'Sexta à noite, pico de pedidos.', {}),
            (2, 'Cada pedido chega com aviso, na hora.', {}),
            (3, 'Todos os pedidos num quadro só, e a cozinha vê tudo na tela.', {'ate': 5.4}),
            (3, 'Você sabe o custo de cada lanche, e o caixa fecha certinho.', {'de': 5.4}),
            (4, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (4, 'Veja funcionando com os seus lanches.', {'de': 1.9})],
    'P06': [(0, 'Quanto custa fazer o seu cheese bacon?', {}),
            (1, 'Sem ficha técnica, é chute.', {}),
            (2, 'O sistema calcula o custo de cada lanche, pela ficha técnica.', {'ate': 6.0}),
            (2, 'E baixa o estoque a cada venda.', {'de': 6.0}),
            (3, 'Tudo isso por R$ 299,90.', {}),
            (4, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (4, 'Descubra onde está o seu lucro.', {'de': 1.9})],
    'P07': [(0, 'O que aparece quando procuram você?', {}),
            (1, 'Muitas vezes, só o Instagram.', {}),
            (2, 'A gente cria um site com a sua marca, com cardápio, horários e botão de pedir.', {}),
            (3, 'E abre rápido no celular.', {}),
            (4, 'Do seu jeito, com endereço e horários.', {}),
            (5, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (5, 'Peça o seu orçamento no WhatsApp.', {'de': 1.9})],
    'P08': [(0, 'Teste o sistema antes de contratar.', {}),
            (1, 'Faça um pedido de teste, como quem está com fome.', {}),
            (2, 'Veja ele chegar no painel e marque como pronto na cozinha.', {}),
            (3, 'Está tudo no nosso site.', {}),
            (4, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (4, 'Teste agora, sem compromisso.', {'de': 1.9})],
    'P09': [(0, 'Trocar de sistema parece trabalhoso.', {}),
            (1, 'Com a gente, não.', {}),
            (2, 'Você manda o cardápio e as fotos.', {}),
            (3, 'A gente cadastra os lanches e configura as taxas de entrega.', {}),
            (4, 'E entrega o link pronto pra divulgar.', {}),
            (5, 'Aí é só ver os pedidos chegando.', {}),
            (6, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (6, 'A gente monta tudo pra você.', {'de': 1.9})],
    'P10': [(0, 'Delivery próprio sem bagunça.', {'ritmo': 6.4}),
            (1, 'E sem comissão no seu cardápio.', {}),
            (2, 'A taxa do bairro entra sozinha, e o pagamento já vem no pedido.', {'ate': 4.6}),
            (2, 'O motoboy vê a rota, e quem pediu acompanha.', {'de': 4.6}),
            (3, 'No fim do dia, o acerto sai pronto.', {}),
            (4, 'Cada entrega no lugar certo.', {}),
            (5, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (5, 'Fale com a nossa equipe.', {'de': 1.9})],
    'P11': [(0, 'Quanto você vendeu ontem?', {}),
            (1, 'Sua loja na palma da mão.', {}),
            (2, 'Vendas, pedidos e mais vendidos, de onde você estiver.', {}),
            (3, 'Relatórios por dia e por horário.', {}),
            (4, 'E um aviso a cada pedido novo.', {}),
            (5, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (5, 'Fale com a nossa equipe.', {'de': 1.9})],
    'P12': [(0, 'Quanto custa ter tudo isso?', {}),
            (1, 'Cardápio, sistema, site e tráfego, num lugar só.', {}),
            (2, 'Os planos começam em R$ 199,90.', {}),
            (3, 'O tráfego pago é um adicional.', {}),
            (4, 'E nenhum plano cobra comissão por pedido.', {}),
            (5, 'Sua Hamburgueria.', {'ate': 1.9, 'ritmo': 4.6}),
            (5, 'Escolha o seu e fale com a gente.', {'de': 1.9})],
}

# grafias para a voz grátis (Piper) dizer certo; o ElevenLabs não precisa delas
PRONUNCIAS = {'piper': {'link': 'línqui', 'motoboy': 'motobói'}}


def main(pasta_cues):
    out = AQUI / 'narracao'
    out.mkdir(exist_ok=True)
    (out / 'pronuncias.json').write_text(json.dumps(PRONUNCIAS, ensure_ascii=False, indent=1), encoding='utf-8')
    for vid, falas in F.items():
        cenas = json.loads((Path(pasta_cues) / f'{vid}.cues.json').read_text())['cenas']
        frases = []
        for ci, texto, op in falas:
            c = cenas[ci]
            ini = c['t0'] + op.get('de', 0.0)
            fim = c['t0'] + op['ate'] if 'ate' in op else c['t1']
            f = {'texto': texto, 'inicio': round(ini, 3), 'fim': round(fim, 3), 'cena': c['tipo']}
            if 'ritmo' in op:
                f['ritmo'] = op['ritmo']
            frases.append(f)
        (out / f'{vid}.json').write_text(json.dumps({'video': vid, 'frases': frases}, ensure_ascii=False, indent=1), encoding='utf-8')
    print(len(F), 'roteiros de narração em', out)


if __name__ == '__main__':
    main(sys.argv[1])
