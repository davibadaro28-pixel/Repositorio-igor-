// R08 · Lista educativa: três erros que comem o lucro, um capítulo por erro, e a solução no fim.
(() => {
  const RED = '#e63b2e', INK = '#141414', PAPEL = '#f4efe6';
  const { T, W, D } = IG.init({
    bg: PAPEL, fg: INK, accent: RED, marker: RED, font: "'Fraunces', serif", fontText: "'Inter Tight', sans-serif", grain: 0.05, vignette: 0.18,
    mov: 'sobe', capCls: 'r08', capUpper: false, trilho: 'rgba(20,20,20,.12)', nota: '#5a5348', tagBg: 'rgba(20,20,20,.82)', weight: '900',
    fundo: (bg) => { L.$('div', 'full', bg, { background: 'radial-gradient(80% 60% at 50% 40%, #faf6ee, #ece4d6)' }); },
  });
  const { tl, $, px } = L;
  // abertura: o 3 gigante
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    IG.texto(a, b, [[W(0, 'tres') - 0.05, '3', { fontSize: '560px', color: RED, lineHeight: '0.85' }], [W(0, 'erros') - 0.05, 'erros que comem', { fontSize: '96px' }], [W(0, 'lucro') - 0.05, '<i>o seu lucro</i>', { fontSize: '120px', color: RED }]], { parent: s, top: 300, upper: false, k: 0.06 });
    ['1', '2', '3'].forEach((n, i) => {
      const d = $('div', null, s, { position: 'absolute', left: px(255 + i * 210), top: '1120px', width: '150px', height: '150px', borderRadius: '50%', background: RED, display: 'grid', placeItems: 'center', font: "900 80px 'Fraunces', serif", color: PAPEL, boxShadow: '0 16px 30px -12px rgba(230,59,46,.6)' });
      d.textContent = n;
      IG.hid(d);
      const t = W(0, 'terceiro') + 0.1 + i * 0.4;
      tl.fromTo(d, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, t);
      L.cue(t, 'pop', { n: i });
    });
    IG.texto(a, b, [[W(0, 'fica') - 0.05, 'fica até o terceiro →', { fontSize: '44px', fontFamily: "'Inter Tight', sans-serif", fontWeight: '800', color: '#5a5348' }]], { parent: s, top: 1300, upper: false, empurra: false });
  }
  IG.progresso(T(1) - 0.1, T(4) - 0.1, [[T(1), 1 / 3], [T(2), 2 / 3], [T(3), 1]]);
  const cap = (a, b, n, titulo) => {
    const s = L.scene(a, b, IG.world());
    IG.capitulo(s, a + 0.05, n, 3, titulo, { top: 230 });
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.3, b, 0.04]] });
    return s;
  };
  // 1 · preço no chute
  {
    const a = T(1) - 0.1, b = T(2) - 0.1;
    const s = cap(a, b, '1', 'preço no chute');
    IG.anotar(s, W(1, 'chute') - 0.05, { tipo: 'sublinhado', x: 250, y: 606, w: 580 }, { color: RED, largura: 10 });
    const dado = $('div', null, s, { position: 'absolute', left: '0', top: '700px', width: '1080px', textAlign: 'center', font: "italic 700 96px 'Fraunces', serif", color: INK });
    dado.innerHTML = 'R$ 90? R$ 120?<br><span style="color:#e63b2e">R$ 150?</span>';
    IG.hid(dado);
    tl.fromTo(dado, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, W(1, 'chute') + 0.15);
    tl.to(dado, { autoAlpha: 0, duration: 0.15 }, W(1, 'sem') - 0.2);
    L.cue(W(1, 'chute') + 0.15, 'tick');
    const c = IG.colunas(s, W(1, 'sem') - 0.1, 'd-estoque-cmv-ficha', [[284, 640], [840, 1290]], 205, 315, { w: 960, top: 760 });
    const [, y1] = c.at(300, 360);
    const f = $('div', 'faixa-red', s, { left: px(c.left), top: px(y1), width: px(c.w), height: px(170 * c.k) });
    IG.hid(f);
    tl.fromTo(f, { autoAlpha: 0, scaleX: 0, transformOrigin: '0 50%' }, { autoAlpha: 1, scaleX: 1, duration: 0.5, ease: 'power3.out', immediateRender: false }, W(1, 'vende') - 0.05);
    const [vx, vy] = c.at(1072, 360);
    IG.anotar(s, W(1, 'margem') - 0.2, { tipo: 'circulo', x: vx, y: vy, w: 58 * c.k, h: 160 * c.k }, { color: RED, largura: 9 });
    IG.carimbo(s, W(1, 'margem') + 0.35, 'margem baixa', { x: 190, y: 1180, size: 96, rot: -6, cor: RED, bg: 'rgba(244,239,230,.85)' });
    IG.real(W(1, 'sem') - 0.1, b - 0.05);
  }
  // 2 · estoque de cabeça
  {
    const a = T(2) - 0.1, b = T(3) - 0.1;
    const s = cap(a, b, '2', 'estoque de cabeça');
    const bal = $('div', null, s, { position: 'absolute', left: '140px', top: '720px', width: '800px', padding: '40px 50px', borderRadius: '60px', background: '#fff', boxShadow: '0 30px 60px -24px rgba(0,0,0,.35)', textAlign: 'center', font: "italic 700 84px/1.1 'Fraunces', serif", color: INK });
    bal.innerHTML = '“acho que<br>ainda tem…”';
    IG.hid(bal);
    tl.fromTo(bal, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)', immediateRender: false }, W(2, 'cabeca') - 0.05);
    tl.to(bal, { autoAlpha: 0, scale: 0.9, duration: 0.15 }, W(2, 'descobre') - 0.15);
    L.cue(W(2, 'cabeca') - 0.05, 'pop');
    IG.ilustra(W(2, 'cabeca') - 0.05, W(2, 'descobre') - 0.15);
    IG.peca(s, W(2, 'descobre') - 0.1, 'd-estoque-baixo', { x: 820, y: 239, w: 156, h: 25 }, { k: 4.4, top: 760, radius: 60 });
    IG.peca(s, W(2, 'acabou') - 0.05, 'd-inicio-full', { x: 1048, y: 700, w: 368, h: 122 }, { k: 2.5, base: [1440, 1197], top: 940, radius: 22, cue: 'alert' });
    IG.anotar(s, W(2, 'hora') - 0.05, { tipo: 'circulo', x: 540 - 184 * 2.5 + 12 * 2.5, y: 940 + (770 - 700) * 2.5, w: 345 * 2.5, h: 22 * 2.5 }, { color: RED, largura: 9 });
    const av = $('div', null, s, { position: 'absolute', left: '0', top: '1300px', width: '1080px', textAlign: 'center', font: "italic 700 64px 'Fraunces', serif", color: RED });
    av.textContent = 'o sistema avisa antes';
    IG.hid(av);
    tl.fromTo(av, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, W(2, 'precisa') + 0.35);
    L.cue(W(2, 'precisa') + 0.35, 'tick');
    IG.real(W(2, 'descobre') - 0.1, b - 0.05);
  }
  // 3 · comissão no cliente que já é seu
  {
    const a = T(3) - 0.1, b = T(4) - 0.1;
    const s = cap(a, b, '3', 'comissão no seu cliente');
    IG.anotar(s, W(3, 'terceiro') + 0.35, { tipo: 'sublinhado', x: 140, y: 606, w: 800 }, { color: RED, largura: 10 });
    const nt = IG.notificacao(s, W(3, 'terceiro') + 0.25, 'Novo pedido no app de delivery', 'de um cliente que já é seu', { y: 760, icone: '#8a8f98', letra: '!' });
    tl.to(nt, { autoAlpha: 0, y: -60, duration: 0.2 }, W(3, 'cardapio') - 0.35);
    IG.anotar(s, W(3, 'seu') - 0.1, { tipo: 'circulo', x: 90, y: 760, w: 900, h: 150 }, { color: RED, largura: 9 });
    IG.ilustra(W(3, 'terceiro') + 0.25, W(3, 'cardapio') - 0.35);
    IG.celular(W(3, 'cardapio') - 0.25, b, [[W(3, 'cardapio') - 0.25, 'menu-top']], { parent: s, x: 0, y: 330, k: 0.72, real: false });
    IG.peca(s, W(3, 'direto') - 0.05, 'd-pedidos-novo', { x: 560, y: 843, w: 320, h: 42 }, { k: 2.4, top: 1310, radius: 40, cue: 'ding', de: { autoAlpha: 0, y: 60, scale: 0.6 } });
    IG.real(W(3, 'cardapio') - 0.25, b - 0.05);
  }
  // o sistema resolve os três
  {
    const a = T(4) - 0.1, b = T(5) - 0.1;
    const s = L.scene(a, b);
    IG.texto(a, b, [[W(4, 'resolve') - 0.05, 'o sistema resolve', { fontSize: '92px' }], [W(4, 'tres') - 0.05, 'os três.', { fontSize: '150px', color: RED }]], { parent: s, top: 330, upper: false, k: 0.05 });
    [['preço com ficha técnica', 0], ['alerta de estoque mínimo', 1], ['cardápio direto, com a sua marca', 2]].forEach(([txt, i]) => {
      const t = W(4, 'tres') + 0.1 + i * 0.28;
      const y = 820 + i * 150;
      const l = $('div', null, s, { position: 'absolute', left: '210px', top: px(y), font: "700 50px 'Inter Tight', sans-serif", color: INK });
      l.textContent = txt;
      IG.hid(l);
      tl.fromTo(l, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.3, immediateRender: false }, t);
      IG.anotar(s, t, { tipo: 'check', x: 100, y: y + 30, s: 0.9 }, { color: RED, largura: 12, dur: 0.25 });
    });
  }
  IG.prova(T(5) - 0.1, T(6) - 0.05, { prova: { kickColor: INK, lblColor: INK, noteColor: '#5a5348' } });
  IG.cta(T(6) - 0.05, {
    linhas: [[T(6) - 0.05, 'pare de perder', { fontSize: '104px' }], [W(6, 'gente') - 0.1, '<i>lucro.</i>', { fontSize: '170px', color: RED }]],
    top: 500, botao: [W(6, 'fala') + 0.1, 'Fala com a gente'], botaoCor: INK, botaoTexto: PAPEL, toque: W(6, 'gente') + 0.5, mov: 'sobe', cor: INK,
  });
  IG.fim({ hideIn: [[T(5) - 0.12, D + 1]] });
})();
