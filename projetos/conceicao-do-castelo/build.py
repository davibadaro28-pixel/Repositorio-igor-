"""Monta o video do Residencial Conceicao do Castelo no estilo da referencia.

Uso: python3 -I build.py <scratchpad>
"""
import json, os, subprocess, sys, unicodedata
from PIL import ImageFont

S = sys.argv[1]
ORIG = f"{S}/material/IMG_2602.MOV"
PROXY = f"{S}/work/proxy.mov"
WORK = f"{S}/work"
SHOTS = f"{WORK}/shots"
BRIEF = f"{S}/briefing/img-006.jpg"
OUTDIR = f"{S}/out"
os.makedirs(SHOTS, exist_ok=True)
os.makedirs(OUTDIR, exist_ok=True)

W, H, FPS = 1080, 1920, 30
GRADE = ("eq=contrast=1.08:saturation=1.18:gamma=0.96,"
         "colorbalance=rs=-0.04:bs=0.05:rh=0.04:gh=0.01:bh=-0.03,vignette=angle=PI/5")
ENC = ["-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(FPS)]

# ---------------------------------------------------------------- audio map
# Trechos do audio original mantidos (tempo da fonte). Pausas longas cortadas.
AUDIO = [(0.00, 49.15), (49.70, 52.15), (53.05, 63.70)]
TAIL = 2.8  # silencio no fim para a tela final


def src2out(t):
    acc = 0.0
    for a, b in AUDIO:
        if a - 0.05 <= t <= b + 0.05:
            return acc + (min(max(t, a), b) - a)
        acc += b - a
    raise ValueError(f"tempo {t} fora dos trechos de audio")


TOTAL = sum(b - a for a, b in AUDIO) + TAIL

# ---------------------------------------------------------------- shots
# (inicio_saida, fim_saida, tipo, parametros)
LAZER = {  # recortes das imagens 3D da pagina de lazer do briefing
    "churrasqueira": (41, 357, 518, 756),
    "salao": (587, 357, 1065, 756),
    "academia": (1133, 357, 1611, 756),
}
SHOT_LIST = [
    (0.00, 6.05, "v", dict(src=0.00)),               # gancho: corretor no terreno
    (6.05, 6.35, "v", dict(src=66.60)),              # flashes do decorado
    (6.35, 6.65, "v", dict(src=72.20)),
    (6.65, 6.95, "v", dict(src=79.20)),
    (6.95, 7.25, "v", dict(src=89.60)),
    (7.25, 13.47, "v", dict(src=7.25)),              # corretora: nome e local
    (13.47, 21.83, "v", dict(src=13.47)),            # os dois andando: localizacao
    (21.83, 24.05, "v", dict(src=63.75)),            # porta abrindo -> entrada
    (24.05, 24.70, "v", dict(src=66.40)),            # painel ripado
    (24.70, 26.25, "v", dict(src=82.75)),            # quarto (2 dormitorios)
    (26.25, 27.15, "v", dict(src=78.00)),            # sacada
    (27.15, 28.56, "v", dict(src=68.20)),            # sala/cozinha integrada
    (28.56, 32.40, "img", dict(key="salao")),
    (32.40, 33.85, "img", dict(key="academia")),
    (33.85, 34.80, "img", dict(key="churrasqueira")),
    (34.80, 46.67, "v", dict(src=34.80)),            # os dois na placa: condicoes
    (46.67, 47.80, "v", dict(src=46.67)),            # "Hoje voce pode estar vendo..."
    (47.80, 51.60, "xf", dict(a=49.80, a_len=3.0, b=80.00, b_len=1.15, dur=0.35)),  # terreno -> decorado
    (51.60, 54.12, "v", dict(src=53.05)),            # "Talvez um desses apartamentos..."
    (54.12, 56.40, "v", dict(src=70.80)),            # cozinha
    (56.40, 58.40, "v", dict(src=88.20)),            # quarto casal
    (58.40, 62.80, "slow", dict(src=85.25, speed=0.5)),  # mesa -> sala em camera lenta
    (62.80, TOTAL, "still", dict(src=86.90)),        # quadro final com zoom lento
]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(" ".join(cmd)); print(r.stderr[-3000:]); sys.exit(1)


def render_shot(i, start, end, kind, p):
    out = f"{SHOTS}/{i:02d}.mp4"
    dur = end - start
    n = int(round(end * FPS)) - int(round(start * FPS))  # quadros exatos, sem acumular arredondamento
    base = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    if kind == "v":
        run(base + ["-ss", f"{p['src']:.3f}", "-i", PROXY, "-frames:v", str(n), "-an",
                    "-vf", f"{GRADE},setsar=1", *ENC, out])
    elif kind == "slow":
        src_len = dur * p["speed"]
        run(base + ["-ss", f"{p['src']:.3f}", "-t", f"{src_len + 0.1:.3f}", "-i", ORIG, "-an",
                    "-vf", f"setpts=PTS/{p['speed']},fps={FPS},scale={W}:{H}:flags=lanczos,{GRADE},setsar=1",
                    "-frames:v", str(n), *ENC, out])
    elif kind == "still":
        frame = f"{WORK}/still_{i}.png"
        run(base + ["-ss", f"{p['src']:.3f}", "-i", ORIG, "-frames:v", "1", frame])
        run(base + ["-i", frame, "-vf",
                    f"scale=4320:7680,zoompan=z='1+0.06*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS},{GRADE},setsar=1",
                    "-frames:v", str(n), *ENC, out])
    elif kind == "img":
        x0, y0, x1, y1 = LAZER[p["key"]]
        crop = f"crop={x1 - x0}:{y1 - y0}:{x0}:{y0}"
        fw = 920  # largura da foto dentro do quadro
        fg = (f"[0:v]split[i1][i2];[i1]{crop},scale=3680:-2:flags=lanczos,"
              f"zoompan=z='1+0.05*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={fw}x{int(fw * (y1 - y0) / (x1 - x0)) // 2 * 2}:fps={FPS},"
              f"pad=iw+28:ih+28:14:14:white[fg]")
        bg = (f"[i2]{crop},scale=-2:{H},crop={W}:{H},gblur=sigma=45,eq=brightness=-0.06,"
              f"loop=loop={n}:size=1,fps={FPS}[bg]")
        run(base + ["-i", BRIEF, "-filter_complex",
                    f"{fg};{bg};[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1,setsar=1",
                    "-frames:v", str(n), *ENC, out])
    elif kind == "xf":
        off = p["a_len"] - p["dur"]
        run(base + ["-ss", f"{p['a']:.3f}", "-t", f"{p['a_len']:.3f}", "-i", PROXY,
                    "-ss", f"{p['b']:.3f}", "-t", f"{p['b_len']:.3f}", "-i", PROXY,
                    "-filter_complex",
                    f"[0:v]{GRADE},setsar=1,fps={FPS}[a];[1:v]{GRADE},setsar=1,fps={FPS}[b];"
                    f"[a][b]xfade=transition=fade:duration={p['dur']}:offset={off:.3f}",
                    "-frames:v", str(n), "-an", *ENC, out])
    return out


def build_video():
    files = []
    for i, (a, b, kind, p) in enumerate(SHOT_LIST):
        print(f"shot {i:02d} {a:6.2f}-{b:6.2f} {kind}", flush=True)
        files.append(render_shot(i, a, b, kind, p))
    lst = f"{WORK}/shots.txt"
    with open(lst, "w") as f:
        for fp in files:
            f.write(f"file '{fp}'\n")
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
         "-i", lst, "-c", "copy", f"{WORK}/main.mp4"])


