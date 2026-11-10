"""Monta o site estático da Bea Paes.

Uso, a partir da raiz do repositório:  python3 _src/build.py

Lê os corpos das páginas em _src/pages/, troca os marcadores <!-- PARCIAL:nome --> pelos blocos
de _src/parciais/ e envolve tudo com o mesmo cabeçalho, sprite de ícones, rodapé e botão de
WhatsApp. Escreve as páginas prontas na raiz do repositório, além de sitemap.xml e robots.txt.
A pasta _src não é publicada pelo GitHub Pages (pastas com "_" são ignoradas).
"""
import json
import pathlib
import re

SRC = pathlib.Path(__file__).parent
OUT = SRC.parent

URL_BASE = "https://davibadaro28-pixel.github.io/Repositorio-igor-/"
# Número usado como destino quando o JavaScript não carrega. O mesmo número fica em main.js (CONFIG).
WHATSAPP = "5511945364807"
WHATSAPP_VISIVEL = "(11) 94536-4807"
INSTAGRAM = "https://www.instagram.com/beapaes_/"
YOUTUBE = "https://www.youtube.com/@beapaesnutri"
COMUNIDADE = "https://chat.whatsapp.com/F7X6syXfhyw20rirQbO9eo"

PAGINAS = [
    ("index", "Bea Paes | Nutricionista na gestação e no pós-parto",
     "Acompanhamento nutricional da nutricionista Bea Paes para gestantes e mulheres no pós-parto, com o plano alinhado ao obstetra."),
    ("programa", "O programa | Bea Paes, nutricionista",
     "Como funciona o acompanhamento nutricional da Bea Paes na gestação e no pós-parto: etapas, o que está incluso, equipe e investimento."),
    ("alimentacao", "Alimentação e ganho de peso na gestação | Bea Paes",
     "Calculadora de ganho de peso pela Caderneta da Gestante, suplementos do pré-natal, enjoo, azia e alimentação na gestação, com fontes oficiais."),
    ("pos-parto", "Pós-parto e amamentação | Bea Paes",
     "Alimentação na amamentação, recuperação no pós-parto, saúde emocional e nutrição para hipertrofia, com fontes oficiais."),
    ("gestacao", "Exercício na gestação | Bea Paes",
     "O que as diretrizes recomendam sobre exercício na gestação: quanto se movimentar, sinais para parar e preparação para o parto."),
    ("quero-entrar", "Comece pelo WhatsApp | Bea Paes",
     "Conte em que fase você está e mande uma mensagem pronta para a Bea pelo WhatsApp."),
    ("404", "Página não encontrada | Bea Paes",
     "A página procurada não existe. Volte para o início do site da Bea Paes."),
]

MENU = [
    ("programa", "O programa"),
    ("alimentacao", "Alimentação"),
    ("pos-parto", "Pós-parto"),
    ("gestacao", "Exercício"),
]

FAVICON = (
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E"
    "%3Crect width='32' height='32' rx='7' fill='%236E4F3E'/%3E"
    "%3Ctext x='16' y='21.5' font-family='Georgia,serif' font-size='14' fill='%23FAF7F2' text-anchor='middle'%3EBP%3C/text%3E"
    "%3C/svg%3E"
)

DADOS_ESTRUTURADOS = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Beatriz Paes",
    "alternateName": "Bea Paes",
    "jobTitle": "Nutricionista",
    "description": "Acompanhamento nutricional na gestação e no pós-parto.",
    "url": URL_BASE,
    "image": URL_BASE + "img/bea-800.jpg",
    "sameAs": [INSTAGRAM, YOUTUBE],
    "makesOffer": {
        "@type": "Offer",
        "name": "Acompanhamento nutricional na gestação e no pós-parto",
        "price": "3700",
        "priceCurrency": "BRL",
    },
}

sprite = (SRC / "_sprite.html").read_text(encoding="utf-8")
parciais = {p.stem: p.read_text(encoding="utf-8").rstrip() for p in (SRC / "parciais").glob("*.html")}


def aplicar_parciais(texto):
    def troca(m):
        nome = m.group(1)
        if nome not in parciais:
            raise SystemExit(f"Parcial não encontrada: {nome}")
        return parciais[nome]
    return re.sub(r"<!-- PARCIAL:([a-z0-9-]+) -->", troca, texto)


def menu(atual):
    itens = []
    for slug, nome in MENU:
        corrente = ' aria-current="page"' if slug == atual else ""
        itens.append(f'        <a href="{slug}.html"{corrente}>{nome}</a>')
    itens.append(f'        <a class="menu-insta" href="{INSTAGRAM}" rel="noopener">Instagram @beapaes_</a>')
    itens.append('        <a class="menu-cta" href="index.html#contato">Comece por uma conversa</a>')
    return "\n".join(itens)


