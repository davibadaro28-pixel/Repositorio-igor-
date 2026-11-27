#!/usr/bin/env python3
"""Avalia se uma narração em português está boa e natural, com medidas objetivas e os trechos que pedem escuta.

  python3 avaliar.py --audio narracao.wav --roteiro roteiro.txt --saida /tmp/aval
  python3 avaliar.py --audio take1.wav take2.wav take3.wav --roteiro roteiro.json --saida /tmp/aval   (compara takes)
  python3 avaliar.py --audio nova.wav --roteiro r.txt --referencia narracao_que_eu_gosto.mp3 --saida /tmp/aval

O que mede (detalhes e faixas em references/criterios.md):
  texto      a transcrição automática bate com o roteiro? palavras trocadas, faltando, repetidas ou pouco claras
  ritmo      sílabas por segundo de cada frase (sem as pausas) e se o ritmo muda demais entre frases
  pausas     pausa onde há pontuação, nada de pausa no meio da frase, frases não emendadas
  entonação  variação do tom (monótona ou exagerada), pergunta com cara de pergunta, final de frase que não sobe à toa
  técnico    estouro (clipping), pico, ruído de fundo, corte seco no começo/fim, silêncio sobrando
  sincronia  (se o roteiro tiver janelas de tempo) cada frase começa e termina dentro da sua janela

Gera em --saida: relatorio.md (para ler), relatorio.json (para usar em código) e prosodia.png (o desenho da fala).
Sem roteiro, avalia ritmo, pausas, entonação e técnica usando a própria transcrição como texto.
"""
import argparse
import json
import math
import re
import subprocess
import sys
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import texto_falado as tf  # noqa: E402

SR = 16000
CACHE = Path.home() / '.cache' / 'narracao'
INTERROGATIVAS = {'quanto', 'quanta', 'quantos', 'quantas', 'quem', 'qual', 'quais', 'como', 'onde', 'quando', 'cade',
                  'porque', 'por', 'que', 'o', 'pra', 'para'}   # perguntas abertas costumam terminar descendo no pt-BR


# ---------------------------------------------------------------- áudio
def carregar(caminho, sr=SR):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(caminho), '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'],
                       capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).copy()


def info(caminho):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate,channels,codec_name',
                        '-show_entries', 'format=duration', '-of', 'json', str(caminho)], capture_output=True, text=True, check=True)
    d = json.loads(r.stdout)
    s = d['streams'][0]
    return {'taxa': int(s['sample_rate']), 'canais': int(s['channels']), 'codec': s['codec_name'], 'duracao': float(d['format']['duration'])}


def loudness(caminho):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(caminho), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    txt = r.stderr[r.stderr.rfind('Summary'):]
    g = lambda k: float(re.search(k + r':\s+(-?[\d.]+|-inf)', txt).group(1).replace('-inf', '-120'))  # noqa: E731
    try:
        return {'lufs': g('I'), 'pico_real': g('Peak'), 'lra': g('LRA')}
    except AttributeError:
        return {'lufs': None, 'pico_real': None, 'lra': None}


def db(x):
    return 20 * math.log10(max(float(x), 1e-9))


def rms(x):
    return float(np.sqrt(np.mean(np.square(x)))) if len(x) else 0.0


# ---------------------------------------------------------------- transcrição
def transcrever(x, modelo):
    from faster_whisper import WhisperModel
    m = WhisperModel(modelo, device='cpu', compute_type='int8', download_root=str(CACHE / 'whisper'))
    # sem initial_prompt de propósito: dar o roteiro ao reconhecedor esconderia as palavras mal pronunciadas
    segs, _ = m.transcribe(x, language='pt', word_timestamps=True, beam_size=5, condition_on_previous_text=False, vad_filter=False)
    return [{'p': w.word.strip(), 'ini': float(w.start), 'fim': float(w.end), 'conf': float(w.probability)} for s in segs for w in s.words if w.word.strip()]


# ---------------------------------------------------------------- prosódia (Praat)
def prosodia(x):
    import parselmouth
    from parselmouth.praat import call
    snd = parselmouth.Sound(x.astype(np.float64), sampling_frequency=SR)
    # duas passadas (Hirst): primeiro larga, depois ajustada à voz
    f = snd.to_pitch_ac(time_step=0.01, pitch_floor=60, pitch_ceiling=600).selected_array['frequency']
    v = f[f > 0]
    lo, hi = (60, 600)
    if len(v) > 30:
        q25, q75 = np.percentile(v, [25, 75])
        lo, hi = max(50, 0.75 * q25), min(900, 1.6 * q75)
    p = snd.to_pitch_ac(time_step=0.01, pitch_floor=lo, pitch_ceiling=hi)
    t_f0 = np.array(p.xs())
    f0 = p.selected_array['frequency']
    it = snd.to_intensity(minimum_pitch=max(60.0, lo), time_step=0.01)
    t_int, intens = np.array(it.xs()), it.values[0]
    tg = call(snd, 'To TextGrid (silences)', 100, 0.01, -30, 0.10, 0.05, 'silent', 'sounding')
    n = int(call(tg, 'Get number of intervals', 1))
    inter = [(call(tg, 'Get start time of interval', 1, i), call(tg, 'Get end time of interval', 1, i), call(tg, 'Get label of interval', 1, i)) for i in range(1, n + 1)]
    return {'t_f0': t_f0, 'f0': f0, 'st': np.where(f0 > 0, 12 * np.log2(np.maximum(f0, 1) / 100.0), np.nan),
            't_int': t_int, 'int': intens, 'intervalos': inter, 'faixa_busca': (round(lo), round(hi))}


