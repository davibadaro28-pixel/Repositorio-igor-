// A01 · Encomendas de fim de ano. Público: quem faz bolo e doce por encomenda.
// Gancho: calendário de dezembro lotado de bilhetes (quebra de padrão) + novidade (Natal chegando).
(() => {
  const GOLD = '#f6c453', CREAM = '#fff6e6';
  const { T, W, D } = IG.init({
    bg: '#5a0f1b', fg: CREAM, accent: GOLD, marker: GOLD, font: "'DM Serif Display', serif", fontText: "'Inter Tight', sans-serif", marcador: "'Caveat', cursive",
    grain: 0.07, vignette: 0.5, mov: 'sobe', capCls: 'a01', capUpper: false, upper: false, weight: '400', tagBg: 'rgba(40,6,12,.72)',
    fundo: (bg) => { L.$('div', 'full', bg, { background: 'radial-gradient(90% 60% at 50% 30%, #a3212f, #5a0f1b 75%)' }); IG.neve(bg, { n: 54 }); },
  });
  const { tl, $, px } = L;
  // 1 · dezembro lotado: onde você vai anotar?
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    const cal = $('div', 'cal01', s, { left: '130px', top: '560px', width: '820px' });
    cal.innerHTML = `<div class="topo">DEZEMBRO</div><div class="g">${Array.from({ length: 31 }, (_, i) => `<i>${i + 1}</i>`).join('')}</div>`;
    tl.fromTo(cal, { scale: 1.3, rotate: -7 }, { scale: 1, rotate: -2, duration: 0.55, ease: 'expo.out' }, 0);
    L.cue(0.02, 'impact');
    const notas = [['bolo 2 kg', 16, '#ffe27a'], ['torta', 19, '#ffb3c7'], ['50 docinhos', 20, '#b8f2d0'], ['bolo ninho', 22, '#ffe27a'], ['rabanada', 23, '#bfe0ff'], ['3 tortas', 24, '#ffb3c7'], ['bolo 3 kg', 23, '#b8f2d0'], ['pavê', 24, '#ffe27a'], ['+ 2 bolos', 21, '#bfe0ff'], ['???', 24, '#ff8c8c']];
    notas.forEach(([txt, dia, cor], i) => {
      const col = (dia - 1) % 7, lin = Math.floor((dia - 1) / 7);
      const r = L.rng(40 + i);
      const n = $('div', 'bil', cal, { left: px(22 + col * 111 + (r() - 0.5) * 44 - 8), top: px(122 + 22 + lin * 98 + (r() - 0.5) * 40 - 10), background: cor });
      n.textContent = txt;
      IG.hid(n);
      const t = W(0, 'encomendas') - 0.1 + i * 0.36;
      tl.fromTo(n, { autoAlpha: 0, scale: 2.2, rotate: (r() - 0.5) * 60 }, { autoAlpha: 1, scale: 1, rotate: (r() - 0.5) * 22, duration: 0.22, ease: 'power3.in', immediateRender: false }, t);
      L.cue(t + 0.2, 'pop', { n: i });
    });
    IG.shake(W(0, 'comecar') - 0.1, 0.4);
    IG.texto(a, b, [[0.05, 'encomendas', { fontSize: '100px' }], [W(0, 'natal') - 0.25, '<i>de Natal</i>', { fontSize: '150px', color: GOLD }]], { parent: s, top: 250, lh: '0.95', k: 0.05 });
    IG.texto(a, b, [[W(0, 'onde') - 0.05, 'onde você vai anotar?', { fontSize: '96px', fontFamily: "'Caveat', cursive", color: CREAM }]], { parent: s, top: 1250, empurra: false });
    IG.anotar(s, W(0, 'anotar'), { tipo: 'sublinhado', x: 190, y: 1362, w: 700 }, { color: GOLD, largura: 9 });
    IG.ilustra(0.3, b - 0.05);
  }
  // 2 · o cliente escolhe, marca dia e hora
  const a2 = T(1) - 0.1, m2 = W(1, 'cai') - 0.12;
  IG.texto(a2, m2, [[a2 + 0.05, 'o cliente marca', { fontSize: '84px' }], [W(1, 'dia') - 0.05, '<i>o dia e a hora</i>', { fontSize: '104px', color: GOLD }]], { top: 250, lh: '1', empurra: false });
  IG.celular(a2, m2, [[a2, 'product-2'], [W(1, 'marca') - 0.3, 'checkout-1']], { y: 70, k: 0.95, toques: [[W(1, 'escolhe') - 0.05, 180, 645], [W(1, 'marca') - 0.05, 295, 453], [W(1, 'dia') + 0.1, 100, 538], [W(1, 'hora') + 0.05, 285, 538]] });
  // 3 · cai tudo na agenda, e ela mostra o que produzir
  {
    const a = m2, b = T(3) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'cai na sua agenda', { fontSize: '92px', color: GOLD }]], { parent: s, top: 300, empurra: false });
    const c = IG.colunas(s, a + 0.05, 'd-encomendas', [[285, 560], [730, 830]], 150, 330, { w: 900, top: 520, cue: 'ding', de: { autoAlpha: 0, y: -360, rotate: -4 } });
    const [x0, y0] = c.at(290, 203);
    IG.anotar(s, W(2, 'produzir') - 0.1, { tipo: 'circulo', x: x0, y: y0, w: c.w - 40, h: 50 * c.k }, { color: '#c8102e', largura: 9 });
    const nota = $('div', null, s, { position: 'absolute', left: '0', width: '1080px', top: '1330px', textAlign: 'center', font: "700 72px 'Caveat', cursive", color: CREAM });
    nota.textContent = 'o que produzir em cada dia';
    IG.hid(nota);
    tl.fromTo(nota, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, W(2, 'produzir') + 0.25);
    [262, 335, 408].forEach((y, i) => {
      const [fx, fy] = c.at(285, y);
      const f = $('div', null, s, { position: 'absolute', left: px(fx), top: px(fy), width: '14px', height: px(66 * c.k), background: GOLD, borderRadius: '7px', transformOrigin: '50% 0' });
      IG.hid(f);
      const t = a + 0.9 + i * 0.4;
      tl.fromTo(f, { autoAlpha: 0, scaleY: 0 }, { autoAlpha: 1, scaleY: 1, duration: 0.3, ease: 'power3.out', immediateRender: false }, t);
      L.cue(t, 'tick');
    });
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.5, b, 0.05]] });
  }
  IG.cta(T(3) - 0.1, {
    linhas: [[W(3, 'organiza') - 0.05, 'organiza isso', { fontSize: '110px' }], [W(3, 'antes') - 0.05, '<i>antes de dezembro.</i>', { fontSize: '104px', color: GOLD }]],
    top: 470, botao: [W(3, 'fala') - 0.1, 'Fala com a gente'], botaoTop: 1010, botaoCor: GOLD, botaoTexto: '#5a0f1b', toque: W(3, 'gente') + 0.3, prova: true,
  });
  IG.fim({ hideIn: [[T(3) - 0.12, D + 1]], top: 1500 });
})();
