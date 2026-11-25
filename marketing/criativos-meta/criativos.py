"""Os 50 criativos estáticos para vender o sistema no Meta Ads.

Cada criativo fala com UMA dor e UM público. Prova = tela real do sistema (dados de demonstração).
Nada de integração com iFood/99Food, nota fiscal ou resultado prometido em números.

Campos:
  id, pub (hb = hamburgueria, dc = doceria, g = geral), tpl (layout), tema (escuro/claro)
  angulo, consciencia (frio = não conhece o problema, problema, solucao, produto)
  hook (texto grande da imagem; <em> = destaque), sub (linha de apoio)
  + campos do layout (tela, chat, itens, preco…)
  texto (texto principal do anúncio), titulo, desc (descrição)
"""

WA = 'Chama no WhatsApp'

C = []


def add(**k):
    C.append(k)


# =====================================================================
# HAMBURGUERIAS
# =====================================================================

add(id='H01', pub='hb', tpl='big', tema='escuro', angulo='Comissão por pedido', consciencia='problema',
    big='R$ 0', hook='de comissão no pedido que chega pelo <em>seu</em> cardápio.',
    sub='O cliente pede pelo seu link. O lanche, o cliente e o dinheiro ficam com você.',
    tela='hb_menu',
    texto='Quanto de cada X-Bacon fica com o aplicativo de delivery? 🍔\n\n'
          'No seu cardápio digital, o pedido não paga comissão. O cliente abre o link do seu Instagram ou do WhatsApp, '
          'escolhe o lanche, o ponto da carne e os adicionais, e o pedido cai direto no seu painel.\n\n'
          'Você paga uma mensalidade fixa. Vendeu 100 ou 1.000 lanches, o valor é o mesmo.\n\n'
          'Chama no WhatsApp que a gente mostra funcionando com o seu cardápio.',
    titulo='Seu cardápio, sem comissão', desc='Mensalidade fixa')

add(id='H02', pub='hb', tpl='chat', tema='escuro', angulo='Pedido digitado no WhatsApp/direct', consciencia='problema',
    hook='Seu cliente pede pelo direct e <em>você digita tudo de novo?</em>',
    chat=[('c', 'Boa noite! Me manda o cardápio?'), ('c', 'Quanto tá o cheese bacon?'), ('c', 'Entrega no Jardim América?'),
          ('c', 'Pode ser sem cebola?'), ('l', 'Pede pelo link que vai tudo certinho 👇')],
    sub='Mande o link. O pedido chega pronto no painel.',
    tela='hb_checkout',
    texto='"Me manda o cardápio?" "Quanto tá?" "Entrega no meu bairro?" Toda noite, as mesmas perguntas. 📱\n\n'
          'Com o cardápio digital você manda um link e pronto: o cliente vê fotos e preços, escolhe o ponto da carne e os '
          'adicionais, vê a taxa de entrega do bairro dele e envia. O pedido chega organizado no seu painel, sem ninguém digitar nada.\n\n'
          'Quer ver com os seus lanches? Chama no WhatsApp.',
    titulo='Pare de anotar pedido no chat', desc='O pedido chega pronto')

add(id='H03', pub='hb', tpl='phone', tema='claro', angulo='Ponto da carne errado', consciencia='problema',
    hook='Pediu ao ponto. <em>Chegou bem passado.</em>',
    sub='No cardápio digital, o ponto da carne é obrigatório. Vai escrito no pedido e na tela da cozinha.',
    itens=['Ponto da carne obrigatório', '“Sem cebola”, “sem picles” marcados', 'Tudo escrito para a cozinha'],
    tela='hb_produto',
    texto='Pediu ao ponto, chegou bem passado. E a avaliação veio com uma estrela. 😬\n\n'
          'No cardápio digital, o cliente escolhe o ponto da carne antes de fechar o pedido (é obrigatório) e marca o que '
          'quer tirar: sem cebola, sem picles. Tudo chega escrito no pedido e na tela da cozinha, do jeito que ele pediu.\n\n'
          'Chama no WhatsApp e veja com o seu cardápio.',
    titulo='O ponto certo, sempre', desc='Escrito no pedido')

add(id='H04', pub='hb', tpl='desk', tema='escuro', angulo='Pico de sexta à noite', consciencia='problema',
    hook='Sexta, 21h, chapa lotada. <em>Qual pedido sai primeiro?</em>',
    sub='Quadro de pedidos com o tempo de cada um, aviso sonoro de pedido novo e alerta de atraso.',
    tela='hb_pedidos_z', destaque=(0.045, 0.14, 0.335, 0.84, 'Há quanto tempo cada pedido espera'),
    texto='Sexta à noite, 15 pedidos ao mesmo tempo: balcão, telefone e delivery. Qual sai primeiro? 🔥\n\n'
          'No quadro de pedidos você vê tudo em colunas: novo, em preparo, pronto, em entrega. Cada pedido mostra há quanto '
          'tempo está esperando e o sistema avisa quando algum atrasa. Pedido novo chega com aviso sonoro.\n\n'
          'Chama no WhatsApp e peça uma demonstração.',
    titulo='Pico de sexta sob controle', desc='Quadro de pedidos ao vivo')

add(id='H05', pub='hb', tpl='desk', tema='claro', angulo='Comanda de papel na cozinha', consciencia='problema',
    hook='A chapa não precisa mais de <em>papelzinho.</em>',
    sub='Tela da cozinha num tablet: o que produzir, o ponto de cada carne e o botão “Pronto”.',
    tela='hb_cozinha', estreito=True,
    texto='Comanda de papel molha, rasga e some bem na hora do pico. 🧾\n\n'
          'A tela da cozinha fica num tablet do lado da chapa: mostra o total a produzir e cada pedido com o ponto da carne '
          'e as observações em destaque. Terminou, toca em "Pronto" e o balcão já sabe.\n\n'
          'Prefere papel? O sistema também imprime a comanda na impressora térmica.\n\nChama no WhatsApp.',
    titulo='Cozinha sem comanda perdida', desc='Tela para tablet')

