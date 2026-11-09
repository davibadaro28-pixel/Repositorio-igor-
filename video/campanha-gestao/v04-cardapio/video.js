// V04 · "Seus doces merecem mais" — vitrine e experiência de compra.
// Creme, rosé e chocolate, estilo revista; Playfair Display itálica; movimentos lentos e macios.
(() => {
  const ROSE = '#c25b74';
  const CHOC = '#3b2320';
  const CREAM = '#f7efe6';
  L.init({ bg: CREAM, grain: 0.045, vignette: 0.16 });
  const { tl, $, px } = L;
  const T = L.n;
  const W = L.wt;
  const D = L.D;
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const soft = (el, t, from = {}, d = 0.9) => tl.fromTo(el, { autoAlpha: 0, y: 50, ...from }, { autoAlpha: 1, y: 0, x: 0, scale: 1, rotate: 0, filter: 'blur(0px)', duration: d, ease: 'power3.out', immediateRender: false }, t);

  // fundo: papel creme com manchas rosadas que respiram
  const b1 = $('div', 'glow', L.bg, { width: '1100px', height: '1100px', left: '-380px', top: '-200px', background: 'radial-gradient(circle, rgba(241,201,201,.75), rgba(241,201,201,0) 62%)' });
  const b2 = $('div', 'glow', L.bg, { width: '1200px', height: '1200px', left: '380px', top: '1000px', background: 'radial-gradient(circle, rgba(232,190,160,.55), rgba(232,190,160,0) 62%)' });
  L.onFrame((t) => { b1.style.transform = `translate(${Math.sin(t * 0.3) * 60}px, ${Math.cos(t * 0.25) * 50}px)`; b2.style.transform = `translate(${Math.cos(t * 0.2) * 70}px, ${Math.sin(t * 0.3) * 40}px)`; });

  const world = $('div', 'world', L.layers);
  const ui = $('div', 'full', L.frame, { pointerEvents: 'none' });
  const tagIl = L.tag(ui, 'Ilustração', { left: 60, top: 150, bg: '#fff', color: CHOC, dot: '#d9a441', style: { fontSize: '21px', boxShadow: '0 6px 20px rgba(59,35,32,.1)' } });
  const tagReal = L.tag(ui, 'Cardápio real · dados de demonstração', { left: 60, top: 150, bg: '#fff', color: CHOC, dot: ROSE, style: { fontSize: '21px', boxShadow: '0 6px 20px rgba(59,35,32,.1)' } });
  const tagOn = (tag, a, b) => tl.to(tag, { autoAlpha: 1, duration: 0.3 }, a).to(tag, { autoAlpha: 0, duration: 0.25 }, b);

  // ---------- S1 · "Seus doces podem ser incríveis…" ----------
  const s1 = L.scene(0, T(1) + 0.9);
  const arch = $('div', 'soft', s1, { position: 'absolute', left: '150px', top: '300px', width: '780px', height: '980px', borderRadius: '390px 390px 28px 28px', overflow: 'hidden', background: '#eadbd0' });
  const p1 = L.img(arch, L.F('bombom-de-morango-leite-ninho'), 980, 980, { position: 'absolute', left: '-100px', top: '0', objectFit: 'cover' });
  const p2 = L.img(arch, L.F('bolo-premium-ninho-com-morango'), 980, 980, { position: 'absolute', left: '-100px', top: '0', objectFit: 'cover' });
  tl.fromTo(p1, { scale: 1.25, x: 40 }, { scale: 1.08, x: -20, duration: 2.2, ease: 'none', immediateRender: false }, 0);
  hid(p2);
  tl.fromTo(p2, { autoAlpha: 0, scale: 1.2 }, { autoAlpha: 1, scale: 1.05, duration: 2.6, ease: 'sine.out', immediateRender: false }, W(0, 'podem'));
  tl.fromTo(arch, { y: 40 }, { y: 0, duration: 2, ease: 'sine.out', immediateRender: false }, 0);
  L.cue(0, 'bell');
  const t1 = $('div', 'serif', s1, { position: 'absolute', left: '0', width: '1080px', top: '1320px', textAlign: 'center', fontSize: '72px', fontWeight: '500' });
  t1.textContent = 'Seus doces podem ser';
  const t2 = $('div', 'ital', s1, { position: 'absolute', left: '0', width: '1080px', top: '1405px', textAlign: 'center', fontSize: '150px', color: ROSE, lineHeight: '1' });
  t2.textContent = 'incríveis…';
  soft(t1, 0.15, { y: 30 }, 0.8);
  hid(t2);
  soft(t2, W(0, 'incriveis') - 0.15, { y: 40, filter: 'blur(14px)' }, 1.0);
  L.cue(W(0, 'incriveis') - 0.15, 'shimmer');
  tl.to([t1, t2], { autoAlpha: 0, y: -30, duration: 0.5 }, T(1) - 0.3);
  tl.to(arch, { x: -330, scale: 0.62, rotate: -4, duration: 1.0, ease: 'power3.inOut' }, T(1) - 0.3);
  tl.to(arch, { autoAlpha: 0, duration: 0.5 }, T(1) + 0.4);

  // ---------- S2/S3 · conversa genérica: foto borrada, lista de preços, pedido perdido ----------
  const s2 = L.scene(T(1) - 0.3, T(3) - 0.02, world);
  const ph = L.phone(s2, '#efe9e3');
  ph.el.querySelector('.sb-time').style.color = '#222';
  ph.el.querySelector('.sb-icons svg').setAttribute('fill', '#222');
  ph.view.style.background = '#f3efe9';
  const head = $('div', null, ph.view, { left: '0', top: '0', width: '390px', height: '64px', background: '#efe9e3', borderBottom: '1px solid #ddd5cc', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px' });
  head.innerHTML = `<div style="width:38px;height:38px;border-radius:50%;background:#cfc6bd"></div><div style="font:600 19px 'DM Sans';color:#222">Cliente</div>`;
  head.style.position = 'absolute';
  const feed = $('div', null, ph.view, { left: '0', top: '64px', width: '390px', height: '733px', overflow: 'hidden' });
  const col = $('div', null, feed, { position: 'absolute', left: '0', top: '0', width: '390px' });
  const msgs = [];
  let my = 20;
  const bubble = (cls, html, t, h, extra = {}) => {
    const b = $('div', `bub ${cls}`, col, { top: px(my), ...extra });
    b.innerHTML = html;
    my += h + 12;
    hid(b);
    tl.fromTo(b, { autoAlpha: 0, scale: 0.8, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, t);
    L.cue(t, 'bubble', { n: msgs.length });
    msgs.push(b);
    return b;
  };
  const blurPhoto = `<div style="width:240px;height:240px;border-radius:14px;overflow:hidden;background:#ccc"><img src="${L.F('bolo-de-chocolate-com-calda')}" style="width:240px;height:240px;object-fit:cover;filter:blur(6px) saturate(.55) brightness(.85) contrast(.8);transform:rotate(-4deg) scale(1.15)"></div>`;
  const list = `<div style="width:230px;padding:6px 2px">${[150, 120, 170, 100, 140, 125, 160].map((w) => `<div style="height:12px;width:${w}px;background:#b9b0a7;border-radius:6px;margin:9px 0;filter:blur(1.5px)"></div>`).join('')}</div>`;
  bubble('in', 'Oi! Vocês têm cardápio?', W(1, 'mas'), 50);
  const bPhoto = bubble('out', blurPhoto, W(1, 'cardapio'), 264, { padding: '8px' });
  bubble('in', 'Qual o valor desse?', W(1, 'valorizando'), 50);
  const bList = bubble('out', list, W(1, 'produtos') - 0.1, 160, { padding: '8px 12px' });
  const tFlood = W(2, 'pedido') - 0.2;
  const lost = bubble('in', 'Quero encomendar 1 bolo pra sábado!', tFlood - 0.5, 74);
  ['Tem de morango?', 'Entrega no meu bairro?', 'Aceita pix?', 'Oi??', 'Alguém aí?', 'Vou ver em outro lugar…'].forEach((m, i) => bubble(i % 2 ? 'in' : 'in', m, tFlood + i * 0.22, 50));
  // a conversa rola e o pedido some
  const scrollY = { v: 0 };
  tl.to(scrollY, { v: -260, duration: 0.6, ease: 'power2.inOut' }, W(1, 'produtos') + 0.1);
  tl.to(scrollY, { v: -560, duration: 1.5, ease: 'power2.inOut' }, tFlood);
  L.onFrame(() => { col.style.transform = `translateY(${scrollY.v}px)`; });
  tl.fromTo(ph.el, { x: 700, rotateY: -30, autoAlpha: 0 }, { x: 140, rotateY: -14, autoAlpha: 1, duration: 1.0, ease: 'power3.out', immediateRender: false }, T(1) - 0.3);
  tl.to(ph.el, { x: 0, rotateY: 0, duration: 0.8, ease: 'power2.inOut' }, W(2, 'foto') - 0.6);
  tl.to(bPhoto.querySelector('img'), { filter: 'blur(14px) saturate(.4) brightness(.8) contrast(.7)', duration: 0.6 }, W(2, 'borrada') - 0.2);
  // anotações à mão
  const note = (txt, t, x, y, rot) => {
    const n = $('div', 'note', s2, { left: px(x), top: px(y), transform: `rotate(${rot}deg)` });
    n.textContent = txt;
    hid(n);
    tl.fromTo(n, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, t);
    L.cue(t, 'scribble');
    return n;
  };
  note('foto borrada', W(2, 'foto') - 0.05, 40, 640, -6);
  note('lista de preços', W(2, 'lista') - 0.05, 775, 900, 4);
  note('pedido perdido…', W(2, 'perdido') - 0.05, 40, 1150, -3);
  // o pedido que se perde: anel vermelho que some junto
  const ring = $('div', null, lost, { position: 'absolute', inset: '-8px', borderRadius: '24px', border: '3px dashed #c0392b' });
  hid(ring);
  tl.to(ring, { autoAlpha: 1, duration: 0.2 }, tFlood - 0.3);
  tl.to(lost, { opacity: 0.35, duration: 0.6 }, W(2, 'perdido'));
  void bList;
  tagOn(tagIl, T(1), T(3) - 0.2);
  tl.to(ph.el, { y: 300, autoAlpha: 0, filter: 'blur(10px)', duration: 0.6, ease: 'power2.in' }, T(3) - 0.5);

  // ---------- S4 · "Agora imagine a sua vitrine assim:" (cortina de seda) ----------
  const curtain = $('div', 'full', L.layers, { background: `linear-gradient(180deg, #fbf5ee 0%, #f3e3d8 100%)` });
  tl.fromTo(curtain, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power3.inOut', immediateRender: false }, T(3) - 0.35);
  tl.set(curtain, { clipPath: 'inset(0 0 100% 0)' }, 0);
  tl.to(curtain, { autoAlpha: 0, duration: 0.6 }, T(3) + 0.45);
  L.cue(T(3) - 0.35, 'silk');
  const s4 = L.scene(T(3) + 0.3, T(5) - 0.02, world);
  const ph2 = L.phone(s4, '#7d2949');
  const v = { top: L.img(ph2.view, L.M('menu-top'), 390, 797) };
  tl.fromTo(ph2.el, { y: 500, rotateX: 25, scale: 0.85, autoAlpha: 0 }, { y: 40, rotateX: 6, scale: 1, autoAlpha: 1, duration: 1.1, ease: 'power3.out', immediateRender: false }, T(3) + 0.3);
  tl.fromTo(ph2.sweep, { x: 0 }, { x: 900, duration: 1.1, ease: 'power2.inOut', immediateRender: false }, W(3, 'vitrine') - 0.2);
  L.cue(W(3, 'vitrine') - 0.2, 'sparkle');
  const h4 = $('div', 'ital', s4, { position: 'absolute', left: '0', width: '1080px', top: '230px', textAlign: 'center', fontSize: '92px', color: CHOC, lineHeight: '1.05' });
  h4.innerHTML = `Agora, imagine<br><span style="color:${ROSE}">a sua vitrine assim.</span>`;
  hid(h4);
  soft(h4, W(3, 'agora') - 0.1, { filter: 'blur(10px)' }, 0.9);
  tl.to(h4, { autoAlpha: 0, y: -30, duration: 0.4 }, T(4) - 0.1);
  tagOn(tagReal, T(3) + 0.6, T(7) - 0.3);

  // ---------- S5 · "Com a sua marca, as suas cores e as suas fotos." ----------
  const fan = $('div', 'full', s4);
  const themes = [['theme-1', '#7d2949', -16, 190], ['theme-2', '#5a3a2a', -6, 410], ['theme-3', '#24574b', 6, 670], ['theme-4', '#8d3f22', 16, 890]];
  const TK = 0.6;
  const fanEls = themes.map(([img, c, rot, cx], i) => {
    const card = $('div', 'soft', fan, { position: 'absolute', left: px(cx - (390 * TK) / 2), top: px(560), width: px(390 * TK), height: px(797 * TK), borderRadius: '26px', overflow: 'hidden', background: '#fff' });
    L.img(card, L.M(img), 390 * TK, 797 * TK);
    const sw = $('div', null, fan, { position: 'absolute', left: px(cx - 30), top: px(560 + 797 * TK + 50), width: '60px', height: '60px', borderRadius: '50%', background: c, boxShadow: '0 0 0 6px #fff, 0 10px 20px rgba(0,0,0,.15)' });
    hid(card);
    hid(sw);
    tl.fromTo(card, { autoAlpha: 0, x: 540 - cx, rotate: 0, y: 80, scale: 0.9 }, { autoAlpha: 1, x: 0, rotate: rot, y: Math.abs(rot) * 3, scale: 1, duration: 0.8, ease: 'back.out(1.3)', immediateRender: false }, W(4, 'marca') - 0.25 + i * 0.07);
    tl.fromTo(sw, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(3)', immediateRender: false }, W(4, 'cores') - 0.1 + i * 0.1);
    return card;
  });
  L.cue(W(4, 'marca') - 0.25, 'fan');
  L.cue(W(4, 'cores') - 0.1, 'chimes', { n: 4 });
  tl.to(ph2.el, { y: 900, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, W(4, 'marca') - 0.4);
  const h5 = $('div', 'ital', s4, { position: 'absolute', left: '0', width: '1080px', top: '300px', textAlign: 'center', fontSize: '84px', color: CHOC });
  h5.innerHTML = `a sua marca, <span style="color:${ROSE}">o seu jeito</span>`;
  hid(h5);
  soft(h5, W(4, 'marca'), {}, 0.7);
  // "as suas fotos": mergulho num mosaico de fotos reais do cardápio
  tl.to(fanEls.concat([h5]), { autoAlpha: 0, scale: 0.9, duration: 0.45, ease: 'power2.in' }, W(4, 'fotos') - 0.45);
  tl.to(fan.querySelectorAll('div[style*="border-radius: 50%"]'), { autoAlpha: 0, duration: 0.3 }, W(4, 'fotos') - 0.45);
  const strip = $('div', 'soft', s4, { position: 'absolute', left: '90px', top: '420px', width: '900px', height: '980px', borderRadius: '30px', overflow: 'hidden', background: '#fff' });
  const stripImg = L.crop(strip, L.M('menu-strip'), 0, 470, 390, 425, { base: [390, 3600], k: 900 / 390 });
  hid(strip);
  tl.fromTo(strip, { autoAlpha: 0, scale: 1.15 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power3.out', immediateRender: false }, W(4, 'fotos') - 0.2);
  tl.fromTo(stripImg, { y: 0 }, { y: -260, duration: 1.6, ease: 'sine.inOut', immediateRender: false }, W(4, 'fotos') - 0.2);
  L.cue(W(4, 'fotos') - 0.2, 'whoosh');
  tl.to(strip, { autoAlpha: 0, scale: 0.92, duration: 0.4 }, T(5) - 0.3);

  // ---------- S6 · "Categorias organizadas, tamanhos, encomenda com data e hora…" ----------
  const s6 = L.scene(T(5) - 0.3, T(7) - 0.02, world);
  const ph3 = L.phone(s6, '#7d2949');
  const lay = (name) => { const im = L.img(ph3.view, L.M(name), 390, 797); hid(im); return im; };
  const base6 = L.img(ph3.view, L.M('menu-top'), 390, 797);
  tl.fromTo(ph3.el, { y: 700, autoAlpha: 0 }, { y: 30, autoAlpha: 1, duration: 0.7, ease: 'power3.out', immediateRender: false }, T(5) - 0.3);
  L.cue(T(5) - 0.3, 'whoosh');
  // categorias: a barra de navegação troca de seção
  const navs = ['nav-sec-bolos', 'nav-sec-fatias-e-potes', 'nav-sec-docinhos'];
  const mv = { y: 0 };
  tl.to(mv, { y: -2300, duration: 1.6, ease: 'power2.inOut' }, W(5, 'categorias') - 0.05);
  const runner = L.crop(ph3.view, L.M('menu-strip'), 0, 157, 390, 3600 - 157, { base: [390, 3600], k: 1, top: 0 });
  hid(runner);
  tl.set(runner, { autoAlpha: 1 }, W(5, 'categorias') - 0.05);
  L.onFrame(() => { runner.style.transform = `translateY(${mv.y * 0.6}px)`; });
  navs.forEach((n, i) => {
    const im = L.crop(ph3.view, L.M(n), 0, 0, 390, 57, { base: [390, 57], k: 1, top: 0 });
    hid(im);
    const t = W(5, 'categorias') + i * 0.38;
    tl.set(im, { autoAlpha: 1 }, t);
    if (i < navs.length - 1) tl.set(im, { autoAlpha: 0 }, t + 0.38);
    L.cue(t, 'tick', { n: i });
  });
  tl.set(ph3.view.querySelectorAll('.crop'), { autoAlpha: 0 }, W(5, 'tamanhos') - 0.2);
  // tamanhos
  const pr1 = lay('product-1');
  const pr2 = lay('product-2');
  tl.fromTo(pr1, { autoAlpha: 1, y: 797 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, W(5, 'tamanhos') - 0.25);
  L.tap(ph3.view, 195, 646, W(5, 'tamanhos') + 0.35);
  tl.set(pr2, { autoAlpha: 1 }, W(5, 'tamanhos') + 0.42);
  // encomenda com data e hora
  const ck0 = lay('checkout-0');
  const ck1 = lay('checkout-1');
  tl.fromTo(ck0, { autoAlpha: 1, y: 797 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, W(5, 'encomenda') - 0.3);
  L.tap(ph3.view, 284, 452, W(5, 'encomenda') + 0.35);
  tl.set(ck1, { autoAlpha: 1 }, W(5, 'encomenda') + 0.42);
  const dt = $('div', null, ph3.view, { left: '12px', top: '500px', width: '366px', height: '62px', borderRadius: '14px', border: `3px solid ${ROSE}`, boxShadow: '0 0 0 6px rgba(194,91,116,.18)' });
  hid(dt);
  tl.fromTo(dt, { autoAlpha: 0, scale: 1.15 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, W(5, 'data') - 0.05);
  L.cue(W(5, 'data') - 0.05, 'chime');
  const labels6 = [['categorias', 'Categorias'], ['tamanhos', 'Tamanhos'], ['encomenda', 'Encomenda com data e hora']];
  labels6.forEach(([w, txt], i) => {
    const l = $('div', 'ital', s6, { position: 'absolute', left: '0', width: '1080px', top: '300px', textAlign: 'center', fontSize: '70px', color: ROSE });
    l.textContent = txt;
    hid(l);
    soft(l, W(5, w) - 0.1, { y: 20 }, 0.5);
    const end = i < 2 ? W(5, labels6[i + 1][0]) - 0.15 : T(6) - 0.1;
    tl.to(l, { autoAlpha: 0, y: -20, duration: 0.25 }, end);
  });
  tl.to(ph3.el, { rotateY: -8, duration: 2, ease: 'sine.inOut' }, W(5, 'tamanhos'));
  tl.to(ph3.el, { rotateY: 6, duration: 2, ease: 'sine.inOut' }, W(5, 'encomenda'));

  // ---------- S7 · "e o pedido chega certinho, sem perder nenhuma mensagem." ----------
  L.tap(ph3.view, 195, 760, W(6, 'pedido') - 0.05);
  const tr = lay('track');
  tl.fromTo(tr, { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.35, immediateRender: false }, W(6, 'chega') - 0.1);
  tl.to(dt, { autoAlpha: 0, duration: 0.1 }, W(6, 'chega') - 0.1);
  L.cue(W(6, 'chega') - 0.1, 'success');
  const okRing = $('div', null, ph3.view, { left: '12px', top: '72px', width: '366px', height: '96px', borderRadius: '18px', border: '3px solid #2f9e6b', boxShadow: '0 0 0 8px rgba(47,158,107,.18)' });
  hid(okRing);
  tl.fromTo(okRing, { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, W(6, 'certinho') - 0.05);
  const encRing = $('div', null, ph3.view, { left: '12px', top: '188px', width: '366px', height: '52px', borderRadius: '14px', border: `3px solid ${ROSE}` });
  hid(encRing);
  tl.fromTo(encRing, { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, W(6, 'certinho') + 0.35);
  // as bolhas soltas vão embora: nada se perde
  const gone = $('div', 'full', s6);
  ['Oi??', 'Qual o valor?', 'Alguém aí?', 'Tem pra sábado?'].forEach((m, i) => {
    const b = $('div', 'bub in', gone, { left: px(i % 2 ? 700 : 70), top: px(560 + i * 170), fontSize: '26px', maxWidth: '320px' });
    b.textContent = m;
    hid(b);
    tl.fromTo(b, { autoAlpha: 0.95, scale: 1, x: 0 }, { autoAlpha: 0, scale: 0.6, x: i % 2 ? 300 : -300, filter: 'blur(8px)', duration: 0.7, ease: 'power2.in', immediateRender: false }, W(6, 'sem') + i * 0.12);
  });
  L.cue(W(6, 'sem'), 'poof');
  const h7 = $('div', 'ital', s6, { position: 'absolute', left: '0', width: '1080px', top: '300px', textAlign: 'center', fontSize: '76px', color: '#2f7d59' });
  h7.textContent = 'Pedido certinho.';
  hid(h7);
  soft(h7, W(6, 'certinho') - 0.1, {}, 0.6);
  tl.to(ph3.el, { rotateY: 0, scale: 1.02, duration: 1.5, ease: 'sine.inOut' }, W(6, 'chega'));

  // ---------- S8 · "Quem vê, tem vontade. Crie o seu cardápio personalizado." ----------
  const s8 = L.scene(T(7) - 0.3, null);
  const cream = $('div', 'full', s8, { background: CREAM });
  tl.fromTo(cream, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 0.8, ease: 'power3.inOut', immediateRender: false }, T(7) - 0.3);
  L.cue(T(7) - 0.3, 'silk');
  const pics = ['bolo-premium-brigadeiro-com-morango', 'bombom-de-morango-chocolate', 'brownie-ninho-com-nutella', 'bolo-no-pote-ninho-com-morango', 'bolo-premium-ninho-com-morango', 'cookie-nutella', 'bolo-gelado-prestigio', 'coxinha-ninho-com-morango', 'bolo-de-cenoura-com-calda'];
  const G = 300;
  const gap = 18;
  const gx = (1080 - 3 * G - 2 * gap) / 2;
  pics.forEach((p, i) => {
    const c = $('div', null, s8, { position: 'absolute', left: px(gx + (i % 3) * (G + gap)), top: px(240 + Math.floor(i / 3) * (G + gap)), width: px(G), height: px(G), borderRadius: i === 4 ? '150px' : '22px', overflow: 'hidden', boxShadow: '0 20px 40px -20px rgba(59,35,32,.5)' });
    L.img(c, L.F(p), G, G, { objectFit: 'cover' });
    hid(c);
    tl.fromTo(c, { autoAlpha: 0, scale: 0.7, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.6)', immediateRender: false }, T(7) - 0.1 + [4, 1, 3, 2, 0, 5, 7, 6, 8][i] * 0.06);
  });
  L.cue(T(7) - 0.1, 'chimes', { n: 9 });
  const q = $('div', 'ital', s8, { position: 'absolute', left: '0', width: '1080px', top: '1250px', textAlign: 'center', fontSize: '96px', color: CHOC, lineHeight: '1' });
  q.innerHTML = `Quem vê, <span style="color:${ROSE}">tem vontade.</span>`;
  hid(q);
  soft(q, W(7, 'quem') - 0.05, { filter: 'blur(10px)' }, 0.8);
  const btn = $('div', null, s8, { position: 'absolute', left: '140px', top: '1420px', width: '800px', padding: '32px 30px', borderRadius: '999px', background: ROSE, color: '#fff', textAlign: 'center', font: "700 42px/1 'DM Sans'", boxShadow: '0 30px 60px -20px rgba(194,91,116,.6)' });
  btn.textContent = 'Crie o seu cardápio personalizado';
  hid(btn);
  tl.fromTo(btn, { autoAlpha: 0, scale: 0.8, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.8)', immediateRender: false }, W(7, 'crie') - 0.1);
  L.cue(W(7, 'crie') - 0.1, 'pop');
  L.tap(s8, 700, 1462, W(7, 'personalizado') + 0.4);
  tl.to(btn, { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1 }, W(7, 'personalizado') + 0.4);
  const sub = $('div', 'dm', s8, { position: 'absolute', left: '0', width: '1080px', top: '1560px', textAlign: 'center', font: "600 30px/1.3 'DM Sans'", color: 'rgba(59,35,32,.7)' });
  sub.textContent = 'Com a sua marca, as suas cores e as suas fotos.';
  hid(sub);
  tl.to(sub, { autoAlpha: 1, duration: 0.5 }, W(7, 'personalizado'));

  const capLayer = $('div', 'full', ui);
  L.captions(capLayer, { maxWords: 4, top: 1500, cls: 'v4', hideIn: [[0, T(1) - 0.05], [T(5) - 0.3, T(6) - 0.1], [T(7) - 0.3, D + 1]] });
  L.cue(D - 2.4, 'tail');
  L.finish();
})();
