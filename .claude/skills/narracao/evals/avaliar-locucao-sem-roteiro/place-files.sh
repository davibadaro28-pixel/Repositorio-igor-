#!/usr/bin/env bash
# A locução deste teste é o exemplo público de uma voz de anúncio pt-BR da biblioteca do ElevenLabs ("Mateus").
# Não fica no repositório: é baixada na hora.
set -eu
curl -sSfL -o locucao_anuncio.mp3 "https://storage.googleapis.com/eleven-public-prod/database/workspace/098d91cef2a942bb98397eb6c0aa72bf/voices/PKoLMZQNTkKzc8W7Fy4P/KQB73uFTRHstplKLloV0.mp3"