add(id='H06', pub='hb', tpl='phone', tema='escuro', angulo='Taxa de entrega calculada na mão', consciencia='problema',
    hook='Ainda calcula a taxa de entrega <em>no WhatsApp?</em>',
    sub='Cada bairro com a sua taxa. O cliente escolhe o bairro e o valor entra sozinho no total.',
    itens=['Taxa por bairro', 'Bairro que você não atende nem aparece', 'Entrega ou retirada'],
    tela='hb_checkout2',
    texto='"Quanto fica a entrega pro Jardim das Flores?" Aí você para tudo pra responder. 🛵\n\n'
          'No cardápio digital, cada bairro tem a sua taxa. O cliente escolhe o bairro e o valor entra sozinho no total. '
          'Bairro que você não atende nem aparece na lista.\n\n'
          'Menos mensagem e nenhum erro na conta. Chama no WhatsApp.',
    titulo='Taxa de entrega automática', desc='Por bairro')

add(id='H07', pub='hb', tpl='desk', tema='escuro', angulo='Lanche que vende e não dá lucro', consciencia='frio',
    hook='Seu lanche mais vendido <em>dá lucro mesmo?</em>',
    sub='Ficha técnica de cada lanche: custo, CMV e lucro. Margem apertada aparece em vermelho.',
    tela='hb_cmv_z', destaque=(0.672, 0.2, 0.08, 0.78, 'CMV de cada lanche'),
    texto='Vender muito não é o mesmo que lucrar. Tem lanche que sai toda noite e quase não deixa dinheiro. 🍔\n\n'
          'Com a ficha técnica, o sistema calcula quanto custa cada lanche (pão, carne, queijo, bacon, embalagem) e mostra '
          'o CMV e o lucro de cada um. Quando a margem aperta, aparece em vermelho.\n\n'
          'Aí você sabe onde mexer no preço. Chama no WhatsApp.',
    titulo='O custo de cada lanche', desc='Ficha técnica e CMV')

add(id='H08', pub='hb', tpl='note', tema='escuro', angulo='Insumo acabando no meio do serviço', consciencia='problema',
    nota='Acabou o pão brioche. No meio do sábado.',
    hook='O estoque baixa sozinho a cada venda <em>e avisa antes de acabar.</em>',
    sub='Cada lanche vendido tira do estoque o que leva: pão, carne, queijo.',
    tela='hb_estoque_baixo',
    texto='Sábado, 20h, fila de pedido... e acabou o pão brioche. 😩\n\n'
          'O sistema dá baixa no estoque a cada lanche vendido, pela ficha técnica: um pão, uma carne, uma fatia de cheddar. '
          'Quando um insumo chega no mínimo, o alerta aparece na tela inicial. Dá tempo de comprar antes de faltar.\n\n'
          'Chama no WhatsApp e veja funcionando.',
    titulo='Estoque que avisa antes', desc='Baixa automática')

add(id='H09', pub='hb', tpl='note', tema='claro', angulo='Caixa que não bate', consciencia='problema',
    nota='Fechou o caixa. Faltou R$ 30.',
    hook='Com o sistema, <em>a diferença aparece na hora.</em>',
    sub='Abertura com fundo de troco, sangria registrada e fechamento conferido por forma de pagamento.',
    tela='hb_caixa_z',
    texto='Fechou o caixa e faltou R$ 30. Foi troco errado? Sangria que ninguém anotou? 🤔\n\n'
          'No sistema, o caixa abre com o fundo de troco, cada sangria e suprimento fica registrado e o fechamento mostra '
          'quanto deveria ter em dinheiro, Pix e cartão. Se tiver diferença, ela aparece na hora, não no fim do mês.\n\n'
          'Chama no WhatsApp.',
    titulo='Caixa que fecha certinho', desc='Conferido por pagamento')

add(id='H10', pub='hb', tpl='phone', tema='escuro', angulo='Combo virando quebra-cabeça', consciencia='solucao',
    hook='Combo com lanche e bebida <em>à escolha.</em> Sem confusão.',
    sub='O cliente monta o combo no cardápio e o sistema não deixa fechar faltando nada.',
    itens=['Escolha dos lanches', 'Escolha das bebidas', 'Batata à escolha'],
    tela='hb_combo2',
    texto='Combo casal: 2 lanches, fritas e 2 bebidas. Pelo WhatsApp, vira quebra-cabeça. 🧩\n\n'
          'No cardápio digital, o cliente monta o combo: escolhe os lanches, as bebidas e a batata. O sistema não deixa '
          'fechar faltando nada e o pedido chega com cada escolha escrita.\n\n'
          'A gente monta os seus combos com você. Chama no WhatsApp.',
    titulo='Combos montados sem erro', desc='Escolhas obrigatórias')

add(id='H11', pub='hb', tpl='phone', tema='claro', angulo='Adicionais que ninguém oferece', consciencia='frio',
    hook='O bacon extra que <em>se vende sozinho.</em>',
    sub='Os adicionais aparecem dentro de cada lanche, com preço. O cliente adiciona com um toque.',
    itens=['Carne extra', 'Cheddar, bacon, ovo', 'O valor soma sozinho'],
    tela='hb_produto', rolar=0.42,
    texto='Quantas vezes o cliente queria bacon extra e ninguém ofereceu? 🥓\n\n'
          'No cardápio digital, os adicionais aparecem dentro de cada lanche: carne extra, cheddar, bacon, ovo, cebola '
          'caramelizada, cada um com o seu preço. O cliente adiciona com um toque e o valor soma sozinho.\n\n'
          'O atendente esquece de oferecer. O cardápio não esquece. Chama no WhatsApp.',
    titulo='Adicionais que vendem', desc='Com um toque')

