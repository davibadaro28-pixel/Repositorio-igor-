// R07 · Tutorial rápido: como o cliente encomenda sozinho, em três toques, no cardápio real.
(() => {
  const WINE = '#b0306a', INK = '#2b1020';
  const { T, W, D } = IG.init({
    bg: '#fdeef3', fg: INK, accent: WINE, font: "'Poppins', sans-serif", fontText: "'Poppins', sans-serif", grain: 0.03, vignette: 0.12,
    mov: 'sobe', capCls: 'r07', capUpper: false, nota: '#6b4a58', tagBg: 'rgba(43,16,32,.78)',
    fundo: (bg) => {
      L.$('div', 'full', bg, { background: 'radial-gradient(60% 40% at 80% 20%, #ffd9e6, transparent 70%), radial-gradient(50% 40% at 10% 90%, #ffe7d6, transparent 70%)' });
    },
  });
  const { tl, $ } = L;
  // abertura: a pergunta de sempre no WhatsApp
  IG.mensagens(0.1, W(0, 'olha') - 0.05, [[W(0, 'oi') - 0.1, 'oi, tem pra sábado?', 'in'], [W(0, 'sabado') + 0.35, 'e de que sabor?', 'in'], [W(0, 'sabado') + 0.7, 'oi??', 'in']], { top: 520 });
  IG.texto(W(0, 'olha') - 0.05, T(1) - 0.05, [[W(0, 'olha') - 0.05, 'olha como fica:', { fontSize: '96px' }]], { top: 290, upper: false, weight: '900', empurra: false });
  // celular com o cardápio real: escolhe, agenda, envia
  const cel = IG.celular(W(0, 'olha') + 0.1, T(4) - 0.1, [
    [W(0, 'olha') + 0.1, 'menu-premium'],
    [W(1, 'escolhe') + 0.25, 'product-1'],
    [W(1, 'tamanho') + 0.15, 'product-2'],
    [T(2) - 0.05, 'checkout-0'],
    [W(2, 'dia') + 0.25, 'checkout-1'],
    [W(3, 'enviar') + 0.3, 'track'],
  ], {
    x: 230, y: -40, k: 1.06, ry: -8,
    toques: [[W(1, 'escolhe'), 288, 465], [W(1, 'tamanho') - 0.1, 180, 645], [T(2) - 0.35, 255, 759], [W(2, 'dia'), 295, 453], [W(3, 'enviar'), 195, 759]],
  });
  const passo = (a, b, n, titulo, sub) => {
    const p = $('div', 'passo', L.scene(a, b));
    p.innerHTML = `<div class="n">${n}</div><div class="t">${titulo}</div><div class="s">${sub}</div>`;
    IG.hid(p);
    tl.fromTo(p, { autoAlpha: 0, x: -120 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'expo.out', immediateRender: false }, a);
    L.cue(a, 'pop');
  };
  passo(T(1) - 0.1, T(2) - 0.1, '1', 'Escolhe', 'o bolo e o tamanho');
  passo(T(2) - 0.1, T(3) - 0.1, '2', 'Agenda', 'dia e horário da encomenda');
  passo(T(3) - 0.1, T(4) - 0.1, '3', 'Envia', 'e acompanha o pedido');
  L.cue(W(3, 'enviar') + 0.3, 'success');
  // acompanha o pedido: aproxima a linha do tempo e mostra a etiqueta da encomenda
  tl.to(cel.ph.el, { scale: 1.22, x: 160, y: 40, duration: 0.9, ease: 'power2.inOut' }, W(3, 'acompanha') + 0.1);
  L.cue(W(3, 'acompanha') + 0.1, 'zoom');
  {
    const s3 = L.scene(W(3, 'pedido') - 0.1, T(4) - 0.1);
    const chip = $('div', null, s3, { position: 'absolute', left: '60px', top: '1220px', padding: '22px 34px', borderRadius: '28px', background: '#fff', boxShadow: '0 24px 50px -20px rgba(90,20,50,.45)', font: "800 44px 'Poppins', sans-serif", color: INK });
    chip.innerHTML = '<span style="color:#b0306a">✓</span> Encomenda para 10/11, 15:00';
    IG.hid(chip);
    tl.fromTo(chip, { autoAlpha: 0, y: 60, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, W(3, 'pedido') - 0.1);
    L.cue(W(3, 'pedido') - 0.1, 'pop');
  }
  // e o pedido já está no painel
  {
    const a = T(4) - 0.1, b = T(5) - 0.08;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'no seu painel', { fontSize: '100px', color: WINE }]], { parent: s, top: 330, upper: false, weight: '900', empurra: false });
    IG.peca(s, a + 0.1, 'd-pedidos-novo', { x: 280, y: 150, w: 680, h: 450 }, { k: 1.38, top: 560, radius: 24 });
    IG.peca(s, W(4, 'painel') - 0.1, 'd-pedidos-novo', { x: 560, y: 843, w: 320, h: 42 }, { k: 2.6, top: 1230, radius: 40, cue: 'ding', de: { autoAlpha: 0, y: 60, scale: 0.6 } });
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
  }
  IG.prova(T(5) - 0.08, T(6) - 0.05, { prova: { kickColor: INK, lblColor: INK } });
  // o seu, com a sua marca: o mesmo cardápio em quatro temas reais
  IG.celular(T(6) - 0.05, W(6, 'fala') - 0.12, [[T(6) - 0.05, 'theme-1'], [W(6, 'seu') + 0.1, 'theme-2'], [W(6, 'sua') - 0.1, 'theme-3'], [W(6, 'marca') + 0.05, 'theme-4']], { x: 0, y: 40, k: 0.95, deslizar: false });
  IG.texto(T(6) - 0.05, W(6, 'fala') - 0.12, [[W(6, 'sua') - 0.1, 'com a sua marca', { fontSize: '92px', color: WINE }]], { top: 290, upper: false, weight: '900', empurra: false });
  IG.cta(W(6, 'fala') - 0.12, {
    linhas: [[W(6, 'fala') - 0.1, 'fala com', { fontSize: '150px' }], [W(6, 'gente') - 0.1, 'a gente', { fontSize: '150px', color: WINE }]],
    top: 520, botao: [W(6, 'gente') + 0.05, 'Quero o meu cardápio'], botaoCor: WINE, botaoTexto: '#fff', toque: W(6, 'gente') + 0.6, mov: 'sobe', cor: INK,
  });
  IG.fim({ hideIn: [[T(5) - 0.1, T(6) - 0.05], [W(6, 'fala') - 0.15, D + 1]] });
})();
