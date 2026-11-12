// A06 · Entrega própria. Público: quem entrega com motoboy próprio.
// Gancho: mapa com três entregas em rota e um "?" em cada uma (quebra de padrão) + qualificação "sua doceria entrega?".
(() => {
  const RED = '#ff4d3d', INK = '#1d2433';
  const { T, W, D } = IG.init({
    bg: '#e8ecf1', fg: INK, accent: RED, marker: RED, font: "'Outfit', sans-serif", fontText: "'Outfit', sans-serif", grain: 0.04, vignette: 0.14,
    mov: 'soco', capCls: 'a06', capUpper: false, weight: '900', tagBg: 'rgba(29,36,51,.85)',
    fundo: (bg) => {
      const m = L.$('div', null, bg, { position: 'absolute', left: '-200px', top: '-200px', width: '1480px', height: '2320px', backgroundColor: '#dfe5ec', backgroundImage: 'linear-gradient(#fff 14px, transparent 14px), linear-gradient(90deg, #fff 14px, transparent 14px), linear-gradient(rgba(255,255,255,.6) 5px, transparent 5px), linear-gradient(90deg, rgba(255,255,255,.6) 5px, transparent 5px)', backgroundSize: '330px 330px, 330px 330px, 110px 110px, 110px 110px', transform: 'rotate(-8deg)' });
      L.drift(m, { amp: 10, scale: 0, pushes: [[0, 21, 0.06]] });
    },
  });
  const { tl, $, px } = L;
  // 1 · quem saiu com qual pedido agora?
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '1080'); svg.setAttribute('height', '1920');
    Object.assign(svg.style, { position: 'absolute', left: '0', top: '0' });
    s.appendChild(svg);
    const rotas = [['M540 1110 C 420 960, 300 940, 200 800', '#304', 90, 716], ['M540 1110 C 700 1030, 800 960, 880 840', '#305', 760, 756], ['M540 1110 C 600 1220, 740 1270, 840 1350', '#310', 640, 1384]];
    rotas.forEach(([d, ped, lx, ly], i) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', RED); p.setAttribute('stroke-width', '10'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-dasharray', '4 26');
      svg.appendChild(p);
      const len = p.getTotalLength();
      const moto = $('div', 'moto', s);
      moto.textContent = '?';
      const t0 = 0.05 + i * 0.25, dur = 3.6;
      L.onFrame((t) => {
        const u = L.ease.inOut(L.clamp((t - t0) / dur));
        const pt = p.getPointAtLength(len * (0.06 + 0.94 * u));
        moto.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
        p.style.strokeDashoffset = String(-t * 60);
      });
      const tag = $('div', 'pino', s, { left: px(lx), top: px(ly) });
      tag.textContent = `pedido ${ped}`;
      IG.hid(tag);
      tl.fromTo(tag, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.2)', immediateRender: false }, W(0, 'quem') - 0.1 + i * 0.3);
      L.cue(W(0, 'quem') - 0.1 + i * 0.3, 'pop', { n: i });
    });
    const loja = $('div', 'pino', s, { left: '440px', top: '1080px', background: '#fff', color: INK, border: `6px solid ${INK}`, fontSize: '40px' });
    loja.textContent = 'sua loja';
    const sel = $('div', null, s, { position: 'absolute', left: '0', top: '270px', width: '1080px', textAlign: 'center' });
    sel.innerHTML = `<span style="display:inline-block;padding:20px 40px;background:${INK};color:#fff;font:900 62px/1 'Outfit',sans-serif;border-radius:22px;transform:rotate(-2deg)">SUA DOCERIA ENTREGA?</span>`;
    tl.fromTo(sel, { scale: 1.4 }, { scale: 1, duration: 0.4, ease: 'expo.out' }, 0);
    L.cue(0.02, 'impact');
    IG.texto(a, b, [[W(0, 'quem') - 0.08, 'QUEM SAIU', { fontSize: '128px' }], [W(0, 'com') - 0.05, 'COM QUAL PEDIDO?', { fontSize: '104px', color: RED }]], { parent: s, top: 392, lh: '0.98', empurra: false, lineStyle: { textShadow: '0 0 30px #e8ecf1, 0 0 30px #e8ecf1' } });
    IG.ilustra(0.3, b - 0.05);
  }
  // 2 · cada bairro tem a sua taxa; o cliente vê o valor na hora de pedir
  {
    const a = T(1) - 0.1, b = T(2) - 0.1;
    IG.texto(a, b, [[a + 0.05, 'cada bairro,', { fontSize: '100px' }], [W(1, 'taxa') - 0.25, 'uma taxa', { fontSize: '120px', color: RED }]], { top: 270, lh: '0.98', empurra: false });
    IG.celular(a, b, [[a, 'checkout-2']], { x: 0, y: 95, k: 0.9, ry: 8, toques: [[W(1, 'pedir') + 0.4, 195, 759]] });
    const s = L.scene(a, b, IG.world());
    const k = 2.4, zl = 540 - (362 * k) / 2, zt = 930;
    const zoom = L.crop(s, L.M('checkout-2'), 14, 296, 362, 96, { base: [390, 797], k, cls: 'panel', left: zl, top: zt, style: { borderRadius: '26px', backgroundColor: '#fffaf6', boxShadow: '0 50px 90px -24px rgba(0,0,0,.6), 0 0 0 6px #ff4d3d' } });
    IG.hid(zoom);
    tl.fromTo(zoom, { autoAlpha: 0, scale: 0.42, y: -160 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)', immediateRender: false }, W(1, 'bairro') - 0.15);
    L.cue(W(1, 'bairro') - 0.15, 'zoom');
    IG.anotar(s, W(1, 'taxa') - 0.1, { tipo: 'circulo', x: zl + 150 * k, y: zt + 36 * k, w: 100 * k, h: 26 * k }, { color: RED, largura: 9 });
    IG.anotar(s, W(1, 'valor') - 0.15, { tipo: 'sublinhado', x: zl + 28 * k, y: zt + 90 * k, w: 150 * k }, { color: RED, largura: 9 });
    const ch = $('div', 'pino', s, { left: '250px', top: '1215px', background: RED, fontSize: '46px', padding: '18px 34px' });
    ch.textContent = 'o cliente vê na hora de pedir';
    IG.hid(ch);
    tl.fromTo(ch, { autoAlpha: 0, scale: 0.4, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(2.2)', immediateRender: false }, W(1, 'hora') - 0.15);
    tl.to(ch, { scale: 1.07, duration: 0.3, yoyo: true, repeat: 3, ease: 'sine.inOut' }, W(1, 'pedir') + 0.1);
    L.cue(W(1, 'hora') - 0.15, 'pop');
  }
  // 3 · escolhe o entregador e acompanha o que está em rota
  {
    const a = T(2) - 0.1, b = T(3) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'quem leva cada pedido', { fontSize: '70px' }]], { parent: s, top: 290, empurra: false });
    const k1 = 2.75, l1 = 540 - (318 * k1) / 2;
    IG.peca(s, a + 0.08, 'd-pedido-custo', { x: 398, y: 552, w: 318, h: 76 }, { k: k1, top: 440, radius: 22 });
    L.tap(s, l1 + 250 * k1, 440 + 50 * k1, W(2, 'escolhe') + 0.1, RED);
    const k2 = 2.75, l2 = 540 - (318 * k2) / 2;
    IG.peca(s, W(2, 'entregador') - 0.1, 'd-entregas', { x: 1099, y: 156, w: 318, h: 140 }, { k: k2, top: 690, radius: 22, cue: 'ding' });
    IG.anotar(s, W(2, 'rota') - 0.15, { tipo: 'circulo', x: l2 + (1330 - 1099) * k2, y: 690 + (252 - 156) * k2, w: 78 * k2, h: 26 * k2 }, { color: RED, largura: 8 });
    IG.peca(s, W(2, 'acompanha') - 0.1, 'd-entregas', { x: 548, y: 150, w: 264, h: 160 }, { k: 1.5, left: 80, top: 1110, radius: 18, rot: -2 });
    IG.peca(s, W(2, 'acompanha') + 0.15, 'd-entregas', { x: 818, y: 150, w: 266, h: 178 }, { k: 1.5, left: 560, top: 1120, radius: 18, rot: 2 });
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.04]] });
  }
  // 4 · no fim do dia, o acerto com cada um
  const m4 = W(3, 'fala') - 0.15;
  {
    const a = T(3) - 0.1, b = m4;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'no fim do dia', { fontSize: '96px' }], [W(3, 'acerto') - 0.15, 'O ACERTO', { fontSize: '190px', color: RED }], [W(3, 'cada') - 0.1, 'com cada um', { fontSize: '96px' }]], { parent: s, top: 300, lh: '0.98', k: 0.04 });
    const k = 1.95, left = 540 - (476 * k) / 2;
    IG.peca(s, a + 0.2, 'd-entregas', { x: 937, y: 92, w: 476, h: 40 }, { k, top: 900, radius: 20 });
    IG.anotar(s, W(3, 'acerto') - 0.05, { tipo: 'circulo', x: left + (1208 - 937) * k, y: 900 + 2, w: 200 * k, h: 36 * k }, { color: RED, largura: 8 });
    IG.real(a + 0.2, b - 0.05);
  }
  IG.cta(m4, {
    linhas: [[m4 + 0.02, 'SUA ENTREGA', { fontSize: '128px' }], [m4 + 0.25, 'SOB CONTROLE.', { fontSize: '118px', color: RED }]],
    top: 470, botao: [m4 + 0.4, 'Fala com a gente'], botaoTop: 1010, botaoCor: RED, botaoTexto: '#fff', toque: W(3, 'gente') + 0.3, prova: true, cor: INK,
    provaBorda: 'rgba(29,36,51,.2)', provaBg: 'rgba(255,255,255,.75)',
  });
  IG.fim({ hideIn: [[m4 - 0.05, D + 1]], top: 1500 });
})();
