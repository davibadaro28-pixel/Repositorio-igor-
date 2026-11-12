// A04 · Contas a pagar. Público: quem cuida do financeiro sozinha.
// Gancho: caixinha de pergunta + boletos sem data (quebra de padrão), com desafio "sem olhar o caderno".
(() => {
  const OR = '#ff8a3d', NAVY = '#0f1b33';
  const { T, W, D } = IG.init({
    bg: NAVY, fg: '#fff', accent: OR, marker: OR, font: "'Sora', sans-serif", fontText: "'Inter Tight', sans-serif", grain: 0.06, vignette: 0.5,
    mov: 'sobe', capCls: 'a04', capUpper: false, upper: false, weight: '800',
    fundo: (bg) => { L.$('div', 'full', bg, { background: 'radial-gradient(80% 55% at 50% 30%, #22366b, #0f1b33 75%)' }); },
  });
  const { tl, $, px } = L;
  // 1 · qual conta vence essa semana? sem olhar o caderno
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    const cx = $('div', 'cx', s);
    cx.innerHTML = '<div class="h">PERGUNTA RÁPIDA</div><div class="q">Qual conta da sua doceria vence essa semana?</div>';
    tl.fromTo(cx, { scale: 1.25, rotate: -4 }, { scale: 1, rotate: -1.5, duration: 0.5, ease: 'expo.out' }, 0);
    L.cue(0.02, 'impact');
    [['Aluguel', -6, 150, 800], ['Fornecedor', 4, 300, 920], ['Gás', -2, 210, 1050]].forEach(([nome, rot, x, y], i) => {
      const bl = $('div', 'bol', s, { left: px(x), top: px(y) });
      bl.innerHTML = `${nome} · vencimento<b>??/11</b><div class="bar"></div>`;
      IG.hid(bl);
      const t = 0.5 + i * 0.42;
      tl.fromTo(bl, { autoAlpha: 0, y: 500, rotate: rot * 4 }, { autoAlpha: 1, y: 0, rotate: rot, duration: 0.45, ease: 'back.out(1.5)', immediateRender: false }, t);
      L.cue(t, 'page', { n: i });
    });
    const sem = $('div', 'tagc', s, { left: '150px', top: '1330px', background: OR, transform: 'rotate(-3deg)' });
    sem.textContent = 'sem olhar o caderno!';
    IG.hid(sem);
    tl.fromTo(sem, { autoAlpha: 0, scale: 1.8 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power4.out', immediateRender: false }, W(0, 'sem') - 0.05);
    L.cue(W(0, 'sem') - 0.05, 'hit');
    IG.shake(W(0, 'sem') - 0.02, 0.3);
    IG.ilustra(0.3, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[1.8, b, 0.05]] });
  }
  // 2 · tudo num lugar só: pendente e vencido
  {
    const a = T(1) - 0.1, b = T(2) - 0.1;
    const s = L.scene(a, b, IG.world());
    const m = W(1, 'no') - 0.15;
    [['aluguel', a + 0.08, 120, 340, -5], ['gás', W(1, 'gas') - 0.05, 620, 330, 4], ['fornecedor', W(1, 'fornecedor') - 0.05, 300, 470, -2]].forEach(([txt, t, x, y, r], i) => {
      const e = $('div', 'tagc', s, { left: px(x), top: px(y), transform: `rotate(${r}deg)` });
      e.textContent = txt;
      IG.hid(e);
      tl.fromTo(e, { autoAlpha: 0, scale: 1.7 }, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'power4.out', immediateRender: false }, t);
      tl.to(e, { autoAlpha: 0, y: 220, scale: 0.6, duration: 0.3, ease: 'power2.in' }, m - 0.05 + i * 0.05);
      L.cue(t, 'hit');
    });
    IG.texto(m + 0.2, b, [[W(1, 'tudo') - 0.2, 'tudo num lugar só', { fontSize: '88px', color: OR }]], { parent: s, top: 300, empurra: false });
    const c = IG.colunas(s, m + 0.1, 'd-fin-contas', [[284, 400], [405, 640], [940, 1050]], 398, 256, { w: 950, top: 500, cue: 'ding' });
    [460, 517, 572, 625].forEach((y, i) => {
      const [fx, fy] = c.at(284, y - 24);
      const f = $('div', null, s, { position: 'absolute', left: px(fx - 4), top: px(fy), width: '12px', height: px(50 * c.k), background: OR, borderRadius: '6px', transformOrigin: '50% 0' });
      IG.hid(f);
      const t = m + 0.65 + i * 0.3;
      tl.fromTo(f, { autoAlpha: 0, scaleY: 0 }, { autoAlpha: 1, scaleY: 1, duration: 0.25, immediateRender: false }, t);
      L.cue(t, 'tick');
    });
    const kk = 1.66, lk = 540 - (562 * kk) / 2;
    IG.peca(s, W(1, 'pendente') - 0.25, 'd-fin-contas', { x: 280, y: 250, w: 562, h: 84 }, { k: kk, top: 1070, radius: 20 });
    IG.anotar(s, W(1, 'pendente'), { tipo: 'sublinhado', x: lk + 16 * kk, y: 1070 + 62 * kk, w: 190 * kk }, { color: OR, largura: 8, dur: 0.3 });
    IG.anotar(s, W(1, 'venceu') - 0.1, { tipo: 'circulo', x: lk + 290 * kk, y: 1070 + 6, w: 258 * kk, h: 70 * kk }, { color: '#ff4d4d', largura: 8 });
    IG.real(m + 0.1, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[m + 0.5, b, 0.05]] });
  }
  // 3 · o fluxo de caixa mostra o saldo de cada dia
  {
    const a = T(2) - 0.1, b = T(3) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'saldo de cada dia', { fontSize: '88px', color: OR }]], { parent: s, top: 300, empurra: false });
    const k = 1.95, left = 540 - (476 * k) / 2;
    IG.peca(s, a + 0.08, 'd-fin-fluxo', { x: 284, y: 392, w: 476, h: 282 }, { k, top: 470, radius: 22 });
    const varre = $('div', null, s, { position: 'absolute', left: px(left + 70), top: '560px', width: '8px', height: '380px', background: OR, borderRadius: '4px', boxShadow: `0 0 24px ${OR}` });
    IG.hid(varre);
    tl.fromTo(varre, { autoAlpha: 1, x: 0 }, { autoAlpha: 1, x: 760, duration: b - a - 0.7, ease: 'sine.inOut', immediateRender: false }, a + 0.5);
    IG.peca(s, W(2, 'saldo') - 0.1, 'd-fin-fluxo', { x: 854, y: 250, w: 275, h: 68 }, { k: 2.3, top: 1060, radius: 22, cue: 'ding' });
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.3, b, 0.05]] });
  }
  IG.cta(T(3) - 0.1, {
    linhas: [[W(3, 'chega') - 0.05, 'chega de susto', { fontSize: '104px' }], [W(3, 'boleto') - 0.25, 'com boleto.', { fontSize: '124px', color: OR }]],
    top: 470, botao: [W(3, 'fala') - 0.1, 'Fala com a gente'], botaoTop: 1010, botaoCor: OR, botaoTexto: NAVY, toque: W(3, 'gente') + 0.3, prova: true,
  });
  IG.fim({ hideIn: [[T(3) - 0.12, D + 1]], top: 1500 });
})();