# ---------------------------------------------------------------- alinhamento roteiro x transcrição
def alinhar(frases, asr):
    esp = []   # tokens esperados
    pals = []  # palavras do roteiro
    for fi, fr in enumerate(frases):
        pp = tf.palavras_pontuadas(fr['texto'])
        for j, (p, pont) in enumerate(pp):
            pals.append({'p': p, 'pont': pont, 'frase': fi, 'ultima': j == len(pp) - 1, 'ini': None, 'fim': None, 'conf': None, 'ok': True})
            for tk in tf.tokens_palavra(p):
                esp.append({'tk': tk, 'pal': len(pals) - 1})
    ouv = []
    for wi, w in enumerate(asr):
        tks = tf.tokens_palavra(w['p'])
        for k, tk in enumerate(tks):
            d = (w['fim'] - w['ini']) / max(1, len(tks))
            ouv.append({'tk': tk, 'w': wi, 'ini': w['ini'] + k * d, 'fim': w['ini'] + (k + 1) * d, 'conf': w['conf']})
    A, B = [e['tk'] for e in esp], [o['tk'] for o in ouv]
    difs = []

    def marca(ie, io):
        e, o = esp[ie], ouv[io]
        pw = pals[e['pal']]
        pw['ini'] = o['ini'] if pw['ini'] is None else min(pw['ini'], o['ini'])
        pw['fim'] = o['fim'] if pw['fim'] is None else max(pw['fim'], o['fim'])
        pw['conf'] = o['conf'] if pw['conf'] is None else min(pw['conf'], o['conf'])

    for op, i1, i2, j1, j2 in SequenceMatcher(None, A, B, autojunk=False).get_opcodes():
        if op == 'equal':
            for k in range(i2 - i1):
                marca(i1 + k, j1 + k)
            continue
        junta = lambda xs: re.sub(r'(.)\1', r'\1', ''.join(xs))  # noqa: E731  (letra dobrada: "com missão" = "comissão")
        if op == 'replace' and junta(A[i1:i2]) == junta(B[j1:j2]):
            for k in range(i2 - i1):
                marca(i1 + k, j1 + min(j2 - j1 - 1, round(k * (j2 - j1) / (i2 - i1))))
            continue
        palavras_esp = sorted({esp[k]['pal'] for k in range(i1, i2)})
        palavras_ouv = sorted({ouv[k]['w'] for k in range(j1, j2)})
        if op in ('replace', 'insert') and j2 > j1:
            for k in range(i1, i2):
                marca(k, j1 + min(j2 - j1 - 1, round((k - i1) * (j2 - j1) / max(1, i2 - i1))))
        for pidx in palavras_esp:
            pals[pidx]['ok'] = False
        texto_esp = ' '.join(pals[k]['p'] for k in palavras_esp)
        texto_ouv = ' '.join(asr[k]['p'] for k in palavras_ouv)
        sim = SequenceMatcher(None, ''.join(A[i1:i2]), ''.join(B[j1:j2])).ratio() if i2 > i1 and j2 > j1 else 0.0
        conf = min((asr[k]['conf'] for k in palavras_ouv), default=None)
        ini = min((ouv[k]['ini'] for k in range(j1, j2)), default=None)
        fim = max((ouv[k]['fim'] for k in range(j1, j2)), default=None)
        repetida = op == 'insert' and any(B[k] in (A[max(0, i1 - 2):i1 + 2]) for k in range(j1, j2))
        difs.append({'tipo': {'replace': 'trocada', 'delete': 'faltando', 'insert': 'a mais'}[op], 'esperado': texto_esp, 'ouvido': texto_ouv,
                     'similaridade': round(sim, 2), 'conf': conf, 'ini': ini, 'fim': fim, 'repetida': repetida,
                     'palavras': palavras_esp})
    # palavras faltando ganham tempo pelos vizinhos (para não quebrar as frases)
    return pals, difs


