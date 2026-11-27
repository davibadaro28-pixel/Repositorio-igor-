#!/usr/bin/env python3
"""Texto escrito -> texto falado (pt-BR), contagem de sílabas e estimativa de duração.

Usos:
  python3 texto_falado.py roteiro.txt                    # mostra o texto para a voz, as trocas feitas e a duração estimada
  python3 texto_falado.py roteiro.json --motor piper     # idem, com as janelas de tempo de cada frase (cabe ou não cabe)
  python3 texto_falado.py roteiro.txt --estilo conversa --pronuncias minhas.json

Roteiro: .txt (uma frase ou bloco por linha) ou .json ({"frases": [{"texto": ..., "inicio": s, "fim": s}]}).
Também é importado por avaliar.py e gerar_piper.py.
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

AQUI = Path(__file__).resolve().parent

# ---------------------------------------------------------------- números por extenso
UNI = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze',
       'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
CEN = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']


def _fem(t):
    return re.sub(r'\bum\b', 'uma', re.sub(r'\bdois\b', 'duas', re.sub(r'entos\b', 'entas', t)))


def _ate_999(n):
    if n < 20:
        return UNI[n]
    if n < 100:
        d, u = divmod(n, 10)
        return DEZ[d] + (' e ' + UNI[u] if u else '')
    if n == 100:
        return 'cem'
    c, r = divmod(n, 100)
    return CEN[c] + (' e ' + _ate_999(r) if r else '')


def extenso(n, feminino=False):
    """Inteiro >= 0 por extenso, como se fala no Brasil (1.200 -> mil e duzentos)."""
    n = int(n)
    if n < 1000:
        t = _ate_999(n)
        return _fem(t) if feminino else t
    partes = []
    escalas = [(10 ** 9, 'bilhão', 'bilhões'), (10 ** 6, 'milhão', 'milhões'), (1000, 'mil', 'mil')]
    resto = n
    for val, sing, plur in escalas:
        q, resto = divmod(resto, val)
        if not q:
            continue
        if val == 1000:
            pq = _ate_999(q)
            pq = _fem(pq) if feminino else pq
            partes.append('mil' if q == 1 else f'{pq} mil')
        else:
            partes.append(f'{_ate_999(q)} {sing if q == 1 else plur}')
    if resto:
        r = _ate_999(resto)
        r = _fem(r) if feminino else r
        # "e" antes do último grupo quando ele é < 100 ou centena redonda
        partes.append(('e ' if resto < 100 or resto % 100 == 0 else '') + r)
    return ' '.join(partes)


def _int(s):
    return int(s.replace('.', ''))


def moeda(reais, centavos, estilo='anuncio'):
    r, c = _int(reais), int((centavos or '0').ljust(2, '0')[:2])
    if r == 0 and c:
        return f'{extenso(c)} centavo' + ('s' if c > 1 else '')
    base = extenso(r)
    if not c:
        return f'{base} rea' + ('is' if r != 1 else 'l')
    if estilo == 'anuncio':                       # "cento e noventa e nove e noventa"
        return f'{base} e {extenso(c)}'
    return f'{base} rea' + ('is' if r != 1 else 'l') + f' e {extenso(c)} centavo' + ('s' if c > 1 else '')


ORD = {1: 'primeiro', 2: 'segundo', 3: 'terceiro', 4: 'quarto', 5: 'quinto', 6: 'sexto', 7: 'sétimo', 8: 'oitavo', 9: 'nono', 10: 'décimo'}
LETRA = {'a': 'á', 'b': 'bê', 'c': 'cê', 'd': 'dê', 'e': 'é', 'f': 'éfe', 'g': 'gê', 'h': 'agá', 'i': 'í', 'j': 'jota', 'k': 'cá',
         'l': 'éle', 'm': 'ême', 'n': 'êne', 'o': 'ó', 'p': 'pê', 'q': 'quê', 'r': 'érre', 's': 'ésse', 't': 'tê', 'u': 'ú',
         'v': 'vê', 'w': 'dáblio', 'x': 'xis', 'y': 'ípsilon', 'z': 'zê'}
# siglas que se leem como palavra (não soletrar)
SIGLA_PALAVRA = {'PIX', 'ONG', 'CEP', 'MEI', 'FAQ', 'SUS', 'INSS', 'ENEM', 'DETRAN', 'PROCON', 'OK', 'LED', 'UFO', 'NASA', 'UNESCO', 'ANVISA', 'TV'}
UNID = {'kg': 'quilos', 'g': 'gramas', 'km': 'quilômetros', 'm': 'metros', 'ml': 'mililitros', 'l': 'litros', 'min': 'minutos',
        's': 'segundos', 'h': 'horas', 'cm': 'centímetros'}
FEM_DEPOIS = {'horas', 'hora', 'gramas', 'pessoas', 'vezes', 'opções', 'unidades', 'fatias', 'pizzas'}


def carregar_pronuncias(caminho=None, motor='generico'):
    """Dicionário de grafias para a voz: {palavra: como escrever para soar certo}. Padrão por motor + do usuário."""
    base = json.loads((AQUI / 'pronuncias.json').read_text(encoding='utf-8')) if (AQUI / 'pronuncias.json').exists() else {}
    d = dict(base.get('todos', {}))
    d.update(base.get(motor, {}))
    if caminho:
        extra = json.loads(Path(caminho).read_text(encoding='utf-8'))
        d.update(extra.get('todos', {}) if isinstance(extra.get('todos'), dict) else {})
        d.update(extra.get(motor, {}) if isinstance(extra.get(motor), dict) else {})
        d.update({k: v for k, v in extra.items() if isinstance(v, str)})
    return d


# o que cada motor precisa: os modelos novos do ElevenLabs (v3/v4) leem números e preços sozinhos e devem
# receber o texto como está escrito; os outros leem melhor com tudo por extenso.
MOTORES = {
    'elevenlabs': {'numeros': False, 'siglas': False},       # eleven_v4 / eleven_v3
    'elevenlabs-v2': {'numeros': True, 'siglas': False},     # eleven_multilingual_v2, flash, turbo
    'piper': {'numeros': True, 'siglas': True},
    'kokoro': {'numeros': True, 'siglas': True},
    'generico': {'numeros': True, 'siglas': True},
}
SING = {'quilos': 'quilo', 'gramas': 'grama', 'quilômetros': 'quilômetro', 'metros': 'metro', 'mililitros': 'mililitro',
        'litros': 'litro', 'minutos': 'minuto', 'segundos': 'segundo', 'horas': 'hora', 'centímetros': 'centímetro'}


def _ordinal(m):
    o = ORD.get(int(m.group(1)), extenso(int(m.group(1))))
    return o[:-1] + 'a' if m.group(2) == 'ª' and o.endswith('o') else o


def para_fala(texto, motor='generico', moeda_estilo='anuncio', pronuncias=None):
    """Devolve (texto_para_a_voz, trocas). Mantém a pontuação (ela comanda as pausas)."""
    trocas = []
    cfg = MOTORES.get(motor, MOTORES['generico'])

    def sub(padrao, fn, s, flags=0):
        def f(m):
            novo = fn(m)
            if novo != m.group(0):
                trocas.append((m.group(0), novo))
            return novo
        return re.sub(padrao, f, s, flags=flags)

    t = texto
    if not cfg['numeros']:
        for k, v in sorted((pronuncias or {}).items(), key=lambda kv: -len(kv[0])):
            t = sub(r'(?<!\w)' + re.escape(k) + r'(?!\w)', lambda m, v=v: v, t, flags=re.IGNORECASE)
        return re.sub(r'\s+', ' ', t).strip(), trocas
    t = sub(r'R\$\s*(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?', lambda m: moeda(m.group(1), m.group(2), moeda_estilo), t)
    t = sub(r'(\d+(?:,\d+)?)\s?%', lambda m: (extenso(_int(m.group(1).split(',')[0])) + (' vírgula ' + extenso(int(m.group(1).split(',')[1])) if ',' in m.group(1) else '')) + ' por cento', t)
    t = sub(r'\b(\d{1,2})h(\d{2})\b', lambda m: f'{extenso(int(m.group(1)), True)} e {extenso(int(m.group(2)))}', t)
    t = sub(r'\b(\d{1,2}):(\d{2})\b', lambda m: f'{extenso(int(m.group(1)), True)}' + (f' e {extenso(int(m.group(2)))}' if int(m.group(2)) else ' horas'), t)
    t = sub(r'\b(\d{1,2})h\b', lambda m: f'{extenso(int(m.group(1)), True)} hora' + ('s' if int(m.group(1)) != 1 else ''), t)
    t = sub(r'\b(\d{1,2})([ºª°])', _ordinal, t)
    t = sub(r'\b(\d+(?:[.,]\d+)?)\s?(kg|km|ml|min|cm|g|l|m|s)\b',
            lambda m: f'{m.group(1)} ' + (SING[UNID[m.group(2)]] if m.group(1) == '1' else UNID[m.group(2)]), t)
    # números soltos (com gênero quando a palavra seguinte é feminina conhecida)
    t = sub(r'\b(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(?=(\s+\w+)?)',
            lambda m: (extenso(_int(m.group(1)), feminino=bool(m.group(3) and m.group(3).strip().lower() in FEM_DEPOIS))
                       + (' vírgula ' + extenso(int(m.group(2))) if m.group(2) else '')), t)
    t = t.replace('&', ' e ').replace(' + ', ' mais ').replace('nº', 'número').replace('Nº', 'número')
    # siglas em maiúsculas: soletra, exceto as que se leem como palavra
    if cfg['siglas']:
        t = sub(r'\b([A-Z]{2,4})\b', lambda m: m.group(1) if m.group(1) in SIGLA_PALAVRA else '-'.join(LETRA[c.lower()] for c in m.group(1)), t)
    for k, v in sorted((pronuncias or {}).items(), key=lambda kv: -len(kv[0])):   # "X-Bacon" antes de "bacon"
        t = sub(r'(?<!\w)' + re.escape(k) + r'(?!\w)', lambda m, v=v: v, t, flags=re.IGNORECASE)
    return re.sub(r'\s+', ' ', t).strip(), trocas


# ---------------------------------------------------------------- comparação com a transcrição
DESCARTAR = {'e', 'reais', 'real', 'centavos', 'centavo', 'virgula', 'r'}


def sem_acento(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


PONT = '.,;:!?…)"\'»”’—–-'


def palavras_pontuadas(texto):
    """[(palavra, pontuação_depois)]. 'R$ 199,90' fica junto; a pontuação final da palavra é separada."""
    texto = re.sub(r'R\$\s+', 'R$', texto.replace('—', ' — ').replace('–', ' – '))
    out = []
    for pedaco in texto.split():
        pal = pedaco.lstrip('("\'«“‘')
        pont = ''
        while pal and pal[-1] in PONT and not re.search(r'\d[.,]$', pal[-2:] + 'x'):
            pont = pal[-1] + pont
            pal = pal[:-1]
        if not pal:                 # travessão ou pontuação solta: vale como pausa na palavra anterior
            if out:
                out[-1] = (out[-1][0], out[-1][1] + pont)
            continue
        out.append((pal, pont))
    return out


def som(tk):
    """Grafias que soam igual viram a mesma (a transcrição escreve "hamburgheria" para "hamburgueria")."""
    tk = re.sub(r'gh(?=[ei])', 'gu', tk)
    tk = tk.replace('ph', 'f').replace('y', 'i').replace('k', 'c')
    tk = re.sub(r'x(?=[ptc])', 's', tk)              # "sexta" se fala "sesta", "texto" se fala "testo"
    return re.sub(r'(.)\1', r'\1', tk)          # letra dobrada (ss, rr, ll…) não muda a comparação


# formas da fala que a transcrição escreve por extenso (e o contrário)
CONTRACOES = {'pra': ['para'], 'pro': ['para', 'o'], 'pros': ['para', 'os'], 'pras': ['para', 'as'],
              'num': ['em', 'um'], 'numa': ['em', 'uma'], 'nuns': ['em', 'uns'], 'numas': ['em', 'umas'],
              'ta': ['esta'], 'to': ['estou'], 'ce': ['voce'], 'neh': ['nao', 'e']}


def tokens_palavra(palavra):
    falado, _ = para_fala(palavra, moeda_estilo='formal')
    out = []
    for tk in re.findall(r'\w+', sem_acento(falado.lower())):
        if tk in DESCARTAR:
            continue
        out += [som(t) for t in CONTRACOES.get(tk, [tk])]
    return out


def tokens(texto, pronuncias_inversas=None):
    """Lista de (token_normalizado, indice_da_palavra_original). Números viram palavras; pontuação some."""
    pals = palavras_pontuadas(texto)
    out = [(tk, i) for i, (p, _) in enumerate(pals) for tk in tokens_palavra(p)]
    return out, [p for p, _ in pals]


# ---------------------------------------------------------------- sílabas
VOG = 'aeiouáéíóúâêôãõày'


def silabas_palavra(p):
    p = sem_acento_parcial(p.lower())
    p = re.sub(r'(?<=[qg])u(?=[eiéíêaáoó])', '', p)       # qu/gu: o u não forma sílaba
    n = 0
    for grupo in re.findall(f'[{VOG}]+', p):
        k = len(grupo)
        # ditongos decrescentes (vogal + i/u átono) e nasais ão/ãe/õe contam como uma sílaba
        k -= len(re.findall(r'[aeoáéóâêô][iu](?![áéíóú])', grupo))
        k -= len(re.findall(r'[ãõ][oe]', grupo))
        n += max(1, k)
    return n


def sem_acento_parcial(s):
    # mantém ã/õ (nasal) e tônicas; só usado para contar sílabas
    return s


def silabas(texto):
    return sum(silabas_palavra(w) for w in re.findall(r'[^\W\d_]+', texto))


# ---------------------------------------------------------------- roteiro
FIM_FRASE = re.compile(r'(?<=[.!?…])\s+')


def ler_roteiro(caminho_ou_texto):
    """Devolve lista de frases: [{'texto', 'inicio'?, 'fim'?}]. Aceita .txt, .json ou texto direto."""
    p = Path(caminho_ou_texto)
    if p.exists() and p.suffix.lower() == '.json':
        d = json.loads(p.read_text(encoding='utf-8'))
        frases = d.get('frases', d) if isinstance(d, dict) else d
        return [f if isinstance(f, dict) else {'texto': f} for f in frases]
    texto = p.read_text(encoding='utf-8') if p.exists() else str(caminho_ou_texto)
    frases = []
    for linha in texto.splitlines():
        linha = linha.strip()
        if not linha or linha.startswith('#'):
            continue
        frases += [{'texto': s.strip()} for s in FIM_FRASE.split(linha) if s.strip()]
    return frases


ESTILOS = {   # sílabas por segundo de articulação (sem contar as pausas): faixa boa e limites
    'anuncio': {'alvo': 5.8, 'ok': (4.4, 7.2), 'limite': (3.8, 8.0)},
    'institucional': {'alvo': 5.0, 'ok': (4.0, 6.3), 'limite': (3.4, 7.0)},
    'conversa': {'alvo': 5.5, 'ok': (4.3, 6.8), 'limite': (3.7, 7.6)},
}
PAUSA = {'frase': 0.45, 'virgula': 0.18}


def estimar(texto, estilo='anuncio'):
    s = silabas(texto)
    pausas = len(re.findall(r'[.!?…:;]', texto[:-1])) * PAUSA['frase'] + len(re.findall(r',', texto)) * PAUSA['virgula']
    return s, s / ESTILOS[estilo]['alvo'] + pausas


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('roteiro')
    ap.add_argument('--motor', default='generico', choices=list(MOTORES))
    ap.add_argument('--estilo', default='anuncio', choices=list(ESTILOS))
    ap.add_argument('--moeda', default='anuncio', choices=['anuncio', 'formal'])
    ap.add_argument('--pronuncias')
    ap.add_argument('--json', action='store_true', help='saída em JSON')
    a = ap.parse_args()
    pron = carregar_pronuncias(a.pronuncias, a.motor)
    frases = ler_roteiro(a.roteiro)
    out, total = [], 0.0
    for f in frases:
        falado, trocas = para_fala(f['texto'], a.motor, a.moeda, pron)
        s, dur = estimar(para_fala(f['texto'], 'generico', a.moeda)[0], a.estilo)   # sílabas sempre do texto por extenso
        item = {'texto': f['texto'], 'para_voz': falado, 'trocas': trocas, 'silabas': s, 'duracao_estimada': round(dur, 2)}
        if 'inicio' in f and 'fim' in f:
            janela = f['fim'] - f['inicio']
            item['janela'] = round(janela, 2)
            item['cabe'] = dur <= janela - 0.15
            item['silabas_que_cabem'] = int((janela - 0.15 - (dur - s / ESTILOS[a.estilo]['alvo'])) * ESTILOS[a.estilo]['alvo'])
            item['silabas_para_preencher'] = int((janela - 0.45) * 6.3)       # fala do tamanho da cena: pausas curtas e iguais
            item['curta'] = s < 0.8 * item['silabas_para_preencher']
        total += dur
        out.append(item)
    if a.json:
        print(json.dumps({'frases': out, 'duracao_total_estimada': round(total, 2)}, ensure_ascii=False, indent=1))
        return
    for i, it in enumerate(out, 1):
        print(f'{i}. {it["para_voz"]}')
        for de, para in it['trocas']:
            print(f'     troca: "{de}" -> "{para}"')
        extra = ''
        if 'janela' in it:
            extra = f' | janela {it["janela"]} s: ' + ('cabe' if it['cabe'] else f'NÃO CABE (corte para ~{it["silabas_que_cabem"]} sílabas)')
            if it['cabe'] and it['curta']:
                extra += f', mas CURTA: para preencher a cena, ~{it["silabas_para_preencher"]} sílabas (senão sobra silêncio)'
        print(f'     {it["silabas"]} sílabas, ~{it["duracao_estimada"]} s{extra}')
    print(f'\nDuração estimada ({a.estilo}): {total:.1f} s')


if __name__ == '__main__':
    sys.exit(main())
