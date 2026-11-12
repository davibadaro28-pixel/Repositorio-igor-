// A07 · Sair da loja. Público: quem não consegue se afastar da doceria.
// Gancho: a lista de ligações para a própria loja crescendo (quebra de padrão), depois o painel real no celular.
(() => {
  const SUN = '#ffe27a';
  const { T, W, D } = IG.init({
    bg: '#5a189a', fg: '#fff', accent: SUN, font: "'Plus Jakarta Sans', sans-serif", fontText: "'Plus Jakarta Sans', sans-serif", grain: 0.06, vignette: 0.4,
    mov: 'sobe', capCls: 'a07', capUpper: false, upper: false, weight: '800',
    fundo: (bg) => {
      L.$('div', 'full', bg, { background: 'linear-gradient(180deg, #ff9e5e 0%, #f25c8a 38%, #7b2cbf 72%, #3c096c 100%)' });
      const sol = L.$('div', null, bg, { position: 'absolute', left: '290px', top: '420px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, #fff3b0, #ffd166 60%, rgba(255,209,102,0) 72%)', opacity: '0.85' });
      L.onFrame((t) => { sol.style.transform = `translateY(${t * 22}px)`; });
    },
  });
  const { tl, $, px } = L;
  // 1 · sair sem ficar ligando pra saber como tá?
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    IG.texto(a, b, [[0.0, 'sair da doceria', { fontSize: '104px' }], [W(0, 'sem') - 0.08, 'sem ligar toda hora?', { fontSize: '92px', color: SUN }]], { parent: s, top: 270, lh: '1.02', empurra: false });
    const horas = ['10:02', '10:47', '11:30', '12:15', '13:05', '13:50'];
    horas.forEach((h, i) => {
      const r = $('div', 'lig', s, { top: px(560 + i * 138) });
      r.innerHTML = `<i>↗</i><div>Doceria (loja)<small>“e aí, como tá?”</small></div><span>${h}</span>`;
      const t = i < 2 ? 0 : 0.45 + (i - 2) * 0.5;
      if (i < 2) tl.fromTo(r, { x: 60 }, { x: 0, duration: 0.4, ease: 'expo.out' }, 0);
      else { IG.hid(r); tl.fromTo(r, { autoAlpha: 0, y: 60, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.8)', immediateRender: false }, t); L.cue(t, 'vibrate', { n: i }); }
    });
    L.cue(0.02, 'vibrate');
    IG.ilustra(0.3, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[0.4, b, 0.05]] });
  }
  // 2 e 3 · com o painel no celular, dá: vendas, pedidos, estoque
  const a2 = T(1) - 0.1, b2 = T(3) - 0.1;
  IG.celular(a2, b2, [[a2, 'm-inicio'], [W(2, 'pedidos') - 0.15, 'm-pedidos'], [W(2, 'estoque') - 0.15, 'm-estoque'], [W(2, 'tudo') - 0.15, 'm-inicio']], { painel: true, y: 210, k: 1.22, ry: -7, sb: '#7d2949', brilho: W(2, 'tudo') });
  IG.texto(a2, T(2) - 0.1, [[a2 + 0.05, 'com o painel no celular,', { fontSize: '72px' }], [W(1, 'da') - 0.1, 'dá.', { fontSize: '170px', color: SUN, lineHeight: '0.9' }]], { top: 250, empurra: false });
  [['vendas do dia', T(2) - 0.1, W(2, 'pedidos') - 0.15], ['pedidos chegando', W(2, 'pedidos') - 0.15, W(2, 'estoque') - 0.15], ['estoque', W(2, 'estoque') - 0.15, W(2, 'tudo') - 0.15], ['tudo na sua mão', W(2, 'tudo') - 0.15, b2]].forEach(([txt, t0, t1], i) => {
    IG.texto(t0, t1, [[t0 + 0.02, txt, { fontSize: i === 3 ? '100px' : '96px', color: i === 3 ? SUN : '#fff' }]], { top: 300, empurra: false, mov: 'soco', cue: 'tick' });
  });
  IG.cta(T(3) - 0.1, {
    linhas: [[W(3, 'quer') - 0.05, 'quer ver', { fontSize: '130px' }], [W(3, 'no') - 0.05, 'no seu celular?', { fontSize: '110px', color: SUN }]],
    top: 460, botao: [W(3, 'fala') - 0.1, 'Fala com a gente'], botaoTop: 1010, botaoCor: SUN, botaoTexto: '#3c096c', toque: W(3, 'gente') + 0.3, prova: true,
  });
  IG.fim({ hideIn: [[T(3) - 0.12, D + 1]], top: 1430 });
})();