add(id='H12', pub='hb', tpl='phone', tema='escuro', angulo='"Meu lanche já saiu?"', consciencia='problema',
    hook='“Moço, meu lanche <em>já saiu?</em>”',
    sub='O cliente acompanha o pedido pelo celular: recebido, em preparo, saiu para entrega.',
    itens=['Acompanhamento em tempo real', 'Atualiza quando você avança o pedido', 'Menos mensagem no WhatsApp'],
    tela='hb_acompanhar',
    texto='"Moço, meu lanche já saiu?" Essa mensagem chega dez vezes por noite. 📲\n\n'
          'Com o cardápio digital, o cliente acompanha o pedido em tempo real: recebido, confirmado, em preparo, saiu para '
          'entrega. Você avança o pedido no painel e a tela dele atualiza sozinha.\n\n'
          'Menos mensagem, menos interrupção. Chama no WhatsApp.',
    titulo='O cliente vê onde está o lanche', desc='Acompanhamento ao vivo')

add(id='H13', pub='hb', tpl='lista', tema='escuro', angulo='Acerto com o motoboy', consciencia='problema',
    hook='O motoboy voltou. <em>Quanto ele tem que te passar?</em>',
    itens=['App do entregador com a rota no Google Maps', 'Valor a cobrar e troco em cada entrega',
           '“Saí” e “Entreguei” com um toque', 'Acerto com cada entregador por período'],
    sub='Cada entrega no nome do entregador. O acerto sai pronto.',
    texto='Fim da noite: o motoboy volta com dinheiro, maquininha e um monte de papel. Quanto ele tem que te passar? 🛵\n\n'
          'No sistema, cada entrega fica no nome do entregador. Pelo app do entregador, ele vê a rota no Google Maps, o valor '
          'a cobrar e o troco, e marca "Saí" e "Entreguei". No fim, o acerto por período sai pronto.\n\n'
          'Chama no WhatsApp.',
    titulo='Acerto com motoboy sem papel', desc='App do entregador')

add(id='H14', pub='hb', tpl='desk', tema='escuro', angulo='Cliente fiel que sumiu', consciencia='frio',
    hook='Aquele cliente de toda sexta <em>sumiu.</em> Você percebeu?',
    sub='O sistema separa quem não pede há mais de 30 dias. Você chama no WhatsApp com um toque.',
    tela='hb_clientes_z', destaque=(0.84, 0.075, 0.15, 0.075, 'Sumidos há 30+ dias'),
    texto='Tem cliente que pedia toda sexta e parou. E ninguém percebeu. 👀\n\n'
          'O sistema guarda o histórico de cada cliente e separa quem sumiu há mais de 30 dias, quem mais compra e quem faz '
          'aniversário no mês. Com um toque, abre o WhatsApp com uma mensagem pronta (que tal um cupom de volta?).\n\n'
          'Chama no WhatsApp.',
    titulo='Traga de volta quem sumiu', desc='Clientes + WhatsApp')

add(id='H15', pub='hb', tpl='note', tema='claro', angulo='Dia fraco', consciencia='solucao',
    nota='Terça parada. De novo.',
    hook='Crie um cupom <em>só para o dia fraco.</em>',
    sub='Desconto, frete grátis ou primeira compra, com pedido mínimo, validade e limite de usos.',
    tela='hb_cupons_z',
    texto='Terça-feira, chapa fria e motoboy parado. 🥶\n\n'
          'Crie um cupom para o dia fraco: desconto em %, valor fixo ou frete grátis, com pedido mínimo, validade e limite de '
          'usos. Ou um cupom só para a primeira compra, para quem ainda não conhece a casa. Você divulga no Instagram e o '
          'cliente digita no cardápio.\n\nNa tela de cupons, você vê quantas vezes cada um foi usado. Chama no WhatsApp.',
    titulo='Movimente o dia fraco', desc='Cupons no cardápio')

add(id='H16', pub='hb', tpl='desk', tema='escuro', angulo='Decisão no palpite', consciencia='frio',
    hook='Que horas a sua chapa <em>mais trabalha?</em>',
    sub='Faturamento por dia, por horário e por dia da semana. Mais vendidos, bairros e ticket médio.',
    tela='hb_relatorios_z',
    texto='Que horas chega mais pedido? Qual dia da semana vende menos? Qual lanche puxa as vendas? 📊\n\n'
          'Os relatórios mostram o faturamento por dia, por horário e por dia da semana, os mais vendidos, os bairros que mais '
          'pedem e o ticket médio. Dá para montar a escala e as promoções olhando número, não palpite.\n\n'
          'Chama no WhatsApp.',
    titulo='Decida olhando número', desc='Relatórios prontos')

add(id='H17', pub='hb', tpl='phone', tema='claro', angulo='Dono preso na loja', consciencia='frio',
    hook='A hamburgueria <em>no seu bolso.</em>',
    sub='Vendas do dia, pedidos em aberto e o que está acabando, de onde você estiver.',
    itens=['Vendas e ticket médio do dia', 'Pedidos em aberto', 'Alerta de estoque baixo'],
    tela='hb_m_inicio',
    texto='Dá pra sair da loja sem ligar a cada 20 minutos pra saber como está? Dá. 📱\n\n'
          'O painel abre no celular: vendas do dia, ticket médio, pedidos em aberto, os mais vendidos e o que está acabando '
          'no estoque. Tudo atualizado na hora.\n\nChama no WhatsApp e veja no seu celular.',
    titulo='Sua loja no celular', desc='Painel em tempo real')

add(id='H18', pub='hb', tpl='split', tema='escuro', angulo='Antes x depois', consciencia='problema',
    hook='Antes e depois de <em>organizar a hamburgueria</em>',
    antes=['Pedido no caderno', 'Taxa de entrega no chute', 'Caixa conferido no olho', 'Estoque na memória'],
    depois=['Pedido chega pelo cardápio', 'Taxa por bairro automática', 'Caixa por forma de pagamento', 'Alerta de estoque baixo'],
    tela='hb_m_inicio',
    texto='Antes: pedido no caderno, taxa de entrega no chute, caixa conferido no olho e estoque na memória. 📓\n\n'
          'Depois: pedido chegando organizado pelo cardápio digital, taxa por bairro automática, caixa fechado por forma de '
          'pagamento e estoque que avisa antes de acabar.\n\n'
          'A gente monta o seu cardápio e te ensina a usar. Chama no WhatsApp.',
    titulo='Saia do caderno', desc='Montamos seu cardápio')

