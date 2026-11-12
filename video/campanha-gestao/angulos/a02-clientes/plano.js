// A02 · Cliente que some. Público: quem depende de cliente que volta.
// Gancho: bolo com vela e confete (quebra de padrão) + curiosidade: "você sabe quem é?"
(() => {
  const PINK = '#ff4f87', INK = '#2b1b3d';
  const { T, W, D } = IG.init({
    bg: '#fff1e0', fg: INK, accent: PINK, marker: PINK, font: "'Baloo 2', sans-serif", fontText: "'Nunito', sans-serif", grain: 0.03, vignette: 0.12,
    mov: 'soco', capCls: 'a02', capUpper: false, upper: false, weight: '800', tagBg: 'rgba(43,27,61,.8)',
    fundo: (bg) => { L.$('div', 'full', bg, { background: 'radial-gradient(70% 45% at 50% 38%, #ffe0ea, #fff1e0 75%)' }); },
  });
  const { tl, $, px } = L;
  // 1 · tem cliente fazendo aniversário. você sabe quem é?
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    const bolo = $('div', null, s, { position: 'absolute', left: '250px', top: '640px', width: '580px', height: '580px', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 50px 90px -30px rgba(43,27,61,.5)', border: '14px solid #fff' });
    const im = L.img(bolo, L.F('bolo-premium-ninho-com-morango'), 552, 552, { objectFit: 'cover' });
    tl.fromTo(bolo, { scale: 1.35, rotate: 8 }, { scale: 1, rotate: 0, duration: 0.6, ease: 'expo.out' }, 0);
    tl.fromTo(im, { scale: 1.2 }, { scale: 1.04, duration: 6, ease: 'none' }, 0);
    const vela = $('div', 'vela', s, { left: '529px', top: '560px' });
    const chama = $('div', 'chama', vela);
    L.onFrame((t) => { chama.style.transform = `scale(${1 + 0.12 * Math.sin(t * 17)}, ${1 + 0.16 * Math.sin(t * 23 + 1)}) rotate(${4 * Math.sin(t * 9)}deg)`; });
    IG.confete(s, 0.08, { y: 820, n: 80 });
    IG.confete(s, W(0, 'aniversario') - 0.05, { y: 820, n: 60, seed: 5 });
    IG.texto(a, b, [[0.03, 'tem cliente seu', { fontSize: '96px' }], [W(0, 'aniversario') - 0.08, 'de aniversário', { fontSize: '124px', color: PINK }], [W(0, 'semana') - 0.2, 'essa semana', { fontSize: '96px' }]], { parent: s, top: 250, lh: '0.98', k: 0.04 });
    [[130, 1040], [800, 1010], [470, 1180]].forEach(([x, y], i) => {
      const q = $('div', 'quem', s, { left: px(x), top: px(y) });
      q.textContent = '?';
      IG.hid(q);
      const t = W(0, 'voce') - 0.05 + i * 0.22;
      tl.fromTo(q, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, t);
      tl.to(q, { y: -18, duration: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut' }, t + 0.3);
      L.cue(t, 'pop', { n: i });
    });
    IG.ilustra(0.3, b - 0.05);
  }
  // 2 · o sistema sabe; e mostra quem sumiu
  {
    const a = T(1) - 0.1, b = T(2) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'o sistema sabe', { fontSize: '110px', color: PINK }]], { parent: s, top: 290, empurra: false });
    const k = 2.45, left = 540 - (368 * k) / 2;
    IG.peca(s, a + 0.08, 'd-inicio-full', { x: 664, y: 1022, w: 368, h: 112 }, { k, base: [1440, 1197], top: 500, radius: 26, cue: 'ding' });
    IG.anotar(s, W(1, 'sabe') + 0.25, { tipo: 'circulo', x: left + (935 - 664) * k, y: 500 + (1068 - 1022) * k, w: 86 * k, h: 50 * k }, { color: PINK, largura: 8 });
    const kf = 1.85, lf = 540 - (510 * kf) / 2;
    IG.peca(s, W(1, 'mostra') - 0.1, 'd-clientes', { x: 685, y: 198, w: 510, h: 42 }, { k: kf, top: 900, radius: 20 });
    IG.anotar(s, W(1, 'sumiu') - 0.05, { tipo: 'circulo', x: lf + (838 - 685) * kf, y: 900 + 2, w: 150 * kf, h: 38 * kf }, { color: PINK, largura: 8 });
    const n = $('div', null, s, { position: 'absolute', left: '0', width: '1080px', top: '1040px', textAlign: 'center', font: "800 60px 'Baloo 2', sans-serif", color: INK });
    n.innerHTML = 'sumiu há mais de <span style="color:#ff4f87">30 dias</span>';
    IG.hid(n);
    tl.fromTo(n, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, W(1, '30') - 0.1);
    L.cue(W(1, '30') - 0.1, 'tick');
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
  }
  // 3 · um toque e você chama no WhatsApp
  {
    const a = T(2) - 0.1, b = T(3) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'um toque', { fontSize: '120px', color: PINK }]], { parent: s, top: 290, empurra: false });
    const c = IG.colunas(s, a + 0.08, 'd-clientes', [[284, 520], [1050, 1140], [1270, 1392]], 250, 325, { w: 940, top: 500 });
    const [tx, ty] = c.at(1366, 426);
    L.tap(s, tx, ty, W(2, 'toque') + 0.1, '#25d366');
    IG.anotar(s, W(2, 'chama') - 0.1, { tipo: 'circulo', x: tx - 40, y: ty - 40, w: 80, h: 80 }, { color: '#25d366', largura: 9 });
    const wz = $('div', null, s, { position: 'absolute', left: '170px', top: '1240px', padding: '26px 44px', borderRadius: '999px', background: '#25d366', color: '#fff', font: "800 54px 'Baloo 2', sans-serif", boxShadow: '0 24px 44px -18px rgba(37,211,102,.7)' });
    wz.textContent = 'chama no WhatsApp';
    IG.hid(wz);
    tl.fromTo(wz, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.2)', immediateRender: false }, W(2, 'whatsapp') - 0.15);
    L.cue(W(2, 'whatsapp') - 0.15, 'bubble');
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
  }
  IG.cta(T(3) - 0.1, {
    linhas: [[W(3, 'quer') - 0.05, 'quer cuidar dos', { fontSize: '100px' }], [W(3, 'clientes') - 0.1, 'seus clientes assim?', { fontSize: '100px', color: PINK }]],
    top: 480, botao: [W(3, 'fala') - 0.1, 'Fala com a gente'], botaoTop: 1010, botaoCor: PINK, botaoTexto: '#fff', toque: W(3, 'gente') + 0.3, prova: true, cor: INK,
    provaBorda: 'rgba(43,27,61,.18)', provaBg: 'rgba(255,255,255,.6)',
  });
  IG.fim({ hideIn: [[T(3) - 0.12, D + 1]], top: 1500 });
})();
