// A03 · Caixa que não bate. Público: quem vende no balcão.
// Gancho: a bobina do fechamento sai da máquina com "R$ ???" (quebra de padrão) e a pergunta direta.
(() => {
  const RED = '#d62828', INK = '#151515';
  const { T, W, D } = IG.init({
    bg: '#ece7db', fg: INK, accent: RED, marker: RED, danger: RED, font: "'Space Mono', monospace", fontText: "'Space Grotesk', sans-serif", grain: 0.05, vignette: 0.16,
    mov: 'soco', capCls: 'a03', capUpper: false, weight: '700', tagBg: 'rgba(21,21,21,.85)', ls: '-.02em',
    fundo: (bg) => { L.$('div', 'full', bg, { backgroundImage: 'linear-gradient(rgba(21,21,21,.05) 2px, transparent 2px)', backgroundSize: '100% 46px' }); },
  });
  const { tl, $, px } = L;
  // 1 · o caixa bateu, ou fechou no olho?
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    const bob = $('div', 'bobina', s);
    const cup = $('div', 'cupom', bob);
    cup.innerHTML = '<div class="c">SUA DOCERIA</div><div class="c">FECHAMENTO DO DIA</div><div class="t"></div><div class="l"><span>ESPERADO</span><span>R$ ???</span></div><div class="l"><span>CONTADO</span><span>R$ ???</span></div><div class="t"></div><div class="l" style="color:#d62828"><span>DIFERENÇA</span><span>R$ ???</span></div>';
    $('div', 'fenda', s);
    tl.fromTo(cup, { y: -300 }, { y: 0, duration: 1.6, ease: 'steps(12)' }, 0);
    const sel = $('div', null, s, { position: 'absolute', left: '0', top: '262px', width: '1080px', textAlign: 'center' });
    sel.innerHTML = '<span style="display:inline-block;padding:16px 34px;background:#151515;color:#ece7db;font:700 44px/1 \'Space Mono\',monospace;border-radius:10px">FIM DO DIA NA DOCERIA</span>';
    tl.fromTo(sel, { scale: 1.3 }, { scale: 1, duration: 0.35, ease: 'expo.out' }, 0);
    L.cue(0.02, 'type', { d: 1.6 });
    L.cue(1.72, 'register');
    IG.texto(a, b, [[W(0, 'caixa') - 0.1, 'O CAIXA', { fontSize: '150px' }], [W(0, 'bateu') - 0.05, 'BATEU?', { fontSize: '170px', color: RED }]], { parent: s, top: 1010, lh: '0.95', k: 0.05 });
    IG.carimbo(s, W(0, 'fechou') - 0.05, 'ou foi no olho?', { x: 150, y: 1350, size: 80, rot: -4, cor: INK, bg: '#ffe14d', font: "700 84px/1 'Space Mono', monospace" });
    IG.ilustra(0.3, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[1.8, b, 0.04]] });
  }
  // 2 · abre com o troco, lança sangria, vê quanto entrou em cada forma
  {
    const a = T(1) - 0.1, b = T(2) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'o caixa do dia', { fontSize: '86px' }]], { parent: s, top: 285, empurra: false });
    IG.peca(s, W(1, 'abre') - 0.1, 'd-caixa', { x: 280, y: 151, w: 276, h: 102 }, { k: 2.35, top: 440, radius: 22, cue: 'register' });
    const kb = 2.2, lb = 540 - (413 * kb) / 2;
    IG.peca(s, W(1, 'lanca') - 0.1, 'd-caixa', { x: 1003, y: 90, w: 413, h: 42 }, { k: kb, top: 715, radius: 22 });
    IG.anotar(s, W(1, 'sangria') - 0.05, { tipo: 'circulo', x: lb + 8, y: 715 + 6, w: 96 * kb, h: 30 * kb }, { color: RED, largura: 8 });
    const c = IG.colunas(s, W(1, 've') - 0.1, 'd-caixa', [[284, 440], [730, 836]], 318, 116, { w: 900, top: 860, cue: 'ding' });
    const [px1, py1] = c.at(292, 426);
    IG.anotar(s, W(1, 'pix') - 0.05, { tipo: 'sublinhado', x: px1, y: py1, w: 30 * c.k }, { color: RED, largura: 9, dur: 0.25 });
    const [cx1, cy1] = c.at(292, 386);
    IG.anotar(s, W(1, 'cartao') - 0.05, { tipo: 'sublinhado', x: cx1, y: cy1, w: 122 * c.k }, { color: RED, largura: 9, dur: 0.25 });
    const [vx, vy] = c.at(745, 355);
    IG.anotar(s, W(1, 'dinheiro') - 0.05, { tipo: 'circulo', x: vx, y: vy, w: 88 * c.k, h: 74 * c.k }, { color: RED, largura: 8 });
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
  }
  // 3 · na hora de fechar, mostra a diferença
  {
    const a = T(2) - 0.1, b = T(3) - 0.1;
    const s = L.scene(a, b, IG.world());
    IG.texto(a, b, [[a + 0.05, 'na hora de fechar', { fontSize: '80px' }]], { parent: s, top: 285, empurra: false });
    IG.peca(s, a + 0.05, 'd-caixa', { x: 1141, y: 151, w: 276, h: 102 }, { k: 2.6, top: 440, radius: 22 });
    const c = IG.colunas(s, W(2, 'ele') - 0.1, 'd-caixa', [[284, 470], [1040, 1128], [1255, 1410]], 498, 76, { w: 940, top: 800, cue: 'ding' });
    const [x, y] = c.at(1262, 506);
    IG.anotar(s, W(2, 'diferenca') - 0.1, { tipo: 'circulo', x, y, w: 146 * c.k, h: 24 * c.k }, { color: RED, largura: 9 });
    IG.carimbo(s, W(2, 'diferenca') + 0.15, 'a diferença aparece', { x: 110, y: 1080, size: 70, rot: -4, cor: RED, bg: '#fff', font: "700 70px/1 'Space Mono', monospace" });
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.3, b, 0.05]] });
  }
  IG.cta(T(3) - 0.1, {
    linhas: [[W(3, 'sem') - 0.05, 'SEM CONTA', { fontSize: '140px' }], [W(3, 'cabeca') - 0.25, 'DE CABEÇA.', { fontSize: '140px', color: RED }]],
    top: 470, botao: [W(3, 'fala') - 0.1, 'Fala com a gente'], botaoTop: 1010, botaoCor: INK, botaoTexto: '#ece7db', toque: W(3, 'gente') + 0.3, prova: true, cor: INK,
    provaBorda: 'rgba(21,21,21,.25)', provaBg: 'rgba(255,255,255,.7)',
  });
  IG.fim({ hideIn: [[T(3) - 0.12, D + 1]], top: 1500 });
})();
