// R06 · Anotações sobre o próprio painel: o narrador circula e sublinha, na tela real, o que nenhum app mostra.
(() => {
  const YEL = '#ffd400', RED = '#ff4d4d';
  const { T, W, D } = IG.init({
    bg: '#16181d', fg: '#fff', accent: YEL, marker: YEL, danger: RED, font: "'Permanent Marker', cursive", fontText: "'Inter Tight', sans-serif", marcador: "'Permanent Marker', cursive",
    grain: 0.06, vignette: 0.5, mov: 'sobe', capCls: 'r06', capUpper: false, weight: '400',
    fundo: (bg) => { L.$('div', 'full', bg, { backgroundImage: 'radial-gradient(rgba(255,255,255,.07) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px' }); },
  });
  const { tl, $, px } = L;
  const nota = (parent, t, txt, x, y, o = {}) => {
    const e = $('div', null, parent, { position: 'absolute', left: px(x), top: px(y), font: `400 ${o.size || 54}px 'Permanent Marker', cursive`, color: o.cor || YEL, transform: `rotate(${o.rot ?? -4}deg)`, whiteSpace: 'nowrap' });
    e.textContent = txt;
    IG.hid(e);
    tl.fromTo(e, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, t);
    L.cue(t, 'scribble');
    return e;
  };
  // abertura
  {
    const a = 0, b = T(1) - 0.08;
    const s = L.scene(a, b);
    IG.texto(a, b, [[W(0, 'coisa') - 0.1, 'uma coisa que', { fontSize: '96px', color: '#fff' }], [W(0, 'nenhum') - 0.05, 'nenhum app', { fontSize: '112px', color: YEL, margin: '6px 0 14px' }], [W(0, 'delivery') - 0.05, 'de delivery', { fontSize: '112px', color: '#fff' }], [W(0, 'mostra', 1) - 0.05, 'te mostra:', { fontSize: '112px', color: '#fff' }]], { parent: s, top: 520, k: 0.08 });
    IG.anotar(s, W(0, 'app') + 0.1, { tipo: 'sublinhado', x: 190, y: 742, w: 700 }, { color: RED, largura: 12 });
    IG.anotar(s, W(0, 'mostra', 1) + 0.2, { tipo: 'seta', x1: 720, y1: 1010, x2: 560, y2: 1260 }, { color: YEL, largura: 10 });
  }
  const bloco = (a, b, titulo, fn) => {
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, titulo, { fontSize: '76px', color: YEL }]], { parent: s, top: 330, empurra: false, upper: false });
    fn(s, a, b);
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
    L.cue(a, 'whoosh');
    return s;
  };
  // 1 · quanto vende cada canal (cardápio próprio, PDV/balcão, WhatsApp, telefone)
  bloco(T(1) - 0.08, T(2) - 0.08, 'quanto vende cada canal', (s, a) => {
    const c = IG.colunas(s, a + 0.1, 'd-relatorios', [[284, 430], [535, 610], [845, 950]], 545, 236, { k: 2.6, top: 520 });
    [['cardapio', 597], ['balcao', 637], ['whatsapp', 679], ['telefone', 720]].forEach(([w, y]) => {
      const [x0, yy] = c.at(290, y + 16);
      const [x1] = c.at(415, y + 16);
      IG.anotar(s, W(1, w) - 0.05, { tipo: 'sublinhado', x: x0, y: yy, w: x1 - x0 }, { color: YEL, largura: 9, dur: 0.3 });
    });
    nota(s, W(1, 'balcao') + 0.15, 'PDV = balcão', 560, 1170, { rot: -5 });
  });
  // 2 · quanto custa cada produto; margem apertada em vermelho
  bloco(T(2) - 0.08, T(3) - 0.08, 'quanto custa cada produto', (s, a) => {
    const c = IG.colunas(s, a + 0.1, 'd-estoque-cmv-ficha', [[284, 640], [840, 1290]], 205, 315, { w: 960, top: 520 });
    const [hx, hy] = c.at(1010, 210);
    IG.anotar(s, W(2, 'custa'), { tipo: 'circulo', x: hx - 10, y: hy, w: 70 * c.k, h: 22 * c.k }, { color: YEL, largura: 8 });
    const [vx, vy] = c.at(1072, 296);
    IG.anotar(s, W(2, 'vermelho') - 0.1, { tipo: 'circulo', x: vx, y: vy, w: 58 * c.k, h: 214 * c.k }, { color: RED, largura: 9 });
    nota(s, W(2, 'apertada'), 'margem apertada!', 470, 960, { cor: RED, rot: -3 });
  });
  // 3 · quanto custou cada pedido
  bloco(T(3) - 0.08, T(4) - 0.08, 'quanto custou cada pedido', (s, a) => {
    const k = 1.45;
    IG.peca(s, a + 0.1, 'd-pedido-custo', { x: 395, y: 180, w: 650, h: 330 }, { k, top: 520, radius: 18 });
    const left = 540 - (650 * k) / 2;
    IG.anotar(s, W(3, 'custou'), { tipo: 'circulo', x: left + 20, y: 520 + (484 - 180) * k, w: 610 * k, h: 22 * k }, { color: YEL, largura: 9 });
    nota(s, W(3, 'pedido') + 0.1, 'custo estimado do pedido', 160, 1070, { rot: -3 });
  });
  // 4 · o DRE diz se sobrou dinheiro
  bloco(T(4) - 0.08, T(5) - 0.1, 'sobrou dinheiro?', (s, a) => {
    const d = IG.dre(s, a + 0.1, { k: 1.1, top: 470 });
    IG.anotar(s, W(4, 'sobrou') - 0.05, { tipo: 'circulo', x: d.left + 4, y: d.rowY(1066) - 4, w: 800 * d.k - 8, h: 44 * d.k }, { color: YEL, largura: 10 });
    IG.anotar(s, W(4, 'dinheiro'), { tipo: 'seta', x1: 940, y1: 1430, x2: 820, y2: d.rowY(1066) + 60 }, { color: RED, largura: 9 });
  });
  IG.prova(T(5) - 0.1, T(6) - 0.05, { fundo: '#16181d' });
  IG.cta(T(6) - 0.05, {
    linhas: [[W(6, 'quer') - 0.05, 'quer ver isso', { fontSize: '110px' }], [W(6, 'doceria') - 0.1, 'com a sua doceria?', { fontSize: '96px', color: YEL }]],
    top: 560, botao: [W(6, 'fala') - 0.1, 'Fala com a gente'], botaoCor: YEL, botaoTexto: '#16181d', toque: W(6, 'gente') + 0.3, mov: 'sobe',
  });
  IG.fim({ hideIn: [[T(5) - 0.12, D + 1]] });
})();