add(id='H19', pub='hb', tpl='check', tema='claro', angulo='Checklist de dores', consciencia='problema',
    hook='Sua hamburgueria <em>ainda…</em>',
    itens=['anota pedido no WhatsApp?', 'calcula a taxa de entrega na mão?', 'descobre que o pão acabou na hora?',
           'não sabe quanto custa cada lanche?'],
    fecho='Marcou um? Dá pra resolver os quatro num sistema só.',
    texto='Responde rápido: sua hamburgueria ainda…\n'
          '❌ anota pedido no WhatsApp?\n❌ calcula a taxa de entrega na mão?\n❌ descobre que o pão acabou na hora do pedido?\n'
          '❌ não sabe quanto custa cada lanche?\n\n'
          'Se marcou um, o sistema resolve: cardápio digital, taxa por bairro, estoque com alerta e ficha técnica, tudo junto. 👇\n\n'
          'Chama no WhatsApp.',
    titulo='Marcou algum? Fala com a gente', desc='Demonstração sem compromisso')

add(id='H20', pub='hb', tpl='preco', tema='escuro', angulo='Oferta: cardápio digital', consciencia='produto',
    hook='Cardápio digital da sua hamburgueria',
    preco='199,90', plano='Cardápio digital',
    itens=['Fotos, ponto da carne e adicionais', 'Taxa por bairro, cupom e Pix', 'Pedidos no painel em tempo real',
           'Link e QR Code para o Instagram'],
    nota='Sem comissão por pedido. A gente monta o cardápio pra você.',
    tela='hb_menu',
    texto='Cardápio digital com a cara da sua hamburgueria por R$ 199,90 por mês. Sem comissão por pedido. 🍔\n\n'
          '✅ Fotos, ponto da carne e adicionais\n✅ Taxa de entrega por bairro, cupom e Pix\n'
          '✅ Pedidos chegando no painel em tempo real\n✅ Link e QR Code para o Instagram e o balcão\n\n'
          'A gente cadastra o seu cardápio e entrega pronto. Chama no WhatsApp.',
    titulo='Cardápio digital: R$ 199,90/mês', desc='Sem comissão por pedido')

add(id='H21', pub='hb', tpl='preco', tema='claro', angulo='Oferta: sistema completo', consciencia='produto',
    hook='O sistema completo da hamburgueria',
    preco='299,90', plano='Sistema + cardápio em site',
    itens=['Cardápio digital e quadro de pedidos', 'Balcão (PDV), caixa e tela da cozinha', 'Estoque com ficha técnica e CMV',
           'Financeiro, clientes, cupons e relatórios'],
    nota='Sem comissão por pedido. Montagem do cardápio inclusa.',
    tela='hb_m_inicio',
    texto='Tudo o que a hamburgueria precisa num lugar só, por R$ 299,90 por mês. 💻\n\n'
          'Cardápio digital, quadro de pedidos, balcão, caixa, tela da cozinha, estoque com ficha técnica, financeiro, '
          'clientes, cupons, entregas e relatórios. Sem comissão por pedido.\n\n'
          'A gente monta o seu cardápio e te ensina a usar. Chama no WhatsApp e peça uma demonstração.',
    titulo='Sistema completo: R$ 299,90/mês', desc='Sem comissão por pedido')

add(id='H22', pub='hb', tpl='bio', tema='escuro', angulo='Link da bio que não vende', consciencia='frio',
    hook='Um link na bio que <em>recebe pedido.</em>',
    sub='Link e QR Code do seu cardápio para o Instagram, o WhatsApp e o balcão.',
    tela='hb_menu',
    texto='Seu Instagram tem visita todo dia. E o link da bio leva para… um PDF? Para lugar nenhum? 🔗\n\n'
          'Com o cardápio digital, o link da bio vira pedido: o cliente toca, escolhe o lanche e envia. Você também ganha um '
          'QR Code para colar no balcão e na embalagem.\n\nChama no WhatsApp.',
    titulo='Link da bio que vende', desc='Link e QR Code')

# =====================================================================
# DOCERIAS E CONFEITARIAS
# =====================================================================

add(id='D01', pub='dc', tpl='desk', tema='claro', angulo='Encomendas de fim de ano', consciencia='problema',
    hook='Dezembro chegando. <em>Onde estão as encomendas?</em>',
    sub='Agenda de encomendas por dia, com o que produzir em cada um.',
    tela='dc_encomendas_z',
    texto='Dezembro chegando e as encomendas espalhadas entre caderno, WhatsApp e post-it. 🎄\n\n'
          'No sistema, o cliente escolhe o bolo, marca dia e horário pelo cardápio e a encomenda cai na agenda. Para cada dia '
          'aparece o que produzir: quantos bolos, de qual sabor, de qual tamanho.\n\n'
          'Organize o fim de ano antes de ele chegar. Chama no WhatsApp.',
    titulo='Encomendas de Natal em ordem', desc='Agenda por dia')

add(id='D02', pub='dc', tpl='phone', tema='escuro', angulo='Agendamento de encomenda', consciencia='solucao',
    hook='O cliente marca <em>dia e hora</em> da encomenda sozinho.',
    sub='Encomenda agendada pelo cardápio, respeitando o prazo de cada bolo.',
    itens=['Data e horário de entrega ou retirada', 'Prazo mínimo por produto', 'Cai direto na agenda'],
    tela='dc_checkout',
    texto='"Dá pra fazer pra sábado às 15h?" E lá vai você olhar o caderno. 📅\n\n'
          'No cardápio digital, o cliente escolhe o bolo, o tamanho e já marca dia e horário de entrega ou retirada. '
          'O sistema respeita o prazo de cada produto: bolo que precisa de 24h não pode ser pedido para hoje.\n\n'
          'Chama no WhatsApp.',
    titulo='Encomenda com dia e hora', desc='Pelo cardápio')

