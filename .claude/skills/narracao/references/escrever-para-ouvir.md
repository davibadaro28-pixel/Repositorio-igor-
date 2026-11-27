# Escrever para o ouvido (pt-BR)

Quem ouve não volta atrás para reler. Uma narração natural começa num texto que soa como alguém falando, não como
um texto lido em voz alta.

## Frases

- **Uma ideia por frase**, de 6 a 14 palavras. Frase longa obriga a voz a correr ou a respirar no lugar errado.
- **Ordem direta**: sujeito, verbo, complemento. "O pedido cai direto no seu painel", não "Direto no seu painel cai o pedido".
- **Fale com a pessoa**: "você", "seu", verbos no presente. Evite "o usuário", "os clientes da empresa".
- **Corte o que a tela já mostra.** Narração e texto na tela não precisam repetir palavra por palavra. A voz completa a cena.
- **Pergunta só quando a resposta vem logo depois.** No pt-BR, a pergunta de sim/não sobe no fim ("Você vende pelo
  Instagram?"). A pergunta com quanto, quem, como e onde costuma descer ("Quanto custa o seu lanche?").

## Pontuação manda nas pausas

| Escreva | A voz faz |
| --- | --- |
| `.` | pausa de fim de frase (0,3 a 0,6 s) e tom descendo |
| `,` | respiro curto (0,1 a 0,3 s) |
| `?` | entonação de pergunta |
| `—` ou `…` | pausa de efeito (use pouco: uma por narração) |
| nada | fala emendada |

Não ponha vírgula onde ninguém pausaria (entre sujeito e verbo). Toda vírgula vira um respiro.

## Números, preços, siglas e palavras estrangeiras

O `texto_falado.py` faz essas trocas sozinho para os motores que precisam (Piper, ElevenLabs v2). Confira o resultado:

- **Preço:** "R$ 199,90" vira "cento e noventa e nove e noventa" (jeito de anúncio). Para o formal, use `--moeda formal`
  ("cento e noventa e nove reais e noventa centavos"). No texto, prefira um preço por frase.
- **Porcentagem, horas, quantidades:** 30% → "trinta por cento"; 21h30 → "vinte e uma e trinta"; 2 horas → "duas horas".
- **Siglas:** são soletradas (CMV → "cê-ême-vê"), menos as que se leem como palavra (PIX, CEP, MEI…). Se a sigla é
  pouco conhecida, escreva por extenso: "o custo de cada lanche", não "o CMV".
- **Estrangeiras e marcas:** o ElevenLabs costuma acertar. O Piper erra, e `scripts/pronuncias.json` traz grafias que
  funcionam ("delivery" → "delíveri"). Quando a avaliação apontar pronúncia errada, acrescente a palavra num arquivo seu
  e passe com `--pronuncias`.
- **Nomes próprios:** confira na avaliação. Se a voz errar, escreva como se fala ("Ruan" e não "Juan", se for o caso).

## Quanto texto cabe

Em anúncio, a fala natural fica entre 5 e 6,5 sílabas por segundo, fora as pausas. Em média são **2,3 a 2,7 palavras
por segundo**, já contando as pausas. Faça a conta com folga:

| Tempo | Palavras (anúncio) | Palavras (institucional) |
| --- | --- | --- |
| 3 s | 6 a 8 | 5 a 7 |
| 5 s | 11 a 13 | 9 a 11 |
| 15 s | 33 a 38 | 28 a 32 |
| 30 s | 65 a 75 | 55 a 65 |

`python3 scripts/texto_falado.py roteiro.json` calcula frase a frase e diz quantas sílabas cortar quando não cabe.

## Vídeo com cenas

- Uma frase por cena. A voz entra 0,1 a 0,3 s **depois** do texto aparecer e termina **antes** do corte.
- Deixe 0,3 s de folga no fim de cada janela: corte de cena no meio da palavra soa como erro.
- O fim do vídeo (marca e chamada) fica melhor com uma frase curta e firme, terminando em ponto final.

## Exemplo

Texto de tela: `Sem comissão. Mensalidade fixa a partir de R$ 199,90.`

Texto falado:
```
No seu cardápio, o pedido não paga comissão.
É mensalidade fixa, a partir de R$ 199,90.
```
