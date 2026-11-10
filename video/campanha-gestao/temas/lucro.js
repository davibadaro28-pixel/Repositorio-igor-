// Tema "lucro" (V02): branco quente + verde-esmeralda (fintech), Plus Jakarta Sans, movimentos limpos com mola.
window.TEMA = (() => {
  const EM = '#0e9f6e';
  const INK = '#17201c';
  const RED = '#e0503f';
  const M = {};
  let tl, $, px, world, ui, tagSim, tagReal;
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const rise = (el, t, d = 0.6, from = {}) => tl.fromTo(el, { autoAlpha: 0, y: 70, ...from }, { autoAlpha: 1, y: 0, x: 0, scale: 1, rotate: 0, duration: d, ease: 'back.out(1.5)', immediateRender: false }, t);
  const push = (s, a, b, k = 0.08) => L.drift(s, { amp: 0, scale: 0, pushes: [[a, b, k]] });

  M.init = () => {
    L.init({ bg: '#f5f2ec', grain: 0.035, vignette: 0.12 });
    ({ tl, $, px } = L);
    $('div', 'full', L.bg, { backgroundImage: 'radial-gradient(rgba(23,32,28,.12) 1.4px, transparent 1.6px)', backgroundSize: '44px 44px' });
    const blob = $('div', 'glow', L.bg, { width: '1300px', height: '1300px', left: '-110px', top: '300px', background: 'radial-gradient(circle, rgba(14,159,110,.16), rgba(14,159,110,0) 60%)' });
    L.onFrame((t) => { blob.style.transform = `translate(${Math.sin(t * 0.25) * 120}px, ${Math.cos(t * 0.2) * -420}px)`; });
    world = $('div', 'world', L.layers);
    ui = $('div', 'full', L.frame, { pointerEvents: 'none' });
    tagSim = L.tag(ui, 'Simulação ilustrativa', { left: 60, top: 150, bg: '#fff', color: INK, dot: '#f5a524', style: { boxShadow: '0 6px 20px rgba(0,0,0,.08)', fontSize: '21px' } });
    tagReal = L.tag(ui, 'Tela real · dados de demonstração', { left: 60, top: 150, bg: '#fff', color: INK, dot: EM, style: { boxShadow: '0 6px 20px rgba(0,0,0,.08)', fontSize: '21px' } });
    return { T: L.n, W: L.wt, E: L.nEnd, D: L.D };
  };
  const tagOn = (tag, a, b) => tl.to(tag, { autoAlpha: 1, duration: 0.25 }, a).to(tag, { autoAlpha: 0, duration: 0.2 }, b);
  M.sim = (a, b) => tagOn(tagSim, a, b);
  M.real = (a, b) => tagOn(tagReal, a, b);

  // "R$ 10.000" contando (simulação) ≠ bolso
  M.contador = (a, b, o = {}) => {
    const s = L.scene(a, b);
    const g = $('div', 'full', s);
    const kick = $('div', 'kick', g, { position: 'absolute', left: '0', width: '1080px', top: '470px', textAlign: 'center' });
    kick.textContent = o.kick || 'Faturamento do mês';
    const num = $('div', 'num', g, { position: 'absolute', left: '0', width: '1080px', top: '530px', textAlign: 'center' });
    const cnt = { v: 0 };
    const t0 = o.inicio ?? a + 0.1;
    tl.fromTo(cnt, { v: 0 }, { v: o.valor ?? 10000, duration: 1.05, ease: 'power2.out', immediateRender: false }, t0);
    L.onFrame(() => { num.textContent = `R$ ${Math.round(cnt.v).toLocaleString('pt-BR')}`; });
    L.cue(t0, 'count', { d: 1.05 });
    tl.fromTo(num, { scale: 0.86 }, { scale: 1, duration: 1.2, ease: 'expo.out', immediateRender: false }, a);
    if (o.nao) {
      const neq = $('div', null, g, { position: 'absolute', left: '0', width: '1080px', top: '770px', textAlign: 'center', font: "800 190px/1 'Plus Jakarta Sans'", color: EM });
      neq.textContent = '≠';
      hid(neq);
      tl.fromTo(neq, { autoAlpha: 0, scale: 0.3, rotate: -40 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.45, ease: 'back.out(2.4)', immediateRender: false }, o.nao - 0.05);
      L.cue(o.nao - 0.05, 'pop');
      tl.to(num, { color: '#9aa39e', duration: 0.3 }, o.nao);
    }
    if (o.bolso) {
      const pocket = $('div', null, g, { position: 'absolute', left: '390px', top: '1000px', width: '300px', height: '300px' });
      pocket.innerHTML = `<svg viewBox="0 0 120 120" width="300" height="300" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 22h84v38c0 26-19 44-42 44S18 86 18 60z"/><path d="M18 22c10 12 26 18 42 18s32-6 42-18" stroke="${EM}"/><text x="60" y="86" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="40" fill="${EM}" stroke="none">?</text></svg>`;
      hid(pocket);
      rise(pocket, o.bolso, 0.6, { scale: 0.7 });
      L.cue(o.bolso, 'thud');
      if (o.bolsoTexto) { const pl = $('div', 'kick', g, { position: 'absolute', left: '0', width: '1080px', top: '1310px', textAlign: 'center', color: INK }); pl.textContent = o.bolsoTexto; hid(pl); rise(pl, o.bolso + 0.2, 0.4); }
    }
    M.sim(a + 0.1, b - 0.1);
    tl.to(g, { y: -700, autoAlpha: 0, duration: 0.5, ease: 'power3.in' }, b - 0.5);
    push(s, (o.bolso ?? o.nao ?? t0 + 1.1), b - 0.5, 0.06);
    return s;
  };

  // cascata de custos (simulação, sem valores): tempos de cada barra, sobra e "?"
  M.cascata = (a, b, o) => {
    const s = L.scene(a, b);
    const chart = $('div', 'full', s);
    const base = 1240, top0 = 470, H = base - top0;
    const tt = o.tempos;
    const bars = [
      { l: 'Faturamento', h: H, y: top0, c: EM },
      { l: 'Ingredientes', h: 260, y: top0, c: RED },
      { l: 'Embalagens', h: 110, y: top0 + 260, c: RED },
      { l: 'Taxas', h: 95, y: top0 + 370, c: RED },
      { l: 'Contas do mês', h: o.negativo ? 420 : 220, y: top0 + 465, c: RED },
    ];
    const left0 = 75, step = 160, bw = 128;
    bars.forEach((bb, i) => {
      const x = left0 + i * step;
      const t = tt[i];
      const el = $('div', null, chart, { position: 'absolute', left: px(x), top: px(bb.y), width: px(bw), height: px(bb.h), borderRadius: '14px', background: bb.c, boxShadow: '0 20px 40px -18px rgba(0,0,0,.35)' });
      const lb = $('div', 'bar-l', chart, { left: px(x - 14), top: px(Math.max(base, bb.y + bb.h) + 22), width: '156px', fontSize: '21px' });
      lb.textContent = bb.l;
      hid(el); hid(lb);
      if (i === 0) { tl.fromTo(el, { autoAlpha: 1, scaleY: 0, transformOrigin: '50% 100%' }, { autoAlpha: 1, scaleY: 1, duration: 0.7, ease: 'expo.out', immediateRender: false }, t); L.cue(t, 'rise'); }
      else {
        tl.fromTo(el, { autoAlpha: 1, y: -700 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'bounce.out', immediateRender: false }, t - 0.1);
        L.cue(t + 0.18, 'drop', { n: i });
        const gl = $('div', null, chart, { position: 'absolute', left: px(x - step + bw), top: px(bb.y), width: px(step - bw), height: '0', borderTop: '3px dashed rgba(23,32,28,.25)' });
        hid(gl);
        tl.to(gl, { autoAlpha: 1, duration: 0.2 }, t);
      }
      tl.to(lb, { autoAlpha: 1, duration: 0.3 }, t);
    });
    const sx = left0 + 5 * step;
    const restTop = top0 + (o.negativo ? 885 : 685);
    if (o.sobra) {
      const neg = !!o.negativo;
      const rest = $('div', null, chart, { position: 'absolute', left: px(sx), top: px(neg ? base : restTop), width: px(bw), height: px(neg ? restTop - base : base - restTop), borderRadius: '14px', background: neg ? RED : EM });
      const rl = $('div', 'bar-l', chart, { left: px(sx - 14), top: px(neg ? restTop + 22 : base + 22), width: '156px', fontSize: '21px', color: neg ? RED : EM });
      rl.textContent = neg ? 'Prejuízo' : 'Sobra';
      hid(rest); hid(rl);
      tl.fromTo(rest, { autoAlpha: 1, scaleY: 0, transformOrigin: neg ? '50% 0%' : '50% 100%' }, { autoAlpha: 1, scaleY: 1, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, o.sobra);
      tl.to(rl, { autoAlpha: 1, duration: 0.3 }, o.sobra);
      L.cue(o.sobra, neg ? 'alert' : 'rise');
    }
    if (o.pergunta) {
      const q = $('div', null, chart, { position: 'absolute', left: px(sx - 40), width: px(bw + 80), top: px(restTop - 190), textAlign: 'center', font: "800 170px/1 'Plus Jakarta Sans'", color: INK });
      q.textContent = '?';
      hid(q);
      tl.fromTo(q, { autoAlpha: 0, scale: 0.2, y: 60 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(2.5)', immediateRender: false }, o.pergunta);
      L.cue(o.pergunta, 'question');
    }
    if (o.titulo) {
      const h2 = $('div', 'h2', s, { position: 'absolute', left: '60px', top: '250px', width: '960px', fontSize: '84px' });
      h2.innerHTML = o.titulo[1];
      hid(h2);
      rise(h2, o.titulo[0], 0.5);
    }
    if (o.mergulho) {
      chart.style.transformOrigin = `${sx + bw / 2}px ${restTop - 100}px`;
      tl.to(chart, { scale: 7, duration: 0.75, ease: 'power3.in' }, b - 0.62);
      L.cue(b - 0.62, 'riser', { d: 0.62 });
    }
    M.sim(a + 0.05, b - 0.1);
    push(s, tt[tt.length - 1] + 0.4, b - (o.mergulho ? 0.65 : 0), 0.08);
    return s;
  };

  // título em linhas (Plus Jakarta), com etiqueta opcional
  M.titulo = (a, b, lines, o = {}) => {
    const s = L.scene(a, b);
    L.linhas(s, lines, { cls: 'h2', top: o.top ?? 560, line: { fontSize: o.size ?? '104px', lineHeight: '1.05' }, scale: 1.08, dy: 50, dur: 0.5, ease: 'back.out(1.5)', cue: 'card' });
    if (o.foto) {
      const c = $('div', 'shadow2', s, { position: 'absolute', left: '290px', top: px(o.fotoTop ?? 1010), width: '500px', height: '380px', borderRadius: '28px', overflow: 'hidden' });
      L.img(c, L.F(o.foto), 500, 500, { objectFit: 'cover', marginTop: '-60px' });
      hid(c);
      rise(c, o.tFoto ?? a + 0.2, 0.7, { scale: 0.85 });
    }
    const last = Math.max(...lines.map((l) => l[0]));
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.5, last, 0.04], [last + 0.3, b, 0.08]] });
    return s;
  };

  // Início real: tela inclinada e os 3 indicadores saltando
  M.inicio = (a, b, o) => {
    const s = L.scene(a, b, world);
    const scr = $('div', 'shadow2', s, { position: 'absolute', left: '-180px', top: '470px', width: '1440px', height: '900px', borderRadius: '28px', overflow: 'hidden', transformOrigin: '50% 50%' });
    L.crop(scr, L.P('d-inicio'), 0, 0, 1440, 900, { k: 1 });
    const dim = $('div', 'full', scr, { background: 'rgba(245,242,236,.0)' });
    tl.fromTo(scr, { scale: 1.6, autoAlpha: 0 }, { scale: 0.62, rotateX: 18, rotateY: -22, autoAlpha: 1, duration: 1.1, ease: 'expo.out', immediateRender: false }, a);
    tl.to(scr, { rotateY: -12, rotateX: 12, duration: Math.max(0.5, b - a - 1.1), ease: 'sine.inOut' }, a + 1.1);
    L.cue(a, 'whoosh');
    tl.to(dim, { background: 'rgba(245,242,236,.55)', duration: 0.4 }, o.tempos[0] - 0.2);
    [['Vendas hoje', 0], ['Pedidos hoje', 1], ['Ticket médio', 2]].forEach(([k, i]) => {
      const el = L.panel(s, L.P('d-inicio'), MP.inicio[k], 2.45, 540, 560 + i * 315, { radius: 26, style: { backgroundColor: '#fff' } });
      hid(el);
      tl.fromTo(el, { autoAlpha: 0, z: -400, rotateX: 25, y: 120 }, { autoAlpha: 1, z: 0, rotateX: 0, y: 0, duration: 0.6, ease: 'back.out(1.4)', immediateRender: false }, o.tempos[i] - 0.15);
      L.cue(o.tempos[i] - 0.15, 'card', { n: i });
    });
    M.real(a + 0.3, b - 0.05);
    push(s, o.tempos[2] + 0.3, b, 0.08);
    return s;
  };

  // custo e lucro bruto por produto (CMV real); margem apertada salta da tabela
  M.cmv = (a, b, o) => {
    const s = L.scene(a, b, world);
    const CK = 1.2;
    const SEG = [[280, 720], [860, 1270]];
    const segW = SEG.reduce((t, [x0, x1]) => t + x1 - x0, 0);
    const mapX = (x) => (x >= SEG[1][0] ? SEG[0][1] - SEG[0][0] + (x - SEG[1][0]) : x - SEG[0][0]);
    const tblLeft = 540 - (segW * CK) / 2;
    const crop2 = (parent, y, h, op = {}) => {
      const box = $('div', op.cls || null, parent, { position: 'absolute', left: px(op.left ?? 0), top: px(op.top ?? 0), width: px(segW * CK), height: px(h * CK), overflow: 'hidden', background: '#fff', ...(op.style || {}) });
      let off = 0;
      for (const [x0, x1] of SEG) { L.crop(box, L.P('d-estoque-cmv-ficha'), x0, y, x1 - x0, h, { k: CK, left: off * CK }); off += x1 - x0; }
      return box;
    };
    const tb = crop2(s, 198, 322, { cls: 'shadow2', left: tblLeft, top: 470, style: { borderRadius: '22px' } });
    tl.fromTo(tb, { autoAlpha: 0, y: 240, rotateX: 35 }, { autoAlpha: 1, y: 0, rotateX: 8, duration: 0.8, ease: 'expo.out', immediateRender: false }, a);
    L.cue(a, 'whoosh');
    const colHi = (x0, x1, t, label, top = 390) => {
      const c = $('div', null, tb, { position: 'absolute', left: px(mapX(x0) * CK), top: '0', width: px((x1 - x0) * CK), height: '100%', background: 'rgba(14,159,110,.14)', borderLeft: `3px solid ${EM}`, borderRight: `3px solid ${EM}` });
      hid(c);
      tl.fromTo(c, { autoAlpha: 0, scaleY: 0, transformOrigin: '50% 0%' }, { autoAlpha: 1, scaleY: 1, duration: 0.35, immediateRender: false }, t);
      const cx = tblLeft + mapX((x0 + x1) / 2) * CK;
      const lb = $('div', null, s, { position: 'absolute', left: px(Math.min(1040 - 260, cx - 130)), top: px(top), width: '260px', textAlign: cx - 130 > 780 ? 'right' : 'center', font: "800 28px/1 'Plus Jakarta Sans'", color: EM, letterSpacing: '.06em', textTransform: 'uppercase' });
      lb.textContent = label;
      hid(lb);
      rise(lb, t, 0.4);
      L.cue(t, 'tick');
    };
    // marcação que percorre as linhas (produto a produto) nos tempos dados; a última fica vermelha
    if (o.varre) {
      const rows = [235.5, 292.5, 349.5];
      const mk = $('div', null, tb, { position: 'absolute', left: '0', width: '100%', top: px((rows[0] - 198) * CK), height: px(57 * CK), background: 'rgba(14,159,110,.14)', borderLeft: `8px solid ${EM}` });
      hid(mk);
      o.varre.forEach((t, i) => {
        const last = i === o.varre.length - 1;
        if (i === 0) tl.fromTo(mk, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }, t);
        else tl.to(mk, { top: (rows[Math.min(i, 2)] - 198) * CK, duration: 0.3, ease: 'power3.inOut' }, t);
        if (last) tl.to(mk, { background: 'rgba(224,80,63,.16)', borderLeftColor: RED, duration: 0.2 }, t + 0.1);
        L.cue(t, last ? 'alert' : 'tick');
      });
      if (o.custo) tl.to(mk, { autoAlpha: 0, duration: 0.2 }, o.custo - 0.2);
    }
    if (o.custo) colHi(965, 1060, o.custo, 'custo');
    if (o.lucro) colHi(1145, 1270, o.lucro, 'lucro bruto', 330);
    if (o.margem) {
      const hot = crop2(s, 349, 57, { cls: 'panel', left: tblLeft, top: 470 + (349 - 198) * CK, style: { borderRadius: '16px' } });
      hid(hot);
      tl.fromTo(hot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, o.margem)
        .to(hot, { y: 400, scale: 1.02, boxShadow: `0 40px 80px -20px rgba(224,80,63,.55), 0 0 0 5px ${RED}`, duration: 0.6, ease: 'back.out(1.6)' }, o.margem);
      L.cue(o.margem, 'alert');
      const hotL = $('div', null, s, { position: 'absolute', left: '0', width: '1080px', top: '1200px', textAlign: 'center', font: "800 44px/1.2 'Plus Jakarta Sans'", color: RED });
      hotL.textContent = o.margemTexto || 'CMV de 55%: margem apertada';
      hid(hotL);
      rise(hotL, o.margem + 0.35, 0.45);
      tl.to(tb, { filter: 'blur(3px)', autoAlpha: 0.5, duration: 0.4 }, o.margem + 0.1);
    }
    M.real(a + 0.2, b - 0.05);
    push(s, (o.margem ?? o.lucro ?? a) + 0.6, b, 0.07);
    return s;
  };

  // custo estimado do pedido (gaveta real do pedido #324)
  M.pedido = (a, b, o) => {
    const s = L.scene(a, b, world);
    const DK = 1.6, dr = MP.drawer, tot = MP.total, cus = MP.custo, DX = 400, DW = 640;
    const drw = L.crop(s, L.P('d-pedido-custo'), DX, dr.y, DW, 345, { k: DK, cls: 'panel', left: 540 - (DW * DK) / 2, top: 420, style: { borderRadius: '26px', backgroundColor: '#fff' } });
    tl.fromTo(drw, { autoAlpha: 0, x: 900, rotateY: -40 }, { autoAlpha: 1, x: 0, rotateY: 0, duration: 0.7, ease: 'expo.out', immediateRender: false }, a);
    L.cue(a, 'whoosh');
    const y0 = tot.y - 8, y1 = cus.y + cus.h + 8;
    const tc = L.crop(s, L.P('d-pedido-custo'), DX, y0, DW, y1 - y0, { k: DK, cls: 'panel', left: 540 - (DW * DK) / 2, top: 420 + (y0 - dr.y) * DK, style: { borderRadius: '16px', backgroundColor: '#fff' } });
    hid(tc);
    tl.fromTo(tc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, o.custo)
      .to(tc, { y: 240, scale: 1.03, boxShadow: `0 40px 80px -20px rgba(14,159,110,.5), 0 0 0 5px ${EM}`, duration: 0.6, ease: 'back.out(1.6)' }, o.custo);
    tl.to(drw, { filter: 'blur(3px)', autoAlpha: 0.45, duration: 0.4 }, o.custo + 0.1);
    L.cue(o.custo, 'pop');
    M.real(a + 0.2, b - 0.05);
    push(s, o.custo + 0.5, b, 0.09);
    return s;
  };

  // DRE real: a marca percorre vendas, custos, despesas e resultado
  M.dre = (a, b, o) => {
    const s = L.scene(a, b, world);
    const RK = 1.2, B = [1440, 1134];
    const card = $('div', 'shadow2', s, { position: 'absolute', left: px(540 - (800 * RK) / 2), top: '400px', width: px(800 * RK), height: px((270 + 537) * RK), borderRadius: '24px', overflow: 'hidden', background: '#fff' });
    L.crop(card, L.P('d-fin-dre-full'), 280, 247, 800, 270, { k: RK, base: B });
    L.crop(card, L.P('d-fin-dre-full'), 280, 574, 800, 537, { k: RK, base: B, top: 270 * RK });
    tl.fromTo(card, { autoAlpha: 0, y: 300, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out', immediateRender: false }, a);
    L.cue(a, 'whoosh');
    const mark = $('div', null, card, { position: 'absolute', left: '0', width: '100%', top: '0', height: '0', background: 'rgba(14,159,110,.16)', borderLeft: `8px solid ${EM}` });
    hid(mark);
    const rowY = (y) => (y < 517 ? (y - 247) * RK : (270 + y - 574) * RK);
    const rows = { vendas: [296, 41], custos: [476, 41], despesas: [1025, 41], resultado: [1066, 45] };
    let first = true;
    for (const [k, t] of Object.entries(o)) {
      if (!rows[k] || t == null) continue;
      const [y, h] = rows[k];
      if (first) tl.fromTo(mark, { autoAlpha: 0 }, { autoAlpha: 1, top: rowY(y), height: h * RK, duration: 0.01, immediateRender: false }, t - 0.08);
      else tl.to(mark, { top: rowY(y), height: h * RK, duration: 0.3, ease: 'power3.inOut' }, t - 0.08);
      first = false;
      L.cue(t - 0.08, 'tick');
    }
    if (o.resultado) {
      const res = L.crop(s, L.P('d-fin-dre-full'), 280, 1066, 800, 45, { k: RK, base: B, cls: 'panel', left: 540 - (800 * RK) / 2, top: 400 + rowY(1066), style: { borderRadius: '14px', backgroundColor: '#fff' } });
      hid(res);
      tl.fromTo(res, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, o.resultado + 0.2)
        .to(res, { scale: 1.1, y: 30, boxShadow: `0 40px 80px -20px rgba(14,159,110,.55), 0 0 0 5px ${EM}`, duration: 0.5, ease: 'back.out(2)' }, o.resultado + 0.2);
      L.cue(o.resultado + 0.2, 'impact');
    }
    const k = $('div', 'kick', s, { position: 'absolute', left: '0', width: '1080px', top: '320px', textAlign: 'center' });
    k.textContent = 'DRE · resultado do período';
    hid(k);
    rise(k, a + 0.2, 0.5);
    M.real(a + 0.2, b - 0.05);
    push(s, (o.resultado ?? a) + 0.6, b, 0.07);
    return s;
  };

  M.prova = (a, b) => {
    const s = L.scene(a, b);
    const card = $('div', 'shadow2', s, { position: 'absolute', left: '70px', top: '400px', width: '940px', height: '900px', borderRadius: '40px', background: '#fff' });
    tl.fromTo(card, { autoAlpha: 0, y: 200, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)', immediateRender: false }, a);
    L.cue(a, 'whoosh');
    L.prova(s, a + 0.1, { top: 470, numSize: 280, kickFont: "800 28px/1.3 'Plus Jakarta Sans'", kickColor: EM, numFont: "800 280px/1 'Plus Jakarta Sans'", numColor: INK, lblFont: "800 96px/1 'Plus Jakarta Sans'", lblSize: 96, lblColor: EM, noteFont: "600 28px/1.35 'Plus Jakarta Sans'", noteColor: 'rgba(23,32,28,.6)' });
    push(s, a + 1, b, 0.12);
    return s;
  };

  // chamada final verde-escura: linhas, apoio, botão e toque
  M.cta = (a, o) => {
    const s = L.scene(a - 0.3, null);
    const green = $('div', 'full', s, { background: '#0b3b2c' });
    tl.fromTo(green, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.55, ease: 'power4.inOut', immediateRender: false }, a - 0.3);
    L.cue(a - 0.3, 'swell');
    const ln = $('div', 'full', s);
    ln.innerHTML = '<svg width="1080" height="1920" style="position:absolute;left:0;top:0"><path d="M-20 1500 C 200 1460, 260 1380, 400 1390 S 620 1200, 760 1150 S 980 900, 1120 820" fill="none" stroke="rgba(52,211,153,.55)" stroke-width="10" stroke-linecap="round"/></svg>';
    const up = ln.querySelector('path');
    up.style.strokeDasharray = 1600;
    tl.fromTo(up, { strokeDashoffset: 1600 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.out', immediateRender: false }, a);
    L.linhas(s, o.linhas, { cls: 'h2', left: 70, width: 940, align: 'left', top: 470, line: { color: '#fff', fontSize: '128px', lineHeight: '0.98' }, dy: 60, scale: 1, dur: 0.6, ease: 'back.out(1.5)' });
    if (o.sub) { const sb = $('div', null, s, { position: 'absolute', left: '74px', top: '820px', width: '900px', font: "600 42px/1.3 'Plus Jakarta Sans'", color: 'rgba(255,255,255,.82)' }); sb.textContent = o.sub[1]; hid(sb); rise(sb, o.sub[0], 0.5); }
    const btn = $('div', null, s, { position: 'absolute', left: '74px', top: '1040px', padding: '34px 46px', borderRadius: '999px', background: '#34d399', color: '#06281d', font: "800 46px/1 'Plus Jakarta Sans'", display: 'flex', gap: '18px', alignItems: 'center', boxShadow: '0 30px 60px -20px rgba(0,0,0,.5)' });
    btn.innerHTML = `${o.botao[1]} <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#06281d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
    hid(btn);
    rise(btn, o.botao[0], 0.55, { scale: 0.8 });
    L.cue(o.botao[0], 'pop');
    L.tap(s, 560, 1085, o.toque);
    tl.to(btn, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, o.toque);
    tl.to(btn, { boxShadow: '0 30px 80px -10px rgba(52,211,153,.75)', scale: 1.04, duration: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut' }, o.toque + 0.3);
    L.drift(s, { amp: 6, scale: 0.01, push: [a, L.D, 0.06] });
    return s;
  };

  M.fim = (hideIn = []) => {
    const capLayer = $('div', 'full', ui);
    L.captions(capLayer, { maxWords: 4, top: 1500, cls: 'v2', hideIn });
    L.cue(L.D - 2.4, 'tail');
    L.finish();
  };
  return M;
})();