# ---------------------------------------------------------------- avaliação
def avaliar(audio, frases, estilo='anuncio', modelo='small', referencia=None, com_roteiro=True, mix=False):
    inf = info(audio)
    x = carregar(audio)
    xr = carregar(audio, inf['taxa'])
    lou = loudness(audio)
    asr = transcrever(x, modelo)
    if not frases:
        frases = tf.ler_roteiro(' '.join(w['p'] for w in asr))
    pr = prosodia(x)
    pals, difs = alinhar(frases, asr)
    probs = []

    def prob(nivel, cat, msg, ini=None, fim=None, fix=None):
        probs.append({'nivel': nivel, 'categoria': cat, 'ini': None if ini is None else round(ini, 2), 'fim': None if fim is None else round(fim, 2), 'msg': msg, 'como_corrigir': fix})

    dur = len(x) / SR
    soando = [(a, b) for a, b, lab in pr['intervalos'] if lab == 'sounding']
    fala_ini = soando[0][0] if soando else 0.0
    fala_fim = soando[-1][1] if soando else dur
    silencios = [(a, b) for a, b, lab in pr['intervalos'] if lab == 'silent' and a > fala_ini - 1e-6 and b < fala_fim + 1e-6]

    # --- texto
    if com_roteiro:
        for d in difs:
            if d['tipo'] == 'faltando':
                # artigo ou preposição de uma letra ("o", "a", "à", "e") some na fala corrida e na transcrição: só atenção
                curta = all(len(tf.sem_acento(w)) <= 1 for w in re.findall(r'\w+', d['esperado']))
                prob('atencao' if curta else 'problema', 'texto', f'Não ouvi: "{d["esperado"]}"', d['ini'], d['fim'],
                     'Ouça: palavra de uma letra costuma se juntar à vizinha.' if curta else 'Gere de novo a frase; confira se a palavra não sumiu na emenda dos trechos.')
            elif d['tipo'] == 'a mais':
                if d['repetida']:
                    prob('problema', 'texto', f'Repetição: "{d["ouvido"]}" a mais', d['ini'], d['fim'], 'Gere de novo a frase (gagueira da voz sintética).')
                elif (d['conf'] or 0) >= 0.5:
                    prob('atencao', 'texto', f'Palavra a mais: "{d["ouvido"]}"', d['ini'], d['fim'], 'Ouça: pode ser ruído interpretado como palavra.')
            else:
                # >= 0,9: quase igual (separação diferente, uma letra): ouvir; < 0,8: palavra mudou
                grave = d['similaridade'] < 0.8 or (d['similaridade'] < 0.9 and d['conf'] is not None and d['conf'] < 0.75)
                prob('problema' if grave else 'atencao', 'texto', f'Esperado "{d["esperado"]}", ouvi "{d["ouvido"]}"', d['ini'], d['fim'],
                     'Ouça o trecho. Se a voz errou, reescreva a palavra como se fala (pronuncias.json) ou troque por sinônimo.')
        for pw in pals:
            # números e símbolos vêm com confiança baixa do reconhecedor mesmo quando ditos certo: não entram aqui
            if pw['ok'] and pw['conf'] is not None and pw['conf'] < 0.45 and len(re.sub(r'\W', '', pw['p'])) >= 4 and not re.search(r'[\d$%]', pw['p']):
                prob('atencao', 'texto', f'Palavra pouco clara: "{pw["p"]}" (confiança {pw["conf"]:.2f})', pw['ini'], pw['fim'], 'Ouça; se estiver embolada, gere de novo ou ajuste a grafia.')

    # --- pausas por fronteira de palavra
    com_tempo = [k for k, pw in enumerate(pals) if pw['ini'] is not None]
    fronteiras = []
    for a, b in zip(com_tempo, com_tempo[1:]):
        pa, pb = pals[a], pals[b]
        pont = pa['pont']
        tipo = 'frase' if (re.search(r'[.!?…:;]', pont) or (pa['ultima'] and pa['frase'] != pb['frase'])) else ('virgula' if re.search(r'[,—–)-]', pont) else 'nenhuma')
        fronteiras.append({'a': a, 'b': b, 'tipo': tipo, 'meio': (pa['fim'] + pb['ini']) / 2, 'pausa': 0.0, 'sils': []})
    sobra = []
    for s0, s1 in silencios:
        m = (s0 + s1) / 2
        # o tempo das palavras do reconhecedor erra até ~0,5 s perto de silêncios (palavra curta adiantada ou esticada).
        # Um silêncio perto de uma pontuação quase sempre é a pausa dela: tenta primeiro as fronteiras pontuadas.
        def dist(f):      # distância entre o silêncio e o espaço entre as duas palavras (0 se encostam)
            lo, hi = sorted((pals[f['a']]['fim'], pals[f['b']]['ini']))
            return max(0.0, s0 - hi, lo - s1)
        # entre frases diferentes (cenas) a tolerância é maior: é ali que a pausa é esperada
        pont = [f for f in fronteiras if f['tipo'] != 'nenhuma'
                and dist(f) <= (0.8 if pals[f['a']]['frase'] != pals[f['b']]['frase'] else 0.35)]
        melhor = min(pont, key=dist) if pont else min(fronteiras, key=lambda f: abs(f['meio'] - m), default=None)
        if melhor and (pont or abs(melhor['meio'] - m) < 0.45 + (s1 - s0) / 2):
            melhor['pausa'] += s1 - s0
            melhor['sils'].append((s0, s1))
        else:
            sobra.append((s0, s1))
    # a pausa medida entre frases define onde uma termina e a outra começa
    corte_frase = {}
    for f in fronteiras:
        if f['tipo'] == 'frase' and f['sils'] and pals[f['a']]['frase'] != pals[f['b']]['frase']:
            s0, s1 = max(f['sils'], key=lambda s: s[1] - s[0])
            corte_frase[pals[f['a']]['frase']] = ('fim', s0)
            corte_frase.setdefault(pals[f['b']]['frase'], None)
            corte_frase[('ini', pals[f['b']]['frase'])] = s1
    meio_pal = [((pw['ini'] + pw['fim']) / 2, pw) for pw in pals if pw['ini'] is not None]
    for f in fronteiras:
        pa, pb = pals[f['a']], pals[f['b']]
        if f['sils']:
            # o reconhecedor às vezes estica uma palavra para dentro do silêncio: o lugar certo é o silêncio medido
            s0, s1 = max(f['sils'], key=lambda s: s[1] - s[0])
            antes = [pw for mm, pw in meio_pal if mm < s0 + 0.02]
            depois = [pw for mm, pw in meio_pal if mm > s1 - 0.02]
            pa_, pb_ = (antes[-1] if antes else pa), (depois[0] if depois else pb)
            par = f'"{pa_["p"]}{pa_["pont"]} | {pb_["p"]}"'
            t0, t1 = s0, s1
        else:
            par = f'"{pa["p"]}{pa["pont"]} | {pb["p"]}"'
            t0, t1 = pa['fim'], pb['ini']
        if f['tipo'] == 'nenhuma' and f['pausa'] > 0.30:
            prob('problema' if f['pausa'] > 0.5 else 'atencao', 'pausas', f'Pausa de {f["pausa"]:.2f} s no meio da frase: {par}', t0, t1,
                 'Gere de novo a frase; se a pausa é intencional, ponha vírgula ou reticências no roteiro.')
        elif f['tipo'] == 'frase' and f['pausa'] < 0.12:
            prob('atencao', 'pausas', f'Frases emendadas (pausa de {f["pausa"]:.2f} s): {par}', t0, t1,
                 'Separe em duas gerações ou ponha a pausa na montagem (0,3 a 0,6 s).')
        elif f['tipo'] == 'frase' and f['pausa'] > 1.2 and not ('inicio' in frases[pb['frase']] and pa['frase'] != pb['frase']):
            # (com janelas de cena, a pausa entre frases de cenas diferentes é o tempo da cena: não é defeito)
            prob('atencao', 'pausas', f'Pausa longa de {f["pausa"]:.2f} s entre frases: {par}', t0, t1, 'Encurte o silêncio na montagem.')
        elif f['tipo'] == 'virgula' and f['pausa'] > 0.9:
            prob('atencao', 'pausas', f'Pausa longa de {f["pausa"]:.2f} s na vírgula: {par}', t0, t1, 'Encurte o silêncio ou tire a vírgula.')
    for s0, s1 in sobra:
        if s1 - s0 > 0.25:
            prob('atencao', 'pausas', f'Silêncio de {s1 - s0:.2f} s dentro de uma palavra', s0, s1, 'Ouça: pode ser falha da voz sintética.')

    # --- frases: tempos, ritmo, entonação
    cfg = tf.ESTILOS[estilo]
    st = pr['st']
    tf0 = pr['t_f0']
    det = []
    for fi, fr in enumerate(frases):
        ws = [pw for pw in pals if pw['frase'] == fi and pw['ini'] is not None]
        item = {'n': fi + 1, 'texto': fr['texto'], 'ini': None, 'fim': None}
        if not ws:
            det.append(item)
            continue
        ini, fim = ws[0]['ini'], ws[-1]['fim']
        for s0, s1 in silencios:      # refina pelo silêncio medido (o reconhecedor costuma esticar as bordas)
            if abs(s1 - ini) < 0.3:
                ini = s1
            if abs(s0 - fim) < 0.3:
                fim = s0
        if ('ini', fi) in corte_frase:
            ini = corte_frase[('ini', fi)]
        if isinstance(corte_frase.get(fi), tuple):
            fim = corte_frase[fi][1]
        # o reconhecedor costuma marcar o fim da última palavra cedo (até ~0,8 s): o fim real é o do trecho de som
        # em que ela cai; o começo, o do trecho em que a primeira palavra cai
        for a_, b_ in soando:
            if a_ - 0.05 <= fim <= b_ + 0.05 and b_ > fim:
                fim = b_
            if a_ - 0.05 <= ini <= b_ + 0.05 and a_ < ini:
                ini = a_
        if fi == 0 and abs(fala_ini - ini) < 0.3:
            ini = fala_ini
        if fi == len(frases) - 1 and abs(fala_fim - fim) < 0.4:
            fim = fala_fim
        dentro = sum(max(0.0, min(s1, fim) - max(s0, ini)) for s0, s1 in silencios)
        fona = max(0.05, fim - ini - dentro)
        sil = tf.silabas(tf.para_fala(fr['texto'], 'generico', 'anuncio')[0])   # preço do jeito curto ("cento e noventa e nove e noventa")
        taxa = sil / fona
        sel = (tf0 >= ini) & (tf0 <= fim) & ~np.isnan(st)
        v = st[sel]
        item.update({'ini': round(ini, 2), 'fim': round(fim, 2), 'silabas': sil, 'fonacao': round(fona, 2), 'silabas_por_s': round(taxa, 2)})
        if len(v) > 10:
            med = float(np.median(v))
            item.update({'tom_mediana_st': round(med, 1), 'tom_faixa_st': round(float(np.percentile(v, 90) - np.percentile(v, 10)), 1)})
            ult = ws[-1]
            vu = st[(tf0 >= ult['ini']) & (tf0 <= min(ult['fim'], fim + 0.05)) & ~np.isnan(st)]
            if len(vu) >= 4:
                item['tom_final_st'] = round(float(np.percentile(vu, 90)) - med, 1)
                item['tom_final_mediana_st'] = round(float(np.median(vu)) - med, 1)
        txt = fr['texto'].strip()
        primeira = tf.sem_acento(tf.palavras_pontuadas(txt)[0][0].lower()) if txt else ''
        item['tipo'] = 'pergunta' if txt.endswith('?') else ('exclamacao' if txt.endswith('!') else 'afirmacao')
        item['pergunta_aberta'] = item['tipo'] == 'pergunta' and primeira in INTERROGATIVAS
        if 'inicio' in fr and 'fim' in fr:
            item['janela'] = [fr['inicio'], fr['fim']]
        det.append(item)

        # ritmo
        curta = sil < 6
        if not curta:
            lo, hi = cfg['ok']
            llo, lhi = cfg['limite']
            if taxa > lhi:
                prob('problema', 'ritmo', f'Frase {fi + 1} corrida: {taxa:.1f} sílabas/s (bom: {lo}–{hi})', ini, fim, 'Corte palavras da frase ou gere mais devagar (velocidade 0,9).')
            elif taxa > hi:
                prob('atencao', 'ritmo', f'Frase {fi + 1} um pouco rápida: {taxa:.1f} sílabas/s (bom: {lo}–{hi})', ini, fim, 'Se a janela permitir, gere um pouco mais devagar.')
            elif taxa < llo:
                prob('problema', 'ritmo', f'Frase {fi + 1} arrastada: {taxa:.1f} sílabas/s (bom: {lo}–{hi})', ini, fim, 'Gere mais rápido ou com voz mais animada.')
            elif taxa < lo:
                prob('atencao', 'ritmo', f'Frase {fi + 1} um pouco lenta: {taxa:.1f} sílabas/s (bom: {lo}–{hi})', ini, fim, 'Pode acelerar um pouco.')
        # entonação
        if item.get('tom_faixa_st') is not None and not curta and item['tom_faixa_st'] < 2.5:
            prob('atencao', 'entonacao', f'Frase {fi + 1} sem variação de tom (faixa {item["tom_faixa_st"]} semitons)', ini, fim,
                 'Soa robótica: use uma voz mais expressiva, baixe a estabilidade (ElevenLabs) ou reescreva com ênfase numa palavra.')
        if item['tipo'] == 'pergunta' and not item['pergunta_aberta'] and item.get('tom_final_st') is not None and item['tom_final_st'] < 2.0:
            prob('atencao', 'entonacao', f'Frase {fi + 1} é pergunta de sim/não mas o tom não sobe no fim', ws[-1]['ini'], fim,
                 'Gere de novo; no ElevenLabs v3/v4 dá para pôr [curious] antes da frase.')
        if item['tipo'] == 'afirmacao' and item.get('tom_final_mediana_st') is not None and item['tom_final_mediana_st'] > 4.5:
            prob('atencao', 'entonacao', f'Frase {fi + 1} termina subindo (soa como dúvida)', ws[-1]['ini'], fim, 'Gere de novo; confira se a frase termina com ponto final.')

    taxas = [d['silabas_por_s'] for d in det if d.get('silabas_por_s') and d.get('silabas', 0) >= 6]
    if len(taxas) >= 3:
        cv = float(np.std(taxas) / np.mean(taxas))
        if cv > 0.22:
            prob('atencao', 'ritmo', f'Ritmo irregular entre as frases (variação de {cv * 100:.0f}%)', None, None, 'Gere as frases mais rápidas/lentas de novo para igualar o andamento.')
    vv = st[~np.isnan(st) & (tf0 >= fala_ini) & (tf0 <= fala_fim)]
    tom_dp = float(np.std(vv)) if len(vv) > 20 else None
    if tom_dp is not None and fala_fim - fala_ini >= 6:      # em trecho curto o desvio do tom não diz muito
        if tom_dp < 1.5:
            prob('problema', 'entonacao', f'Narração monótona: desvio do tom {tom_dp:.1f} semitons (natural: 2 a 5)', None, None,
                 'Troque por voz mais expressiva ou baixe a estabilidade; frases curtas e com ênfase ajudam.')
        elif tom_dp < 2.0:
            prob('atencao', 'entonacao', f'Pouca variação de tom: {tom_dp:.1f} semitons (natural: 2 a 5)', None, None, 'Pode soar plana; teste outra voz ou mais estilo.')
        elif tom_dp > 6.0:
            prob('atencao', 'entonacao', f'Tom exagerado: desvio {tom_dp:.1f} semitons (natural: 2 a 5)', None, None, 'Suba a estabilidade ou tire tags de emoção fortes.')
    # saltos bruscos de tom (quebra/estalo de voz sintética)
    saltos = []
    for k in range(1, len(st) - 1):
        if not np.isnan(st[k - 1]) and not np.isnan(st[k]) and not np.isnan(st[k + 1]) and abs(st[k] - st[k - 1]) > 8 and abs(st[k + 1] - st[k - 1]) > 8:
            saltos.append(float(tf0[k]))
    if len(saltos) >= 3:
        prob('atencao', 'entonacao', f'{len(saltos)} saltos bruscos de tom (possível falha na voz)', saltos[0], saltos[-1], 'Ouça os pontos marcados no gráfico.')

    # --- técnico
    cortes = 0
    claro = np.abs(xr) >= 0.999
    if claro.any():
        corr = np.diff(np.concatenate([[0], claro.astype(np.int8), [0]]))
        cortes = int(np.sum((np.where(corr == -1)[0] - np.where(corr == 1)[0]) >= 3))
    if cortes:
        prob('problema', 'tecnico', f'Estouro (clipping) em {cortes} ponto(s)', None, None, 'Gere de novo ou baixe o volume antes de exportar.')
    elif lou['pico_real'] is not None and lou['pico_real'] > -1.0:
        prob('atencao', 'tecnico', f'Pico real em {lou["pico_real"]:.1f} dBTP (deixe abaixo de -1)', None, None, 'Normalize com limitador (alimiter) a -1 dBTP.')
    ruido = [db(rms(x[int(a * SR):int(b * SR)])) for a, b, lab in pr['intervalos'] if lab == 'silent' and b - a > 0.15]
    piso = float(np.median(ruido)) if ruido else None
    if piso is not None and piso > -38:
        prob('problema', 'tecnico', f'Ruído de fundo alto nos silêncios: {piso:.0f} dBFS', None, None, 'Grave de novo em lugar silencioso ou use redução de ruído.')
    elif piso is not None and piso > -45:
        prob('atencao', 'tecnico', f'Ruído de fundo audível nos silêncios: {piso:.0f} dBFS', None, None, 'Aplique um gate/redução de ruído leve.')
    if db(rms(xr[-int(0.02 * inf['taxa']):])) > -30:
        prob('problema', 'tecnico', 'Corte seco no fim do áudio (a voz termina cortada)', dur - 0.3, dur, 'Gere de novo ou exporte sem aparar o final.')
    if db(rms(xr[:int(0.01 * inf['taxa'])])) > -30:
        prob('atencao', 'tecnico', 'Começa cortado (sem respiro no início)', 0, 0.3, 'Deixe 0,1 a 0,2 s de silêncio antes da primeira palavra.')
    if not any('inicio' in f for f in frases):
        if fala_ini > 0.6:
            prob('atencao', 'tecnico', f'Silêncio de {fala_ini:.2f} s antes da primeira palavra', 0, fala_ini, 'Apare o começo (deixe ~0,15 s).')
        if dur - fala_fim > 1.0:
            prob('atencao', 'tecnico', f'Silêncio de {dur - fala_fim:.2f} s depois da última palavra', fala_fim, dur, 'Apare o fim (deixe ~0,3 s).')
    if abs(float(np.mean(x))) > 0.01:
        prob('atencao', 'tecnico', 'Desvio de corrente contínua (DC) no áudio', None, None, 'Passe um filtro passa-altas em 80 Hz.')
    if inf['taxa'] < 22050:
        prob('atencao', 'tecnico', f'Taxa de amostragem baixa ({inf["taxa"]} Hz): som abafado', None, None, 'Gere em 44,1 ou 48 kHz.')

    # --- sincronia
    for d in det:
        if 'janela' not in d:
            continue
        j0, j1 = d['janela']
        if d['ini'] is None:
            prob('problema', 'sincronia', f'Frase {d["n"]} não encontrada na narração', j0, j1, 'Gere e posicione a frase.')
            continue
        if d['fim'] > j1 + 0.05:
            prob('problema', 'sincronia', f'Frase {d["n"]} passa {d["fim"] - j1:.2f} s do tempo da cena', j1, d['fim'],
                 'Corte palavras, gere mais rápido ou alongue a cena.')
        elif d['fim'] > j1 - 0.15:
            prob('atencao', 'sincronia', f'Frase {d["n"]} termina colada no corte da cena ({j1 - d["fim"]:.2f} s antes)', d['fim'], j1,
                 'Deixe pelo menos 0,15 s: corte de cena encostado na última sílaba soa como erro.')
        if d['ini'] < j0 - 0.15:
            prob('atencao', 'sincronia', f'Frase {d["n"]} começa {j0 - d["ini"]:.2f} s antes da cena', d['ini'], j0, 'Atrase o trecho na montagem.')
        elif d['ini'] > j0 + 0.8:
            prob('atencao', 'sincronia', f'Frase {d["n"]} começa {d["ini"] - j0:.2f} s depois da cena', j0, d['ini'], 'Adiante o trecho (comece 0,1–0,3 s depois do texto aparecer).')

    # --- fluidez: buracos e pausas irregulares entre as frases deixam a narração picotada, "sem ritmo"
    com_t = [d for d in det if d.get('ini') is not None and d.get('fim') is not None]
    buracos = [(a_['n'], b_['n'], b_['ini'] - a_['fim'], a_['fim'], b_['ini']) for a_, b_ in zip(com_t, com_t[1:])]
    for n1, n2, g, t0_, t1_ in buracos:
        if g > 1.8:
            prob('problema', 'ritmo', f'Buraco de {g:.2f} s entre as frases {n1} e {n2}: a narração fica picotada', t0_, t1_,
                 'Escreva a frase seguinte mais longa ou a anterior mais longa, para a voz preencher a cena (pausa natural: 0,3 a 0,6 s).')
        elif g > 1.0:
            prob('atencao', 'ritmo', f'Pausa de {g:.2f} s entre as frases {n1} e {n2}', t0_, t1_,
                 'Preencha a cena com um pouco mais de texto ou junte as frases.')
    gs = [g for _, _, g, _, _ in buracos]
    if len(gs) >= 3 and np.mean(gs) > 0 and np.std(gs) / np.mean(gs) > 0.45 and max(gs) - min(gs) > 0.6:
        prob('atencao', 'ritmo', f'Pausas irregulares entre as frases (de {min(gs):.2f} a {max(gs):.2f} s): a narração perde o ritmo', None, None,
             'Iguale as pausas: frases do tamanho da cena (gerar_kokoro.py ajusta a velocidade para preencher) ou pausa fixa na montagem.')
    if com_t:
        total = com_t[-1]['fim'] - com_t[0]['ini']
        voz_t = sum(d['fim'] - d['ini'] for d in com_t)
        ocup = voz_t / total if total > 0 else 1.0
        if len(com_t) >= 3 and ocup < 0.75:
            prob('atencao', 'ritmo', f'A voz ocupa só {ocup * 100:.0f}% do tempo entre a primeira e a última fala (natural: 80% ou mais)', None, None,
                 'Há silêncio demais entre as falas: escreva frases que preencham as cenas.')

    # --- comparação com a referência
    ref = None
    if referencia:
        r = avaliar(referencia, None, estilo, modelo, None, com_roteiro=False)
        ref = {'arquivo': str(referencia), 'silabas_por_s': r['medidas']['silabas_por_s'], 'tom_desvio_st': r['medidas']['tom_desvio_st'],
               'pausa_media_entre_frases': r['medidas']['pausa_media_entre_frases']}

    entre = [f['pausa'] for f in fronteiras if f['tipo'] == 'frase']
    medidas = {
        'duracao': round(dur, 2), 'fala_ini': round(fala_ini, 2), 'fala_fim': round(fala_fim, 2),
        'silabas_por_s': round(float(np.median(taxas)), 2) if taxas else None,
        'tom_desvio_st': None if tom_dp is None else round(tom_dp, 2),
        'tom_busca_hz': pr['faixa_busca'],
        'pausa_media_entre_frases': round(float(np.mean(entre)), 2) if entre else None,
        'lufs': lou['lufs'], 'pico_real': lou['pico_real'], 'ruido_dbfs': None if piso is None else round(piso, 1),
        'taxa_amostragem': inf['taxa'], 'palavras_roteiro': len(pals), 'palavras_com_problema': sum(1 for p in pals if not p['ok']),
        'pausas_entre_frases': [round(g, 2) for g in gs],
    }
    if ref:
        dif = []
        for k, lim, nome in (('silabas_por_s', 0.2, 'ritmo'), ('tom_desvio_st', 0.35, 'variação de tom'), ('pausa_media_entre_frases', 0.5, 'pausa entre frases')):
            a_, b_ = medidas.get(k), ref.get(k)
            if a_ and b_:
                rel = a_ / b_ - 1
                dif.append({'medida': nome, 'esta': a_, 'referencia': b_, 'diferenca_pct': round(rel * 100)})
                if abs(rel) > lim:
                    prob('atencao', 'referencia', f'{nome.capitalize()} {"acima" if rel > 0 else "abaixo"} da referência: {a_} x {b_} ({rel * 100:+.0f}%)', None, None,
                         'Aproxime do jeito da narração de referência (velocidade, voz ou estilo).')
        ref['comparacao'] = dif
    if mix:
        # com trilha por baixo não há silêncio: pausas, ritmo, tom, ruído e sincronia não dão para medir. Ficam o texto
        # (a voz se entende por cima da música?) e o volume/pico do áudio final.
        probs[:] = [p for p in probs if p['categoria'] == 'texto' or p['msg'].startswith(('Estouro', 'Pico real'))]
        for k in ('silabas_por_s', 'tom_desvio_st', 'pausa_media_entre_frases', 'ruido_dbfs', 'fala_ini', 'fala_fim'):
            medidas[k] = None
        for d in det:
            for k in ('ini', 'fim', 'silabas_por_s', 'tom_faixa_st', 'tom_final_st'):
                d.pop(k, None) if k not in ('ini', 'fim') else d.update({k: None})
    return {'arquivo': str(audio), 'estilo': estilo, 'mix': mix, 'medidas': medidas, 'frases': det, 'problemas': probs, 'diferencas_texto': difs,
            'transcricao': ' '.join(w['p'] for w in asr), 'palavras': asr, 'referencia': ref,
            '_desenho': {'pr': pr, 'pals': pals, 'x': x, 'fronteiras': fronteiras, 'saltos': saltos}}


