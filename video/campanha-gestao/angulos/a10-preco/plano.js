// A10 · Preço sem custo. Público: quem dá preço sem ficha técnica.
// Gancho: a medalha "nº 1 em vendas" vira "último em lucro?" (quebra de padrão + curiosidade com medo).
(() => {
  const GOLD = '#f5c542', RED = '#ff4d4d';
  const { T, W, D } = IG.init({
    bg: '#0b0b0c', fg: '#fff', accent: GOLD, marker: RED, danger: RED, font: "'Bebas Neue', sans-serif", fontText: "'Inter Tight', sans-serif", grain: 0.08, vignette: 0.6,
    mov: 'soco', capCls: 'a10', capUpper: false, weight: '400', ls: '.01em',
    fundo: (bg) => {
      const luz = L.$('div', null, bg, { position: 'absolute', left: '-200px', top: '100px', width: '1480px', height: '1500px', background: 'radial-gradient(45% 40% at 50% 45%, rgba(245,197,66,.22), transparent 70%)' });
      L.onFrame((t) => { luz.style.opacity = String(0.75 + 0.25 * Math.sin(t * 1.3)); });
    },
  });
  const { tl, $, px } = L;
  // 1 · o que mais vende pode ser o que menos dá lucro
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    const foto = $('div', null, s, { position: 'absolute', left: '190px', top: '500px', width: '700px', height: '620px', borderRadius: '36px', overflow: 'hidden', border: `8px solid ${GOLD}`, boxShadow: '0 60px 110px -30px rgba(0,0,0,.9)' });
    const im = L.img(foto, L.F('bolo-de-cenoura-com-calda'), 700, 620, { objectFit: 'cover' });
    tl.fromTo(foto, { scale: 1.2 }, { scale: 1, duration: 0.6, ease: 'expo.out' }, 0);
    tl.fromTo(im, { scale: 1.25 }, { scale: 1.03, duration: b - a, ease: 'none' }, 0);
    tl.to(im, { filter: 'saturate(.25) brightness(.7)', duration: 0.4 }, W(0, 'pode'));
    tl.to(foto, { borderColor: RED, duration: 0.3 }, W(0, 'pode'));
    const m1 = $('div', 'med', s, { left: '680px', top: '410px', background: `radial-gradient(circle at 35% 30%, #fff1b8, ${GOLD} 55%, #b8860b)`, color: '#3a2a00' });
    m1.innerHTML = '<div><b>Nº 1</b>em vendas</div>';
    const m2 = $('div', 'med', s, { left: '680px', top: '410px', background: `radial-gradient(circle at 35% 30%, #ffb3b3, ${RED} 55%, #8f1d1d)`, color: '#fff', fontSize: '58px' });
    m2.innerHTML = '<div>último<br>em lucro<b style="font-size:110px">?</b></div>';
    tl.fromTo(m1, { scale: 1.6, rotate: 20 }, { scale: 1, rotate: 8, duration: 0.45, ease: 'back.out(2)' }, 0);
    L.cue(0.02, 'sparkle');
    tl.set(m2, { autoAlpha: 0, scaleX: 0, rotate: 8 }, 0);
    const tf = W(0, 'pode') - 0.05;
    tl.to(m1, { scaleX: 0, duration: 0.16, ease: 'power2.in' }, tf);
    tl.set(m1, { autoAlpha: 0 }, tf + 0.16);
    tl.fromTo(m2, { autoAlpha: 1, scaleX: 0 }, { autoAlpha: 1, scaleX: 1, duration: 0.2, ease: 'back.out(2.4)', immediateRender: false }, tf + 0.16);
    L.cue(tf, 'flip');
    L.cue(tf + 0.2, 'impact');
    IG.texto(a, b, [[0.0, 'O QUE MAIS VENDE', { fontSize: '150px' }]], { parent: s, top: 270, empurra: false });
    IG.texto(a, b, [[W(0, 'ser') - 0.05, 'PODE SER O QUE', { fontSize: '110px' }], [W(0, 'menos') - 0.05, 'MENOS DÁ LUCRO', { fontSize: '164px', color: RED }]], { parent: s, top: 1150, lh: '0.92', empurra: false });
    IG.shake(W(0, 'menos') - 0.02, 0.4);
    IG.ilustra(0.3, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[0.6, b, 0.05]] });
  }
  // 2 · com a ficha técnica, o sistema calcula o custo
  {
    const a = T(1) - 0.1, b = T(2) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'FICHA TÉCNICA', { fontSize: '150px', color: GOLD }]], { parent: s, top: 270, empurra: false });
    const k = 1.4, left = 540 - (656 * k) / 2;
    IG.peca(s, a + 0.1, 'd-ficha', { x: 392, y: 44, w: 656, h: 476 }, { k, top: 460, radius: 24, cue: 'whoosh' });
    [269, 317, 365, 413, 461].forEach((y, i) => { const f = $('div', null, s, { position: 'absolute', left: px(left + (958 - 392) * k), top: px(460 + (y - 18 - 44) * k), width: px(78 * k), height: px(36 * k), border: `5px solid ${GOLD}`, borderRadius: '10px' }); IG.hid(f); const t = W(1, 'sistema') - 0.2 + i * 0.22; tl.fromTo(f, { autoAlpha: 0, scale: 1.5 }, { autoAlpha: 1, scale: 1, duration: 0.18, immediateRender: false }, t); tl.to(f, { autoAlpha: 0, duration: 0.2 }, t + 0.5); L.cue(t, 'tick'); });
    IG.anotar(s, W(1, 'custo') - 0.15, { tipo: 'circulo', x: left + (676 - 392) * k, y: 460 + (182 - 44) * k, w: 92 * k, h: 44 * k }, { color: RED, largura: 9 });
    IG.real(a + 0.1, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
  }
  // 3 · e pinta de vermelho o que está com a margem apertada
  {
    const a = T(2) - 0.1, b = T(3) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'MARGEM APERTADA', { fontSize: '120px' }], [W(2, 'vermelho') - 0.1, 'FICA EM VERMELHO', { fontSize: '128px', color: RED }]], { parent: s, top: 260, lh: '0.92', empurra: false });
    const c = IG.colunas(s, a + 0.1, 'd-estoque-cmv-ficha', [[284, 640], [840, 1130]], 205, 315, { w: 960, top: 560 });
    const [vx, vy] = c.at(1078, 358);
    IG.anotar(s, W(2, 'vermelho'), { tipo: 'circulo', x: vx, y: vy, w: 48 * c.k, h: 152 * c.k }, { color: RED, largura: 9 });
    [378, 435, 492].forEach((y, i) => { const [ux, uy] = c.at(292, y + 12); IG.anotar(s, W(2, 'margem') - 0.1 + i * 0.22, { tipo: 'sublinhado', x: ux, y: uy, w: 196 * c.k }, { color: GOLD, largura: 7, dur: 0.22 }); });
    IG.real(a + 0.1, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
  }
  IG.cta(T(3) - 0.1, {
    linhas: [[W(3, 'melhor') - 0.05, 'MELHOR DESCOBRIR', { fontSize: '132px' }], [W(3, 'agora') - 0.08, 'AGORA.', { fontSize: '230px', color: GOLD, lineHeight: '0.88' }]],
    top: 440, botao: [W(3, 'fala') - 0.1, 'Fala com a gente'], botaoTop: 1010, botaoCor: GOLD, botaoTexto: '#0b0b0c', toque: W(3, 'gente') + 0.3, prova: true,
  });
  IG.fim({ hideIn: [[T(3) - 0.12, D + 1]], top: 1500 });
})();
