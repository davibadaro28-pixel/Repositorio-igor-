# Mixagem dos 5 anúncios

Cada vídeo foi mixado separadamente (`vXX/mix.json` + `shared/mixar.py`), com trilha original e paleta de
efeitos próprias. Nada de preset único: EQ, compressão, ducking e efeitos mudam conforme a voz, o estilo
e o ritmo de cada peça.

## Cadeia usada em todos

| Elemento | Processamento |
| --- | --- |
| Voz | passa-altas, corte do embolado (220–350 Hz), presença (2,8–4,5 kHz), "ar" (9,5–12 kHz), de-esser dinâmico na faixa de 5–10 kHz, compressor RMS + pega-picos |
| Trilha | passa-altas, "fader rider" que nivela as seções geradas, compressor de barramento, bolsão dinâmico de 1,5–4 kHz que abre espaço quando a voz fala, ducking pelas palavras da narração (pré-roll de 80 ms, ataque de 70–90 ms, release de 300–450 ms) e automações por cena |
| Efeitos | cada marca da animação (corte, toque, carimbo, notificação...) dispara um som no quadro exato; barramento com EQ, saturação e reverb próprios de cada vídeo; leve ducking sob a voz |
| Master | compressor de cola, normalização para **−14 LUFS integrado**, limitador de pico real com sobreamostragem 4x (teto −1,2 dBTP), saída 48 kHz |

## Medições finais

| Vídeo | LUFS | Pico real | Voz sobre trilha (na fala) | Compressão máx. da voz | De-esser máx. | Efeitos sincronizados |
| --- | --- | --- | --- | --- | --- | --- |
| V01 Taxas | −14,0 | −1,2 dBTP | 12 dB | 7,8 dB | 8,7 dB | 40 |
| V02 Lucro | −14,0 | −3,6 dBTP | 14 dB | 8,9 dB | 7,2 dB | 31 |
| V03 Estoque | −14,0 | −1,9 dBTP | 13 dB | 6,7 dB | 8,1 dB | 39 |
| V04 Cardápio | −14,0 | −1,2 dBTP | 14 dB | 7,2 dB | 5,2 dB | 35 |
| V05 Gestão | −14,0 | −2,3 dBTP | 11 dB | 10,6 dB | 9,9 dB | 54 |

Conferência de inteligibilidade: cada frase foi transcrita (Whisper) na narração seca e no mix final; o texto
reconhecido é o mesmo nos dois (no V01, o mix chegou a ser entendido melhor que a gravação seca).

## Identidade sonora de cada vídeo

- **V01 · A fatia que fica no caminho** — trap tenso em meio-tempo (144 BPM) que vira groove confiante na solução.
  Voz do Diego firme, presença em 3,2 kHz. Efeitos secos e agressivos: corte de faca na fatia, batidas nos cortes
  de palavra, impacto no "sem comissão", "ding" quando o pedido cai no painel. Relação voz/trilha mais apertada (12 dB)
  para manter energia.
- **V02 · Faturar não é lucrar** — piano mínimo com pulso grave (96 BPM), cordas que crescem até o DRE. Voz da Scheila
  limpa e próxima. Efeitos de interface discretos (tiques, blocos caindo na cascata, contador), barramento sem graves
  e pouco reverb. Trilha mais baixa (14 dB) para o tom analítico.
- **V03 · Dinheiro parado na prateleira** — groove mecânico (112 BPM) com plucks metálicos. Voz do Paulo com o grave
  limpo (corte em 220 Hz). Efeitos de inventário: bip de scanner, carimbos, moedas, alarme; barramento com saturação
  leve e sala curta e metálica.
- **V04 · Seus doces merecem mais** — harpa, sinos e pizzicato (83 BPM). Voz da Marianne com brilho sedoso e um toque
  de reverb. No trecho do problema (conversa bagunçada) a trilha "encolhe" (filtro passa-baixas e −2 dB) e abre
  de novo na vitrine. Efeitos macios: bolhas de mensagem, rabisco, seda, brilho, carrilhão; reverb mais longo.
- **V05 · Um dia inteiro sob controle** — pop/house (123 BPM) com virada para o drop no CTA. Voz da Roberta mais
  comprimida e à frente. Efeitos de impacto a cada hora do relógio (placa virando, gaveta do caixa, sino da cozinha,
  alarme), barramento com saturação. Relação voz/trilha de 11 dB, a mais energética da campanha.