PESO = {'problema': 10, 'atencao': 3}
TETO = {'texto': 40, 'ritmo': 25, 'pausas': 25, 'entonacao': 25, 'tecnico': 30, 'sincronia': 30, 'referencia': 10}


def nota(probs):
    por = {}
    for p in probs:
        por[p['categoria']] = por.get(p['categoria'], 0) + PESO[p['nivel']]
    n = max(0, 100 - sum(min(TETO.get(c, 20), v) for c, v in por.items()))
    np_ = sum(1 for p in probs if p['nivel'] == 'problema')
    if np_ == 0:
        ver = 'Aprovada' if n >= 85 else 'Aprovada com ressalvas'
    else:
        ver = 'Refazer a narração' if n < 50 else 'Refazer os trechos com problema'
    return n, ver


# ---------------------------------------------------------------- relatório e desenho
def fmt_t(t):
    return '—' if t is None else f'{t:.2f} s'


def relatorio_md(r):
    m = r['medidas']
    L = [f'# Avaliação da narração: {Path(r["arquivo"]).name}', '',
         f'**Nota: {r["nota"]}/100 · {r["veredito"]}**  ', f'Estilo esperado: {r["estilo"]} · duração {m["duracao"]} s', '']
    if r.get('mix'):
        L += ['> Áudio com trilha (`--mix`): só a clareza da fala (o texto que a transcrição entende por cima da música) e o',
              '> volume final. Ritmo, pausas, tom e sincronia se avaliam na narração sozinha, antes de mixar.', '']
    probs = r['problemas']
    for nivel, titulo in (('problema', 'Problemas (corrigir)'), ('atencao', 'Atenção (ouvir e decidir)')):
        ps = [(i, p) for i, p in enumerate(probs, 1) if p['nivel'] == nivel]
        if ps:
            L += [f'## {titulo}', '']
            for i, p in ps:
                quando = '' if p['ini'] is None else f' [{p["ini"]:.2f}–{p["fim"]:.2f} s]'
                L.append(f'{i}. **{p["categoria"]}**{quando}: {p["msg"]}  ')
                if p.get('como_corrigir'):
                    L.append(f'   → {p["como_corrigir"]}')
            L.append('')
    if not probs:
        L += ['Nenhum problema encontrado nas medidas automáticas.', '']
    L += ['## Medidas', '', '| Medida | Valor | Referência |', '| --- | --- | --- |',
          f'| Ritmo (mediana das frases) | {m["silabas_por_s"]} sílabas/s | {tf.ESTILOS[r["estilo"]]["ok"][0]}–{tf.ESTILOS[r["estilo"]]["ok"][1]} |',
          f'| Variação do tom (desvio) | {m["tom_desvio_st"]} semitons | 2–5 |',
          f'| Pausa média entre frases | {m["pausa_media_entre_frases"]} s | 0,3–0,9 |',
          f'| Volume integrado | {m["lufs"]} LUFS | voz solta −16 a −20 |',
          f'| Pico real | {m["pico_real"]} dBTP | abaixo de −1 |',
          f'| Ruído nos silêncios | {m["ruido_dbfs"]} dBFS | abaixo de −50 |',
          f'| Palavras com divergência | {m["palavras_com_problema"]} de {m["palavras_roteiro"]} | 0 |', '']
    if r.get('referencia') and r['referencia'].get('comparacao'):
        L += ['## Comparação com a referência', '', f'Referência: `{Path(r["referencia"]["arquivo"]).name}`', '', '| Medida | Esta | Referência | Diferença |', '| --- | --- | --- | --- |']
        L += [f'| {c["medida"]} | {c["esta"]} | {c["referencia"]} | {c["diferenca_pct"]:+d}% |' for c in r['referencia']['comparacao']]
        L.append('')
    L += ['## Frase a frase', '', '| # | Início | Fim | Sílabas/s | Faixa de tom | Fim do tom | Janela | Texto |', '| --- | --- | --- | --- | --- | --- | --- | --- |']
    for d in r['frases']:
        jan = f'{d["janela"][0]:.2f}–{d["janela"][1]:.2f}' if d.get('janela') else ''
        L.append(f'| {d["n"]} | {fmt_t(d["ini"])} | {fmt_t(d["fim"])} | {d.get("silabas_por_s", "—")} | {d.get("tom_faixa_st", "—")} st | '
                 f'{d.get("tom_final_st", "—")} st | {jan} | {d["texto"][:70]} |')
    L += ['', '## O que a transcrição automática ouviu', '', '> ' + r['transcricao'], '',
          '_As medidas apontam defeitos objetivos. Timbre, emoção e se a voz combina com a marca só se decidem ouvindo:_',
          '_ouça pelo menos os trechos listados acima, e a narração inteira uma vez._' if probs else '_ouça a narração inteira uma vez._']
    return '\n'.join(L)