def build_audio():
    parts, labels = [], []
    for k, (a, b) in enumerate(AUDIO):
        parts.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,"
                     f"afade=t=out:st={b - a - 0.015:.3f}:d=0.015[a{k}]")
        labels.append(f"[a{k}]")
    fc = ";".join(parts) + ";" + "".join(labels) + \
        f"concat=n={len(AUDIO)}:v=0:a=1,apad=pad_dur={TAIL},highpass=f=80," \
        f"loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", PROXY, "-filter_complex", fc,
         "-t", f"{TOTAL:.3f}", "-c:a", "pcm_s16le", f"{WORK}/audio.wav"])


# ---------------------------------------------------------------- legendas
FONT_S = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
FONT_B = "/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf"
RED = "&H2A20E5&"  # #E5202A em BGR
WHITE = "&HFFFFFF&"
SIZE_S, SIZE_B = 46, 96
MAXW = 720
CY = 990  # centro vertical do bloco de legenda

# Cada bloco: lista de linhas (estilo, texto). Na fala: "exibe=falado" troca a grafia,
# "-palavra" consome sem exibir, "!" pinta de vermelho.
CHUNKS = [
    [("S", "Você, provavelmente,"), ("B", "não deve imaginar")],
    [("S", "o que vai"), ("B", "nascer aqui,")],
    [("S", "mas espere só até você"), ("B", "ver !ISSO=isso.")],
    [("S", "Este=Esta é o"), ("B", "Residencial Conceição")],
    [("S", "localizado no"), ("B", "Burgo Paulista,")],
    [("S", "pertinho da"), ("B", "Vila Ré,")],
    [("S", "próximo ao"), ("B", "!Metrô !Patriarca")],
    [("S", "A localização aqui é um dos"), ("B", "grandes diferenciais")],
    [("S", "Aqui você tem"), ("B", "mercado, UPA,")],
    [("B", "Fatec -e Zona Leste")],
    [("S", "e tudo que você precisa para o seu"), ("B", "dia a dia")],
    [("S", "E agora, olha o que"), ("B", "você vai encontrar aqui")],
    [("S", "apartamento de"), ("B", "!2=dois !dormitórios=ormitórios")],
    [("S", "e com"), ("B", "sacada")],
    [("S", "E não é só o"), ("B", "apartamento")],
    [("S", "O condomínio também terá"), ("B", "salão de festas,")],
    [("B", "playground,")],
    [("S", "espaço para"), ("B", "academia")],
    [("S", "e"), ("B", "churrasqueira")],
    [("S", "E se você acha que deve ter uma"), ("B", "fortuna guardada")],
    [("B", "para comprar?")],
    [("B", "Calma,")],
    [("S", "porque as"), ("B", "!condições !de !pagamento")],
    [("S", "podem"), ("B", "facilitar"), ("S", "a sua compra")],
    [("S", "Mas cada caso depende de"), ("B", "uma análise,")],
    [("S", "e o melhor é você fazer uma"), ("B", "!simulação")],
    [("B", "Hoje"), ("S", "você pode estar vendo isso")],
    [("S", "Mas"), ("B", "!daqui !a !pouco"), ("S", "você pode estar vendo isso")],
    [("S", "Talvez um desses apartamentos"), ("B", "!seja !seu")],
    [("S", "Quer saber"), ("B", "valores")],
    [("S", "e as condições de como"), ("B", "ficaria para você?")],
    [("S", "Chama no=a"), ("B", "!Whats=W"), ("S", "e faça sua simulação")],
    [("B", "Te esperamos!")],
]


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalnum())