add(id='D03', pub='dc', tpl='desk', tema='escuro', angulo='Aniversariantes do mês', consciencia='frio',
    hook='Seu cliente faz aniversário este mês. <em>Quem vai vender o bolo dele?</em>',
    sub='O sistema lista os aniversariantes do mês e abre o WhatsApp com a mensagem pronta.',
    tela='dc_aniversariantes_z', destaque=(0.785, 0.11, 0.2, 0.11, 'Aniversariantes do mês'),
    texto='Seu cliente faz aniversário este mês. Quem vai vender o bolo dele: você ou a doceria da esquina? 🎂\n\n'
          'O sistema guarda a data de aniversário de cada cliente e lista os aniversariantes do mês. Com um toque, abre o '
          'WhatsApp com uma mensagem pronta. E também mostra quem não compra há mais de 30 dias.\n\nChama no WhatsApp.',
    titulo='Aniversariantes do mês', desc='Mensagem pronta')

add(id='D04', pub='dc', tpl='quiz', tema='claro', angulo='Preço sem saber o custo', consciencia='frio',
    pergunta='Quanto custa fazer o seu bolo de cenoura?',
    hook='Se a resposta foi “mais ou menos”, <em>o preço pode estar errado.</em>',
    sub='Ficha técnica de cada bolo: o sistema calcula o custo e a margem de cada tamanho.',
    tela='dc_estoque_z',
    texto='Quanto custa fazer o seu bolo de cenoura? Se a resposta foi "mais ou menos uns…", o preço pode estar errado. 🥕\n\n'
          'Cadastre a ficha técnica (farinha, ovos, cobertura, embalagem) e o sistema calcula o custo de cada bolo e de cada '
          'tamanho, com a margem. O custo dos insumos se atualiza a cada compra que você lança.\n\nChama no WhatsApp.',
    titulo='O custo de cada bolo', desc='Ficha técnica')

add(id='D05', pub='dc', tpl='quiz', tema='claro', angulo='Diferença no caixa', consciencia='problema',
    pergunta='O caixa de ontem bateu?',
    hook='Se você não tem certeza, <em>o sistema tem.</em>',
    sub='Fundo de troco, sangria registrada e fechamento conferido por forma de pagamento.',
    tela='dc_caixa_z',
    texto='Faltou R$ 20 no caixa. De novo. E ninguém sabe onde foi parar. 💸\n\n'
          'No sistema, o caixa abre com o fundo de troco, as sangrias ficam registradas e o fechamento mostra o que entrou em '
          'dinheiro, Pix e cartão. A diferença aparece no fechamento do dia, não no fim do mês.\n\nChama no WhatsApp.',
    titulo='Caixa conferido todo dia', desc='Sem diferença escondida')

add(id='D06', pub='dc', tpl='check', tema='escuro', angulo='Checklist de dores', consciencia='problema',
    hook='Sua doceria <em>ainda…</em>',
    itens=['guarda encomenda no caderno?', 'responde preço um por um no WhatsApp?', 'descobre que acabou o leite Ninho na hora?',
           'não sabe quanto custa cada bolo?'],
    fecho='Marcou um? Dá pra resolver os quatro num sistema só.',
    texto='Responde rápido: sua doceria ainda…\n'
          '❌ guarda encomenda no caderno?\n❌ responde preço um por um no WhatsApp?\n'
          '❌ descobre que acabou o leite Ninho na hora de produzir?\n❌ não sabe quanto custa cada bolo?\n\n'
          'Se marcou um, o sistema resolve: agenda de encomendas, cardápio digital, estoque com alerta e ficha técnica. 👇\n\n'
          'Chama no WhatsApp.',
    titulo='Marcou algum? Fala com a gente', desc='Demonstração sem compromisso')

add(id='D07', pub='dc', tpl='desk', tema='escuro', angulo='"O que eu faço agora?"', consciencia='problema',
    hook='“O que eu faço agora?” <em>Está na tela.</em>',
    sub='Tela da cozinha com o total a produzir e cada pedido na ordem em que chegou.',
    tela='dc_cozinha', estreito=True,
    texto='Cansou de ouvir "o que eu faço agora?" a cada 10 minutos? 👩‍🍳\n\n'
          'A tela da cozinha mostra o total a produzir e cada pedido na ordem em que chegou, com as observações em destaque '
          '("escrever Parabéns, Ana"). Ficou pronto, um toque e o balcão já sabe.\n\nChama no WhatsApp.',
    titulo='A resposta fica na tela', desc='Tela da cozinha')

add(id='D08', pub='dc', tpl='split', tema='claro', angulo='Antes x depois', consciencia='problema',
    hook='Antes e depois de <em>organizar a doceria</em>',
    antes=['Encomenda no caderno', 'Preço respondido no WhatsApp', 'Bolo sem custo calculado', 'Aniversário de cliente esquecido'],
    depois=['Agenda de encomendas por dia', 'Cardápio com fotos e preços', 'Ficha técnica e margem', 'Aniversariantes do mês'],
    tela='dc_m_inicio',
    texto='Antes: encomenda no caderno, preço respondido um por um no WhatsApp, bolo sem custo calculado e aniversário de '
          'cliente esquecido. 📓\n\n'
          'Depois: agenda de encomendas por dia, cardápio digital com fotos e preços, ficha técnica com a margem de cada bolo '
          'e a lista de aniversariantes do mês.\n\nA gente monta o seu cardápio e te ensina a usar. Chama no WhatsApp.',
    titulo='Saia do caderno', desc='Montamos seu cardápio')