def desenhar(r, caminho):
    from PIL import Image, ImageDraw, ImageFont
    d_ = r['_desenho']
    pr, pals, x = d_['pr'], d_['pals'], d_['x']
    dur = len(x) / SR
    W, H, X0, X1 = 1800, 720, 70, 1770
    im = Image.new('RGB', (W, H), '#ffffff')
    g = ImageDraw.Draw(im)
    try:
        F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
        FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
        FS = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
    except OSError:
        F = FB = FS = ImageFont.load_default()
    tx = lambda t: X0 + (X1 - X0) * t / max(dur, 1e-6)  # noqa: E731
    g.text((X0, 12), f'{Path(r["arquivo"]).name} · nota {r["nota"]}/100 · {r["veredito"]}', fill='#111', font=FB)
    # faixas
    A0, A1 = 78, 168      # forma de onda
    P0, P1 = 210, 560     # tom
    T0 = 585              # palavras
    for a, b, lab in pr['intervalos']:
        if lab == 'silent':
            g.rectangle([tx(a), A0, tx(b), P1], fill='#eef4fb')
            if b - a >= 0.12 and tx(b) - tx(a) > 26:
                g.text((tx(a) + 2, A0 + 2), f'{b - a:.2f}', fill='#5b7fa8', font=FS)
    for k, fr in enumerate(r['frases']):
        if fr.get('janela'):      # janelas das cenas, alternando o verde, com o corte marcado
            g.rectangle([tx(fr['janela'][0]), A0 - 10, tx(fr['janela'][1]), A0 - 3], fill='#8cc995' if k % 2 == 0 else '#c4e5c9')
            g.line([tx(fr['janela'][1]), A0 - 12, tx(fr['janela'][1]), P1], fill='#2f8a3b', width=1)
            g.text((tx(fr['janela'][0]) + 3, A0 - 26), f'cena {fr["n"]}', fill='#2f8a3b', font=FS)
    # forma de onda (envelope em dB)
    hop = int(0.01 * SR)
    env = [db(rms(x[i:i + hop])) for i in range(0, len(x), hop)]
    mid = (A0 + A1) / 2
    for i, e in enumerate(env):
        h = max(0, (e + 60) / 60) * (A1 - A0) / 2
        xx = tx(i * hop / SR)
        g.line([xx, mid - h, xx, mid + h], fill='#8a94a6')
    g.text((8, A0), 'voz', fill='#555', font=FS)
    # tom
    st = pr['st']
    v = st[~np.isnan(st)]
    if len(v):
        med = float(np.median(v))
        lo, hi = med - 12, med + 12
        ty = lambda s: P1 - (P1 - P0) * (s - lo) / (hi - lo)  # noqa: E731
        for k in range(-12, 13, 3):
            y = ty(med + k)
            g.line([X0, y, X1, y], fill='#f0f0f0' if k else '#d0d0d0')
            g.text((8, y - 7), f'{k:+d} st', fill='#888', font=FS)
        pts = []
        for t, s in zip(pr['t_f0'], st):
            if np.isnan(s):
                if len(pts) > 1:
                    g.line(pts, fill='#1f6feb', width=3)
                pts = []
                continue
            pts.append((tx(t), ty(min(hi, max(lo, s)))))
        if len(pts) > 1:
            g.line(pts, fill='#1f6feb', width=3)
        for fr in r['frases']:
            if fr.get('tom_mediana_st') is not None and fr['ini'] is not None:
                y = ty(fr['tom_mediana_st'])
                g.line([tx(fr['ini']), y, tx(fr['fim']), y], fill='#f2a33a', width=1)
        for t in d_['saltos']:
            g.ellipse([tx(t) - 5, P0 + 4, tx(t) + 5, P0 + 14], outline='#d1242f', width=2)
    g.text((X0, A1 + 12), 'tom (semitons em relação à mediana) · laranja = tom médio da frase · azul-claro = silêncio (com a duração) · '
           'vermelho = problema, laranja = atenção (números do relatório)', fill='#555', font=FS)
    # palavras
    lin = [0, 0, 0]
    for pw in pals:
        if pw['ini'] is None:
            continue
        xx = tx(pw['ini'])
        k = min(range(3), key=lambda j: lin[j])
        if lin[k] > xx:
            k = min(range(3), key=lambda j: lin[j])
        y = T0 + k * 22
        cor = '#111' if pw['ok'] else '#d1242f'
        g.line([xx, P1, xx, y], fill='#e6e6e6')
        texto = pw['p'] + pw['pont']
        g.text((xx + 2, y), texto, fill=cor, font=F)
        lin[k] = xx + g.textlength(texto, font=F) + 8
    # problemas numerados
    for i, p in enumerate(r['problemas'], 1):
        if p['ini'] is None:
            continue
        cor = '#d1242f' if p['nivel'] == 'problema' else '#e08a00'
        x0, x1 = tx(p['ini']), tx(p['fim'] if p['fim'] is not None else p['ini'])
        g.rectangle([x0, P1 + 2, max(x1, x0 + 3), P1 + 8], fill=cor)
        g.text((x0, 44), str(i), fill=cor, font=FB)
        g.line([x0, 68, x0, A0], fill=cor, width=2)
    # eixo do tempo
    Y = H - 40
    g.line([X0, Y, X1, Y], fill='#999')
    passo = 1 if dur <= 30 else 5
    for s in range(0, int(dur) + 1, passo):
        g.line([tx(s), Y - 4, tx(s), Y + 4], fill='#999')
        g.text((tx(s) - 6, Y + 8), f'{s}s', fill='#666', font=FS)
    im.save(caminho)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--audio', nargs='+', required=True, help='um ou mais arquivos (vários = comparar takes)')
    ap.add_argument('--roteiro', help='.txt, .json (com janelas) ou o texto entre aspas')
    ap.add_argument('--estilo', default='anuncio', choices=list(tf.ESTILOS))
    ap.add_argument('--referencia', help='uma narração que você considera boa, para comparar ritmo, tom e pausas')
    ap.add_argument('--modelo', default='small', help='modelo de transcrição (small; medium é mais preciso e mais lento)')
    ap.add_argument('--saida', required=True)
    ap.add_argument('--mix', action='store_true', help='áudio já mixado com trilha: confere só a clareza da fala e o volume')
    a = ap.parse_args()
    frases = tf.ler_roteiro(a.roteiro) if a.roteiro else None
    saida = Path(a.saida)
    saida.mkdir(parents=True, exist_ok=True)
    res = []
    for arq in a.audio:
        pasta = saida if len(a.audio) == 1 else saida / Path(arq).stem
        pasta.mkdir(parents=True, exist_ok=True)
        r = avaliar(arq, frases, a.estilo, a.modelo, a.referencia, com_roteiro=bool(frases), mix=a.mix)
        r['nota'], r['veredito'] = nota(r['problemas'])
        desenhar(r, pasta / 'prosodia.png')
        r.pop('_desenho')
        (pasta / 'relatorio.json').write_text(json.dumps(r, ensure_ascii=False, indent=1, default=float), encoding='utf-8')
        (pasta / 'relatorio.md').write_text(relatorio_md(r), encoding='utf-8')
        np_ = sum(1 for p in r['problemas'] if p['nivel'] == 'problema')
        na = len(r['problemas']) - np_
        print(f'{Path(arq).name}: nota {r["nota"]} · {r["veredito"]} · {np_} problema(s), {na} atenção · {pasta / "relatorio.md"}')
        res.append(r)
    if len(res) > 1:
        res.sort(key=lambda r: (-r['nota'], sum(p['nivel'] == 'problema' for p in r['problemas'])))
        L = ['# Comparação de takes', '', '| Posição | Arquivo | Nota | Veredito | Problemas | Ritmo | Tom (desvio) |', '| --- | --- | --- | --- | --- | --- | --- |']
        for i, r in enumerate(res, 1):
            L.append(f'| {i} | {Path(r["arquivo"]).name} | {r["nota"]} | {r["veredito"]} | {sum(p["nivel"] == "problema" for p in r["problemas"])} | '
                     f'{r["medidas"]["silabas_por_s"]} | {r["medidas"]["tom_desvio_st"]} |')
        (saida / 'comparacao.md').write_text('\n'.join(L) + '\n', encoding='utf-8')
        print('melhor:', Path(res[0]['arquivo']).name, '·', saida / 'comparacao.md')


if __name__ == '__main__':
    main()
