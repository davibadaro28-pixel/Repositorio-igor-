"""Narração dos 12 vídeos da Sua Hamburgueria (P01–P12): uma fala por cena (duas nas longas), escrita para o ouvido.

Cada fala tem o tamanho da sua cena (cerca de 6,3 sílabas por segundo do tempo da cena menos 0,45 s): com o
gerar_kokoro.py da skill de narração, a velocidade de cada frase é ajustada para ela começar 0,1 s depois do corte e
terminar 0,35 s antes do próximo. As pausas entre as falas ficam curtas e iguais (0,4 a 0,5 s), que é o que dá ritmo
à narração. A versão anterior, com frases curtas presas ao começo de cada cena, deixava buracos de até 3,5 s.

Uso: python3 narracao_pro.py <pasta-com-os-cues>     (os P*.cues.json do render)
     → narracao/P01.json … (roteiros com janelas, prontos para gerar_kokoro.py, gerar_piper.py ou o ElevenLabs)
"""
import json
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent

# (cena, texto, opções). Opções: de/ate = segundos a partir do início da cena (divide cenas longas); ritmo = sílabas/s só dessa fala.
F = {
    'P01': [(0, 'Quanto da venda fica no aplicativo?', {}),
            (1, 'No seu cardápio próprio, a comissão é zero.', {}),
            (2, 'Pelo seu link, o cliente escolhe o ponto da carne e os adicionais.', {'ate': 4.6}),
            (2, 'Pronto: pedido confirmado.', {'de': 4.6}),
            (3, 'O pedido chega na hora, direto no painel da sua loja.', {}),
            (4, 'Mensalidade de R$ 199,90.', {}),
            (5, 'Sua Hamburgueria. Fale com a nossa equipe agora mesmo pelo WhatsApp.', {})],
    'P02': [(0, 'Do anúncio à entrega, cuidamos de tudo.', {}),
            (1, 'O anúncio certo atrai quem está com fome.', {}),
            (2, 'Ele pede direto no seu cardápio digital, sem pagar comissão.', {}),
            (3, 'O pedido cai no painel, a cozinha vê na tela o que preparar, e ninguém precisa gritar.', {}),
            (4, 'E o cliente acompanha tudo até a porta.', {}),
            (5, 'Sua Hamburgueria: do anúncio à entrega, tudo num lugar só. Fale com a gente.', {})],
    'P03': [(0, 'Você merece mais que um app de delivery.', {}),
            (1, 'São quatro serviços juntos, numa operação só.', {}),
            (2, 'Cardápio digital sem comissão, sistema de gestão, site com a sua marca e tráfego pago no Instagram.', {}),
            (3, 'E os pedidos chegando, um atrás do outro, sem confusão.', {}),
            (4, 'Os planos começam em R$ 199,90 por mês.', {}),
            (5, 'Sua Hamburgueria. Chama a gente no WhatsApp e tira suas dúvidas.', {})],
    'P04': [(0, 'Curtida não paga conta. Conversa paga.', {}),
            (1, 'Quanto custa cada conversa que o seu anúncio traz?', {}),
            (2, 'A gente cria vídeos para hamburgueria, testa vários ângulos e fica com os que trazem conversa mais barata.', {}),
            (3, 'Todo mês, relatório com o custo de cada conversa.', {}),
            (4, 'R$ 999,99 por mês.', {}),
            (5, 'Sua Hamburgueria. Fale com a nossa equipe e veja como funciona.', {})],
    'P05': [(0, 'Um sistema feito para hamburgueria.', {}),
            (1, 'Sexta à noite, pico de pedidos. Tudo certo?', {}),
            (2, 'Cada pedido chega com aviso, e nenhum fica esquecido no balcão.', {}),
            (3, 'Todos os pedidos num quadro só, e a cozinha vê tudo na tela, na ordem certa.', {'ate': 5.4}),
            (3, 'Você sabe o custo de cada lanche, e no fim o caixa fecha certinho.', {'de': 5.4}),
            (4, 'Sua Hamburgueria. Veja funcionando com os seus próprios lanches.', {})],
    'P06': [(0, 'Quanto custa fazer o seu lanche mais vendido?', {}),
            (1, 'Sem a ficha técnica, o preço é chute.', {}),
            (2, 'O sistema usa a ficha técnica e calcula o custo de cada lanche, ingrediente por ingrediente.', {'ate': 6.0}),
            (2, 'E dá baixa no estoque a cada venda.', {'de': 6.0}),
            (3, 'Tudo isso por R$ 299,90.', {}),
            (4, 'Sua Hamburgueria. Descubra onde está o seu lucro e fale com a gente.', {})],
    'P07': [(0, 'O que aparece quando procuram você?', {}),
            (1, 'Muitas vezes, só o Instagram, e o cliente desiste.', {}),
            (2, 'A gente cria um site com a sua marca, os lanches, os horários e o botão de pedir bem à vista.', {}),
            (3, 'E ele abre rápido no celular, que é onde o seu cliente está.', {}),
            (4, 'Do seu jeito, com endereço e horários.', {}),
            (5, 'Sua Hamburgueria. Peça o orçamento do seu site pelo WhatsApp.', {})],
    'P08': [(0, 'Teste o sistema antes de contratar.', {}),
            (1, 'Faça um pedido de teste no cardápio: escolha o lanche, os adicionais e a forma de pagamento.', {}),
            (2, 'Veja o pedido chegar no painel na mesma hora, e depois marque como pronto na tela da cozinha.', {}),
            (3, 'Está tudo no site, aberto para testar.', {}),
            (4, 'Sua Hamburgueria. Teste agora, sem compromisso, e fale com a gente.', {})],
    'P09': [(0, 'Trocar de sistema dá trabalho?', {}),
            (1, 'Com a gente, não.', {}),
            (2, 'Você manda o cardápio que já tem, com as fotos.', {}),
            (3, 'A gente cadastra os lanches e adicionais, e configura as taxas de entrega e o pagamento.', {}),
            (4, 'E entrega o link pronto pra divulgar no Instagram.', {}),
            (5, 'Aí é só ver os primeiros pedidos chegando no painel.', {}),
            (6, 'Sua Hamburgueria. A gente monta tudo pra você começar.', {})],
    'P10': [(0, 'Delivery próprio, sem bagunça.', {}),
            (1, 'Sem pagar comissão no seu cardápio.', {}),
            (2, 'A taxa do bairro entra sozinha, e o pagamento e o troco já vêm no pedido.', {'ate': 4.6}),
            (2, 'O motoboy vê a rota e o valor a cobrar, e o cliente acompanha a entrega.', {'de': 4.6}),
            (3, 'No fim do dia, o acerto com cada entregador sai pronto.', {}),
            (4, 'Cada entrega no lugar certo, e nenhum pedido perdido.', {}),
            (5, 'Sua Hamburgueria. Fale com a nossa equipe e organize o seu delivery.', {})],
    'P11': [(0, 'Quanto vendeu ontem? E qual lanche saiu mais?', {}),
            (1, 'Sua loja inteira na palma da mão.', {}),
            (2, 'Vendas do dia, pedidos em aberto e os mais vendidos, de onde você estiver.', {}),
            (3, 'Relatórios por dia e por horário, pra saber quando reforçar a equipe.', {}),
            (4, 'E um aviso no celular a cada pedido novo que chega.', {}),
            (5, 'Sua Hamburgueria. Fale com a nossa equipe e veja o painel funcionando.', {})],
    'P12': [(0, 'Quanto custa ter tudo isso?', {}),
            (1, 'Cardápio digital, sistema de gestão, site e tráfego pago, tudo num lugar só.', {}),
            (2, 'Os planos começam em R$ 199,90 por mês.', {}),
            (3, 'O tráfego pago é adicional, com relatório todo mês.', {}),
            (4, 'E nenhum plano cobra comissão por pedido.', {}),
            (5, 'Sua Hamburgueria. Escolha o seu plano e fale com a nossa equipe hoje.', {})],
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
