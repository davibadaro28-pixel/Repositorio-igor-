// R10 · Vlog: um dia numa doceria sem caderno. Relógio no canto, telas reais "coladas" como fotos do dia.
(() => {
  const PEACH = '#ffb36b', CREAM = '#fff7ee';
  const { T, W, D } = IG.init({
    bg: '#2a1d16', fg: CREAM, accent: PEACH, font: "'DM Serif Display', serif", fontText: "'Inter Tight', sans-serif", marcador: "'Caveat', cursive",
    grain: 0.13, vignette: 0.62, mov: 'sobe', capCls: 'r10', capUpper: false, upper: false, weight: '400', nota: 'rgba(255,247,238,.7)', tagBg: 'rgba(20,12,8,.7)',
    fundo: (bg) => {
      const luz = L.$('div', 'full', bg, { background: 'radial-gradient(70% 50% at 30% 20%, rgba(255,179,107,.28), transparent 70%), radial-gradient(60% 50% at 80% 90%, rgba(255,120,80,.16), transparent 70%)' });
      L.onFrame((t) => { luz.style.transform = `translate(${Math.sin(t * 0.3) * 30}px, ${Math.cos(t * 0.23) * 20}px)`; });
    },
  });
  const { tl, $, px } = L;
  const fita = (card, x, y, r) => { $('div', 'fita', card, { left: px(x), top: px(y), transform: `rotate(${r}deg)` }); };
  const mao = (parent, t, txt, x, y, rot = -4) => {
    const e = $('div', 'mao', parent, { left: px(x), top: px(y), transform: `rotate(${rot}deg)` });
    e.textContent = txt;
    IG.hid(e);
    tl.fromTo(e, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, t);
    L.cue(t, 'scribble');
    return e;
  };
  // tela real como foto colada com fita
  const colada = (parent, t, src, segs, y, h, o = {}) => {
    const c = IG.colunas(parent, t, src, segs, y, h, { ...o, de: { autoAlpha: 0, y: 160, rotate: (o.rot || 0) * 3, scale: 0.9 } });
    c.card.style.transform = `rotate(${o.rot || 0}deg)`;
    tl.set(c.card, { rotate: o.rot || 0 }, t + 0.5);
    fita(c.card, c.w / 2 - 85, -16, -3);
    c.card.style.overflow = 'visible';
    return c;
  };
  // abertura: fotos do dia e o caderno riscado
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    IG.fotoEl(s, 0.05, 'bolo-premium-ninho-com-morango', { w: 520, h: 600, left: 70, top: 380, polaroid: true, rot: -6, legenda: 'bolo do dia', zoomDur: 4 });
    IG.fotoEl(s, 0.45, 'fatia-red-velvet', { w: 460, h: 540, left: 560, top: 520, polaroid: true, rot: 5, legenda: 'fatias', zoomDur: 4 });
    IG.texto(a, b, [[W(0, 'dia') - 0.05, 'um dia na doceria', { fontSize: '96px' }]], { parent: s, top: 1150, k: 0.05 });
    const cad = mao(s, W(0, 'caderno') - 0.2, 'sem caderno', 330, 1290, -3);
    IG.anotar(s, W(0, 'caderno') + 0.1, { tipo: 'risco', x: 320, y: 1330, w: 380 }, { color: PEACH, largura: 8 });
    L.cue(0.05, 'whoosh');
  }
  IG.relogio([[T(1) - 0.05, T(2) - 0.15, '7h00'], [T(2) - 0.1, T(3) - 0.15, '11h30'], [T(3) - 0.1, T(4) - 0.15, '15h00'], [T(4) - 0.1, T(5) - 0.15, '18h30']]);
  const cena = (a, b) => { const s = L.scene(a, b, IG.world()); L.drift(s, { amp: 6, scale: 0.006, pushes: [[a + 0.3, b, 0.05]] }); IG.real(a + 0.3, b - 0.05); return s; };
  // 7h · caixa aberto e encomendas do dia
  {
    const a = T(1) - 0.1, b = T(2) - 0.1;
    const s = cena(a, b);
    IG.fotoEl(s, a, 'bolo-de-cenoura-com-calda', { w: 1080, h: 1920, left: 0, top: 0, radius: 0, zoomDur: 6, cue: false }).style.filter = 'brightness(.35) blur(2px)';
    mao(s, a + 0.1, '7h da manhã', 90, 330, -3);
    colada(s, W(1, 'caixa') - 0.1, 'd-caixa', [[280, 843]], 151, 102, { k: 1.66, top: 470, rot: -2 });
    const enc = colada(s, W(1, 'encomendas') - 0.1, 'd-encomendas', [[285, 560], [730, 830]], 150, 330, { k: 2.05, top: 720, rot: 1.5 });
    // "em ordem": cada horário do dia acende em sequência
    [262, 335, 408, 481].forEach((y, i) => {
      const f = $('div', null, enc.card, { position: 'absolute', left: '0', top: px((y - 150) * enc.k), width: px(enc.w), height: px(66 * enc.k), background: 'rgba(255,179,107,.38)', borderLeft: `10px solid ${PEACH}`, transformOrigin: '0 50%' });
      IG.hid(f);
      const t = W(1, 'ordem') - 0.25 + i * 0.32;
      tl.fromTo(f, { autoAlpha: 0, scaleX: 0 }, { autoAlpha: 1, scaleX: 1, duration: 0.3, ease: 'power3.out', immediateRender: false }, t);
      L.cue(t, 'tick');
    });
  }
  // pedidos no quadro e a cozinha na tela
  {
    const a = T(2) - 0.1, b = T(3) - 0.1;
    const s = cena(a, b);
    IG.fotoEl(s, a, 'brownie-ninho-com-nutella', { w: 1080, h: 1920, left: 0, top: 0, radius: 0, zoomDur: 6, cue: false }).style.filter = 'brightness(.33) blur(2px)';
    mao(s, a + 0.1, 'os pedidos caem sozinhos', 90, 330, -3);
    colada(s, W(2, 'pedidos') - 0.1, 'd-pedidos-novo', [[280, 960]], 150, 450, { k: 1.3, top: 460, rot: -1.5 });
    const coz = colada(s, W(2, 'cozinha') - 0.1, 'd-cozinha', [[280, 1033]], 333, 240, { k: 1.22, top: 1040, rot: 2 });
    tl.to(coz.card, { scale: 1.07, duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: 3 }, W(2, 'tela') - 0.2);
    L.tap(coz.card, (460 - 280) * coz.k, (532 - 333) * coz.k, W(2, 'tela') + 0.3);
  }
  // 15h · alerta do morango
  {
    const a = T(3) - 0.1, b = T(4) - 0.1;
    const s = cena(a, b);
    IG.fotoEl(s, a, 'bombom-de-morango-chocolate', { w: 1080, h: 1920, left: 0, top: 0, radius: 0, zoomDur: 6, cue: false }).style.filter = 'brightness(.33) blur(2px)';
    mao(s, a + 0.1, 'compro antes de faltar', 90, 330, -3);
    const c = colada(s, W(3, 'avisa') - 0.1, 'd-inicio-full', [[1048, 1416]], 700, 122, { k: 2.5, base: [1440, 1197], top: 620, rot: -1.5, cue: 'alert' });
    const [x, y] = c.at(1060, 770);
    IG.anotar(s, W(3, 'morango'), { tipo: 'circulo', x, y, w: 345 * c.k, h: 24 * c.k }, { color: PEACH, largura: 9 });
    IG.fotoEl(s, W(3, 'minimo') - 0.1, 'bombom-de-morango-leite-ninho', { w: 400, h: 470, left: 560, top: 1000, polaroid: true, rot: 6, legenda: 'morango', zoomDur: 3 });
  }
  // 18h30 · fim do dia: vendas, pedidos e ticket médio
  {
    const a = T(4) - 0.1, b = T(5) - 0.1;
    const s = cena(a, b);
    IG.fotoEl(s, a, 'torta-na-travessa-prestigio', { w: 1080, h: 1920, left: 0, top: 0, radius: 0, zoomDur: 6, cue: false }).style.filter = 'brightness(.3) blur(2px)';
    mao(s, a + 0.1, 'fim do dia', 90, 330, -3);
    colada(s, W(4, 'vendas') - 0.1, 'd-inicio', [[280, 555], [567, 842]], 151, 118, { k: 1.7, top: 560, rot: -1.5 });
    colada(s, W(4, 'ticket') - 0.1, 'd-inicio', [[854, 1129]], 151, 118, { k: 2.4, top: 900, rot: 2 });
  }
  // fim do mês · DRE
  {
    const a = T(5) - 0.1, b = T(6) - 0.08;
    const s = cena(a, b);
    mao(s, a + 0.1, 'e no fim do mês…', 90, 330, -3);
    const d = IG.dre(s, W(5, 'dre') - 0.3, { k: 1.08, top: 470 });
    IG.anotar(s, W(5, 'dre') + 0.2, { tipo: 'circulo', x: d.left + 4, y: d.rowY(1066) - 4, w: 800 * d.k - 8, h: 44 * d.k }, { color: PEACH, largura: 9 });
  }
  IG.prova(T(6) - 0.08, T(7) - 0.05, { fundo: '#2a1d16' });
  IG.cta(T(7) - 0.05, {
    linhas: [[W(7, 'quer') - 0.05, 'quer um dia', { fontSize: '120px' }], [W(7, 'assim') - 0.05, '<i>assim?</i>', { fontSize: '170px', color: PEACH }]],
    top: 520, botao: [W(7, 'fala') - 0.1, 'Fala com a gente'], botaoCor: PEACH, botaoTexto: '#2a1d16', toque: W(7, 'gente') + 0.3, mov: 'sobe',
  });
  IG.fim({ hideIn: [[T(6) - 0.12, D + 1]], top: 1500 });
})();
