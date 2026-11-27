# O que o avaliador mede e por quê

Cada item vira **problema** (−10 na nota, corrigir) ou **atenção** (−3, ouvir e decidir). Há um teto de desconto por
categoria (texto 40, técnico e sincronia 30, ritmo, pausas e entonação 25), para que um defeito repetido não esconda os outros.

## Calibração

As faixas vêm de estudos de fala do português brasileiro e foram conferidas com oito exemplos públicos de vozes de
anúncio pt-BR do ElevenLabs. Esses exemplos ficaram entre 4,5 e 7,0 sílabas/s, com desvio do tom de 3,1 a 4,4 semitons
e pausas entre frases de 0,33 a 0,65 s. As vozes Piper sem ajuste ficaram entre 8,3 e 9,3 sílabas/s. Quando o usuário
tem uma narração que considera boa, use `--referencia`: comparar com o gosto dele vale mais que a faixa geral.

## Texto (a voz falou o roteiro?)

- A transcrição é feita **sem** dar o roteiro ao reconhecedor, de propósito: dar o roteiro faria o reconhecedor
  "ouvir" a palavra certa mesmo quando a voz errou.
- O roteiro e a transcrição viram palavras faladas (números por extenso, sem acento) e são alinhados.
- **Trocada:** semelhança < 0,8 é problema (a palavra mudou: "chega" → "cheira"). Entre 0,8 e 0,9 é problema só se o
  reconhecedor estiver inseguro (confiança < 0,75). Com 0,9 ou mais é atenção ("faturamento" → "fatoramento" pode ser
  vogal mal articulada ou erro do reconhecedor: ouça).
- **Faltando / a mais / repetida:** problema (a voz pulou ou gaguejou). "A mais" isolado com confiança baixa é ignorado
  (costuma ser respiração lida como palavra).
- **Pouco clara:** palavra certa, mas com confiança < 0,45. Números e símbolos ficam de fora (o reconhecedor sempre
  dá confiança baixa a eles).

**Alarmes falsos conhecidos:** palavra estrangeira, marca ou nome próprio que o reconhecedor escreve diferente
("hamburgheria"); números ditos de outro jeito ("cento e noventa e nove e noventa" ↔ "R$ 199,90" é tratado). Na dúvida,
ouça o trecho, que vem com o tempo exato.

## Ritmo

- **Sílabas por segundo de articulação**: sílabas do texto ÷ tempo com voz (sem as pausas). É a medida usada em
  fonética. Palavras por minuto mistura pausa com velocidade e engana.
- Faixas (bom / limite): anúncio 4,4–7,2 / 3,8–8,0; conversa 4,3–6,8 / 3,7–7,6; institucional 4,0–6,3 / 3,4–7,0.
  Frases com menos de 6 sílabas não são medidas (o erro de medida fica grande).
- **Irregular entre frases:** variação > 22% entre as frases. Acontece ao gerar frase a frase com configurações diferentes.

## Pausas

Os silêncios (Praat, −30 dB do pico, mínimo 0,10 s) são ligados a uma fronteira entre palavras e comparados com a
pontuação do roteiro. O tempo das palavras do reconhecedor erra até ~0,5 s perto de silêncios (palavra curta adiantada ou
esticada para dentro da pausa), então um silêncio que encosta (até 0,35 s) numa fronteira com pontuação fica com ela.
Os outros vão para a fronteira mais próxima. A mensagem cita as palavras dos dois lados do silêncio medido, não as do
reconhecedor.
- sem pontuação e pausa > 0,30 s → atenção; > 0,5 s → problema (respiro no lugar errado, típico de voz sintética);
- fim de frase com pausa < 0,12 s → frases emendadas; > 1,2 s → pausa longa;
- vírgula com pausa > 0,9 s → longa;
- silêncio > 0,25 s que não cai em fronteira nenhuma → possível falha dentro da palavra.

## Entonação

Tom em semitons (escala de percepção), medido em duas passadas ajustadas à voz:
- **Desvio do tom da narração** (≥ 6 s de fala): < 1,5 problema (monótona, robótica), < 2,0 atenção, > 6,0 atenção
  (exagerada). Fala natural fica entre 2 e 5.
- **Faixa por frase** (p90 − p10) < 2,5 semitons → frase sem variação.
- **Pergunta de sim/não** sem subida de 2 semitons na última palavra → atenção. Perguntas com quanto, quem, como etc.
  não entram nessa regra, porque descer no fim é natural nelas.
- **Afirmação terminando 4,5 semitons acima** do tom da frase → soa como dúvida.
- **Saltos bruscos** (> 8 semitons de um quadro para o outro, três ou mais) → possível quebra de voz. Às vezes é erro do
  detector de tom em voz rouca, por isso fica como atenção.

## Técnico

- Estouro: 3 amostras seguidas no máximo → problema. Pico real > −1 dBTP → atenção.
- Ruído nos silêncios: > −45 dBFS atenção, > −38 problema (voz sintética limpa fica abaixo de −60).
- Corte seco: os últimos 20 ms ainda com som (> −30 dBFS) → problema. Começo sem respiro → atenção.
- Silêncio sobrando (sem janelas): > 0,6 s antes da primeira palavra ou > 1,0 s depois da última.
- Taxa de amostragem < 22.050 Hz → som abafado.

## Sincronia (com janelas no roteiro)

- Termina mais de 0,05 s depois do fim da janela → problema (a frase invade a próxima cena).
- Termina a menos de 0,15 s do fim da janela → atenção (corte de cena encostado na última sílaba soa como erro).
- Começa > 0,15 s antes da janela → atenção. Começa > 0,8 s depois → atenção (a voz fica atrás da imagem).

## O que NÃO é medido

Timbre agradável, emoção certa para a marca, sotaque, se a voz parece "de propaganda" ou "de gente". Isso é escuta.
O relatório lista os trechos com risco: peça ao usuário para ouvir pelo menos esses, e a narração inteira uma vez.