def ts(t):
    t = max(t, 0)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def text_width(txt, style):
    f = ImageFont.truetype(FONT_B if style == "B" else FONT_S, SIZE_B if style == "B" else SIZE_S)
    return f.getlength(txt) * (0.80 if style == "B" else 0.83)


def build_ass():
    words = json.load(open(f"{S}/material/words.json"))
    wi = 0
    events = []
    timed = []  # (inicio_bloco, fim_ultima_palavra, linhas[(estilo, [(texto, t, vermelho)])])
    for chunk in CHUNKS:
        lines = []
        for style, txt in chunk:
            toks = []
            for tok in txt.split():
                skip = tok.startswith("-")
                red = tok.startswith("!")
                tok = tok.lstrip("-!")
                shown, _, spoken = tok.partition("=")
                spoken = spoken or shown
                while norm(words[wi]["w"]) != norm(spoken):
                    wi += 1
                t = src2out(words[wi]["s"])
                end = src2out(words[wi]["e"])
                wi += 1
                if not skip:
                    toks.append((shown, t, red, end))
            lines.append((style, toks))
        start = min(t for _, tk in lines for _, t, _, _ in tk)
        last = max(e for _, tk in lines for _, _, _, e in tk)
        timed.append((start, last, lines))

    for k, (start, last, lines) in enumerate(timed):
        nxt = timed[k + 1][0] if k + 1 < len(timed) else last + 0.6
        end = nxt if nxt - last < 0.6 else last + 0.45
        heights = [64 if st == "S" else (132 if any(r for _, _, r, _ in tk) else 108) for st, tk in lines]
        y = CY - sum(heights) / 2
        for (style, toks), h in zip(lines, heights):
            cy = y + h / 2
            y += h
            ls = toks[0][1]
            plain = " ".join(w for w, _, _, _ in toks)
            reds = [w for w, _, r, _ in toks if r]
            boxed = style == "B" and bool(reds)  # destaque: texto branco em tarja vermelha
            sc = min(100, int(100 * (MAXW - 40 if boxed else MAXW) / max(text_width(plain, style), 1)))
            pop = (f"\\fscx{int(sc * 1.12)}\\fscy{int(sc * 1.12)}\\t(0,160,\\fscx{sc}\\fscy{sc})"
                   if style == "B" else f"\\fscx{sc}\\fscy{sc}")
            if boxed:
                events.append(f"Dialogue: 2,{ts(ls)},{ts(end)},BR,,0,0,0,,"
                              f"{{\\an5\\pos(540,{cy:.0f})\\fad(60,90){pop}}}{plain}")
            else:
                body = ""
                for w, t, _, _ in toks:
                    dt = int((t - ls) * 1000)
                    body += f"{{\\1a&HFF&\\3a&HFF&\\t({dt},{dt + 90},\\1a&H00&\\3a&H90&)}}{w} "
                events.append(f"Dialogue: 2,{ts(ls)},{ts(end)},{style},,0,0,0,,"
                              f"{{\\an5\\pos(540,{cy:.0f})\\blur5\\fad(0,90){pop}}}{body.rstrip()}")
            if reds:  # eco gigante desfocado atras da palavra em vermelho
                rt = min(t for _, t, r, _ in toks if r)
                etxt = " ".join(reds)
                esc = min(260, int(260 * 1500 / max(text_width(etxt, "B"), 1)))
                events.append(f"Dialogue: 0,{ts(rt)},{ts(end)},Echo,,0,0,0,,"
                              f"{{\\an5\\pos(540,{cy:.0f})\\fscx{esc}\\fscy{esc}\\blur22\\fad(120,120)}}{etxt}")

    # rotulos e tela final
    def ev(a, b, style, txt, layer=3):
        events.append(f"Dialogue: {layer},{ts(a)},{ts(b)},{style},,0,0,0,,{txt}")

    ev(28.56, 34.80, "Tag", "{\\an3\\pos(918,1676)}Imagens meramente ilustrativas")
    ev(src2out(39.14), src2out(46.64), "Tag", "{\\an2\\pos(540,1520)\\fad(200,200)}Condições sujeitas a análise de crédito")
    ev(src2out(60.06) - 0.2, TOTAL, "Pill",
       "{\\an5\\pos(540,1400)\\fad(200,0)\\fscx112\\fscy112\\t(0,180,\\fscx100\\fscy100)}WhatsApp (11) 94023-1550")
    end_a = src2out(63.42) + 0.15
    ev(end_a, TOTAL, "S", "{\\an5\\pos(540,880)\\blur5\\fad(200,0)}Residencial")
    sc = min(100, int(100 * 860 / text_width("Conceição do Castelo", "B")))
    ev(end_a + 0.15, TOTAL, "B",
       f"{{\\an5\\pos(540,965)\\blur5\\fad(200,0)\\fscx{int(sc * 1.12)}\\fscy{int(sc * 1.12)}\\t(0,180,\\fscx{sc}\\fscy{sc})}}Conceição do Castelo")
    ev(end_a + 0.3, TOTAL, "S", "{\\an5\\pos(540,1060)\\blur5\\fad(200,0)\\fscx80\\fscy80}Burgo Paulista · Zona Leste · SP")
    ev(src2out(60.06) - 0.2, TOTAL, "Tag",
       "{\\an2\\pos(540,1520)\\fad(200,0)}Imagens meramente ilustrativas. Condições sujeitas a análise de crédito.")

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: S,Inter SemiBold,{SIZE_S},&H00FFFFFF,&H00FFFFFF,&H90000000,&H00000000,0,0,0,0,100,100,-0.5,0,1,3,0,5,0,0,0,1
Style: B,Inter Display ExtraBold,{SIZE_B},&H00FFFFFF,&H00FFFFFF,&H90000000,&H00000000,0,0,0,0,100,100,-2.5,0,1,3,0,5,0,0,0,1
Style: BR,Inter Display ExtraBold,{SIZE_B},&H00FFFFFF,&H00FFFFFF,&H002A20E5,&H002A20E5,0,0,0,0,100,100,-2.5,0,3,14,0,5,0,0,0,1
Style: Echo,Inter Display ExtraBold,{SIZE_B},&HB42A20E5,&HB42A20E5,&HFF000000,&HFF000000,0,0,0,0,100,100,-4,0,1,0,0,5,0,0,0,1
Style: Tag,Inter SemiBold,24,&H30FFFFFF,&H30FFFFFF,&H80000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,0,0,0,1
Style: Pill,Inter Display ExtraBold,52,&H00FFFFFF,&H00FFFFFF,&H002A20E5,&H002A20E5,0,0,0,0,100,100,-1,0,3,18,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    with open(f"{WORK}/legendas.ass", "w") as f:
        f.write(header + "\n".join(events) + "\n")


