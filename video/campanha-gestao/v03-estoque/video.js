// V03 · "Dinheiro parado na prateleira" — estoque e custo.
// Planta técnica azul-marinho + âmbar, Space Grotesk + JetBrains Mono, scanner e etiquetas de inventário.
(() => {
  const AM = '#ffb020';
  const NAVY = '#0a1a33';
  const LINE = '#7fb4ff';
  const RED = '#ff5b5b';
  L.init({ bg: NAVY, grain: 0.05, vignette: 0.45 });
  const { tl, $, px } = L;
  const T = L.n;
  const W = L.wt;
  const D = L.D;
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const slam = (el, t, from = {}) => tl.fromTo(el, { autoAlpha: 0, scale: 1.25, ...from }, { autoAlpha: 1, scale: 1, x: 0, y: 0, rotate: 0, duration: 0.32, ease: 'power4.out', immediateRender: false }, t);
  const slideIn = (el, t, dx = -900, d = 0.5) => tl.fromTo(el, { autoAlpha: 0, x: dx }, { autoAlpha: 1, x: 0, duration: d, ease: 'expo.out', immediateRender: false }, t);
  const B_INI = [1440, 1197];

  // ---------- fundo: papel de planta técnica ----------
  $('div', 'full', L.bg, { backgroundImage: `linear-gradient(rgba(127,180,255,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(127,180,255,.10) 1px,transparent 1px),linear-gradient(rgba(127,180,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(127,180,255,.05) 1px,transparent 1px)`, backgroundSize: '120px 120px,120px 120px,24px 24px,24px 24px' });
  const cross = $('div', 'full', L.bg);
  cross.innerHTML = `<svg width="1080" height="1920"><g stroke="${LINE}" stroke-opacity=".45" stroke-width="2">${[[60, 120], [1020, 120], [60, 1780], [1020, 1780]].map(([x, y]) => `<path d="M${x - 18} ${y}h36M${x} ${y - 18}v36"/>`).join('')}</g><text x="60" y="1840" fill="${LINE}" fill-opacity=".55" font-family="JetBrains Mono" font-size="20">FOLHA 03 · ESTOQUE · ESC 1:1</text></svg>`;

  const world = $('div', 'world', L.layers);
  const ui = $('div', 'full', L.frame, { pointerEvents: 'none' });
  const tagReal = L.tag(ui, 'Tela real · dados de demonstração', { left: 60, top: 150, bg: 'rgba(10,26,51,.85)', color: '#e8f1ff', dot: AM, style: { border: '1.5px solid rgba(127,180,255,.4)', fontSize: '21px', fontFamily: "'JetBrains Mono', monospace" } });
  const realOn = (a, b) => tl.to(tagReal, { autoAlpha: 1, duration: 0.2 }, a).to(tagReal, { autoAlpha: 0, duration: 0.15 }, b);

  // linha de scanner que atravessa o quadro nas trocas de cena
  const scan = $('div', null, ui, { position: 'absolute', left: '0', top: '0', width: '1080px', height: '6px', background: AM, boxShadow: `0 0 40px 12px rgba(255,176,32,.55)`, visibility: 'hidden' });
  const scans = [];
  const sweep = (t) => { scans.push(t - 0.18); L.cue(t - 0.18, 'scan'); };
  L.onFrame((t) => {
    const s = scans.find((a) => t >= a && t < a + 0.36);
    scan.style.visibility = s != null ? 'visible' : 'hidden';
    if (s != null) scan.style.transform = `translateY(${L.ease.inOut((t - s) / 0.36) * 1920}px)`;
  });

  // ---------- S1 · "Você sabe quanto dinheiro está parado no estoque da sua doceria?" ----------
  const s1 = L.scene(0, T(1) + 0.4);
  const shelf = $('div', null, s1, { position: 'absolute', left: '90px', top: '560px', width: '900px', height: '900px' });
  const items = [];
  const nm = [['LEITE COND.', 'can'], ['CHOCOLATE', 'box'], ['AÇÚCAR', 'bag'], ['MORANGO', 'box'], ['EMBALAGEM', 'stack'], ['CREME DE LEITE', 'can'], ['FARINHA', 'bag'], ['COCO RALADO', 'jar'], ['MANTEIGA', 'box'], ['OVOS', 'box'], ['GRANULADO', 'jar'], ['LEITE EM PÓ', 'can']];
  let svg = `<svg width="900" height="900" fill="none" stroke="${LINE}" stroke-width="3" stroke-linejoin="round">`;
  svg += `<path class="d" d="M10 0V900M890 0V900M10 290H890M10 590H890M10 890H890"/>`;
  nm.forEach(([n, kind], i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const x = 40 + col * 215;
    const yb = 290 + row * 300;
    const w = 150;
    const h = [180, 140, 200, 160][(i * 7) % 4];
    let d;
    if (kind === 'can') d = `M${x} ${yb - h + 14}v${h - 14}h${w}v${-(h - 14)}M${x} ${yb - h + 14}c0 -18 ${w} -18 ${w} 0c0 18 ${-w} 18 ${-w} 0`;
    else if (kind === 'bag') d = `M${x + 10} ${yb}l-10 ${-h + 30}l20 -30h${w - 40}l20 30l-10 ${h - 30}z M${x + 30} ${yb - h + 40}h${w - 60}`;
    else if (kind === 'jar') d = `M${x + 15} ${yb}v${-h + 40}q0 -14 14 -14h${w - 58}q14 0 14 14v${h - 40}z M${x + 30} ${yb - h + 10}h${w - 60}v16h${-(w - 60)}z`;
    else if (kind === 'stack') d = `M${x} ${yb}v-40h${w}v40z M${x + 6} ${yb - 40}v-40h${w - 12}v40z M${x + 12} ${yb - 80}v-40h${w - 24}v40z`;
    else d = `M${x} ${yb}v${-h}h${w}v${h}z M${x} ${yb - h}l20 -24h${w}l-20 24 M${x + w} ${yb}l20 -24v${-h}`;
    svg += `<path class="d" d="${d}"/>`;
    items.push({ n, x: x + w / 2, y: yb - h - 60, row });
  });
  svg += '</svg>';
  shelf.innerHTML = svg;
  shelf.querySelectorAll('path.d').forEach((p, i) => {
    const len = p.getTotalLength ? 2400 : 2400;
    p.style.strokeDasharray = len;
    tl.fromTo(p, { strokeDashoffset: len * 0.55 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', immediateRender: false }, 0.02 * i);
  });
  // etiquetas de cada insumo aparecem quando o scanner passa
  const scanY = { v: -60 };
  const scanBar = $('div', null, shelf, { position: 'absolute', left: '-40px', width: '980px', height: '4px', top: '0', background: AM, boxShadow: '0 0 30px 8px rgba(255,176,32,.5)' });
  tl.fromTo(scanY, { v: -60 }, { v: 920, duration: 2.6, ease: 'none', immediateRender: false }, 0.5);
  L.onFrame(() => { scanBar.style.top = px(scanY.v); scanBar.style.opacity = scanY.v > -50 && scanY.v < 910 ? 1 : 0; });
  items.forEach((it, i) => {
    const lb = $('div', 'lbl3', shelf, { left: px(it.x - 80), top: px(it.y), width: '160px', textAlign: 'center', fontSize: '17px' });
    lb.textContent = it.n;
    hid(lb);
    const t = 0.5 + ((it.y + 60) / 980) * 2.6;
    tl.fromTo(lb, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.5)', immediateRender: false }, t);
    if (i % 4 === 0) L.cue(t, 'beep', { n: it.row });
  });
  const h1 = $('div', 'sg', s1, { position: 'absolute', left: '60px', top: '230px', width: '960px', fontSize: '112px', lineHeight: '1' });
  h1.innerHTML = `DINHEIRO<br><span style="color:${AM}">PARADO?</span>`;
  const h1w = h1.querySelectorAll('br');
  void h1w;
  slam(h1, W(0, 'dinheiro') - 0.05);
  L.cue(W(0, 'dinheiro') - 0.05, 'hit');
  tl.to(h1, { autoAlpha: 0, y: -60, duration: 0.3 }, T(1) - 0.1);
  tl.to(shelf, { y: 900, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, T(1) - 0.1);

  // ---------- S2 · "Leite condensado, chocolate, morango, embalagem… tudo isso é dinheiro." ----------
  const s2 = L.scene(T(1) - 0.05, T(2) - 0.02, world);
  const FK = 1.45;
  const fRows = [[702, 'leite'], [318, 'chocolate'], [750, 'morango'], [462, 'embalagem']];
  const cards = fRows.map(([y, w], i) => {
    const c = L.crop(s2, L.P('d-ficha'), 398, y - 22, 660, 44, { k: FK, cls: 'card3', left: 540 - (660 * FK) / 2, top: 520 + i * 118 });
    const stripe = $('div', null, c, { position: 'absolute', left: '0', top: '0', width: '10px', height: '100%', background: AM, borderRadius: '10px 0 0 10px' });
    void stripe;
    hid(c);
    slideIn(c, W(1, w) - 0.08, i % 2 ? 900 : -900, 0.45);
    L.cue(W(1, w) - 0.08, 'whip', { n: i });
    return c;
  });
  const fT = L.crop(s2, L.P('d-ficha'), 384, 50, 672, 40, { k: 1.25, cls: 'card3', left: 540 - (672 * 1.25) / 2, top: 400, style: { borderRadius: '10px' } });
  hid(fT);
  tl.fromTo(fT, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, T(1) + 0.1);
  // valores em R$ ganham destaque: "tudo isso é dinheiro"
  cards.forEach((c, i) => {
    const ring = $('div', null, s2, { position: 'absolute', left: px(540 - (660 * FK) / 2 + (958 - 398) * FK), top: px(520 + i * 118 - 6), width: px(80 * FK), height: px(44 * FK + 12), border: `4px solid ${AM}`, borderRadius: '12px', boxShadow: '0 0 30px rgba(255,176,32,.5)' });
    hid(ring);
    tl.fromTo(ring, { autoAlpha: 0, scale: 1.5 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, W(1, 'tudo') + i * 0.1);
  });
  L.cue(W(1, 'tudo'), 'coins');
  const h2 = $('div', 'sg', s2, { position: 'absolute', left: '0', width: '1080px', top: '1040px', textAlign: 'center', fontSize: '92px' });
  h2.innerHTML = `TUDO ISSO É <span style="color:${AM}">DINHEIRO</span>`;
  hid(h2);
  slam(h2, W(1, 'dinheiro') - 0.1);
  L.cue(W(1, 'dinheiro') - 0.1, 'impact');
  const fNote = $('div', 'mono', s2, { position: 'absolute', left: '0', width: '1080px', top: '1180px', textAlign: 'center', fontSize: '24px', color: 'rgba(232,241,255,.6)' });
  fNote.textContent = 'insumos da ficha técnica de um bolo · custo por receita';
  hid(fNote);
  tl.to(fNote, { autoAlpha: 1, duration: 0.3 }, W(1, 'tudo'));
  realOn(T(1) + 0.1, T(2) - 0.05);

  // ---------- S3 · "Aqui você vê o valor do seu estoque na hora." ----------
  sweep(T(2));
  const s3 = L.scene(T(2), T(3) - 0.02, world);
  const plate = $('div', null, s3, { position: 'absolute', left: '-180px', top: '600px', width: '1440px', height: '900px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 60px 120px -30px rgba(0,0,0,.8)' });
  L.crop(plate, L.P('d-estoque'), 0, 0, 1440, 900, { k: 1 });
  tl.fromTo(plate, { scale: 0.7, rotateX: 52, rotateZ: -8, y: 200, autoAlpha: 0 }, { scale: 0.72, rotateX: 38, rotateZ: -4, y: 60, autoAlpha: 1, duration: 0.7, ease: 'expo.out', immediateRender: false }, T(2));
  tl.to(plate, { rotateX: 30, rotateZ: 0, duration: 2.4, ease: 'sine.inOut' }, T(2) + 0.7);
  const ve = MP.valorEstoque;
  const VK = 3.9;
  const valor = L.crop(s3, L.P('d-estoque'), ve.x - 14, ve.y - 12, ve.w + 20, ve.h + 24, { k: VK, cls: 'card3', left: 540 - ((ve.w + 20) * VK) / 2, top: 360, style: { borderRadius: '18px' } });
  hid(valor);
  tl.fromTo(valor, { autoAlpha: 0, y: 500, scale: 0.4, rotateX: 50 }, { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: 0.6, ease: 'back.out(1.4)', immediateRender: false }, W(2, 'valor') - 0.15);
  tl.to(valor, { boxShadow: `0 40px 90px -20px rgba(0,0,0,.7), 0 0 0 6px ${AM}`, duration: 0.3 }, W(2, 'estoque'));
  L.cue(W(2, 'valor') - 0.15, 'impact');
  const naHora = $('div', 'callout', s3, { left: '0', width: '1080px', textAlign: 'center', top: '540px', fontSize: '34px' });
  naHora.textContent = '▲ ATUALIZADO NA HORA';
  hid(naHora);
  tl.fromTo(naHora, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, W(2, 'hora') - 0.1);
  L.cue(W(2, 'hora') - 0.1, 'tick');
  realOn(T(2), T(3) - 0.05);

  // ---------- S4 · "E o sistema avisa quando um insumo fica abaixo do mínimo." ----------
  sweep(T(3));
  const s4 = L.scene(T(3), T(4) - 0.02, world);
  const BK = 2.9;
  const badge = L.crop(s4, L.P('d-estoque'), 810, 240, 160, 27, { k: BK, cls: 'card3', left: 540 - (160 * BK) / 2, top: 430, style: { borderRadius: '40px' } });
  hid(badge);
  slam(badge, W(3, 'avisa') - 0.1, { scale: 2 });
  L.cue(W(3, 'avisa') - 0.1, 'alarm');
  const pulse = $('div', null, s4, { position: 'absolute', left: px(540 - (160 * BK) / 2 - 10), top: '420px', width: px(160 * BK + 20), height: px(27 * BK + 20), borderRadius: '60px', border: `4px solid ${RED}` });
  hid(pulse);
  tl.fromTo(pulse, { autoAlpha: 0.9, scale: 1 }, { autoAlpha: 0, scale: 1.35, duration: 0.8, repeat: 3, ease: 'power2.out', immediateRender: false }, W(3, 'avisa'));
  const EK = 2.55;
  const low = L.crop(s4, L.P('d-inicio-full'), 1048, 700, 368, 122, { k: EK, base: B_INI, cls: 'card3', left: 540 - (368 * EK) / 2, top: 640, style: { borderRadius: '22px' } });
  hid(low);
  tl.fromTo(low, { autoAlpha: 0, y: 260, rotateX: 40 }, { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, W(3, 'insumo') - 0.1);
  L.cue(W(3, 'insumo') - 0.1, 'whoosh');
  tl.to(low, { boxShadow: `0 40px 90px -20px rgba(0,0,0,.7), 0 0 0 6px ${RED}, 0 0 80px rgba(255,91,91,.45)`, duration: 0.25, yoyo: true, repeat: 3 }, W(3, 'abaixo') - 0.05);
  L.cue(W(3, 'abaixo') - 0.05, 'alert');
  const lowL = $('div', 'callout', s4, { left: '0', width: '1080px', textAlign: 'center', top: '1000px', color: RED });
  lowL.textContent = '⚠ ABAIXO DO MÍNIMO';
  hid(lowL);
  tl.fromTo(lowL, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, W(3, 'minimo') - 0.1);
  realOn(T(3), T(4) - 0.05);

  // ---------- S5 · "Com a ficha técnica, cada venda dá baixa sozinha nos ingredientes." ----------
  sweep(T(4));
  const s5 = L.scene(T(4), T(5) - 0.02, world);
  const FK2 = 1.38;
  const ficha = L.crop(s5, L.P('d-ficha'), 384, 40, 672, 430, { k: FK2, cls: 'card3', left: 540 - (672 * FK2) / 2, top: 420, style: { borderRadius: '20px' } });
  hid(ficha);
  tl.fromTo(ficha, { autoAlpha: 0, rotateY: 70, x: 300 }, { autoAlpha: 1, rotateY: 0, x: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, W(4, 'ficha') - 0.15);
  L.cue(W(4, 'ficha') - 0.15, 'whoosh');
  const sale = $('div', 'lbl3', s5, { left: '360px', top: '330px', fontSize: '30px', padding: '12px 22px', borderRadius: '8px' });
  sale.textContent = 'VENDA · PEDIDO #298';
  hid(sale);
  slam(sale, W(4, 'venda') - 0.1, { scale: 1.6 });
  L.cue(W(4, 'venda') - 0.1, 'stamp');
  tl.to(ficha, { y: -900, autoAlpha: 0, duration: 0.45, ease: 'power3.in' }, W(4, 'baixa') - 0.2);
  // movimentações reais: as linhas do pedido #298 descem uma a uma
  const MK = 1.25;
  const movL = 540 - (820 * MK) / 2;
  const head = L.crop(s5, L.P('d-estoque-mov'), 280, 150, 820, 32, { k: MK, cls: 'card3', left: movL, top: 470, style: { borderRadius: '12px 12px 0 0' } });
  hid(head);
  tl.fromTo(head, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, W(4, 'baixa'));
  [328, 369, 410, 452, 493, 534].forEach((y, i) => {
    const r = L.crop(s5, L.P('d-estoque-mov'), 280, y - 20, 820, 41, { k: MK, cls: 'card3', left: movL, top: 470 + 32 * MK + i * 41 * MK, style: { borderRadius: i === 5 ? '0 0 12px 12px' : '0' } });
    hid(r);
    const t = W(4, 'baixa') + 0.12 + i * 0.16;
    tl.fromTo(r, { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power3.out', immediateRender: false }, t);
    L.cue(t, 'tick', { n: i });
  });
  const auto = $('div', 'callout', s5, { left: '0', width: '1080px', textAlign: 'center', top: '1010px' });
  auto.textContent = '↓ BAIXA AUTOMÁTICA DOS INSUMOS';
  hid(auto);
  tl.fromTo(auto, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, W(4, 'ingredientes') - 0.1);
  tl.to(sale, { autoAlpha: 0, duration: 0.2 }, W(4, 'baixa'));
  realOn(T(4), T(5) - 0.05);

  // ---------- S6 · "Registre compras, perdas e inventário…" ----------
  sweep(T(5));
  const s6 = L.scene(T(5), T(6) - 0.02, world);
  const AK = 3.7;
  const acts = L.crop(s6, L.P('d-estoque'), 1160, 631, 245, 44, { k: AK, cls: 'card3', left: 540 - (245 * AK) / 2, top: 700, style: { borderRadius: '22px' } });
  tl.fromTo(acts, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, T(5));
  L.cue(T(5), 'whoosh');
  const ax = (x) => 540 - (245 * AK) / 2 + (x - 1160) * AK;
  [[1225, 'compras', 'COMPRA (ENTRADA)', 560], [1299, 'perdas', 'SAÍDA / PERDA', 1000], [1344, 'inventario', 'INVENTÁRIO', 1120]].forEach(([x, w, label, ly], i) => {
    const t = W(5, w) - 0.08;
    const ring = $('div', null, s6, { position: 'absolute', left: px(ax(x) - (i ? 70 : 210)), top: px(700 + 22 * AK - 70), width: px(i ? 140 : 420), height: '140px', borderRadius: '70px', border: `5px solid ${AM}` });
    hid(ring);
    tl.fromTo(ring, { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, t);
    tl.to(ring, { autoAlpha: 0.25, duration: 0.2 }, t + 0.6);
    const lbl = $('div', 'callout', s6, { left: px(Math.max(60, Math.min(1020 - 360, ax(x) - 180))), width: '360px', textAlign: 'center', top: px(ly) });
    lbl.textContent = label;
    const stem = $('div', null, s6, { position: 'absolute', left: px(ax(x) - 2), width: '4px', background: AM, top: px(ly < 700 ? ly + 44 : 700 + 44 * AK + 4), height: px(ly < 700 ? 700 - ly - 44 - 6 : ly - (700 + 44 * AK) - 14) });
    hid(lbl);
    hid(stem);
    tl.fromTo([lbl, stem], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }, t);
    tl.fromTo(lbl, { scale: 1.5 }, { scale: 1, duration: 0.25, ease: 'power4.out', immediateRender: false }, t);
    L.cue(t, 'stamp', { n: i });
  });
  realOn(T(5), T(6) - 0.05);

  // ---------- S7 · "e saiba o custo real de cada produto." ----------
  sweep(T(6));
  const s7 = L.scene(T(6), T(7) - 0.02, world);
  const SK = 1.5;
  const summ = L.crop(s7, L.P('d-ficha'), 384, 50, 672, 175, { k: SK, cls: 'card3', left: 540 - (672 * SK) / 2, top: 480, style: { borderRadius: '20px' } });
  tl.fromTo(summ, { autoAlpha: 0, y: 200 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, T(6));
  const cx = 540 - (672 * SK) / 2 + (721 - 384) * SK;
  const cRing = $('div', null, s7, { position: 'absolute', left: px(cx - 140), top: px(480 + (211 - 50) * SK - 62), width: '280px', height: '110px', borderRadius: '55px', border: `5px solid ${AM}`, boxShadow: '0 0 40px rgba(255,176,32,.5)' });
  hid(cRing);
  slam(cRing, W(6, 'custo') - 0.1, { scale: 1.8 });
  L.cue(W(6, 'custo') - 0.1, 'impact');
  const cl = $('div', 'callout', s7, { left: '0', width: '1080px', textAlign: 'center', top: '860px', fontSize: '36px' });
  cl.textContent = 'CUSTO REAL · POR PRODUTO';
  hid(cl);
  tl.fromTo(cl, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, W(6, 'real'));
  realOn(T(6), T(7) - 0.05);

  // ---------- S8 · CTA "Estoque organizado é menos surpresa e mais controle. Fale com a gente." ----------
  sweep(T(7));
  const s8 = L.scene(T(7), null);
  const ctaA = $('div', 'sg', s8, { position: 'absolute', left: '60px', top: '420px', width: '960px', fontSize: '128px', lineHeight: '0.98' });
  ctaA.innerHTML = `ESTOQUE<br><span style="color:${AM}">ORGANIZADO</span>`;
  hid(ctaA);
  slam(ctaA, W(7, 'estoque') - 0.05);
  L.cue(W(7, 'estoque') - 0.05, 'hit');
  const rowsC = [['−', 'surpresa', 'menos'], ['+', 'controle', 'mais']];
  rowsC.forEach(([sym, word, cueW], i) => {
    const r = $('div', 'mono', s8, { position: 'absolute', left: '64px', top: px(740 + i * 110), font: "800 64px/1 'JetBrains Mono', monospace", color: '#e8f1ff', display: 'flex', gap: '24px', alignItems: 'center' });
    r.innerHTML = `<span style="display:inline-grid;place-items:center;width:84px;height:84px;border-radius:12px;background:${i ? AM : 'rgba(127,180,255,.18)'};color:${i ? NAVY : '#e8f1ff'}">${sym}</span>${word}`;
    hid(r);
    slideIn(r, W(7, cueW) - 0.08, -700, 0.45);
    L.cue(W(7, cueW) - 0.08, 'stamp', { n: i });
  });
  const btn = $('div', null, s8, { position: 'absolute', left: '64px', top: '1080px', padding: '34px 44px', borderRadius: '14px', background: AM, color: NAVY, font: "800 46px/1 'JetBrains Mono', monospace", display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 30px 60px -20px rgba(0,0,0,.6)' });
  btn.innerHTML = `FALE COM A GENTE <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="${NAVY}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
  hid(btn);
  slam(btn, W(7, 'fale') - 0.1, { scale: 0.7 });
  L.cue(W(7, 'fale') - 0.1, 'pop');
  L.tap(s8, 520, 1130, W(7, 'gente') + 0.5);
  tl.to(btn, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, W(7, 'gente') + 0.5);
  const sub = $('div', 'mono', s8, { position: 'absolute', left: '64px', top: '1240px', width: '950px', font: "600 30px/1.4 'JetBrains Mono', monospace", color: 'rgba(232,241,255,.7)' });
  sub.textContent = 'Estoque, ficha técnica e CMV para docerias.';
  hid(sub);
  tl.to(sub, { autoAlpha: 1, duration: 0.4 }, W(7, 'gente'));

  L.drift(s5, { amp: 4, scale: 0.006, push: [W(4, 'baixa') + 0.8, T(5), 0.025] });
  L.drift(s7, { amp: 6, scale: 0.01, push: [T(6), T(7), 0.05] });
  L.drift(s8, { amp: 5, scale: 0.008, push: [T(7), D, 0.06] });
  const capLayer = $('div', 'full', ui);
  L.captions(capLayer, { maxWords: 3, top: 1500, cls: 'v3', hideIn: [[T(7) - 0.1, D + 1]] });
  L.cue(D - 2.4, 'tail');
  L.finish();
})();