def pagina(slug, titulo, descricao):
    corpo = aplicar_parciais((SRC / "pages" / f"{slug}.html").read_text(encoding="utf-8").rstrip())
    endereco = URL_BASE if slug == "index" else f"{URL_BASE}{slug}.html"
    ld = ""
    if slug == "index":
        ld = '\n  <script type="application/ld+json">' + json.dumps(DADOS_ESTRUTURADOS, ensure_ascii=False) + "</script>"
    robots = '\n  <meta name="robots" content="noindex">' if slug == "404" else ""
    wa = f"https://wa.me/{WHATSAPP}"
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{titulo}</title>
  <meta name="description" content="{descricao}">{robots}
  <link rel="canonical" href="{endereco}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Bea Paes, nutricionista">
  <meta property="og:title" content="{titulo}">
  <meta property="og:description" content="{descricao}">
  <meta property="og:url" content="{endereco}">
  <meta property="og:image" content="{URL_BASE}img/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Bea Paes, nutricionista, sorrindo com o teste de gravidez positivo, e o título Bem nutrida na gestação. Inteira no pós-parto.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#FAF7F2">
  <link rel="icon" href="{FAVICON}">
  <link rel="apple-touch-icon" href="img/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400..600;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400..500;1,6..72,400&display=swap">
  <link rel="stylesheet" href="style.css">{ld}
</head>
<body>

  <a class="skip" href="#conteudo">Pular para o conteúdo</a>
{sprite}
  <header class="topo">
    <div class="topo-inner">
      <a class="marca" href="index.html" aria-label="Bea Paes, página inicial"><span class="marca-nome">Bea Paes</span><span class="marca-sub">Nutricionista</span></a>
      <button class="menu-botao" type="button" aria-expanded="false" aria-controls="menu"><span class="menu-icone" aria-hidden="true"></span><span class="visualmente-oculto">Menu</span></button>
      <nav id="menu" class="menu" aria-label="Páginas">
{menu(slug)}
      </nav>
      <a class="topo-insta" href="{INSTAGRAM}" rel="noopener" aria-label="Instagram da Bea, @beapaes_"><svg class="icone" aria-hidden="true"><use href="#i-instagram"/></svg></a>
      <a class="botao botao-pequeno topo-cta js-contato" href="{wa}" rel="noopener">Conversar com a Bea</a>
    </div>
  </header>

  <main id="conteudo">
{corpo}
  </main>

  <footer class="rodape">
    <div class="largura rodape-grid">
      <div class="rodape-sobre">
        <p class="rodape-marca">Bea Paes</p>
        <p>Nutricionista. Acompanhamento nutricional na gestação e no pós-parto, alinhado com o seu obstetra.</p>
      </div>
      <nav class="rodape-links" aria-label="Páginas do site">
        <p class="rodape-titulo">Site</p>
        <a href="programa.html">O programa</a>
        <a href="alimentacao.html">Alimentação e ganho de peso</a>
        <a href="pos-parto.html">Pós-parto e amamentação</a>
        <a href="gestacao.html">Exercício na gestação</a>
      </nav>
      <div class="rodape-links">
        <p class="rodape-titulo">Contato</p>
        <a class="js-contato" href="{wa}" rel="noopener">WhatsApp {WHATSAPP_VISIVEL}</a>
        <a href="{INSTAGRAM}" rel="noopener">Instagram @beapaes_</a>
        <a href="{YOUTUBE}" rel="noopener">YouTube</a>
        <a href="{COMUNIDADE}" rel="noopener">Comunidade no WhatsApp</a>
      </div>
      <p class="rodape-aviso">O conteúdo deste site é educativo e não substitui o acompanhamento pré-natal nem uma avaliação individual. Suplementos, dietas e exercícios devem ser combinados com o seu obstetra e a sua nutricionista.</p>
    </div>
  </footer>

  <a class="whats-flutuante js-contato" href="{wa}" rel="noopener" aria-label="Conversar com a Bea no WhatsApp">
    <svg class="whats-icone" aria-hidden="true"><use href="#i-whatsapp"/></svg>
  </a>

  <script src="main.js" defer></script>
</body>
</html>
"""


for slug, titulo, descricao in PAGINAS:
    (OUT / f"{slug}.html").write_text(pagina(slug, titulo, descricao), encoding="utf-8")
    print("ok", slug)

urls = [URL_BASE] + [f"{URL_BASE}{slug}.html" for slug, *_ in PAGINAS if slug not in ("index", "404")]
(OUT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {URL_BASE}sitemap.xml\n", encoding="utf-8")
print("ok sitemap e robots")
