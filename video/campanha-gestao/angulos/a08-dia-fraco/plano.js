// A08 · Dia fraco. Público: quem faz promoção no palpite.
// Gancho: caixinha de pergunta + barras da semana que não param no lugar (quebra de padrão) e o desafio "não vale chutar".
(() => {
  const VIO = '#6d3bff', INK = '#1b1340', PINK = '#ff3d71';
  const { T, W, D } = IG.init({
    bg: '#f3f1ff', fg: INK, accent: VIO, marker: PINK, danger: PINK, font: "'Unbounded', sans-serif", fontText: "'Inter Tight', sans-serif", grain: 0.03, vignette: 0.1,
    mov: 'soco', capCls: 'a08', capUpper: false, upper: false, weight: '800', tagBg: 'rgba(27,19,64,.85)',
    fundo: (bg) => { L.$('div', 'full', bg, { background: 'radial-gradient(70% 45% at 50% 40%, #ffffff, #e9e4ff 80%)' }); },
  });
  const { tl, $, px } = L;
  const REL = [1440, 6427];
  // 1 · qual é o dia mais fraco? não vale chutar
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    const cx = $('div', 'cx8', s);
    cx.innerHTML = '<div class="h">PRA QUEM TEM DOCERIA</div><div class="q">Qual é o seu dia mais fraco?</div>';
    tl.fromTo(cx, { scale: 1.25, rotate: 4 }, { scale: 1, rotate: 1.5, duration: 0.5, ease: 'expo.out' }, 0);
    L.cue(0.02, 'impact');
    const sem = $('div', 'sem', s);
    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const bars = dias.map((d, i) => {
      const x = 14 + i * 122;
      const bar = $('div', 'b', sem, { left: px(x), height: '380px' });
      const lab = $('div', 'd', sem, { left: px(x) }); lab.textContent = d;
      const q = $('div', 'i', sem, { left: px(x) }); q.textContent = '?';
      return { bar, q, f: 1.3 + i * 0.37, p: i * 1.7 };
    });
    L.onFrame((t) => { bars.forEach((o) => { const h = 0.5 + 0.38 * Math.sin(t * o.f * 2.2 + o.p); o.bar.style.transform = `scaleY(${h})`; o.q.style.bottom = `${80 + 380 * h}px`; }); });
    IG.carimbo(s, W(0, 'nao') - 0.05, 'não vale chutar', { x: 110, y: 1320, size: 58, rot: -4, cor: PINK, bg: '#fff', font: "800 58px/1 'Unbounded', sans-serif" });
    IG.ilustra(0.3, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[0.5, b, 0.04]] });
  }
  // 2 · o relatório mostra o dia da semana e o horário
  {
    const a = T(1) - 0.1, b = T(2) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'o relatório mostra', { fontSize: '70px', color: VIO }]], { parent: s, top: 290, empurra: false });
    const k = 1.68, left = 540 - (556 * k) / 2;
    IG.peca(s, a + 0.08, 'd-relatorios-full', { x: 858, y: 1106, w: 556, h: 262 }, { k, base: REL, top: 430, radius: 24, cue: 'ding' });
    IG.anotar(s, W(1, 'semana') - 0.25, { tipo: 'circulo', x: left + (1205 - 858) * k, y: 430 + (1282 - 1106) * k, w: 50 * k, h: 82 * k }, { color: PINK, largura: 8 });
    IG.anotar(s, W(1, 'semana') + 0.1, { tipo: 'circulo', x: left + (1075 - 858) * k, y: 430 + (1276 - 1106) * k, w: 50 * k, h: 88 * k }, { color: PINK, largura: 8 });
    IG.peca(s, W(1, 'em') - 0.15, 'd-relatorios-full', { x: 282, y: 1106, w: 556, h: 262 }, { k, base: REL, top: 910, radius: 24, cue: 'ding' });
    IG.anotar(s, W(1, 'mais') - 0.1, { tipo: 'circulo', x: left + (655 - 282) * k, y: 910 + (1160 - 1106) * k, w: 52 * k, h: 36 * k }, { color: VIO, largura: 8 });
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.04]] });
  }
  // 3 · um cupom pro dia parado, e quantas vezes foi usado
  {
    const a = T(2) - 0.1, b = T(3) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'um cupom pro', { fontSize: '80px' }], [W(2, 'movimentar') - 0.1, 'dia parado', { fontSize: '120px', color: VIO }]], { parent: s, top: 280, lh: '1', empurra: false });
    const c = IG.colunas(s, W(2, 'cupom') - 0.15, 'd-cupons', [[284, 520], [672, 812], [1250, 1316]], 150, 140, { w: 950, top: 600, cue: 'ding' });
    const [ux, uy] = c.at(1256, 156);
    IG.anotar(s, W(2, 'quantas') - 0.1, { tipo: 'circulo', x: ux, y: uy, w: 58 * c.k, h: 126 * c.k }, { color: PINK, largura: 9 });
    const n = $('div', null, s, { position: 'absolute', left: '0', width: '1080px', top: '1010px', textAlign: 'center', font: "800 56px/1.15 'Unbounded', sans-serif", color: INK });
    n.innerHTML = 'quantas vezes<br><span style="color:#ff3d71">ele foi usado</span>';
    IG.hid(n);
    tl.fromTo(n, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, W(2, 'vezes') - 0.1);
    L.cue(W(2, 'vezes') - 0.1, 'tick');
    [0, 1].forEach((i) => { const [fx, fy] = c.at(284, 190 + i * 53); const f = $('div', null, s, { position: 'absolute', left: px(fx - 4), top: px(fy), width: '12px', height: px(46 * c.k), background: VIO, borderRadius: '6px', transformOrigin: '50% 0' }); IG.hid(f); const t = W(2, 'cupom') + 0.5 + i * 0.45; tl.fromTo(f, { autoAlpha: 0, scaleY: 0 }, { autoAlpha: 1, scaleY: 1, duration: 0.3, immediateRender: false }, t); L.cue(t, 'tick'); });
    IG.real(W(2, 'cupom') - 0.15, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
  }
  IG.cta(T(3) - 0.1, {
    linhas: [[W(3, 'promocao') - 0.05, 'promoção com', { fontSize: '76px' }], [W(3, 'numero') - 0.1, 'NÚMERO,', { fontSize: '150px', color: VIO }], [W(3, 'nao') - 0.05, 'não com palpite.', { fontSize: '70px' }]],
    top: 440, botao: [W(3, 'fala') - 0.1, 'Fala com a gente'], botaoTop: 1010, botaoCor: VIO, botaoTexto: '#fff', toque: W(3, 'gente') + 0.3, prova: true, cor: INK,
    provaBorda: 'rgba(27,19,64,.18)', provaBg: 'rgba(255,255,255,.75)',
  });
  IG.fim({ hideIn: [[T(3) - 0.12, D + 1]], top: 1500 });
})();
