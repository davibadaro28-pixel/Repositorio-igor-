# Variações dos anúncios (16 vídeos)

Cada variação de texto de `TEXTOS-ANUNCIOS.md` virou um vídeo próprio, narrado com o texto adaptado para fala,
com a frase de prova (lucro +30% na doceria de quem criou o sistema, em 3ª pessoa) antes do convite final.
As cenas vêm da biblioteca do tema (`temas/<tema>.js`) e cada variação tem o seu plano (`variacoes/<id>/plano.js`),
ligado ao tempo de cada palavra da narração.

## Escolha das vozes

Audição de 16 vozes brasileiras do ElevenLabs com uma frase difícil ("Estoque organizado é menos surpresa.
Encomenda com data e hora, histórico e fidelidade…"), conferindo dicção pelo reconhecimento de fala (Whisper),
variação de entonação e ritmo.

| Tema | Voz | Por quê |
| --- | --- | --- |
| Taxas (V01) | Fernando Borges | dicção perfeita na audição, tom urgente e elegante; a voz anterior trocou "Estoque" por "Estóquio" |
| Lucro (V02) | Ana Dias | formal e limpa, sem erro de dicção |
| Estoque (V03) | Marcelo Costa | articulada e calma, sem erro; a voz anterior teve "Stoke" no lugar de "Estoque" |
| Cardápio (V04) | Marianne | doce e calma, combina com o estilo editorial |
| Gestão (V05) | Roberta | animada, boa variação de entonação |

Cada frase foi gravada 2 vezes (3 quando nenhuma bateu com o texto) e entrou a melhor pela nota: erro de palavras
no reconhecimento, voz monótona, pausa longa no meio da frase e ritmo fora do alvo. O relatório de cada escolha fica
em `escolha.json` na pasta de trabalho.

## Imagem, trilha e som

- Cada variação tem trilha própria (ElevenLabs Music) em 4 seções alinhadas à fala: gancho/problema, solução,
  prova e final; o estilo segue o do tema.
- A mixagem usa o perfil do tema (`mix.json`) e a mesma cadeia de `MIXAGEM.md`: todas em −14 LUFS, pico
  abaixo de −1 dBTP, voz de 11 a 14 dB acima da trilha durante a fala.
- Todas passaram na verificação de ritmo (nenhum trecho parado acima de 1 s) e na checagem de inteligibilidade
  com reconhecimento de fala.
- Os vídeos finais ficam em `out/variacoes/<id>.mp4` (fora do Git por tamanho).

## As 16 variações

### v01a-curiosidade · Fernando Borges · 36.1 s

1. Tem um cliente que você paga para atender.
2. E ele já é seu.
3. Pelo aplicativo, uma parte de cada pedido fica no caminho.
4. Os apps trazem cliente novo. Mas pagar de novo por quem já é seu?
5. Com um cardápio com a sua marca, o pedido cai na hora no seu painel.
6. Sem comissão por pedido. E o cliente fica na sua base, com histórico e WhatsApp.
7. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
8. Tenha o seu canal próprio. Fale com a gente.

### v01b-contraria · Fernando Borges · 36.6 s

1. App de delivery é ótimo para achar cliente novo.
2. E péssimo para guardar o cliente que você já conquistou.
3. Cada pedido dele passa pelo app, e uma parte fica lá.
4. Use o app para ser encontrado. E dê para quem já é seu um caminho direto:
5. o seu cardápio digital, com a sua marca. O pedido cai na hora no seu painel.
6. Sem comissão por pedido do sistema.
7. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
8. Quer ver com a sua marca? Fale com a gente.

### v01c-fundador · Fernando Borges · 40.5 s

1. Quem criou este sistema tem doceria.
2. E cansou de ver parte de cada pedido ficar no aplicativo.
3. Pagava comissão até em cliente fiel, que já era da casa.
4. E os cardápios digitais mal deixavam colocar a cara da loja.
5. Então construiu o que queria usar: cardápio com a marca da loja, e o pedido caindo na hora no painel.
6. Cliente com histórico e WhatsApp, e sem comissão por pedido.
7. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
8. Feito por quem tem doceria. Fale com a gente.

### v01d-prova · Fernando Borges · 40.5 s

1. Na doceria de quem criou este sistema, o lucro subiu trinta por cento.
2. Depois que os clientes fiéis passaram a pedir direto com a loja.
3. Antes, pediam pelo aplicativo, e uma parte de cada pedido ficava no caminho.
4. Com o próprio sistema, o cardápio tem a marca da loja, e o pedido cai na hora no painel.
5. O cliente fica na base, com histórico e WhatsApp, e ganha cupom para pedir direto.
6. Sem comissão por pedido do sistema.
7. É o resultado de uma doceria. Cada negócio tem o seu.
8. Quer ver como funciona? Fale com a gente.

### v02a-curiosidade · Ana Dias · 41.7 s

1. Vendeu bem no mês, e a conta mesmo assim não fecha?
2. A resposta pode estar num número que você nunca calculou: o custo de cada produto.
3. Sem ele, um doce que vende muito pode estar quase sem margem.
4. No sistema, cada produto mostra o custo e o lucro bruto. Margem apertada aparece em vermelho.
5. Cada pedido mostra o custo estimado.
6. E o DRE junta vendas, custos e despesas, e mostra o resultado.
7. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
8. Quer ver com os seus produtos? Fale com a gente.

### v02b-contraria · Ana Dias · 34.6 s

1. Vender mais nem sempre resolve.
2. Se o preço está abaixo do custo, cada venda a mais aumenta o prejuízo.
3. Às vezes, o produto que mais vende é o que menos deixa dinheiro.
4. Com a ficha técnica, você vê o custo e o lucro bruto de cada produto.
5. Cada pedido mostra o custo estimado. E o DRE do mês mostra o resultado.
6. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
7. Pare de adivinhar. Peça uma demonstração.

### v02c-pergunta · Ana Dias · 39.1 s

1. Pergunta rápida: quanto custa fazer o seu bolo mais vendido?
2. Se precisou pensar, este vídeo é para você.
3. Quem sabe o custo define o preço com segurança. Quem não sabe, chuta.
4. O sistema calcula o custo de cada produto pela ficha técnica, mostra o lucro bruto, e destaca em vermelho a margem apertada.
5. No fim do mês, o DRE mostra se sobrou dinheiro.
6. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
7. Fale com a gente e veja com os seus produtos.

### v03a-curiosidade · Marcelo Costa · 41.6 s

1. Tem dinheiro parado na sua cozinha agora. Você sabe quanto?
2. Leite condensado, chocolate, morango, embalagem… tudo isso é dinheiro na prateleira.
3. No sistema, você vê o valor do estoque na hora.
4. Ele avisa quando um insumo fica abaixo do mínimo.
5. Com a ficha técnica, cada venda dá baixa sozinha nos ingredientes.
6. Você registra compras, perdas e inventário, e sabe o custo real de cada produto.
7. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
8. Estoque organizado é menos surpresa e mais controle. Fale com a gente.

### v03b-cena · Marcelo Costa · 39.1 s

1. Sexta à noite, encomenda grande para sábado…
2. e acabou o leite condensado.
3. Se você já passou por isso, sabe o tamanho do susto.
4. E não é falta de cuidado: é difícil dar baixa de cabeça em cada venda.
5. No sistema, a ficha técnica faz isso por você: vendeu, os ingredientes saem do estoque sozinhos.
6. E quando um insumo fica abaixo do mínimo, você recebe o alerta antes de faltar.
7. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
8. Chega de faltar insumo. Fale com a gente.

### v03c-contraria · Marcelo Costa · 34.4 s

1. Planilha de estoque não falha por preguiça.
2. Falha porque ninguém dá baixa em cada venda.
3. Você atualiza no domingo. Na quarta, já está errada.
4. No sistema, cada venda dá baixa nos ingredientes pela ficha técnica.
5. Compras, perdas e inventário ficam registrados.
6. O valor do estoque aparece na hora, e o alerta avisa o que está abaixo do mínimo.
7. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
8. Fale com a gente e veja com os seus insumos.

### v04a-curiosidade · Marianne · 38.5 s

1. Seu doce é lindo.
2. A foto no WhatsApp, nem tanto. E o cliente decide pela foto.
3. Foto borrada, lista de preços, pedido perdido no meio da conversa…
4. Agora imagine a sua vitrine assim:
5. Com a sua marca, as suas cores e as suas fotos.
6. Categorias organizadas, tamanhos, encomenda com data e hora…
7. E o pedido chega certinho no seu painel.
8. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
9. Quem vê, tem vontade. Fale com a gente e veja o seu cardápio.

### v04b-contraria · Marianne · 41.7 s

1. Cada passo entre a vontade e o pedido é uma chance de o cliente desistir.
2. No WhatsApp é assim: pede o cardápio, espera, lê a lista, pergunta o preço, espera de novo.
3. No cardápio digital: vê a foto, escolhe o tamanho, marca data e hora, e envia.
4. O pedido chega completo no seu painel, sem mensagem perdida.
5. E tudo com a sua marca, as suas cores e as suas fotos.
6. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
7. Fale com a gente e veja o seu.

### v04c-publico · Marianne · 35.9 s

1. Para quem faz doce bonito e quer um cardápio à altura.
2. Você capricha no acabamento, na foto, na embalagem. O cardápio precisa acompanhar.
3. No cardápio digital, entram o logo, as cores e as fotos da sua doceria.
4. Categorias, tamanhos e encomenda com data e hora.
5. E o pedido cai organizado no seu painel.
6. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
7. Quem vê, tem vontade. Crie o seu cardápio personalizado.

### v05a-curiosidade · Roberta · 38.8 s

1. Você abriu uma doceria para empreender…
2. ou para apagar incêndio o dia inteiro?
3. Oito da manhã: abre o caixa.
4. Dez: as encomendas do dia.
5. Meio-dia: todos os pedidos num quadro só. A cozinha vê tudo na tela.
6. Três da tarde: alerta de estoque baixo.
7. Seis da tarde: o resultado do dia.
8. No fim do mês, o DRE mostra se sobrou dinheiro.
9. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
10. No computador e no celular. Fale com a gente.

### v05b-contraria · Roberta · 40.6 s

1. Você não precisa de mais um app. Precisa de menos.
2. Caderno de encomendas, planilha de estoque, pedido anotado no papel, calculadora no fim do mês.
3. Cada coisa num lugar, e você no meio de tudo.
4. No sistema, tudo vira uma plataforma só:
5. pedidos, caixa, encomendas, cozinha, estoque, clientes e financeiro.
6. No computador e no celular.
7. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
8. Gestão de verdade para docerias. Fale com a gente.

### v05c-lista · Roberta · 37.4 s

1. Cinco coisas que você faz de cabeça na doceria, e podia estar vendo numa tela.
2. Um: as encomendas do dia, por horário.
3. Dois: os pedidos de todos os canais num quadro só.
4. Três: os insumos abaixo do mínimo.
5. Quatro: quem são os seus clientes mais fiéis.
6. Cinco: quanto sobrou no fim do mês.
7. Tudo isso no computador e no celular.
8. Na doceria de quem criou o sistema, o lucro subiu trinta por cento.
9. Quer ver na prática? Fale com a gente.
