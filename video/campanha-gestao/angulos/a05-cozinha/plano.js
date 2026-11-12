// A05 · Equipe na cozinha. Público: quem tem ajudante ou equipe.
// Gancho: balões de "o que eu faço agora?" enchendo a tela (quebra de padrão) num azulejo de cozinha (ambiente familiar).
(() => {
  const YEL = '#ffd166', TEAL = '#0f4c5c', GREEN = '#06a77d';
  const { T, W, D } = IG.init({
    bg: TEAL, fg: '#fff', accent: YEL, marker: YEL, font: "'Rubik', sans-serif", fontText: "'Rubik', sans-serif", grain: 0.05, vignette: 0.45,
    mov: 'soco', capCls: 'a05', capUpper: false, weight: '900',
    fundo: (bg) => { L.$('div', 'full', bg, { backgroundImage: 'linear-gradient(rgba(255,255,255,.07) 4px, transparent 4px), linear-gradient(90deg, rgba(255,255,255,.07) 4px, transparent 4px)', backgroundSize: '135px 135px' }); },
  });
  const { tl, $, px } = L;
  // 1 · "o que eu faço agora?" o dia inteiro
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    const b0 = $('div', null, s, { position: 'absolute', left: '90px', top: '520px', width: '900px', padding: '44px 50px', background: '#fff', color: '#111', borderRadius: '60px', font: "900 104px/1.02 'Rubik', sans-serif", boxShadow: '0 30px 60px -22px rgba(0,0,0,.55)', textAlign: 'center' });
    b0.innerHTML = '“o que eu faço agora?”';
    $('div', null, b0, { position: 'absolute', left: '110px', bottom: '-30px', width: '70px', height: '70px', background: '#fff', transform: 'rotate(45deg)', borderRadius: '10px', zIndex: -1 });
    tl.fromTo(b0, { scale: 1.3, rotate: -6 }, { scale: 1, rotate: -2, duration: 0.5, ease: 'back.out(2)' }, 0);
    L.cue(0.02, 'pop');
    const sel = $('div', null, s, { position: 'absolute', left: '0', top: '300px', width: '1080px', textAlign: 'center' });
    sel.innerHTML = `<span style="display:inline-block;padding:18px 40px;background:${YEL};color:${TEAL};font:900 56px/1 'Rubik',sans-serif;border-radius:999px;transform:rotate(-2deg)">TEM DOCERIA?</span>`;
    tl.fromTo(sel, { scale: 1.4 }, { scale: 1, duration: 0.35, ease: 'expo.out' }, 0);
    [['e agora?', W(0, 'ouve') - 0.1, 560, 880, 5, 64], ['qual é o próximo?', W(0, 'o') - 0.05, 90, 1010, -4, 58], ['já pode embalar?', W(0, 'faco') - 0.05, 420, 1130, 3, 58], ['faço o de ninho?', W(0, 'agora') - 0.05, 110, 1250, -3, 56], ['e agora??', W(0, 'agora') + 0.45, 640, 1290, 6, 62]].forEach(([txt, t, x, y, r, sz], i) => {
      IG.fala(s, t, txt, { x, y, rot: r, size: sz, w: 700, lado: i % 2 ? 'dir' : 'esq', n: i });
    });
    IG.shake(W(0, 'agora') + 0.45, 0.45);
    IG.texto(a, b, [[W(0, 'dia') - 0.08, 'O DIA INTEIRO?', { fontSize: '118px', color: YEL, textShadow: '0 8px 0 #0a2f39' }]], { parent: s, top: 392, empurra: false });
    tl.to(sel, { autoAlpha: 0, duration: 0.15 }, W(0, 'dia') - 0.15);
    IG.ilustra(0.3, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[0.6, b, 0.05]] });
  }
  // 2 · coloca uma tela na cozinha
  {
    const a = T(1) - 0.1, b = T(2) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[W(1, 'coloca') - 0.05, 'uma tela', { fontSize: '130px', color: YEL }], [W(1, 'na') - 0.1, 'na cozinha', { fontSize: '130px' }]], { parent: s, top: 300, lh: '0.98', empurra: false });
    const k = 1.18;
    const tab = $('div', 'tab5', s, { left: px(540 - (760 * k + 60) / 2), top: '650px', width: px(760 * k + 60), height: px(372 * k + 60) });
    const tela = $('div', 'tela', tab);
    L.crop(tela, L.P('d-cozinha'), 280, 205, 760, 372, { k });
    IG.hid(tab);
    tl.fromTo(tab, { autoAlpha: 0, y: 500, rotateX: 40, scale: 0.9 }, { autoAlpha: 1, y: 0, rotateX: 4, scale: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, a + 0.05);
    tl.to(tab, { rotateX: 0, rotateY: -5, duration: b - a - 0.6, ease: 'sine.inOut' }, a + 0.65);
    L.cue(a + 0.05, 'whoosh');
    IG.real(a + 0.2, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.5, b, 0.07]] });
  }
  // 3 · total pra produzir, cada pedido na ordem; ficou pronto, é só tocar
  {
    const a = T(2) - 0.1, b = T(3) - 0.1;
    const s = L.scene(a, b, IG.world());
    const m1 = W(2, 'cada') - 0.15, m2 = W(2, 'ficou') - 0.15;
    IG.texto(a, m1, [[a + 0.05, 'o total pra produzir', { fontSize: '68px', color: YEL }]], { parent: s, top: 300, empurra: false });
    IG.texto(m1, m2, [[m1 + 0.02, 'cada pedido, na ordem', { fontSize: '66px', color: YEL }]], { parent: s, top: 300, empurra: false });
    IG.texto(m2, b, [[m2 + 0.02, 'ficou pronto? é só tocar', { fontSize: '58px', color: YEL }]], { parent: s, top: 300, empurra: false });
    const kt = 1.15, lt = 540 - (820 * kt) / 2;
    IG.peca(s, a + 0.08, 'd-cozinha', { x: 280, y: 208, w: 820, h: 104 }, { k: kt, top: 450, radius: 20 });
    IG.anotar(s, W(2, 'total') - 0.05, { tipo: 'sublinhado', x: lt + 14 * kt, y: 450 + 30 * kt, w: 122 * kt }, { color: YEL, largura: 8, dur: 0.3 });
    const kc = 2.1;
    const cards = [[280, '1'], [664, '2'], [1047, '3']].map(([x, n], i) => {
      const t = m1 + i * 0.42;
      const left = 100 + i * 46, top = 640 + i * 44;
      const el = IG.peca(s, t, 'd-cozinha', { x, y: 333, w: 370, h: 240 }, { k: kc, left, top, radius: 26, cue: 'flip', de: { autoAlpha: 0, x: 700, rotate: 8 } });
      const o = $('div', 'ord', s, { left: px(left - 30), top: px(top - 34) });
      o.textContent = n;
      IG.hid(o);
      tl.fromTo(o, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.6)', immediateRender: false }, t + 0.25);
      return { el, left, top };
    });
    const c3 = cards[2];
    const bx = c3.left + (1230 - 1047) * kc, by = c3.top + (532 - 333) * kc;
    L.tap(s, bx, by, W(2, 'tocar') - 0.05);
    IG.carimbo(s, W(2, 'tocar') + 0.2, 'PRONTO', { x: c3.left + 150, y: c3.top + 150, size: 120, rot: -9, cor: GREEN, bg: 'rgba(255,255,255,.92)', font: "900 120px/1 'Rubik', sans-serif", cue: 'success' });
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.04]] });
  }
  IG.cta(T(3) - 0.1, {
    linhas: [[W(3, 'resposta') - 0.3, 'a resposta fica', { fontSize: '104px' }], [W(3, 'tela') - 0.2, 'NA TELA,', { fontSize: '160px', color: YEL }], [W(3, 'nao') - 0.05, 'não em você.', { fontSize: '104px' }]],
    top: 400, botao: [W(3, 'fala') - 0.1, 'Fala com a gente'], botaoTop: 1010, botaoCor: YEL, botaoTexto: TEAL, toque: W(3, 'gente') + 0.3, prova: true,
  });
  IG.fim({ hideIn: [[T(3) - 0.12, D + 1]], top: 1500 });
})();
