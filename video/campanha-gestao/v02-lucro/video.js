// V02 · "Faturar não é lucrar" — visibilidade financeira.
// Branco quente + verde-esmeralda (estilo fintech), Plus Jakarta Sans, movimentos limpos com mola.
(() => {
  const EM = '#0e9f6e';
  const INK = '#17201c';
  const RED = '#e0503f';
  L.init({ bg: '#f5f2ec', grain: 0.035, vignette: 0.12 });
  const { tl, $, px } = L;
  const T = L.n;
  const W = L.wt;
  const D = L.D;
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const rise = (el, t, d = 0.6, from = {}) => tl.fromTo(el, { autoAlpha: 0, y: 70, ...from }, { autoAlpha: 1, y: 0, x: 0, scale: 1, rotate: 0, duration: d, ease: 'back.out(1.5)', immediateRender: false }, t);

  // fundo: pontilhado de papel milimetrado
  $('div', 'full', L.bg, { backgroundImage: 'radial-gradient(rgba(23,32,28,.12) 1.4px, transparent 1.6px)', backgroundSize: '44px 44px' });
  const blob = $('div', 'glow', L.bg, { width: '1300px', height: '1300px', left: '-110px', top: '300px', background: 'radial-gradient(circle, rgba(14,159,110,.16), rgba(14,159,110,0) 60%)' });
  tl.to(blob, { top: -200, duration: 6, ease: 'sine.inOut' }, 4).to(blob, { top: 500, duration: 8, ease: 'sine.inOut' }, 12).to(blob, { top: 200, duration: 8, ease: 'sine.inOut' }, 22);

  const world = $('div', 'world', L.layers);
  const ui = $('div', 'full', L.frame, { pointerEvents: 'none' });
  const tagSim = L.tag(ui, 'Simulação ilustrativa', { left: 60, top: 150, bg: '#fff', color: INK, dot: '#f5a524', style: { boxShadow: '0 6px 20px rgba(0,0,0,.08)', fontSize: '21px' } });
  const tagReal = L.tag(ui, 'Tela real · dados de demonstração', { left: 60, top: 150, bg: '#fff', color: INK, dot: EM, style: { boxShadow: '0 6px 20px rgba(0,0,0,.08)', fontSize: '21px' } });
  const tagOn = (tag, a, b) => tl.to(tag, { autoAlpha: 1, duration: 0.25 }, a).to(tag, { autoAlpha: 0, duration: 0.2 }, b);

  // ---------- S1 · "Faturar dez mil não é colocar dez mil no bolso." ----------
  const s1 = L.scene(0, T(1) + 0.5);
  const g1 = $('div', 'full', s1);
  const kick = $('div', 'kick', g1, { position: 'absolute', left: '0', width: '1080px', top: '470px', textAlign: 'center' });
  kick.textContent = 'Faturamento do mês';
  const num = $('div', 'num', g1, { position: 'absolute', left: '0', width: '1080px', top: '530px', textAlign: 'center' });
  const cnt = { v: 0 };
  tl.to(cnt, { v: 10000, duration: 1.05, ease: 'power2.out' }, W(0, 'faturar'));
  L.onFrame(() => { num.textContent = `R$ ${Math.round(cnt.v).toLocaleString('pt-BR')}`; });
  L.cue(W(0, 'faturar'), 'count', { d: 1.05 });
  tl.fromTo(num, { scale: 0.86 }, { scale: 1, duration: 1.2, ease: 'expo.out', immediateRender: false }, 0);
  const neq = $('div', null, g1, { position: 'absolute', left: '0', width: '1080px', top: '770px', textAlign: 'center', font: "800 190px/1 'Plus Jakarta Sans'", color: EM });
  neq.textContent = '≠';
  hid(neq);
  tl.fromTo(neq, { autoAlpha: 0, scale: 0.3, rotate: -40 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.45, ease: 'back.out(2.4)', immediateRender: false }, W(0, 'nao') - 0.05);
  L.cue(W(0, 'nao') - 0.05, 'pop');
  tl.to(num, { color: '#9aa39e', duration: 0.3 }, W(0, 'nao'));
  const pocket = $('div', null, g1, { position: 'absolute', left: '390px', top: '1000px', width: '300px', height: '300px' });
  pocket.innerHTML = `<svg viewBox="0 0 120 120" width="300" height="300" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 22h84v38c0 26-19 44-42 44S18 86 18 60z"/><path d="M18 22c10 12 26 18 42 18s32-6 42-18" stroke="${EM}"/><text x="60" y="86" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="40" fill="${EM}" stroke="none">?</text></svg>`;
  hid(pocket);
  rise(pocket, W(0, 'colocar'), 0.6, { scale: 0.7 });
  const pl = $('div', 'kick', g1, { position: 'absolute', left: '0', width: '1080px', top: '1310px', textAlign: 'center', color: INK });
  pl.textContent = 'no bolso';
  hid(pl);
  rise(pl, W(0, 'bolso') - 0.1, 0.4);
  L.cue(W(0, 'bolso') - 0.1, 'thud');
  tagOn(tagSim, 0.1, T(2) - 0.2);
  tl.to(g1, { y: -700, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, T(1) - 0.15);

  // ---------- S2 · cascata: "Sai ingrediente, embalagem, taxa, conta do mês…" ----------
  const s2 = L.scene(T(1) - 0.1, T(3) - 0.02);
  const chart = $('div', 'full', s2);
  const base = 1240;
  const top0 = 470;
  const H = base - top0;
  const bars = [
    { l: 'Faturamento', h: H, y: top0, c: EM, t: T(1) - 0.05 },
    { l: 'Ingredientes', h: 260, y: top0, c: RED, t: W(1, 'ingrediente') },
    { l: 'Embalagens', h: 110, y: top0 + 260, c: RED, t: W(1, 'embalagem') },
    { l: 'Taxas', h: 95, y: top0 + 370, c: RED, t: W(1, 'taxa') },
    { l: 'Contas do mês', h: 220, y: top0 + 465, c: RED, t: W(1, 'conta') },
  ];
  const left0 = 75;
  const step = 160;
  const bw = 128;
  bars.forEach((b, i) => {
    const x = left0 + i * step;
    const el = $('div', null, chart, { position: 'absolute', left: px(x), top: px(b.y), width: px(bw), height: px(b.h), borderRadius: '14px', background: b.c, boxShadow: '0 20px 40px -18px rgba(0,0,0,.35)' });
    const lb = $('div', 'bar-l', chart, { left: px(x - 14), top: px(base + 22), width: '156px', fontSize: '21px' });
    lb.textContent = b.l;
    hid(el);
    hid(lb);
    if (i === 0) {
      tl.fromTo(el, { autoAlpha: 1, scaleY: 0, transformOrigin: '50% 100%' }, { autoAlpha: 1, scaleY: 1, duration: 0.7, ease: 'expo.out', immediateRender: false }, b.t);
      L.cue(b.t, 'rise');
    } else {
      tl.fromTo(el, { autoAlpha: 1, y: -700 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'bounce.out', immediateRender: false }, b.t - 0.1);
      L.cue(b.t + 0.18, 'drop', { n: i });
      // linha guia do nível anterior
      const g = $('div', null, chart, { position: 'absolute', left: px(x - step + bw), top: px(b.y), width: px(step - bw), height: '0', borderTop: `3px dashed rgba(23,32,28,.25)` });
      hid(g);
      tl.to(g, { autoAlpha: 1, duration: 0.2 }, b.t);
    }
    tl.to(lb, { autoAlpha: 1, duration: 0.3 }, b.t);
  });
  // sobra
  const sx = left0 + 5 * step;
  const restTop = top0 + 685;
  const rest = $('div', null, chart, { position: 'absolute', left: px(sx), top: px(restTop), width: px(bw), height: px(base - restTop), borderRadius: '14px', background: EM });
  const rl = $('div', 'bar-l', chart, { left: px(sx - 14), top: px(base + 22), width: '156px', fontSize: '21px', color: EM });
  rl.textContent = 'Sobra';
  const q = $('div', null, chart, { position: 'absolute', left: px(sx - 40), width: px(bw + 80), top: px(restTop - 190), textAlign: 'center', font: "800 170px/1 'Plus Jakarta Sans'", color: INK });
  q.textContent = '?';
  [rest, rl, q].forEach((e) => hid(e));
  tl.fromTo(rest, { autoAlpha: 1, scaleY: 0, transformOrigin: '50% 100%' }, { autoAlpha: 1, scaleY: 1, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, W(2, 'fim') - 0.1);
  tl.to(rl, { autoAlpha: 1, duration: 0.3 }, W(2, 'fim') - 0.1);
  L.cue(W(2, 'fim') - 0.1, 'rise');
  tl.fromTo(q, { autoAlpha: 0, scale: 0.2, y: 60 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(2.5)', immediateRender: false }, W(2, 'sobra') - 0.1);
  L.cue(W(2, 'sobra') - 0.1, 'question');
  const h2 = $('div', 'h2', s2, { position: 'absolute', left: '60px', top: '250px', width: '960px' });
  h2.innerHTML = `Quanto <span style="color:${EM}">sobra</span> de verdade?`;
  hid(h2);
  rise(h2, W(2, 'quanto') - 0.1, 0.5);
  // a câmera mergulha no "?"
  chart.style.transformOrigin = `${sx + bw / 2}px ${restTop - 100}px`;
  tl.to(chart, { scale: 7, duration: 0.75, ease: 'power3.in' }, T(3) - 0.62);
  tl.to(h2, { autoAlpha: 0, y: -60, duration: 0.3 }, T(3) - 0.6);
  L.cue(T(3) - 0.62, 'riser', { d: 0.62 });

  // ---------- S3 · "No início, você vê as vendas, os pedidos e o ticket médio do dia." ----------
  const s3 = L.scene(T(3) - 0.05, T(4) - 0.02, world);
  const scr = $('div', 'shadow2', s3, { position: 'absolute', left: '-180px', top: '470px', width: '1440px', height: '900px', borderRadius: '28px', overflow: 'hidden', transformOrigin: '50% 50%' });
  L.crop(scr, L.P('d-inicio'), 0, 0, 1440, 900, { k: 1 });
  const dim = $('div', 'full', scr, { background: 'rgba(245,242,236,.0)' });
  tl.fromTo(scr, { scale: 1.6, rotateX: 0, rotateY: 0, z: 0, autoAlpha: 0 }, { scale: 0.62, rotateX: 18, rotateY: -22, autoAlpha: 1, duration: 1.1, ease: 'expo.out', immediateRender: false }, T(3) - 0.05);
  tl.to(scr, { rotateY: -12, rotateX: 12, duration: 4.8, ease: 'sine.inOut' }, T(3) + 1.05);
  L.cue(T(3) - 0.05, 'whoosh');
  tl.to(dim, { background: 'rgba(245,242,236,.55)', duration: 0.4 }, W(3, 'vendas') - 0.2);
  tagOn(tagReal, T(3) + 0.3, T(7) - 0.2);
  const kp = MP.inicio;
  [['Vendas hoje', 'vendas'], ['Pedidos hoje', 'pedidos'], ['Ticket médio', 'ticket']].forEach(([k, w], i) => {
    const el = L.panel(s3, L.P('d-inicio'), kp[k], 2.45, 540, 560 + i * 315, { radius: 26, style: { backgroundColor: '#fff' } });
    hid(el);
    tl.fromTo(el, { autoAlpha: 0, z: -400, rotateX: 25, y: 120 }, { autoAlpha: 1, z: 0, rotateX: 0, y: 0, duration: 0.6, ease: 'back.out(1.4)', immediateRender: false }, W(3, w) - 0.15);
    L.cue(W(3, w) - 0.15, 'card', { n: i });
  });

  // ---------- S4 · "Cada produto mostra o custo e o lucro bruto. Margem apertada salta aos olhos." ----------
  const s4 = L.scene(T(4) - 0.02, T(5) - 0.02, world);
  const CK = 1.2;
  const SEG = [[280, 720], [860, 1270]];
  const segW = SEG.reduce((t, [x0, x1]) => t + x1 - x0, 0);
  const mapX = (x) => (x >= SEG[1][0] ? SEG[0][1] - SEG[0][0] + (x - SEG[1][0]) : x - SEG[0][0]);
  const tblLeft = 540 - (segW * CK) / 2;
  // recorte em dois pedaços (nome do produto + colunas de valores), sem o espaço vazio do meio
  const crop2 = (parent, y, h, o = {}) => {
    const box = $('div', o.cls || null, parent, { position: 'absolute', left: px(o.left ?? 0), top: px(o.top ?? 0), width: px(segW * CK), height: px(h * CK), overflow: 'hidden', background: '#fff', ...(o.style || {}) });
    let off = 0;
    for (const [x0, x1] of SEG) { L.crop(box, L.P('d-estoque-cmv-ficha'), x0, y, x1 - x0, h, { k: CK, left: off * CK }); off += x1 - x0; }
    return box;
  };
  const tb = crop2(s4, 198, 322, { cls: 'shadow2', left: tblLeft, top: 470, style: { borderRadius: '22px' } });
  tl.fromTo(tb, { autoAlpha: 0, y: 240, rotateX: 35 }, { autoAlpha: 1, y: 0, rotateX: 8, duration: 0.8, ease: 'expo.out', immediateRender: false }, T(4) - 0.02);
  L.cue(T(4) - 0.02, 'whoosh');
  const colHi = (x0, x1, t, label, top = 390) => {
    const c = $('div', null, tb, { position: 'absolute', left: px(mapX(x0) * CK), top: '0', width: px((x1 - x0) * CK), height: '100%', background: 'rgba(14,159,110,.14)', borderLeft: `3px solid ${EM}`, borderRight: `3px solid ${EM}` });
    hid(c);
    tl.fromTo(c, { autoAlpha: 0, scaleY: 0, transformOrigin: '50% 0%' }, { autoAlpha: 1, scaleY: 1, duration: 0.35, immediateRender: false }, t);
    const cx = tblLeft + mapX((x0 + x1) / 2) * CK;
    const lb = $('div', null, s4, { position: 'absolute', left: px(Math.min(1040 - 260, cx - 130)), top: px(top), width: '260px', textAlign: cx - 130 > 780 ? 'right' : 'center', font: "800 28px/1 'Plus Jakarta Sans'", color: EM, letterSpacing: '.06em', textTransform: 'uppercase' });
    lb.textContent = label;
    hid(lb);
    rise(lb, t, 0.4);
    L.cue(t, 'tick');
  };
  colHi(965, 1060, W(4, 'custo') - 0.05, 'custo');
  colHi(1145, 1270, W(4, 'lucro') - 0.05, 'lucro bruto', 330);
  // a linha de margem apertada salta da tabela
  const hot = crop2(s4, 349, 57, { cls: 'panel', left: tblLeft, top: 470 + (349 - 198) * CK, style: { borderRadius: '16px' } });
  hid(hot);
  tl.fromTo(hot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, W(4, 'margem') - 0.1)
    .to(hot, { y: 400, scale: 1.02, boxShadow: `0 40px 80px -20px rgba(224,80,63,.55), 0 0 0 5px ${RED}`, duration: 0.6, ease: 'back.out(1.6)' }, W(4, 'margem') - 0.1);
  L.cue(W(4, 'margem') - 0.1, 'alert');
  const hotL = $('div', null, s4, { position: 'absolute', left: '0', width: '1080px', top: '1200px', textAlign: 'center', font: "800 44px/1.2 'Plus Jakarta Sans'", color: RED });
  hotL.textContent = 'CMV de 55%: margem apertada';
  hid(hotL);
  rise(hotL, W(4, 'salta') - 0.1, 0.45);
  tl.to(tb, { filter: 'blur(3px)', autoAlpha: 0.5, duration: 0.4 }, W(4, 'margem'));

  // ---------- S5 · "Cada pedido mostra o seu custo estimado." ----------
  const s5 = L.scene(T(5) - 0.02, T(6) - 0.02, world);
  const DK = 1.6;
  const dr = MP.drawer;
  const tot = MP.total;
  const cus = MP.custo;
  const DX = 400;
  const DW = 640;
  const drw = L.crop(s5, L.P('d-pedido-custo'), DX, dr.y, DW, 345, { k: DK, cls: 'panel', left: 540 - (DW * DK) / 2, top: 420, style: { borderRadius: '26px', backgroundColor: '#fff' } });
  tl.fromTo(drw, { autoAlpha: 0, x: 900, rotateY: -40 }, { autoAlpha: 1, x: 0, rotateY: 0, duration: 0.7, ease: 'expo.out', immediateRender: false }, T(5) - 0.02);
  L.cue(T(5) - 0.02, 'whoosh');
  // o bloco Total + Custo estimado salta para a frente
  const y0 = tot.y - 8;
  const y1 = cus.y + cus.h + 8;
  const tc = L.crop(s5, L.P('d-pedido-custo'), DX, y0, DW, y1 - y0, { k: DK, cls: 'panel', left: 540 - (DW * DK) / 2, top: 420 + (y0 - dr.y) * DK, style: { borderRadius: '16px', backgroundColor: '#fff' } });
  hid(tc);
  tl.fromTo(tc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, W(5, 'custo') - 0.1)
    .to(tc, { y: 240, scale: 1.03, boxShadow: `0 40px 80px -20px rgba(14,159,110,.5), 0 0 0 5px ${EM}`, duration: 0.6, ease: 'back.out(1.6)' }, W(5, 'custo') - 0.1);
  tl.to(drw, { filter: 'blur(3px)', autoAlpha: 0.45, duration: 0.4 }, W(5, 'custo'));
  L.cue(W(5, 'custo') - 0.1, 'pop');

  // ---------- S6 · "E o DRE junta tudo: vendas, custos, despesas e o resultado." ----------
  const s6 = L.scene(T(6) - 0.02, T(7) - 0.02, world);
  const RK = 1.2;
  const B = [1440, 1134];
  const card = $('div', 'shadow2', s6, { position: 'absolute', left: px(540 - (800 * RK) / 2), top: '400px', width: px(800 * RK), height: px((270 + 537) * RK), borderRadius: '24px', overflow: 'hidden', background: '#fff' });
  L.crop(card, L.P('d-fin-dre-full'), 280, 247, 800, 270, { k: RK, base: B });
  L.crop(card, L.P('d-fin-dre-full'), 280, 574, 800, 537, { k: RK, base: B, top: 270 * RK });
  tl.fromTo(card, { autoAlpha: 0, y: 300, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out', immediateRender: false }, T(6) - 0.02);
  L.cue(T(6) - 0.02, 'whoosh');
  const mark = $('div', null, card, { position: 'absolute', left: '0', width: '100%', top: '0', height: '0', background: 'rgba(14,159,110,.16)', borderLeft: `8px solid ${EM}` });
  hid(mark);
  const rowY = (y) => (y < 517 ? (y - 247) * RK : (270 + y - 574) * RK);
  [['vendas', 296, 41], ['custos', 476, 41], ['despesas', 1025, 41], ['resultado', 1066, 45]].forEach(([w, y, h], i) => {
    const t = W(6, w) - 0.08;
    if (i === 0) tl.set(mark, { autoAlpha: 1, top: rowY(y), height: h * RK }, t);
    else tl.to(mark, { top: rowY(y), height: h * RK, duration: 0.3, ease: 'power3.inOut' }, t);
    L.cue(t, 'tick');
  });
  const res = L.crop(s6, L.P('d-fin-dre-full'), 280, 1066, 800, 45, { k: RK, base: B, cls: 'panel', left: 540 - (800 * RK) / 2, top: 400 + rowY(1066), style: { borderRadius: '14px', backgroundColor: '#fff' } });
  hid(res);
  tl.fromTo(res, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, W(6, 'resultado') + 0.2)
    .to(res, { scale: 1.1, y: 30, boxShadow: `0 40px 80px -20px rgba(14,159,110,.55), 0 0 0 5px ${EM}`, duration: 0.5, ease: 'back.out(2)' }, W(6, 'resultado') + 0.2);
  L.cue(W(6, 'resultado') + 0.2, 'impact');
  const dreK = $('div', 'kick', s6, { position: 'absolute', left: '0', width: '1080px', top: '320px', textAlign: 'center' });
  dreK.textContent = 'DRE · resultado do período';
  hid(dreK);
  rise(dreK, T(6) + 0.2, 0.5);

  // ---------- S7 · "Pare de adivinhar. Peça uma demonstração." ----------
  const s7 = L.scene(T(7) - 0.3, null);
  const green = $('div', 'full', s7, { background: '#0b3b2c' });
  tl.fromTo(green, { clipPath: 'inset(100% 0 0 0 round 0px)' }, { clipPath: 'inset(0% 0 0 0 round 0px)', duration: 0.55, ease: 'power4.inOut', immediateRender: false }, T(7) - 0.3);
  L.cue(T(7) - 0.3, 'swell');
  // linha que sobe ao fundo (sem valores)
  const ln = $('div', 'full', s7);
  ln.innerHTML = `<svg width="1080" height="1920" style="position:absolute;left:0;top:0"><path id="up" d="M-20 1500 C 200 1460, 260 1380, 400 1390 S 620 1200, 760 1150 S 980 900, 1120 820" fill="none" stroke="rgba(52,211,153,.55)" stroke-width="10" stroke-linecap="round"/></svg>`;
  const up = ln.querySelector('path');
  up.style.strokeDasharray = 1600;
  tl.fromTo(up, { strokeDashoffset: 1600 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.out', immediateRender: false }, T(7));
  const ctaA = $('div', 'h2', s7, { position: 'absolute', left: '70px', top: '470px', width: '940px', color: '#fff', fontSize: '140px', lineHeight: '0.98' });
  ctaA.innerHTML = 'Pare de<br><span style="color:#34d399">adivinhar.</span>';
  hid(ctaA);
  rise(ctaA, W(7, 'pare') - 0.05, 0.6);
  L.cue(W(7, 'pare') - 0.05, 'hit');
  const ctaB = $('div', null, s7, { position: 'absolute', left: '74px', top: '800px', width: '900px', font: "600 42px/1.3 'Plus Jakarta Sans'", color: 'rgba(255,255,255,.82)' });
  ctaB.textContent = 'Veja vendas, custos e resultado da sua doceria num painel só.';
  hid(ctaB);
  rise(ctaB, W(7, 'adivinhar') + 0.4, 0.5);
  const btn = $('div', null, s7, { position: 'absolute', left: '74px', top: '1040px', padding: '34px 46px', borderRadius: '999px', background: '#34d399', color: '#06281d', font: "800 46px/1 'Plus Jakarta Sans'", display: 'flex', gap: '18px', alignItems: 'center', boxShadow: '0 30px 60px -20px rgba(0,0,0,.5)' });
  btn.innerHTML = 'Peça uma demonstração <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#06281d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
  hid(btn);
  rise(btn, W(7, 'peca') - 0.1, 0.55, { scale: 0.8 });
  L.cue(W(7, 'peca') - 0.1, 'pop');
  L.tap(s7, 560, 1085, W(7, 'demonstracao') + 0.5);
  tl.to(btn, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, W(7, 'demonstracao') + 0.5);

  const capLayer = $('div', 'full', ui);
  L.captions(capLayer, { maxWords: 4, top: 1500, cls: 'v2', hideIn: [[T(7) - 0.3, D + 1]] });
  L.finish();
})();
