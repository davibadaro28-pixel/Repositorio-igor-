// A09 · Produção no achismo. Público: quem produz para vitrine.
// Gancho: tela dividida, "hoje SOBROU" em cima e "ontem FALTOU" embaixo (formato validado + quebra de padrão).
(() => {
  const RED = '#e2452f', INK = '#2a1a12', GREEN = '#1f8a5b';
  const { T, W, D } = IG.init({
    bg: '#fffbe9', fg: INK, accent: RED, marker: RED, danger: RED, font: "'Bricolage Grotesque', sans-serif", fontText: "'Inter Tight', sans-serif", grain: 0.05, vignette: 0.18,
    mov: 'soco', capCls: 'a09', capUpper: false, upper: false, weight: '800', tagBg: 'rgba(42,26,18,.85)',
  });
  const { tl, $, px } = L;
  const REL = [1440, 6427];
  // 1 · sobrou hoje? e ontem faltou? quem produz no achismo vive assim
  {
    const a = 0, b = T(2) - 0.1;
    const s = L.scene(a, b);
    const cima = $('div', null, s, { position: 'absolute', left: '0', top: '0', width: '1080px', height: '960px', overflow: 'hidden' });
    const im = L.img(cima, L.F('bolo-de-cenoura-com-calda'), 1080, 960, { objectFit: 'cover' });
    tl.fromTo(im, { scale: 1.25 }, { scale: 1.02, duration: b - a, ease: 'none' }, 0);
    $('div', 'full', cima, { background: 'linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,0) 45%)' });
    const baixo = $('div', null, s, { position: 'absolute', left: '0', top: '960px', width: '1080px', height: '960px', background: 'radial-gradient(80% 60% at 50% 40%, #4a2f20, #24150d)' });
    const prato = $('div', 'prato', s);
    const r = L.rng(9);
    for (let i = 0; i < 9; i++) $('div', 'mig', prato, { left: px(150 + r() * 300), top: px(70 + r() * 90), transform: `rotate(${r() * 90}deg)` });
    L.onFrame((t) => { prato.style.transform = `translateY(${Math.sin(t * 1.6) * 8}px) rotate(${Math.sin(t * 1.1) * 1.5}deg)`; });
    $('div', null, s, { position: 'absolute', left: '0', top: '953px', width: '1080px', height: '14px', background: RED });
    const h1 = $('div', 'eti', s, { left: '60px', top: '270px' }); h1.textContent = 'HOJE';
    const h2 = $('div', 'eti', s, { left: '60px', top: '1010px' }); h2.textContent = 'ONTEM';
    const c1 = $('div', null, s, { position: 'absolute', left: '230px', top: '520px', padding: '10px 40px', border: `12px solid ${RED}`, borderRadius: '20px', color: RED, background: 'rgba(255,251,233,.92)', font: "800 150px/1 'Bricolage Grotesque', sans-serif" });
    c1.textContent = 'SOBROU';
    tl.fromTo(c1, { scale: 1.6, rotate: -18 }, { scale: 1, rotate: -9, duration: 0.3, ease: 'power4.in' }, 0);
    L.cue(0.3, 'stamp');
    IG.shake(0.3, 0.25);
    IG.carimbo(s, W(0, 'ontem') - 0.05, 'FALTOU', { x: 250, y: 1230, size: 150, rot: 7, cor: '#ffd9a8', bg: 'rgba(36,21,13,.85)', font: "800 150px/1 'Bricolage Grotesque', sans-serif" });
    const faixa = $('div', null, s, { position: 'absolute', left: '0', top: '850px', width: '1080px', textAlign: 'center' });
    faixa.innerHTML = `<span style="display:inline-block;padding:24px 44px;background:#fff;color:${INK};font:800 76px/1 'Bricolage Grotesque',sans-serif;border-radius:24px;box-shadow:0 26px 50px -18px rgba(0,0,0,.6);transform:rotate(-2deg)">produzir no <span style="color:${RED}">achismo</span></span>`;
    IG.hid(faixa);
    tl.fromTo(faixa, { autoAlpha: 0, scale: 1.7 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power4.out', immediateRender: false }, W(1, 'produz') - 0.1);
    L.cue(W(1, 'produz') - 0.1, 'hit');
    tl.to(c1, { rotate: -4, scale: 1.08, duration: 0.2, yoyo: true, repeat: 3, ease: 'sine.inOut' }, W(1, 'vive') - 0.1);
    IG.shake(W(1, 'vive') - 0.05, 0.4);
    L.cue(W(1, 'vive') - 0.05, 'impact');
    IG.ilustra(0.3, b - 0.05);
  }
  // 2 · os mais vendidos da semana
  const m3 = W(2, 'e') - 0.2;
  {
    const a = T(2) - 0.1, b = m3;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'os mais vendidos', { fontSize: '88px' }], [W(2, 'semana') - 0.3, 'da semana', { fontSize: '110px', color: RED }]], { parent: s, top: 260, lh: '0.98', empurra: false });
    const k = 1.9, left = 540 - (368 * k) / 2;
    IG.peca(s, a + 0.08, 'd-inicio-full', { x: 1048, y: 290, w: 368, h: 386 }, { k, base: [1440, 1197], top: 500, radius: 24, cue: 'ding' });
    IG.anotar(s, W(2, 'vendidos') - 0.05, { tipo: 'circulo', x: left + 12 * k, y: 500 + (334 - 290) * k, w: 344 * k, h: 40 * k }, { color: RED, largura: 8 });
    [1, 2, 3, 4].forEach((i) => { const f = $('div', null, s, { position: 'absolute', left: px(left - 22), top: px(500 + (334 + i * 42 - 290) * k), width: '12px', height: px(34 * k), background: GREEN, borderRadius: '6px', transformOrigin: '50% 0' }); IG.hid(f); const t = W(2, 'vendidos') + 0.25 + i * 0.25; tl.fromTo(f, { autoAlpha: 0, scaleY: 0 }, { autoAlpha: 1, scaleY: 1, duration: 0.25, immediateRender: false }, t); L.cue(t, 'tick'); });
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
  }
  // 3 · quanto saiu de cada categoria
  {
    const a = m3, b = T(3) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'quanto saiu de', { fontSize: '84px' }], [W(2, 'cada') - 0.1, 'cada categoria', { fontSize: '100px', color: RED }]], { parent: s, top: 260, lh: '0.98', empurra: false });
    const k = 2.2, left = 540 - (368 * k) / 2;
    IG.peca(s, a + 0.08, 'd-relatorios-full', { x: 280, y: 1398, w: 368, h: 347 }, { k, base: REL, top: 500, radius: 24, cue: 'ding', de: { autoAlpha: 0, x: 500, rotate: 5 } });
    const varre = $('div', null, s, { position: 'absolute', left: px(left - 6), top: '584px', width: px(368 * k + 12), height: px(40 * k), border: `6px solid ${RED}`, borderRadius: '16px' });
    IG.hid(varre);
    tl.fromTo(varre, { autoAlpha: 1, y: 0 }, { autoAlpha: 1, y: 42 * k * 5, duration: b - a - 0.9, ease: 'steps(5)', immediateRender: false }, a + 0.6);
    for (let i = 0; i < 5; i++) L.cue(a + 0.6 + ((b - a - 0.9) / 5) * (i + 1), 'tick');
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
  }
  IG.cta(T(3) - 0.1, {
    linhas: [[W(3, 'produz') - 0.3, 'produz o que', { fontSize: '120px' }], [W(3, 'realmente') - 0.1, 'realmente sai.', { fontSize: '120px', color: RED }]],
    top: 460, botao: [W(3, 'fala') - 0.1, 'Fala com a gente'], botaoTop: 1010, botaoCor: RED, botaoTexto: '#fff', toque: W(3, 'gente') + 0.3, prova: true, cor: INK,
    provaBorda: 'rgba(42,26,18,.2)', provaBg: 'rgba(255,255,255,.8)',
  });
  IG.fim({ hideIn: [[T(3) - 0.12, D + 1]], top: 1500 });
})();