add(id='D09', pub='dc', tpl='chat', tema='claro', angulo='Perguntas repetidas no WhatsApp', consciencia='problema',
    hook='As mesmas perguntas, <em>o dia inteiro.</em>',
    chat=[('c', 'Oi! Tem bolo de pote hoje?'), ('c', 'Quanto é a fatia?'), ('c', 'Faz bolo de 2 kg pra sábado?'),
          ('c', 'Entrega na Penha?'), ('l', 'Tá tudo no link, com foto e preço 👇')],
    sub='Cardápio com fotos, tamanhos e preços. Encomenda com dia e hora.',
    tela='dc_menu',
    texto='"Tem bolo de pote hoje?" "Quanto é a fatia?" "Faz pra sábado?" O dia inteiro, as mesmas perguntas. 💬\n\n'
          'Com o cardápio digital, você responde com um link: fotos, tamanhos, preços, taxa de entrega do bairro e '
          'encomenda com dia e hora marcados. O pedido chega organizado no painel.\n\nChama no WhatsApp.',
    titulo='Responda com um link', desc='Cardápio com fotos')

add(id='D10', pub='dc', tpl='note', tema='claro', angulo='Insumo acabando', consciencia='problema',
    nota='Acabou o leite Ninho. Justo hoje.',
    hook='O estoque baixa sozinho a cada venda <em>e avisa antes de acabar.</em>',
    sub='Cada bolo vendido tira do estoque o que leva, pela ficha técnica.',
    tela='dc_estoque_baixo',
    texto='Encomenda de bolo de Ninho com morango para amanhã… e acabou o leite Ninho. 😩\n\n'
          'O sistema dá baixa no estoque a cada venda, pela ficha técnica de cada produto. Quando um insumo chega no mínimo, '
          'o alerta aparece na tela inicial. Dá tempo de comprar antes de faltar.\n\nChama no WhatsApp.',
    titulo='Estoque que avisa antes', desc='Baixa automática')

add(id='D11', pub='dc', tpl='preco', tema='escuro', angulo='Oferta: cardápio digital', consciencia='produto',
    hook='Cardápio digital da sua doceria',
    preco='199,90', plano='Cardápio digital',
    itens=['Fotos, tamanhos e preços', 'Encomenda com dia e horário', 'Taxa por bairro, cupom e Pix', 'Link e QR Code para o Instagram'],
    nota='Sem comissão por pedido. A gente monta o cardápio pra você.',
    tela='dc_menu',
    texto='Cardápio digital com a cara da sua doceria por R$ 199,90 por mês. Sem comissão por pedido. 🎂\n\n'
          '✅ Fotos, tamanhos e preços\n✅ Encomenda com dia e horário marcados\n✅ Taxa de entrega por bairro, cupom e Pix\n'
          '✅ Link e QR Code para o Instagram\n\nA gente cadastra o seu cardápio e entrega pronto. Chama no WhatsApp.',
    titulo='Cardápio digital: R$ 199,90/mês', desc='Sem comissão por pedido')

add(id='D12', pub='dc', tpl='phone', tema='claro', angulo='Dona presa na loja', consciencia='frio',
    hook='Saiu da doceria? <em>Ela continua com você.</em>',
    sub='Vendas do dia, encomendas e o que está acabando, no seu celular.',
    itens=['Vendas e ticket médio do dia', 'Pedidos e encomendas em aberto', 'Alerta de estoque baixo'],
    tela='dc_m_inicio',
    texto='Foi ao mercado comprar ingrediente e ficou pensando em como estão as coisas na doceria? 📱\n\n'
          'O painel abre no celular: vendas do dia, ticket médio, pedidos e encomendas em aberto e o que está acabando no '
          'estoque. Tudo atualizado na hora.\n\nChama no WhatsApp e veja no seu celular.',
    titulo='Sua doceria no celular', desc='Painel em tempo real')

add(id='D13', pub='dc', tpl='phone', tema='escuro', angulo='Tamanhos e observações', consciencia='solucao',
    hook='1 kg ou 1,7 kg? <em>O cliente escolhe na foto.</em>',
    sub='Cada bolo com foto, tamanhos e preço. E a observação vai junto: “escrever Parabéns, Ana”.',
    itens=['Foto de cada produto', 'Preço por tamanho', 'Observação no pedido'],
    tela='dc_produto',
    texto='"Qual o tamanho do de 1 kg? Serve quantas pessoas? Quanto fica o maior?" 🎂\n\n'
          'No cardápio digital, cada bolo tem foto, descrição e preço por tamanho. O cliente escolhe, escreve a observação '
          '("escrever Parabéns, Ana") e o pedido chega com tudo anotado.\n\nChama no WhatsApp.',
    titulo='Foto, tamanho e preço', desc='Tudo no cardápio')

add(id='D14', pub='dc', tpl='big', tema='escuro', angulo='Comissão por pedido', consciencia='problema',
    big='R$ 0', hook='de comissão na encomenda que chega pelo <em>seu</em> cardápio.',
    sub='O cliente pede pelo seu link. O bolo, o cliente e o dinheiro ficam com você.',
    tela='dc_menu',
    texto='Quanto de cada bolo fica com o aplicativo de delivery? 🎂\n\n'
          'No seu cardápio digital, o pedido não paga comissão. O cliente abre o link do seu Instagram, escolhe o bolo, o '
          'tamanho e o dia da entrega, e a encomenda cai direto na sua agenda.\n\n'
          'Você paga uma mensalidade fixa, venda quanto vender. Chama no WhatsApp.',
    titulo='Seu cardápio, sem comissão', desc='Mensalidade fixa')

# =====================================================================
# GERAL (lojas de comida)
# =====================================================================

