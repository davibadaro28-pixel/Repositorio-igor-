# Gerar com o ElevenLabs (conector do Claude)

Cada geração gasta créditos da conta do usuário (cerca de 1 crédito por caractere nos modelos v2/v3/v4). Nunca
repita uma chamada para "tentar de novo" sem decidir que é uma nova versão, porque cada chamada é cobrada.

## Antes de gerar

1. **Créditos:** `mcp__ElevenLabs__account_get_usage` → `character_limit - character_count`. Some os caracteres do
   roteiro (o texto que vai para a voz) e multiplique pelo número de versões. Se não der, avise o usuário e ofereça o
   Piper para rascunho, com a data de renovação (`next_character_count_reset_unix`).
2. **Custo exato:** `creative_generate_speech` com `estimate_only: true` devolve o custo sem gerar.
3. **Voz:** `creative_list_voices` com `languages: ["pt"]` e, se ajudar, `use_cases: ["advertisement"]`, `gender`,
   `descriptives` (ex.: `["confident"]`, `["casual"]`). Leia a descrição: procure "conversacional", "natural", "sem jeito
   de locutor" para vídeo curto e "corporativa" ou "institucional" para vídeo de empresa. O `voice_id` vem sempre da
   lista ou do usuário, nunca da memória. As vozes têm `preview_url` público: dá para baixar e avaliar o exemplo com
   `avaliar.py` (sem roteiro) antes de gastar crédito.

## Modelo

| Modelo | Quando | Texto |
| --- | --- | --- |
| `eleven_v4` (padrão) | melhor naturalidade e expressão; aceita tags de emoção | números e preços como estão escritos: use `texto_falado.py --motor elevenlabs` (não troca nada) |
| `eleven_v3` | igual ao v4 | idem |
| `eleven_multilingual_v2` | voz mais estável e previsível; sem tags | números por extenso: `--motor elevenlabs-v2` |

Tags no v4/v3, entre colchetes, antes das palavras que colorem: `[excited]`, `[warmly]`, `[curious]`, `[softly]`,
`[short pause]`. Valem até a próxima tag. Use pouco: uma por frase no máximo, e só quando a frase pede.
Em anúncio, `[warmly]` ou `[confident]` no começo costuma bastar.

## Gerar frase a frase

Para cada frase do roteiro (texto do `texto_falado.py`):

```
creative_generate_speech(prompt=<frase>, voice_id=<id>, model_id="eleven_v4", generations_count=2)
  → flow_id, session_ids
creative_get_flow_run_status(flow_id, session_ids)   # repita, esperando poll_after_seconds, até all_completed
  → as gerações trazem o link do áudio: baixe com curl para takes/01a.mp3, takes/01b.mp3, …
```

- Passe o mesmo `flow_id` em todas as frases da narração (fica tudo no mesmo quadro do ElevenLabs).
- Duas versões por frase (`generations_count: 2`) custam o dobro, mas quase sempre uma delas sai melhor. Avalie as duas
  com `avaliar.py --audio 01a.mp3 01b.mp3 --roteiro "texto da frase"` e fique com a primeira da `comparacao.md`.
- Copie as escolhidas para `trechos/01.mp3`, `trechos/02.mp3`… e rode `montar.py`.

## Ajustes quando a avaliação reclamar

- **v4/v3:** o ritmo e o tom mudam com tags e pontuação (`[slowly]`, `[pause]`, reticências), não com `speed`.
- **v2:** `stability` mais baixa (0,3 a 0,45) deixa mais expressivo e mais alta (0,6 a 0,8) mais estável; `style`
  de 0,1 a 0,3 dá mais emoção; `speed` de 0,9 a 1,1 controla a velocidade.
- **Pronúncia errada:** no v4/v3, troque a palavra pela pronúncia em IPA entre barras (`/ʁe.ˈaw/`); nos outros, reescreva
  como se fala. Gere de novo só aquela frase.
