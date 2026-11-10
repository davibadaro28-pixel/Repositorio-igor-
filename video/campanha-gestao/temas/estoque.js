// Tema "estoque" (V03): planta técnica azul-marinho + âmbar, Space Grotesk + JetBrains Mono, scanner e etiquetas.
window.TEMA = (() => {
  const AM = '#ffb020';
  const NAVY = '#0a1a33';
  const LINE = '#7fb4ff';
  const RED = '#ff5b5b';
  const B_INI = [1440, 1197];
  const M = {};
  let tl, $, px, world, ui, tagReal, tagIl;
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const slam = (el, t, from = {}) => tl.fromTo(el, { autoAlpha: 0, scale: 1.25, ...from }, { autoAlpha: 1, scale: 1, x: 0, y: 0, rotate: 0, duration: 0.32, ease: 'power4.out', immediateRender: false }, t);
  const slideIn = (el, t, dx = -900, d = 0.5) => tl.fromTo(el, { autoAlpha: 0, x: dx }, { autoAlpha: 1, x: 0, duration: d, ease: 'expo.out', immediateRender: false }, t);
  const push = (s, a, b, k = 0.06) => L.drift(s, { amp: 0, scale: 0, pushes: [[a, b, k]] });
  const scans = [];

  M.init = () => {
    L.init({ bg: NAVY, grain: 0.05, vignette: 0.45 });
    ({ tl, $, px } = L);
    $('div', 'full', L.bg, { backgroundImage: 'linear-gradient(rgba(127,180,255,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(127,180,255,.10) 1px,transparent 1px),linear-gradient(rgba(127,180,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(127,180,255,.05) 1px,transparent 1px)', backgroundSize: '120px 120px,120px 120px,24px 24px,24px 24px' });
    const cross = $('div', 'full', L.bg);
    cross.innerHTML = `<svg width="1080" height="1920"><g stroke="${LINE}" stroke-opacity=".45" stroke-width="2">${[[60, 120], [1020, 120], [60, 1780], [1020, 1780]].map(([x, y]) => `<path d="M${x - 18} ${y}h36M${x} ${y - 18}v36"/>`).join('')}</g><text x="60" y="1840" fill="${LINE}" fill-opacity=".55" font-family="JetBrains Mono" font-size="20">FOLHA 03 · ESTOQUE · ESC 1:1</text></svg>`;
    world = $('div', 'world', L.layers);
    ui = $('div', 'full', L.frame, { pointerEvents: 'none' });
    const tagSt = { border: '1.5px solid rgba(127,180,255,.4)', fontSize: '21px', fontFamily: "'JetBrains Mono', monospace" };
    tagReal = L.tag(ui, 'Tela real · dados de demonstração', { left: 60, top: 150, bg: 'rgba(10,26,51,.85)', color: '#e8f1ff', dot: AM, style: tagSt });
    tagIl = L.tag(ui, 'Ilustração', { left: 60, top: 150, bg: 'rgba(10,26,51,.85)', color: '#e8f1ff', dot: LINE, style: tagSt });
    const scan = $('div', null, ui, { position: 'absolute', left: '0', top: '0', width: '1080px', height: '6px', background: AM, boxShadow: '0 0 40px 12px rgba(255,176,32,.55)', visibility: 'hidden' });
    L.onFrame((t) => {
      const sc = scans.find((a) => t >= a && t < a + 0.36);
      scan.style.visibility = sc != null ? 'visible' : 'hidden';
      if (sc != null) scan.style.transform = `translateY(${L.ease.inOut((t - sc) / 0.36) * 1920}px)`;
    });
    return { T: L.n, W: L.wt, E: L.nEnd, D: L.D };
  };
  M.real = (a, b) => tl.to(tagReal, { autoAlpha: 1, duration: 0.2 }, a).to(tagReal, { autoAlpha: 0, duration: 0.15 }, b);
  M.ilustra = (a, b) => tl.to(tagIl, { autoAlpha: 1, duration: 0.2 }, a).to(tagIl, { autoAlpha: 0, duration: 0.15 }, b);
  M.sweep = (t) => { scans.push(t - 0.18); L.cue(t - 0.18, 'scan'); };

  // prateleira técnica com scanner e etiquetas; opcional: um insumo "ACABOU" (falta)
  M.prateleira = (a, b, o = {}) => {
    const s = L.scene(a, b);
    const shelf = $('div', null, s, { position: 'absolute', left: '90px', top: '560px', width: '900px', height: '900px' });
    const items = [];
    const nm = [['LEITE COND.', 'can'], ['CHOCOLATE', 'box'], ['AÇÚCAR', 'bag'], ['MORANGO', 'box'], ['EMBALAGEM', 'stack'], ['CREME DE LEITE', 'can'], ['FARINHA', 'bag'], ['COCO RALADO', 'jar'], ['MANTEIGA', 'box'], ['OVOS', 'box'], ['GRANULADO', 'jar'], ['LEITE EM PÓ', 'can']];
    let svg = `<svg width="900" height="900" fill="none" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"><path class="d" d="M10 0V900M890 0V900M10 290H890M10 590H890M10 890H890"/>`;
    nm.forEach(([n, kind], i) => {
      const row = Math.floor(i / 4), col = i % 4, x = 40 + col * 215, yb = 290 + row * 300, w = 150, h = [180, 140, 200, 160][(i * 7) % 4];
      let d;
      if (kind === 'can') d = `M${x} ${yb - h + 14}v${h - 14}h${w}v${-(h - 14)}M${x} ${yb - h + 14}c0 -18 ${w} -18 ${w} 0c0 18 ${-w} 18 ${-w} 0`;
      else if (kind === 'bag') d = `M${x + 10} ${yb}l-10 ${-h + 30}l20 -30h${w - 40}l20 30l-10 ${h - 30}z M${x + 30} ${yb - h + 40}h${w - 60}`;
      else if (kind === 'jar') d = `M${x + 15} ${yb}v${-h + 40}q0 -14 14 -14h${w - 58}q14 0 14 14v${h - 40}z M${x + 30} ${yb - h + 10}h${w - 60}v16h${-(w - 60)}z`;
      else if (kind === 'stack') d = `M${x} ${yb}v-40h${w}v40z M${x + 6} ${yb - 40}v-40h${w - 12}v40z M${x + 12} ${yb - 80}v-40h${w - 24}v40z`;
      else d = `M${x} ${yb}v${-h}h${w}v${h}z M${x} ${yb - h}l20 -24h${w}l-20 24 M${x + w} ${yb}l20 -24v${-h}`;
      svg += `<path class="d i${i}" d="${d}"/>`;
      items.push({ n, x: x + w / 2, y: yb - h - 60, row, i });
    });
    shelf.innerHTML = svg + '</svg>';
    shelf.querySelectorAll('path.d').forEach((p, i) => { p.style.strokeDasharray = 2400; tl.fromTo(p, { strokeDashoffset: 2400 * 0.55 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', immediateRender: false }, a + 0.02 * i); });
    const scanY = { v: -60 };
    const bar = $('div', null, shelf, { position: 'absolute', left: '-40px', width: '980px', height: '4px', top: '0', background: AM, boxShadow: '0 0 30px 8px rgba(255,176,32,.5)' });
    const ts = o.scan ?? a + 0.5;
    tl.fromTo(scanY, { v: -60 }, { v: 920, duration: 2.6, ease: 'none', immediateRender: false }, ts);
    L.onFrame(() => { bar.style.top = px(scanY.v); bar.style.opacity = scanY.v > -50 && scanY.v < 910 ? 1 : 0; });
    items.forEach((it, i) => {
      const lb = $('div', 'lbl3', shelf, { left: px(it.x - 80), top: px(it.y), width: '160px', textAlign: 'center', fontSize: '17px' });
      lb.textContent = it.n;
      hid(lb);
      const t = ts + ((it.y + 60) / 980) * 2.6;
      tl.fromTo(lb, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.5)', immediateRender: false }, t);
      if (i % 4 === 0) L.cue(t, 'beep', { n: it.row });
      if (o.falta && i === 0) {
        tl.to(lb, { background: RED, color: '#fff', duration: 0.1 }, o.falta);
        const no = $('div', 'lbl3', shelf, { left: px(it.x - 80), top: px(it.y + 110), width: '160px', textAlign: 'center', fontSize: '24px', background: RED, color: '#fff' });
        no.textContent = 'ACABOU';
        hid(no);
        slam(no, o.falta, { scale: 2 });
        shelf.querySelectorAll('path.i0').forEach((p) => tl.to(p, { stroke: RED, opacity: 0.35, duration: 0.2 }, o.falta));
        L.cue(o.falta, 'alarm');
      }
    });
    if (o.titulo) {
      const h = $('div', 'sg', s, { position: 'absolute', left: '60px', top: '230px', width: '960px', fontSize: o.tamanho || '112px', lineHeight: '1' });
      h.innerHTML = o.titulo[1];
      hid(h);
      slam(h, o.titulo[0]);
      L.cue(o.titulo[0], 'hit');
    }
    M.ilustra(a + 0.1, b - 0.1);
    push(s, ts + 2.6, b, 0.06);
    return s;
  };

  // título em linhas (Space Grotesk), com nota opcional em mono
  M.titulo = (a, b, lines, o = {}) => {
    if (o.scan !== false) M.sweep(a);
    const s = L.scene(a, b);
    L.linhas(s, lines, { cls: 'sg', top: o.top ?? 560, line: { fontSize: o.size ?? '120px', lineHeight: '1.02' }, scale: 1.25, dur: 0.32, ease: 'power4.out' });
    if (o.nota) { const n = $('div', 'mono', s, { position: 'absolute', left: '90px', width: '900px', top: px(o.notaTop ?? 1180), textAlign: 'center', font: "700 30px/1.4 'JetBrains Mono', monospace", color: AM }); n.textContent = o.nota[1]; hid(n); tl.fromTo(n, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, o.nota[0]); }
    push(s, a + 0.4, b, 0.07);
    return s;
  };

  // linhas reais da ficha técnica (leite condensado, chocolate, morango, embalagem) com o custo em destaque
  M.fichas = (a, b, o) => {
    const s = L.scene(a, b, world);
    const FK = 1.45;
    const fRows = [702, 318, 750, 462];
    const tt = o.tempos;
    fRows.forEach((y, i) => {
      const c = L.crop(s, L.P('d-ficha'), 398, y - 22, 660, 44, { k: FK, cls: 'card3', left: 540 - (660 * FK) / 2, top: 520 + i * 118 });
      $('div', null, c, { position: 'absolute', left: '0', top: '0', width: '10px', height: '100%', background: AM, borderRadius: '10px 0 0 10px' });
      hid(c);
      slideIn(c, tt[i] - 0.08, i % 2 ? 900 : -900, 0.45);
      L.cue(tt[i] - 0.08, 'whip', { n: i });
      if (o.dinheiro) {
        const ring = $('div', null, s, { position: 'absolute', left: px(540 - (660 * FK) / 2 + (958 - 398) * FK), top: px(520 + i * 118 - 6), width: px(80 * FK), height: px(44 * FK + 12), border: `4px solid ${AM}`, borderRadius: '12px', boxShadow: '0 0 30px rgba(255,176,32,.5)' });
        hid(ring);
        tl.fromTo(ring, { autoAlpha: 0, scale: 1.5 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, o.dinheiro + i * 0.1);
      }
    });
    const fT = L.crop(s, L.P('d-ficha'), 384, 50, 672, 40, { k: 1.25, cls: 'card3', left: 540 - (672 * 1.25) / 2, top: 400, style: { borderRadius: '10px' } });
    hid(fT);
    tl.fromTo(fT, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, a + 0.1);
    if (o.dinheiro) {
      L.cue(o.dinheiro, 'coins');
      const h2 = $('div', 'sg', s, { position: 'absolute', left: '0', width: '1080px', top: '1040px', textAlign: 'center', fontSize: '92px' });
      h2.innerHTML = o.texto || `TUDO ISSO É <span style="color:${AM}">DINHEIRO</span>`;
      hid(h2);
      slam(h2, o.dinheiro + 0.4);
      L.cue(o.dinheiro + 0.4, 'impact');
      const n = $('div', 'mono', s, { position: 'absolute', left: '0', width: '1080px', top: '1180px', textAlign: 'center', fontSize: '24px', color: 'rgba(232,241,255,.6)' });
      n.textContent = 'insumos da ficha técnica de um bolo · custo por receita';
      hid(n);
      tl.to(n, { autoAlpha: 1, duration: 0.3 }, o.dinheiro);
    }
    M.real(a + 0.1, b - 0.05);
    push(s, tt[3] + 0.4, b, 0.06);
    return s;
  };

  // valor em estoque na hora (tela real)
  M.valor = (a, b, o) => {
    M.sweep(a);
    const s = L.scene(a, b, world);
    const plate = $('div', null, s, { position: 'absolute', left: '-180px', top: '600px', width: '1440px', height: '900px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 60px 120px -30px rgba(0,0,0,.8)' });
    L.crop(plate, L.P('d-estoque'), 0, 0, 1440, 900, { k: 1 });
    tl.fromTo(plate, { scale: 0.7, rotateX: 52, rotateZ: -8, y: 200, autoAlpha: 0 }, { scale: 0.72, rotateX: 38, rotateZ: -4, y: 60, autoAlpha: 1, duration: 0.7, ease: 'expo.out', immediateRender: false }, a);
    tl.to(plate, { rotateX: 30, rotateZ: 0, duration: Math.max(0.5, b - a - 0.7), ease: 'sine.inOut' }, a + 0.7);
    const ve = MP.valorEstoque, VK = 3.9;
    const v = L.crop(s, L.P('d-estoque'), ve.x - 14, ve.y - 12, ve.w + 20, ve.h + 24, { k: VK, cls: 'card3', left: 540 - ((ve.w + 20) * VK) / 2, top: 360, style: { borderRadius: '18px' } });
    hid(v);
    tl.fromTo(v, { autoAlpha: 0, y: 500, scale: 0.4, rotateX: 50 }, { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: 0.6, ease: 'back.out(1.4)', immediateRender: false }, o.valor - 0.15);
    tl.to(v, { boxShadow: `0 40px 90px -20px rgba(0,0,0,.7), 0 0 0 6px ${AM}`, duration: 0.3 }, o.valor + 0.5);
    L.cue(o.valor - 0.15, 'impact');
    const nh = $('div', 'callout', s, { left: '0', width: '1080px', textAlign: 'center', top: '540px', fontSize: '34px' });
    nh.textContent = '▲ ATUALIZADO NA HORA';
    hid(nh);
    tl.fromTo(nh, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, o.hora ?? o.valor + 0.8);
    L.cue(o.hora ?? o.valor + 0.8, 'tick');
    M.real(a, b - 0.05);
    push(s, o.valor + 0.6, b, 0.07);
    return s;
  };

  // alerta de estoque mínimo: selo "3 abaixo do mínimo" + cartão "Estoque baixo" do Início
  M.alerta = (a, b, o) => {
    M.sweep(a);
    const s = L.scene(a, b, world);
    const BK = 2.9;
    const badge = L.crop(s, L.P('d-estoque'), 810, 240, 160, 27, { k: BK, cls: 'card3', left: 540 - (160 * BK) / 2, top: 430, style: { borderRadius: '40px' } });
    hid(badge);
    slam(badge, o.avisa, { scale: 2 });
    L.cue(o.avisa, 'alarm');
    const pulse = $('div', null, s, { position: 'absolute', left: px(540 - (160 * BK) / 2 - 10), top: '420px', width: px(160 * BK + 20), height: px(27 * BK + 20), borderRadius: '60px', border: `4px solid ${RED}` });
    hid(pulse);
    tl.fromTo(pulse, { autoAlpha: 0.9, scale: 1 }, { autoAlpha: 0, scale: 1.35, duration: 0.8, repeat: 3, ease: 'power2.out', immediateRender: false }, o.avisa + 0.1);
    const EK = 2.55;
    const low = L.crop(s, L.P('d-inicio-full'), 1048, 700, 368, 122, { k: EK, base: B_INI, cls: 'card3', left: 540 - (368 * EK) / 2, top: 640, style: { borderRadius: '22px' } });
    hid(low);
    tl.fromTo(low, { autoAlpha: 0, y: 260, rotateX: 40 }, { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, o.cartao);
    L.cue(o.cartao, 'whoosh');
    tl.to(low, { boxShadow: `0 40px 90px -20px rgba(0,0,0,.7), 0 0 0 6px ${RED}, 0 0 80px rgba(255,91,91,.45)`, duration: 0.25, yoyo: true, repeat: 3 }, o.minimo - 0.05);
    L.cue(o.minimo - 0.05, 'alert');
    const ll = $('div', 'callout', s, { left: '0', width: '1080px', textAlign: 'center', top: '1000px', color: RED });
    ll.textContent = '⚠ ABAIXO DO MÍNIMO';
    hid(ll);
    tl.fromTo(ll, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, o.minimo);
    M.real(a, b - 0.05);
    push(s, o.minimo + 0.5, b, 0.07);
    return s;
  };

  // ficha técnica → venda → movimentações reais (baixa automática)
  M.baixa = (a, b, o) => {
    M.sweep(a);
    const s = L.scene(a, b, world);
    const FK2 = 1.38;
    const ficha = L.crop(s, L.P('d-ficha'), 384, 40, 672, 430, { k: FK2, cls: 'card3', left: 540 - (672 * FK2) / 2, top: 420, style: { borderRadius: '20px' } });
    hid(ficha);
    tl.fromTo(ficha, { autoAlpha: 0, rotateY: 70, x: 300 }, { autoAlpha: 1, rotateY: 0, x: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, o.ficha ?? a);
    L.cue(o.ficha ?? a, 'whoosh');
    const sale = $('div', 'lbl3', s, { left: '360px', top: '330px', fontSize: '30px', padding: '12px 22px', borderRadius: '8px' });
    sale.textContent = 'VENDA · PEDIDO #298';
    hid(sale);
    slam(sale, o.venda, { scale: 1.6 });
    L.cue(o.venda, 'stamp');
    tl.to(ficha, { y: -900, autoAlpha: 0, duration: 0.45, ease: 'power3.in' }, o.baixa - 0.2);
    tl.to(sale, { autoAlpha: 0, duration: 0.2 }, o.baixa);
    const MK = 1.25, movL = 540 - (820 * MK) / 2;
    const head = L.crop(s, L.P('d-estoque-mov'), 280, 150, 820, 32, { k: MK, cls: 'card3', left: movL, top: 470, style: { borderRadius: '12px 12px 0 0' } });
    hid(head);
    tl.fromTo(head, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, o.baixa);
    [328, 369, 410, 452, 493, 534].forEach((y, i) => {
      const r = L.crop(s, L.P('d-estoque-mov'), 280, y - 20, 820, 41, { k: MK, cls: 'card3', left: movL, top: 470 + 32 * MK + i * 41 * MK, style: { borderRadius: i === 5 ? '0 0 12px 12px' : '0' } });
      hid(r);
      const t = o.baixa + 0.12 + i * 0.16;
      tl.fromTo(r, { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power3.out', immediateRender: false }, t);
      L.cue(t, 'tick', { n: i });
    });
    const au = $('div', 'callout', s, { left: '0', width: '1080px', textAlign: 'center', top: '1010px' });
    au.textContent = '↓ BAIXA AUTOMÁTICA DOS INSUMOS';
    hid(au);
    tl.fromTo(au, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, o.baixa + 1.1);
    M.real(a, b - 0.05);
    push(s, o.baixa + 1.2, b, 0.03);
    return s;
  };

  // ações reais de cada insumo: entrada (compra), saída/perda e inventário
  M.acoes = (a, b, o) => {
    M.sweep(a);
    const s = L.scene(a, b, world);
    const AK = 3.7;
    const acts = L.crop(s, L.P('d-estoque'), 1160, 631, 245, 44, { k: AK, cls: 'card3', left: 540 - (245 * AK) / 2, top: 700, style: { borderRadius: '22px' } });
    tl.fromTo(acts, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, a);
    L.cue(a, 'whoosh');
    const ax = (x) => 540 - (245 * AK) / 2 + (x - 1160) * AK;
    [[1225, o.compras, 'COMPRA (ENTRADA)', 560], [1299, o.perdas, 'SAÍDA / PERDA', 1000], [1344, o.inventario, 'INVENTÁRIO', 1120]].forEach(([x, t, label, ly], i) => {
      const ring = $('div', null, s, { position: 'absolute', left: px(ax(x) - (i ? 70 : 210)), top: px(700 + 22 * AK - 70), width: px(i ? 140 : 420), height: '140px', borderRadius: '70px', border: `5px solid ${AM}` });
      hid(ring);
      tl.fromTo(ring, { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, t);
      tl.to(ring, { autoAlpha: 0.25, duration: 0.2 }, t + 0.6);
      const lbl = $('div', 'callout', s, { left: px(Math.max(60, Math.min(1020 - 360, ax(x) - 180))), width: '360px', textAlign: 'center', top: px(ly) });
      lbl.textContent = label;
      const stem = $('div', null, s, { position: 'absolute', left: px(ax(x) - 2), width: '4px', background: AM, top: px(ly < 700 ? ly + 44 : 700 + 44 * AK + 4), height: px(ly < 700 ? 700 - ly - 44 - 6 : ly - (700 + 44 * AK) - 14) });
      hid(lbl); hid(stem);
      tl.fromTo([lbl, stem], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }, t);
      tl.fromTo(lbl, { scale: 1.5 }, { scale: 1, duration: 0.25, ease: 'power4.out', immediateRender: false }, t);
      L.cue(t, 'stamp', { n: i });
    });
    M.real(a, b - 0.05);
    push(s, o.inventario + 0.4, b, 0.06);
    return s;
  };

  // custo real por produto: resumo da ficha (preço, custo, CMV) com o custo circulado
  M.custo = (a, b, o) => {
    M.sweep(a);
    const s = L.scene(a, b, world);
    const SK = 1.5;
    const summ = L.crop(s, L.P('d-ficha'), 384, 50, 672, 175, { k: SK, cls: 'card3', left: 540 - (672 * SK) / 2, top: 480, style: { borderRadius: '20px' } });
    tl.fromTo(summ, { autoAlpha: 0, y: 200 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, a);
    const cx = 540 - (672 * SK) / 2 + (721 - 384) * SK;
    const cRing = $('div', null, s, { position: 'absolute', left: px(cx - 140), top: px(480 + (211 - 50) * SK - 62), width: '280px', height: '110px', borderRadius: '55px', border: `5px solid ${AM}`, boxShadow: '0 0 40px rgba(255,176,32,.5)' });
    hid(cRing);
    slam(cRing, o.custo, { scale: 1.8 });
    L.cue(o.custo, 'impact');
    const cl = $('div', 'callout', s, { left: '0', width: '1080px', textAlign: 'center', top: '860px', fontSize: '36px' });
    cl.textContent = 'CUSTO REAL · POR PRODUTO';
    hid(cl);
    tl.fromTo(cl, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, o.custo + 0.3);
    M.real(a, b - 0.05);
    push(s, o.custo + 0.4, b, 0.06);
    return s;
  };

  M.prova = (a, b) => {
    M.sweep(a);
    const s = L.scene(a, b);
    L.prova(s, a, { top: 470, numSize: 290, kickFont: "800 30px/1.3 'JetBrains Mono', monospace", kickColor: '#e8f1ff', numFont: "700 290px/1 'Space Grotesk', sans-serif", numColor: AM, lblFont: "700 110px/1 'Space Grotesk', sans-serif", lblSize: 110, lblColor: '#fff', noteFont: "600 26px/1.4 'JetBrains Mono', monospace", noteColor: 'rgba(232,241,255,.6)' });
    push(s, a + 1, b, 0.06);
    return s;
  };

  // chamada final: linhas, itens (− / +) opcionais, botão âmbar
  M.cta = (a, o) => {
    M.sweep(a);
    const s = L.scene(a, null);
    L.linhas(s, o.linhas, { cls: 'sg', left: 60, width: 960, align: 'left', top: 420, line: { fontSize: '128px', lineHeight: '0.98' }, scale: 1.25, dur: 0.32, ease: 'power4.out' });
    (o.itens || []).forEach(([t, sym, word], i) => {
      const r = $('div', 'mono', s, { position: 'absolute', left: '64px', top: px(740 + i * 110), font: "800 64px/1 'JetBrains Mono', monospace", color: '#e8f1ff', display: 'flex', gap: '24px', alignItems: 'center' });
      r.innerHTML = `<span style="display:inline-grid;place-items:center;width:84px;height:84px;border-radius:12px;background:${i ? AM : 'rgba(127,180,255,.18)'};color:${i ? NAVY : '#e8f1ff'}">${sym}</span>${word}`;
      hid(r);
      slideIn(r, t - 0.08, -700, 0.45);
      L.cue(t - 0.08, 'stamp', { n: i });
    });
    const btn = $('div', null, s, { position: 'absolute', left: '64px', top: '1080px', padding: '34px 44px', borderRadius: '14px', background: AM, color: NAVY, font: "800 46px/1 'JetBrains Mono', monospace", display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 30px 60px -20px rgba(0,0,0,.6)' });
    btn.innerHTML = `${o.botao[1]} <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="${NAVY}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
    hid(btn);
    slam(btn, o.botao[0], { scale: 0.7 });
    L.cue(o.botao[0], 'pop');
    L.tap(s, 520, 1130, o.toque);
    tl.to(btn, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, o.toque);
    const sub = $('div', 'mono', s, { position: 'absolute', left: '64px', top: '1240px', width: '950px', font: "600 30px/1.4 'JetBrains Mono', monospace", color: 'rgba(232,241,255,.7)' });
    sub.textContent = 'Estoque, ficha técnica e CMV para docerias.';
    hid(sub);
    tl.to(sub, { autoAlpha: 1, duration: 0.4 }, o.toque);
    L.drift(s, { amp: 5, scale: 0.008, push: [a, L.D, 0.06] });
    return s;
  };

  M.fim = (hideIn = []) => {
    const capLayer = $('div', 'full', ui);
    L.captions(capLayer, { maxWords: 3, top: 1500, cls: 'v3', hideIn });
    L.cue(L.D - 2.4, 'tail');
    L.finish();
  };
  return M;
})();