add(id='G01', pub='g', tpl='duo', tema='escuro', angulo='Um link, cardápio inteiro', consciencia='frio',
    hook='Um link. Seu cardápio inteiro. <em>Pedido chegando.</em>',
    sub='Para hamburguerias, docerias, lanchonetes e restaurantes. Com a sua marca e as suas fotos.',
    telas=['hb_menu', 'dc_menu'],
    texto='Seu cliente quer pedir. Ele só precisa de um link. 🔗\n\n'
          'Cardápio digital com a sua marca, as suas cores e as suas fotos: o cliente escolhe, vê a taxa de entrega do bairro, '
          'paga com Pix ou na entrega e acompanha o pedido. Você recebe tudo organizado no painel.\n\n'
          'Hamburgueria, doceria, lanchonete ou restaurante. Chama no WhatsApp.',
    titulo='Cardápio digital com sua marca', desc='Sem comissão por pedido')

add(id='G02', pub='g', tpl='split', tema='claro', angulo='Cardápio em PDF', consciencia='problema',
    hook='Seu cardápio ainda é <em>um PDF no WhatsApp?</em>',
    antes=['Cliente dá zoom no PDF', 'Pergunta o preço mesmo assim', 'Você digita o pedido', 'Calcula a entrega na mão'],
    depois=['Fotos e preços no celular', 'Adicionais e observações', 'Taxa por bairro automática', 'Pedido chega no painel'],
    rotulos=('PDF', 'CARDÁPIO DIGITAL'),
    tela='hb_menu',
    texto='Cardápio em PDF: o cliente dá zoom, se perde, pergunta o preço mesmo assim… e você digita o pedido. 📄\n\n'
          'No cardápio digital, ele vê fotos e preços, escolhe adicionais, vê a taxa de entrega do bairro e envia. O pedido '
          'chega organizado no seu painel, com aviso sonoro.\n\nA gente transforma o seu PDF em cardápio digital. Chama no WhatsApp.',
    titulo='Troque o PDF por pedido', desc='Montamos para você')

add(id='G03', pub='g', tpl='planos', tema='escuro', angulo='Tabela de planos', consciencia='produto',
    hook='Escolha o plano <em>da sua loja</em>',
    texto='Três planos, mensalidade fixa e nenhuma comissão por pedido. 👇\n\n'
          '📱 Cardápio digital: R$ 199,90/mês\n💻 Sistema + cardápio em site: R$ 299,90/mês\n'
          '📲 Sistema + cardápio em app: R$ 599,90/mês\n\n'
          'Todos com a montagem do cardápio, link e QR Code e suporte pelo WhatsApp. Chama no WhatsApp e escolha o seu.',
    titulo='Planos a partir de R$ 199,90', desc='Sem comissão por pedido')

add(id='G04', pub='g', tpl='app', tema='claro', angulo='App com a marca da loja', consciencia='solucao',
    hook='Sua loja <em>na tela do celular</em> do cliente.',
    sub='O cliente instala o cardápio no celular e pede pelo ícone com a sua marca.',
    preco='599,90', plano='Sistema + cardápio em app',
    texto='E se o cliente não precisasse procurar o seu link toda vez? 📲\n\n'
          'No plano com app, o cliente instala o cardápio no celular e ele fica na tela inicial com o ícone e o nome da sua loja. '
          'Tocou, abriu o cardápio. Junto vem o sistema completo: pedidos, caixa, cozinha, estoque e financeiro.\n\n'
          'R$ 599,90 por mês, sem comissão por pedido. Chama no WhatsApp.',
    titulo='O ícone da sua loja no celular', desc='Sistema + app')

add(id='G05', pub='g', tpl='note', tema='escuro', angulo='Medo de dar trabalho', consciencia='solucao',
    nota='Manda as fotos e os preços. A gente monta.',
    hook='Seu cardápio digital <em>montado por nós.</em>',
    sub='Você manda o cardápio que já tem (até PDF ou foto). A gente cadastra tudo e entrega pronto.',
    tela='hb_produtos',
    texto='"Deve dar um trabalhão cadastrar tudo…" Não dá: quem cadastra somos nós. ✍️\n\n'
          'Você manda o cardápio que já tem (PDF, foto do cardápio impresso ou lista no WhatsApp) e as fotos. A gente cadastra '
          'os produtos, os tamanhos, os adicionais e as taxas de entrega, e entrega o cardápio pronto, com link e QR Code.\n\n'
          'Chama no WhatsApp.',
    titulo='A gente monta pra você', desc='Cardápio pronto')

add(id='G06', pub='g', tpl='desk', tema='claro', angulo='Item esgotado / cozinha lotada', consciencia='solucao',
    hook='Acabou? <em>Esgotado com um toque.</em>',
    sub='O item some do cardápio na hora. E dá para pausar os pedidos quando a cozinha lota.',
    tela='hb_produtos_z', destaque=(0.535, 0.2, 0.135, 0.78, 'Disponível ou esgotado'),
    texto='Acabou o produto e o cliente continua pedindo. Aí é desculpa, estorno e cliente chateado. 😕\n\n'
          'No painel, um toque marca o item como esgotado e ele some do cardápio na hora. Cozinha lotada? Pause os pedidos '
          'por um tempo e volte quando der conta.\n\nChama no WhatsApp.',
    titulo='Esgotado com um toque', desc='E pausa nos pedidos')

add(id='G07', pub='g', tpl='note', tema='escuro', angulo='Equipe com acesso a tudo', consciencia='solucao',
    nota='Funcionário vendo o faturamento do mês?',
    hook='Cada um vê <em>só o que precisa.</em>',
    sub='Logins para gerente, caixa, cozinha e entregador, cada um com o seu acesso.',
    tela='hb_usuarios',
    itens=['Gerente', 'Caixa', 'Cozinha', 'Entregador'],
    texto='Funcionário no caixa vendo o faturamento do mês? Não precisa. 🔐\n\n'
          'Cada pessoa da equipe tem o seu login: o caixa vê pedidos e caixa, a cozinha vê a tela de produção, o entregador '
          'vê as entregas dele. Financeiro e relatórios, só para quem você liberar.\n\nChama no WhatsApp.',
    titulo='Um login para cada função', desc='Você no controle')