# ---------------------------------------------------------------- composicao final
def compose(name):
    cw, ch, bd = 828, 1472, 6  # cartao: video 828x1472 + borda branca de 6px
    cx, cy = (W - cw - 2 * bd) // 2, (H - ch - 2 * bd) // 2
    fc = (f"[0:v]split[a][b];"
          f"[a]scale={int(W * 1.12)}:{int(H * 1.12)},crop={W}:{H},gblur=sigma=38,eq=brightness=-0.07:saturation=1.1[bg];"
          f"[b]scale={cw}:{ch}:flags=lanczos,pad={cw + 2 * bd}:{ch + 2 * bd}:{bd}:{bd}:white[card];"
          f"color=c=black@0.55:s={cw + 2 * bd}x{ch + 2 * bd}:r={FPS},format=rgba,"
          f"pad=iw+120:ih+120:60:60:color=black@0,gblur=sigma=22[sh];"
          f"[bg][sh]overlay={cx - 60 + 6}:{cy - 60 + 16}:shortest=1[bg2];"
          f"[bg2][card]overlay={cx}:{cy},ass={WORK}/legendas.ass:fontsdir=/usr/share/fonts/opentype/inter,format=yuv420p[v]")
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", f"{WORK}/main.mp4", "-i", f"{WORK}/audio.wav",
         "-filter_complex", fc, "-map", "[v]", "-map", "1:a", "-t", f"{TOTAL:.3f}",
         "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-profile:v", "high", "-pix_fmt", "yuv420p",
         "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", f"{OUTDIR}/{name}"])


if __name__ == "__main__":
    step = sys.argv[2] if len(sys.argv) > 2 else "all"
    name = sys.argv[3] if len(sys.argv) > 3 else "Conceicao_do_Castelo_v1.mp4"
    if step in ("all", "video"):
        build_video()
    if step in ("all", "audio"):
        build_audio()
    if step in ("all", "ass", "compose"):
        build_ass()
    if step in ("all", "compose"):
        compose(name)
    print("ok", f"{TOTAL:.2f}s")
