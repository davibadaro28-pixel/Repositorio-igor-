// Tema "cardapio" (V04): creme, rosé e chocolate, estilo revista; Playfair Display itálica; movimentos lentos e macios.
window.TEMA = (() => {
  const ROSE = '#c25b74';
  const CHOC = '#3b2320';
  const CREAM = '#f7efe6';
  const M = {};
  let tl, $, px, world, ui, tagIl, tagReal;
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const soft = (el, t, from = {}, d = 0.9) => tl.fromTo(el, { autoAlpha: 0, y: 50, ...from }, { autoAlpha: 1, y: 0, x: 0, scale: 1, rotate: 0, filter: 'blur(0px)', duration: d, ease: 'power3.out', immediateRender: false }, t);
  const float = (s, pushes = []) => L.drift(s, { amp: 10, scale: 0.015, pushes });

  M.init = () => {
    L.init({ bg: CREAM, grain: 0.045, vignette: 0.16 });
    ({ tl, $, px } = L);
    const b1 = $('div', 'glow', L.bg, { width: '1100px', height: '1100px', left: '-380px', top: '-200px', background: 'radial-gradient(circle, rgba(241,201,201,.75), rgba(241,201,201,0) 62%)' });
    const b2 = $('div', 'glow', L.bg, { width: '1200px', height: '1200px', left: '380px', top: '1000px', background: 'radial-gradient(circle, rgba(232,190,160,.55), rgba(232,190,160,0) 62%)' });
    L.onFrame((t) => { b1.style.transform = `translate(${Math.sin(t * 0.3) * 60}px, ${Math.cos(t * 0.25) * 50}px)`; b2.style.transform = `translate(${Math.cos(t * 0.2) * 70}px, ${Math.sin(t * 0.3) * 40}px)`; });
    world = $('div', 'world', L.layers);
    ui = $('div', 'full', L.frame, { pointerEvents: 'none' });
    tagIl = L.tag(ui, 'Ilustração', { left: 60, top: 150, bg: '#fff', color: CHOC, dot: '#d9a441', style: { fontSize: '21px', boxShadow: '0 6px 20px rgba(59,35,32,.1)' } });
    tagReal = L.tag(ui, 'Cardápio real · dados de demonstração', { left: 60, top: 150, bg: '#fff', color: CHOC, dot: ROSE, style: { fontSize: '21px', boxShadow: '0 6px 20px rgba(59,35,32,.1)' } });
    return { T: L.n, W: L.wt, E: L.nEnd, D: L.D };
  };
  const tagOn = (tag, a, b) => tl.to(tag, { autoAlpha: 1, duration: 0.3 }, a).to(tag, { autoAlpha: 0, duration: 0.25 }, b);
  M.ilustra = (a, b) => tagOn(tagIl, a, b);
  M.real = (a, b) => tagOn(tagReal, a, b);

  // cortina de seda creme que cobre a cena (transição)
  M.cortina = (t) => {
    const c = $('div', 'full', L.layers, { background: 'linear-gradient(180deg, #fbf5ee 0%, #f3e3d8 100%)' });
    tl.set(c, { clipPath: 'inset(0 0 100% 0)' }, 0);
    tl.fromTo(c, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power3.inOut', immediateRender: false }, t - 0.35);
    tl.to(c, { autoAlpha: 0, duration: 0.6 }, t + 0.45);
    L.cue(t - 0.35, 'silk');
  };

  // arco editorial com fotos reais que se fundem; textos serifados embaixo
  M.arco = (a, b, o) => {
    const s = L.scene(a, b);
    const arch = $('div', 'soft', s, { position: 'absolute', left: '150px', top: '300px', width: '780px', height: '980px', borderRadius: '390px 390px 28px 28px', overflow: 'hidden', background: '#eadbd0' });
    o.fotos.forEach(([t, f], i) => {
      const im = L.img(arch, L.F(f), 980, 980, { position: 'absolute', left: '-100px', top: '0', objectFit: 'cover' });
      if (i === 0) tl.fromTo(im, { scale: 1.25, x: 40 }, { scale: 1.06, x: -20, duration: b - a + 0.5, ease: 'none', immediateRender: false }, a);
      else { hid(im); tl.fromTo(im, { autoAlpha: 0, scale: 1.2 }, { autoAlpha: 1, scale: 1.05, duration: 1.4, ease: 'sine.out', immediateRender: false }, t); L.cue(t, 'shimmer'); }
    });
    tl.fromTo(arch, { y: 40 }, { y: 0, duration: 2, ease: 'sine.out', immediateRender: false }, a);
    if (a < 0.1) L.cue(0, 'bell');
    L.linhas(s, o.linhas, { cls: 'serif', top: o.top ?? 1320, line: { fontSize: '72px', fontWeight: '500', lineHeight: '1.08' }, dy: 30, scale: 1, dur: 0.8, ease: 'power3.out', cue: 'chime' });
    tl.to(arch, { x: -330, scale: 0.62, rotate: -4, autoAlpha: 0, duration: 0.9, ease: 'power3.inOut' }, b - 0.6);
    float(s, [[a, b, 0.05]]);
    return s;
  };

  // conversa genérica bagunçada (ilustração): bolhas nos tempos dados, foto borrada, lista, pedido perdido
  M.conversa = (a, b, o) => {
    const s = L.scene(a, b, world);
    const ph = L.phone(s, '#efe9e3');
    ph.el.querySelector('.sb-time').style.color = '#222';
    ph.el.querySelector('.sb-icons svg').setAttribute('fill', '#222');
    ph.view.style.background = '#f3efe9';
    const head = $('div', null, ph.view, { position: 'absolute', left: '0', top: '0', width: '390px', height: '64px', background: '#efe9e3', borderBottom: '1px solid #ddd5cc', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px' });
    head.innerHTML = "<div style=\"width:38px;height:38px;border-radius:50%;background:#cfc6bd\"></div><div style=\"font:600 19px 'DM Sans';color:#222\">Cliente</div>";
    const feed = $('div', null, ph.view, { left: '0', top: '64px', width: '390px', height: '733px', overflow: 'hidden' });
    const col = $('div', null, feed, { position: 'absolute', left: '0', top: '0', width: '390px' });
    let my = 20;
    const blur = `<div style="width:240px;height:240px;border-radius:14px;overflow:hidden;background:#ccc"><img src="${L.F('bolo-de-chocolate-com-calda')}" style="width:240px;height:240px;object-fit:cover;filter:blur(6px) saturate(.55) brightness(.85) contrast(.8);transform:rotate(-4deg) scale(1.15)"></div>`;
    const list = `<div style="width:230px;padding:6px 2px">${[150, 120, 170, 100, 140, 125, 160].map((w) => `<div style="height:12px;width:${w}px;background:#b9b0a7;border-radius:6px;margin:9px 0;filter:blur(1.5px)"></div>`).join('')}</div>`;
    let photoEl = null;
    let lost = null;
    o.bolhas.forEach(([t, cls, html], i) => {
      const kind = html === '@foto' ? 'foto' : html === '@lista' ? 'lista' : 'txt';
      const h = kind === 'foto' ? 264 : kind === 'lista' ? 160 : html.length > 28 ? 74 : 50;
      const bb = $('div', `bub ${cls}`, col, { top: px(my), ...(kind !== 'txt' ? { padding: '8px' } : {}) });
      bb.innerHTML = kind === 'foto' ? blur : kind === 'lista' ? list : html;
      if (kind === 'foto') photoEl = bb;
      if (o.perdido && html === o.perdido[1]) lost = bb;
      my += h + 12;
      hid(bb);
      tl.fromTo(bb, { autoAlpha: 0, scale: 0.8, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, t);
      L.cue(t, 'bubble', { n: i });
    });
    const sy = { v: 0 };
    (o.rolagem || []).forEach(([t, v, d]) => tl.to(sy, { v, duration: d, ease: 'power2.inOut' }, t));
    L.onFrame(() => { col.style.transform = `translateY(${sy.v}px)`; });
    tl.fromTo(ph.el, { x: 700, rotateY: -30, autoAlpha: 0 }, { x: o.x ?? 0, rotateY: o.x ? -14 : 0, autoAlpha: 1, duration: 1.0, ease: 'power3.out', immediateRender: false }, a);
    if (o.centro) tl.to(ph.el, { x: 0, rotateY: 0, duration: 0.8, ease: 'power2.inOut' }, o.centro);
    if (o.borrada && photoEl) tl.to(photoEl.querySelector('img'), { filter: 'blur(14px) saturate(.4) brightness(.8) contrast(.7)', duration: 0.6 }, o.borrada);
    (o.notas || []).forEach(([t, txt, x, y, rot]) => {
      const n = $('div', 'note', s, { left: px(x), top: px(y), transform: `rotate(${rot}deg)` });
      n.textContent = txt;
      hid(n);
      tl.fromTo(n, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, t);
      L.cue(t, 'scribble');
    });
    if (lost) {
      const ring = $('div', null, lost, { position: 'absolute', inset: '-8px', borderRadius: '24px', border: '3px dashed #c0392b' });
      hid(ring);
      tl.to(ring, { autoAlpha: 1, duration: 0.2 }, o.perdido[0] - 0.4);
      tl.to(lost, { opacity: 0.35, duration: 0.6 }, o.perdido[0] + 0.3);
    }
    M.ilustra(a + 0.2, b - 0.2);
    tl.to(ph.el, { y: 300, autoAlpha: 0, filter: 'blur(10px)', duration: 0.6, ease: 'power2.in' }, b - 0.5);
    float(s, [[a + 1, b, 0.06]]);
    return s;
  };

  // vitrine: cortina + celular com o cardápio real e brilho
  M.vitrine = (a, b, o = {}) => {
    M.cortina(a);
    const s = L.scene(a + 0.3, b, world);
    const ph = L.phone(s, '#7d2949');
    L.img(ph.view, L.M('menu-top'), 390, 797);
    tl.fromTo(ph.el, { y: 500, rotateX: 25, scale: 0.85, autoAlpha: 0 }, { y: 40, rotateX: 6, scale: 1, autoAlpha: 1, duration: 1.1, ease: 'power3.out', immediateRender: false }, a + 0.3);
    if (o.brilho) { tl.fromTo(ph.sweep, { x: 0 }, { x: 900, duration: 1.1, ease: 'power2.inOut', immediateRender: false }, o.brilho - 0.2); L.cue(o.brilho - 0.2, 'sparkle'); }
    if (o.titulo) { const h = $('div', 'ital', s, { position: 'absolute', left: '0', width: '1080px', top: '230px', textAlign: 'center', fontSize: '92px', color: CHOC, lineHeight: '1.05' }); h.innerHTML = o.titulo[1]; hid(h); soft(h, o.titulo[0], { filter: 'blur(10px)' }, 0.9); }
    M.real(a + 0.6, b - 0.1);
    float(s, [[a + 1.2, b, 0.05]]);
    return s;
  };

  // as 4 identidades reais em leque, amostras de cor e (opcional) mergulho nas fotos
  M.temas = (a, b, o) => {
    const s = L.scene(a, b, world);
    const themes = [['theme-1', '#7d2949', -16, 190], ['theme-2', '#5a3a2a', -6, 410], ['theme-3', '#24574b', 6, 670], ['theme-4', '#8d3f22', 16, 890]];
    const TK = 0.6;
    const els = [];
    themes.forEach(([img, c, rot, cx], i) => {
      const card = $('div', 'soft', s, { position: 'absolute', left: px(cx - (390 * TK) / 2), top: '560px', width: px(390 * TK), height: px(797 * TK), borderRadius: '26px', overflow: 'hidden', background: '#fff' });
      L.img(card, L.M(img), 390 * TK, 797 * TK);
      const sw = $('div', null, s, { position: 'absolute', left: px(cx - 30), top: px(560 + 797 * TK + 50), width: '60px', height: '60px', borderRadius: '50%', background: c, boxShadow: '0 0 0 6px #fff, 0 10px 20px rgba(0,0,0,.15)' });
      hid(card); hid(sw);
      tl.fromTo(card, { autoAlpha: 0, x: 540 - cx, rotate: 0, y: 80, scale: 0.9 }, { autoAlpha: 1, x: 0, rotate: rot, y: Math.abs(rot) * 3, scale: 1, duration: 0.8, ease: 'back.out(1.3)', immediateRender: false }, o.leque + i * 0.07);
      tl.fromTo(sw, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(3)', immediateRender: false }, (o.cores ?? o.leque + 0.8) + i * 0.1);
      els.push(card, sw);
    });
    L.cue(o.leque, 'fan');
    L.cue(o.cores ?? o.leque + 0.8, 'chimes', { n: 4 });
    const h = $('div', 'ital', s, { position: 'absolute', left: '0', width: '1080px', top: '300px', textAlign: 'center', fontSize: '84px', color: CHOC });
    h.innerHTML = o.titulo || `a sua marca, <span style="color:${ROSE}">o seu jeito</span>`;
    hid(h);
    soft(h, o.leque, {}, 0.7);
    els.push(h);
    if (o.fotos) {
      tl.to(els, { autoAlpha: 0, scale: 0.9, duration: 0.45, ease: 'power2.in' }, o.fotos - 0.45);
      const strip = $('div', 'soft', s, { position: 'absolute', left: '90px', top: '420px', width: '900px', height: '980px', borderRadius: '30px', overflow: 'hidden', background: '#fff' });
      const im = L.crop(strip, L.M('menu-strip'), 0, 470, 390, 425, { base: [390, 3600], k: 900 / 390 });
      hid(strip);
      tl.fromTo(strip, { autoAlpha: 0, scale: 1.15 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power3.out', immediateRender: false }, o.fotos - 0.2);
      tl.fromTo(im, { y: 0 }, { y: -260, duration: Math.max(1.2, b - o.fotos), ease: 'sine.inOut', immediateRender: false }, o.fotos - 0.2);
      L.cue(o.fotos - 0.2, 'whoosh');
    }
    M.real(a, b - 0.1);
    float(s, [[a + 0.8, b, 0.05]]);
    return s;
  };

  // fluxo real no celular: categorias, tamanhos, encomenda com data e hora; opcional: envio e "pedido enviado"
  M.fluxo = (a, b, o) => {
    const s = L.scene(a, b, world);
    const ph = L.phone(s, '#7d2949');
    const lay = (name) => { const im = L.img(ph.view, L.M(name), 390, 797); hid(im); return im; };
    L.img(ph.view, L.M('menu-top'), 390, 797);
    tl.fromTo(ph.el, { y: 700, autoAlpha: 0 }, { y: 30, autoAlpha: 1, duration: 0.7, ease: 'power3.out', immediateRender: false }, a);
    L.cue(a, 'whoosh');
    const rot = [];
    if (o.categorias) {
      const mv = { y: 0 };
      tl.to(mv, { y: -2300, duration: 1.6, ease: 'power2.inOut' }, o.categorias - 0.05);
      const runner = L.crop(ph.view, L.M('menu-strip'), 0, 157, 390, 3600 - 157, { base: [390, 3600], k: 1, top: 0 });
      hid(runner);
      tl.set(runner, { autoAlpha: 1 }, o.categorias - 0.05);
      L.onFrame(() => { runner.style.transform = `translateY(${mv.y * 0.6}px)`; });
      ['nav-sec-bolos', 'nav-sec-fatias-e-potes', 'nav-sec-docinhos'].forEach((n, i, arr) => {
        const im = L.crop(ph.view, L.M(n), 0, 0, 390, 57, { base: [390, 57], k: 1, top: 0 });
        hid(im);
        const t = o.categorias + i * 0.38;
        tl.set(im, { autoAlpha: 1 }, t);
        if (i < arr.length - 1) tl.set(im, { autoAlpha: 0 }, t + 0.38);
        L.cue(t, 'tick', { n: i });
        rot.push(im);
      });
      rot.push(runner);
      rot.label = ['categorias', o.categorias];
    }
    const steps = [];
    if (o.categorias) steps.push([o.categorias, o.rotulos?.categorias ?? 'Categorias']);
    if (o.tamanhos) {
      tl.set(rot, { autoAlpha: 0 }, o.tamanhos - 0.2);
      const p1 = lay('product-1'), p2 = lay('product-2');
      tl.fromTo(p1, { autoAlpha: 1, y: 797 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, o.tamanhos - 0.25);
      L.tap(ph.view, 195, 646, o.tamanhos + 0.35);
      tl.set(p2, { autoAlpha: 1 }, o.tamanhos + 0.42);
      steps.push([o.tamanhos, o.rotulos?.tamanhos ?? 'Tamanhos']);
    }
    let dt = null;
    if (o.encomenda) {
      const c0 = lay('checkout-0'), c1 = lay('checkout-1');
      tl.fromTo(c0, { autoAlpha: 1, y: 797 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, o.encomenda - 0.3);
      L.tap(ph.view, 284, 452, o.encomenda + 0.35);
      tl.set(c1, { autoAlpha: 1 }, o.encomenda + 0.42);
      dt = $('div', null, ph.view, { left: '12px', top: '500px', width: '366px', height: '62px', borderRadius: '14px', border: `3px solid ${ROSE}`, boxShadow: '0 0 0 6px rgba(194,91,116,.18)' });
      hid(dt);
      const td = o.data ?? o.encomenda + 0.7;
      tl.fromTo(dt, { autoAlpha: 0, scale: 1.15 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, td);
      L.cue(td, 'chime');
      steps.push([o.encomenda, o.rotulos?.encomenda ?? 'Encomenda com data e hora']);
    }
    if (o.chega) {
      L.tap(ph.view, 195, 760, o.chega - 0.45);
      const tr = lay('track');
      tl.fromTo(tr, { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.35, immediateRender: false }, o.chega - 0.1);
      if (dt) tl.to(dt, { autoAlpha: 0, duration: 0.1 }, o.chega - 0.1);
      L.cue(o.chega - 0.1, 'success');
      const ok = $('div', null, ph.view, { left: '12px', top: '72px', width: '366px', height: '96px', borderRadius: '18px', border: '3px solid #2f9e6b', boxShadow: '0 0 0 8px rgba(47,158,107,.18)' });
      hid(ok);
      tl.fromTo(ok, { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, o.chega + 0.3);
      const er = $('div', null, ph.view, { left: '12px', top: '188px', width: '366px', height: '52px', borderRadius: '14px', border: `3px solid ${ROSE}` });
      hid(er);
      tl.fromTo(er, { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, o.chega + 0.7);
      steps.push([o.chega, o.rotulos?.chega ?? 'Pedido certinho.', '#2f7d59']);
      if (o.semPerder) {
        const gone = $('div', 'full', s);
        ['Oi??', 'Qual o valor?', 'Alguém aí?', 'Tem pra sábado?'].forEach((m, i) => {
          const bb = $('div', 'bub in', gone, { left: px(i % 2 ? 700 : 70), top: px(560 + i * 170), fontSize: '26px', maxWidth: '320px' });
          bb.textContent = m;
          hid(bb);
          tl.fromTo(bb, { autoAlpha: 0.95, scale: 1, x: 0 }, { autoAlpha: 0, scale: 0.6, x: i % 2 ? 300 : -300, filter: 'blur(8px)', duration: 0.7, ease: 'power2.in', immediateRender: false }, o.semPerder + i * 0.12);
        });
        L.cue(o.semPerder, 'poof');
      }
    }
    steps.forEach(([t, txt, color], i) => {
      const l = $('div', 'ital', s, { position: 'absolute', left: '0', width: '1080px', top: '300px', textAlign: 'center', fontSize: '70px', color: color || ROSE });
      l.textContent = txt;
      hid(l);
      soft(l, t - 0.1, { y: 20 }, 0.5);
      const end = steps[i + 1] ? steps[i + 1][0] - 0.15 : b - 0.1;
      tl.to(l, { autoAlpha: 0, y: -20, duration: 0.25 }, end);
    });
    tl.to(ph.el, { rotateY: -8, duration: 2, ease: 'sine.inOut' }, a + 0.8);
    tl.to(ph.el, { rotateY: 6, duration: 2, ease: 'sine.inOut' }, a + 2.8);
    M.real(a, b - 0.1);
    const tEnd = o.chega ? o.chega + 0.9 : b - 1.5;
    float(s, [[a + 0.8, tEnd, 0.05], [tEnd, b, 0.09]]);
    if (o.chega) tl.to(ph.el, { rotateY: -10, rotateX: 6, duration: Math.max(0.6, b - tEnd), ease: 'sine.inOut' }, tEnd);
    return s;
  };

  // título serifado em linhas
  M.titulo = (a, b, lines, o = {}) => {
    const s = L.scene(a, b);
    L.linhas(s, lines, { cls: 'ital', top: o.top ?? 500, line: { fontSize: o.size ?? '92px', lineHeight: '1.1', color: CHOC }, dy: 30, scale: 1, dur: 0.7, ease: 'power3.out', cue: 'chime' });
    float(s, [[a + 0.3, b, 0.07]]);
    return s;
  };

  M.prova = (a, b) => {
    M.cortina(a);
    const s = L.scene(a + 0.2, b);
    L.prova(s, a + 0.4, { top: 470, numSize: 290, kickFont: "italic 600 40px/1.3 'Playfair Display', serif", kickColor: CHOC, numFont: "italic 700 290px/1 'Playfair Display', serif", numColor: ROSE, lblFont: "italic 600 100px/1 'Playfair Display', serif", lblSize: 100, lblColor: CHOC, noteFont: "600 28px/1.4 'DM Sans', sans-serif", noteColor: 'rgba(59,35,32,.65)' });
    float(s, [[a + 1, b, 0.06]]);
    return s;
  };

  // chamada final: mosaico de fotos reais, frase serifada, botão rosé
  M.cta = (a, o) => {
    const s = L.scene(a - 0.3, null);
    const cream = $('div', 'full', s, { background: CREAM });
    tl.fromTo(cream, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 0.8, ease: 'power3.inOut', immediateRender: false }, a - 0.3);
    L.cue(a - 0.3, 'silk');
    const pics = ['bolo-premium-brigadeiro-com-morango', 'bombom-de-morango-chocolate', 'brownie-ninho-com-nutella', 'bolo-no-pote-ninho-com-morango', 'bolo-premium-ninho-com-morango', 'cookie-nutella', 'bolo-gelado-prestigio', 'coxinha-ninho-com-morango', 'bolo-de-cenoura-com-calda'];
    const G = 300, gap = 18, gx = (1080 - 3 * G - 2 * gap) / 2;
    pics.forEach((p, i) => {
      const c = $('div', null, s, { position: 'absolute', left: px(gx + (i % 3) * (G + gap)), top: px(240 + Math.floor(i / 3) * (G + gap)), width: px(G), height: px(G), borderRadius: i === 4 ? '150px' : '22px', overflow: 'hidden', boxShadow: '0 20px 40px -20px rgba(59,35,32,.5)' });
      L.img(c, L.F(p), G, G, { objectFit: 'cover' });
      hid(c);
      tl.fromTo(c, { autoAlpha: 0, scale: 0.7, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.6)', immediateRender: false }, a - 0.1 + [4, 1, 3, 2, 0, 5, 7, 6, 8][i] * 0.06);
    });
    L.cue(a - 0.1, 'chimes', { n: 9 });
    const q = $('div', 'ital', s, { position: 'absolute', left: '0', width: '1080px', top: '1250px', textAlign: 'center', fontSize: '92px', color: CHOC, lineHeight: '1' });
    q.innerHTML = o.frase[1];
    hid(q);
    soft(q, o.frase[0], { filter: 'blur(10px)' }, 0.8);
    const btn = $('div', null, s, { position: 'absolute', left: '140px', top: '1420px', width: '800px', padding: '32px 30px', borderRadius: '999px', background: ROSE, color: '#fff', textAlign: 'center', font: "700 42px/1 'DM Sans'", boxShadow: '0 30px 60px -20px rgba(194,91,116,.6)' });
    btn.textContent = o.botao[1];
    hid(btn);
    tl.fromTo(btn, { autoAlpha: 0, scale: 0.8, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.8)', immediateRender: false }, o.botao[0]);
    L.cue(o.botao[0], 'pop');
    L.tap(s, 700, 1462, o.toque);
    tl.to(btn, { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1 }, o.toque);
    const sub = $('div', 'dm', s, { position: 'absolute', left: '0', width: '1080px', top: '1560px', textAlign: 'center', font: "600 30px/1.3 'DM Sans'", color: 'rgba(59,35,32,.7)' });
    sub.textContent = o.sub || 'Com a sua marca, as suas cores e as suas fotos.';
    hid(sub);
    tl.to(sub, { autoAlpha: 1, duration: 0.5 }, o.toque - 0.3);
    L.drift(s, { amp: 6, scale: 0.01, push: [a, L.D, 0.07] });
    return s;
  };

  M.fim = (hideIn = []) => {
    const capLayer = $('div', 'full', ui);
    L.captions(capLayer, { maxWords: 4, top: 1500, cls: 'v4', hideIn });
    L.cue(L.D - 2.4, 'tail');
    L.finish();
  };
  return M;
})();