add(id='G08', pub='g', tpl='phone', tema='claro', angulo='Troco e forma de pagamento', consciencia='solucao',
    hook='“Troco pra 50?” <em>Já vem no pedido.</em>',
    sub='Pix, cartão ou dinheiro com troco: o cliente escolhe no cardápio e o entregador já sai sabendo.',
    itens=['Pix', 'Cartão na entrega', 'Dinheiro com troco'],
    tela='hb_checkout2', rolar=0.25,
    texto='O motoboy chega, o cliente só tem nota de 100 e ninguém levou troco. 💵\n\n'
          'No cardápio digital, o cliente escolhe como vai pagar (Pix, cartão ou dinheiro) e informa o troco. Vem tudo no '
          'pedido e no app do entregador, com o valor a cobrar.\n\nChama no WhatsApp.',
    titulo='Pagamento e troco no pedido', desc='Pix, cartão ou dinheiro')

add(id='G09', pub='g', tpl='note', tema='claro', angulo='Medo de assinar', consciencia='produto',
    nota='Antes de assinar, veja funcionando.',
    hook='Demonstração com <em>o seu cardápio.</em>',
    sub='Mostramos o sistema com os seus produtos antes de você decidir.',
    tela='hb_inicio',
    texto='Não quer assinar no escuro? Justo. 👀\n\n'
          'A gente mostra o sistema funcionando com os seus produtos: o cardápio do jeito que o seu cliente vai ver, o '
          'pedido chegando no painel, a cozinha, o caixa e os relatórios. Você decide depois.\n\n'
          'Chama no WhatsApp e marque a sua demonstração.',
    titulo='Veja antes de assinar', desc='Demonstração sem compromisso')

add(id='G10', pub='g', tpl='desk', tema='escuro', angulo='Contas esquecidas', consciencia='problema',
    hook='O boleto do gás vence <em>quando?</em>',
    sub='Contas a pagar e a receber, com o que está vencendo e o saldo de cada dia.',
    tela='hb_contas_z',
    texto='Aluguel, gás, fornecedor, folha… e um boleto que você só lembra depois que venceu. 📆\n\n'
          'No financeiro, ficam as contas a pagar e a receber (até as que se repetem todo mês), com o que está pendente e o '
          'que venceu. O fluxo de caixa mostra o saldo de cada dia.\n\nChama no WhatsApp.',
    titulo='Sem susto com boleto', desc='Contas e fluxo de caixa')

add(id='G11', pub='g', tpl='phone', tema='escuro', angulo='Folga sem preocupação', consciencia='frio',
    hook='POV: domingo de folga e você sabe <em>exatamente</em> como está a loja.',
    sub='Pedidos chegando, em preparo e prontos, no seu celular.',
    itens=['Pedidos em tempo real', 'Tempo de cada pedido', 'Aviso de pedido novo'],
    tela='hb_m_pedidos',
    texto='Folga de verdade é quando você não precisa ligar pra loja a cada meia hora. 😮‍💨\n\n'
          'Pelo celular, você vê os pedidos chegando, em preparo e prontos, com o tempo de cada um, e as vendas do dia. '
          'A equipe trabalha no painel e você acompanha de onde estiver.\n\nChama no WhatsApp.',
    titulo='Acompanhe de onde estiver', desc='Painel no celular')

add(id='G12', pub='g', tpl='quiz', tema='escuro', angulo='Não sabe quanto vendeu', consciencia='frio',
    pergunta='Quanto você vendeu ontem?',
    hook='Sem abrir o caderno: <em>está no relatório.</em>',
    sub='Faturamento, pedidos, ticket médio e cancelamentos de qualquer período.',
    tela='hb_m_relatorios',
    texto='Quanto você vendeu ontem? E na semana passada? Se precisou abrir o caderno, tem coisa melhor. 📊\n\n'
          'Nos relatórios você vê o faturamento, o número de pedidos, o ticket médio, os mais vendidos e os cancelamentos de '
          'qualquer período, e exporta para o Excel.\n\nChama no WhatsApp.',
    titulo='Suas vendas em números', desc='Relatórios prontos')

add(id='G13', pub='g', tpl='desk', tema='claro', angulo='Fidelidade sem cartão de papel', consciencia='solucao',
    hook='Cartão fidelidade <em>sem cartão de papel.</em>',
    sub='Cada pedido soma pontos para o cliente. O sistema guarda tudo e o cliente troca no balcão.',
    tela='hb_clientes_w', destaque=(0.852, 0.21, 0.075, 0.77, 'Pontos de cada cliente'),
    texto='Cartão de papel com carimbo: o cliente perde, esquece em casa e você nunca sabe quantos tem. 🎟️\n\n'
          'No sistema, cada pedido soma pontos no cadastro do cliente. Você vê os pontos de cada um e o resgate é feito no '
          'balcão. O cliente volta para trocar.\n\nChama no WhatsApp.',
    titulo='Fidelidade por pontos', desc='Sem cartão de papel')

add(id='G14', pub='g', tpl='colagem', tema='escuro', angulo='Tudo num lugar só', consciencia='solucao',
    hook='Cardápio, pedidos, cozinha e caixa. <em>Num lugar só.</em>',
    telas=[('hb_menu', 'Cardápio digital'), ('hb_pedidos', 'Pedidos'), ('hb_cozinha', 'Cozinha'), ('hb_cmv', 'Custo e margem')],
    texto='Um aplicativo pra pedido, um caderno pra encomenda, uma planilha pro caixa… e nada conversa com nada. 😵\n\n'
          'No sistema fica tudo junto: cardápio digital, quadro de pedidos, balcão, cozinha, caixa, estoque com ficha técnica, '
          'financeiro, clientes e relatórios. O pedido que entra no cardápio já baixa o estoque e aparece no caixa.\n\n'
          'Chama no WhatsApp.',
    titulo='Tudo num sistema só', desc='A partir de R$ 199,90/mês')

assert len(C) == 50, len(C)
assert len({c['id'] for c in C}) == 50
