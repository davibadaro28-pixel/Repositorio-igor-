// Anúncio do cardápio digital personalizado (9:16, 39 s).
// Tudo é desenhado a partir do tempo: window.renderAt(t) posiciona cada quadro (sem relógio, sem acaso).
// As telas do celular são capturas do cardápio real (scripts/capturar.cjs).
(() => {
  const M = window.META;
  const D = 39;
  const FPS = 30;
  const CUES = [];
  const cue = (t, type, extra = {}) => CUES.push({ t: Math.round(t * 1000) / 1000, type, ...extra });

  const $ = (tag, cls, parent, style) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (style) Object.assign(e.style, style);
    if (parent) parent.appendChild(e);
    return e;
  };
  const urls = new Set();
  const CAP = (n) => { const u = `assets/cap/${n}.webp`; urls.add(u); return u; };
  const FOTO = (n) => { const u = `assets/fotos/${n}.webp`; urls.add(u); return u; };
  const px = (v) => `${v}px`;

  const frame = document.getElementById('frame');
  const layers = document.getElementById('layers');
  const bg = document.getElementById('bg');
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  const VW = 390;
  const VH = M.viewport.h;
  const WINE = '#7d2949';
  const P = { scroll: 0, co: 0, ring: 40 }; // estados lidos em applyState

  // ---------- fundo, luz e grão ----------
  bg.style.background = 'radial-gradient(90% 60% at 50% 30%, #1e1013 0%, #0c0807 62%)';
  const glow = (style) => $('div', 'glow', bg, style);
  const glowWarm = glow({ left: '-260px', top: '-360px', width: '1200px', height: '1200px', background: 'radial-gradient(closest-side, rgba(244,176,128,.22), rgba(244,176,128,0))', opacity: 0.7 });
  const glowWine = glow({ left: '40px', top: '520px', width: '1000px', height: '1000px', background: 'radial-gradient(closest-side, rgba(165,52,94,.62), rgba(165,52,94,0))', opacity: 0 });
  const glowLow = glow({ left: '-160px', top: '1180px', width: '1400px', height: '1100px', background: 'radial-gradient(closest-side, rgba(125,41,73,.6), rgba(125,41,73,0))', opacity: 0 });

  const rng = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
  const noise = document.createElement('canvas');
  noise.width = noise.height = 256;
  { const c = noise.getContext('2d'); const d = c.createImageData(256, 256); const r = rng(11);
    for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    c.putImageData(d, 0, 0); }
  document.getElementById('grain').style.display = 'none';
  const grain = $('div', null, frame, { position: 'absolute', inset: '0', opacity: 0.075, mixBlendMode: 'overlay', pointerEvents: 'none',
    backgroundImage: `url(${noise.toDataURL()})`, backgroundSize: '256px 256px' });
  const flash = document.getElementById('flash');

  // ---------- peças ----------
  const SB_ICONS = '<svg width="78" height="14" viewBox="0 0 78 14" fill="#fff"><rect x="0" y="9" width="3.2" height="5" rx="1"/><rect x="4.8" y="6.5" width="3.2" height="7.5" rx="1"/><rect x="9.6" y="4" width="3.2" height="10" rx="1"/><rect x="14.4" y="1.5" width="3.2" height="12.5" rx="1"/><path d="M31 3.2c2.6 0 5 1 6.8 2.7l1.3-1.3C36.9 2.5 34.1 1.4 31 1.4s-5.9 1.1-8.1 3.2l1.3 1.3C26 4.2 28.4 3.2 31 3.2zm0 3.6c1.6 0 3.1.6 4.2 1.7l1.3-1.3c-1.5-1.4-3.4-2.2-5.5-2.2s-4 .8-5.5 2.2l1.3 1.3c1.1-1.1 2.6-1.7 4.2-1.7zm0 3.6c.6 0 1.1.2 1.6.6L31 12.6l-1.6-1.6c.5-.4 1-.6 1.6-.6z"/><rect x="48" y="1.5" width="25" height="11.5" rx="3.6" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/><rect x="50" y="3.5" width="20" height="7.5" rx="2"/><path d="M74.5 5.5v3.6c.8-.3 1.3-1 1.3-1.8s-.5-1.5-1.3-1.8z" fill-opacity=".5"/></svg>';

  function makePhone(parent, sbColor = WINE) {
    const el = $('div', 'phone', parent);
    for (const z of [-10, -7, -4]) $('div', 'ph-edge', el, { transform: `translateZ(${z}px)` });
    $('div', 'ph-body', el);
    for (const [x, y, h] of [[-3, 186, 32], [-3, 246, 62], [-3, 322, 62], [416, 270, 100]]) $('div', 'ph-btn', el, { left: px(x), top: px(y), height: px(h) });
    const scr = $('div', 'ph-screen', el);
    const sb = $('div', 'sb', scr, { background: sbColor });
    $('div', 'sb-time', sb).textContent = '9:41';
    $('div', 'sb-icons', sb).innerHTML = SB_ICONS;
    const view = $('div', 'view', scr);
    $('div', 'island', scr);
    const shade = $('div', null, scr, { position: 'absolute', inset: '0', background: '#000', opacity: 0 });
    $('div', 'home', scr);
    const glare = $('div', 'glare', el);
    const sweep = $('div', 'sweep', glare);
    return { el, view, sb, shade, sweep };
  }
  const img = (parent, src, w, h, style = {}) => { const e = $('img', null, parent, { width: px(w), height: px(h), display: 'block', ...style }); e.src = src; return e; };
  // recorte de uma captura: base = tamanho lógico da captura; k = escala do recorte
  function crop(parent, src, x, y, w, h, o = {}) {
    const [bw, bh] = o.base || [VW, VH];
    const k = o.k || 1;
    return $('div', o.cls || 'crop', parent, {
      left: px(o.left ?? x * k), top: px(o.top ?? y * k), width: px(w * k), height: px(h * k),
      backgroundImage: `url(${src})`, backgroundSize: `${bw * k}px ${bh * k}px`, backgroundPosition: `${-x * k}px ${-y * k}px`, ...(o.style || {}),
    });
  }
  function tap(view, x, y, t) {
    const d = $('div', 'tap-dot', view, { left: px(x), top: px(y) });
    const r = $('div', 'tap-ring', view, { left: px(x), top: px(y) });
    tl.fromTo(d, { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: 0.09, ease: 'power2.out', immediateRender: false }, t)
      .to(d, { opacity: 0, scale: 0.85, duration: 0.34, ease: 'power2.in' }, t + 0.16)
      .fromTo(r, { opacity: 0.9, scale: 0.5 }, { opacity: 0, scale: 2.2, duration: 0.6, ease: 'power2.out', immediateRender: false }, t + 0.04);
    cue(t, 'tap');
  }

  // títulos: palavras sobem de trás de uma máscara
  const heads = [];
  function headline(lines, top) {
    const box = $('div', 'hl', layers, { top: px(top) });
    const words = [];
    for (const [text, cls] of lines) {
      const ln = $('div', `ln ${cls}`, box);
      text.split(' ').forEach((w, i, arr) => { const outer = $('span', 'w', ln); const inner = $('span', 'w', outer); inner.textContent = w + (i < arr.length - 1 ? ' ' : ''); words.push(inner); });
    }
    const h = { box, words };
    heads.push(h);
    return h;
  }
  const showHL = (h, t, stagger = 0.07) => tl.fromTo(h.words, { yPercent: 118, opacity: 0, filter: 'blur(14px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.95, ease: 'expo.out', stagger }, t);
  const hideHL = (h, t) => tl.to(h.words, { yPercent: -108, opacity: 0, filter: 'blur(10px)', duration: 0.42, ease: 'power2.in', stagger: 0.022 }, t);

  function caption(text) {
    const wrap = $('div', 'cap', layers);
    const pill = $('div', null, wrap);
    $('i', null, pill);
    $('span', null, pill).textContent = text;
    tl.set(pill, { opacity: 0 }, 0);
    return pill;
  }
  const capIn = (p, t) => { tl.fromTo(p, { opacity: 0, y: -26, scale: 0.92, filter: 'blur(8px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out', immediateRender: false }, t); cue(t, 'blip'); };
  const capOut = (p, t) => tl.to(p, { opacity: 0, y: 18, scale: 0.96, filter: 'blur(6px)', duration: 0.28, ease: 'power2.in' }, t);
  const pose = (el, t, dur, v, ease = 'power3.inOut') => tl.to(el, { duration: dur, ease, ...v }, t);

  // =====================================================================
  // CENA 1 · gancho (0–5 s): fotos reais dos doces e a pergunta
  // =====================================================================
  const hookWorld = $('div', 'world', layers, { perspective: '1400px' });
  const hookGroup = $('div', 'full p3d', hookWorld);
  const FOTOS = [
    ['bolo-de-cenoura-com-calda', 60, 120, -380, 540, 2],
    ['cookie-nutella', -470, -60, -720, 430, -3],
    ['bolo-premium-prestigio', 470, -620, -760, 450, 4],
    ['brownie-brigadeiro-ao-leite', -460, 780, -700, 430, 3],
    ['pudim-tradicional', -120, 920, -300, 430, -4],
    ['tortinha-de-morango', 450, 390, -320, 390, 5],
    ['bolo-premium-brigadeiro-com-morango', -270, -470, 60, 470, -7],
    ['brownie-ninho-com-nutella', 300, -150, 140, 440, 6],
    ['bombom-de-morango-chocolate', -300, 330, 120, 460, 4],
    ['fatia-ninho-c-frutas-vermelhas', 290, 730, 40, 480, -5],
  ];
  const fotos = FOTOS.map(([n, x, y, z, s, r], i) => {
    const f = $('div', 'foto', hookGroup, { left: px(540 + x - s / 2), top: px(960 + y - s / 2), width: px(s), height: px(s), filter: z < -600 ? 'blur(6px) brightness(.65)' : z < -200 ? 'blur(2px) brightness(.85)' : 'none' });
    img(f, FOTO(n), s, s, { width: '100%', height: '100%' });
    gsap.set(f, { z, rotation: r });
    return f;
  });
  const hookScrim = $('div', 'scrim', layers, { top: '0', height: '900px', background: 'linear-gradient(180deg, rgba(12,8,7,.9) 0%, rgba(12,8,7,.72) 45%, rgba(12,8,7,0) 100%)' });

  tl.fromTo(hookGroup, { z: -380, rotationY: -7, rotationX: 5 }, { z: 160, rotationY: 6, rotationX: -2, duration: 3.7, ease: 'none' }, 0);
  fotos.forEach((f, i) => {
    tl.fromTo(f, { opacity: 0.45, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: 'expo.out' }, i * 0.05);
    tl.to(f, { y: (i % 2 ? -1 : 1) * 40, rotation: `+=${i % 2 ? 4 : -4}`, duration: 3.6, ease: 'sine.inOut' }, 0);
  });
  tl.to(fotos, { opacity: 0.3, filter: 'blur(6px) brightness(.6)', duration: 0.8, ease: 'power2.out' }, 1.55);
  tl.to(hookWorld, { opacity: 0, duration: 0.8, ease: 'power2.in' }, 3.55);
  tl.to(hookGroup, { z: 900, duration: 1.0, ease: 'power2.in' }, 3.55);
  tl.to(hookScrim, { opacity: 0, duration: 0.6 }, 3.6);
  cue(0.05, 'intro');

  const hA = headline([['Sua doceria ainda', 'sans'], ['vende pelo', 'sans']], 236);
  const hB = headline([['cardápio', 'serif'], ['tradicional?', 'serif']], 432);
  showHL(hA, 0.12, 0.09);
  showHL(hB, 1.75, 0.12);
  cue(0.12, 'word');
  cue(1.75, 'word');
  hideHL(hA, 3.42);
  hideHL(hB, 3.5);

  // o cardápio de papel, que vira o celular
  const world = $('div', 'world p3d', layers);
  const paper = $('div', 'paper', world);
  paper.innerHTML = `
    <div class="stain" style="left:250px;top:610px;width:150px;height:150px;border:9px solid rgba(120,80,50,.10);"></div>
    <div class="stain" style="left:-40px;top:720px;width:260px;height:200px;background:radial-gradient(closest-side, rgba(150,110,70,.18), rgba(150,110,70,0));"></div>
    <h4>CARDÁPIO</h4><div class="rule"></div>
    <div class="sec">BOLOS</div>
    <div class="it"><span>Bolo de cenoura</span><span></span><span>21,00</span></div>
    <div class="it"><span>Bolo de chocolate</span><span></span><span>21,00</span></div>
    <div class="it"><span>Bolo de fubá</span><span></span><span>18,00</span></div>
    <div class="it"><span>Bolo de laranja</span><span></span><span>19,00</span></div>
    <div class="sec">FATIAS</div>
    <div class="it"><span>Fatia prestígio</span><span></span><span>14,00</span></div>
    <div class="it"><span>Fatia ninho</span><span></span><span>14,00</span></div>
    <div class="sec">DOCES</div>
    <div class="it"><span>Brownie</span><span></span><span>12,00</span></div>
    <div class="it"><span>Brigadeiro</span><span></span><span>4,50</span></div>
    <div class="it"><span>Pudim</span><span></span><span>16,00</span></div>
    <div class="it"><span>Cookie</span><span></span><span>9,00</span></div>
    <div class="sec">TORTAS</div>
    <div class="it"><span>Torta de limão</span><span></span><span>12,00</span></div>
    <div class="it"><span>Torta de morango</span><span></span><span>13,00</span></div>
    <div class="it" style="margin-top:34px;justify-content:center;font-size:16px;letter-spacing:.1em">PEDIDOS PELO TELEFONE</div>
    <div class="lam"></div>`;
  tl.set(paper, { autoAlpha: 0 }, 0);
  tl.fromTo(paper, { autoAlpha: 1, x: 0, y: 1250, rotationX: 38, rotationY: -6, rotation: -6, scale: 1.36 },
    { y: 345, rotationX: 7, rotationY: -12, rotation: -2.5, duration: 1.0, ease: 'expo.out', immediateRender: false }, 1.6);
  tl.to(paper, { rotationY: -5, rotation: -1.5, y: 335, duration: 1.6, ease: 'sine.inOut' }, 2.4);
  tl.to(paper, { rotationY: 90, scale: 1.42, duration: 0.3, ease: 'power2.in' }, 3.32);
  tl.set(paper, { autoAlpha: 0 }, 3.63);
  cue(1.6, 'whoosh', { v: 0.6 });
  cue(3.3, 'flip');

  // =====================================================================
  // O celular com o cardápio real
  // =====================================================================
  const A = makePhone(world);
  const V = A.view;
  const strip = img(V, CAP('menu-strip'), VW, M.stripHeight);
  const navWrap = $('div', null, V, { width: px(VW), height: px(M.nav.h) });
  const navO1 = img(navWrap, CAP('nav-destaques'), VW, M.nav.h, { position: 'absolute', left: '0', top: '0' });
  const navO2 = img(navWrap, CAP('nav-sec-bolos'), VW, M.nav.h, { position: 'absolute', left: '0', top: '0', opacity: 0 });
  const scrPremium = img(V, CAP('menu-premium'), VW, VH, { opacity: 0 });
  const bag = crop(V, CAP('menu-bag'), M.bagRect.x, M.bagRect.y, M.bagRect.w, M.bagRect.h, { style: { borderRadius: '16px', opacity: 0, boxShadow: '0 14px 30px -6px rgba(125,41,73,.5)' } });
  const dim = $('div', null, V, { width: px(VW), height: px(VH), background: 'rgba(28,25,23,.4)', opacity: 0 });
  const sTop = Math.round(M.sheet1.y);
  const sheetH = VH - sTop;
  const sheet = crop(V, CAP('product-1'), 0, sTop, VW, sheetH, { style: { transform: `translateY(${sheetH}px)` } });
  const sheet2 = crop(sheet, CAP('product-2'), 0, sTop, VW, sheetH, { left: 0, top: 0, style: { opacity: 0 } });
  // finalização: cabeçalho fixo, corpo que rola (3 capturas em sequência) e rodapé com o botão
  const cb = M.checkoutBody;
  const bodyTop = Math.round(cb.y);
  const bodyH = Math.round(cb.h);
  const co = $('div', null, V, { top: px(sTop), width: px(VW), height: px(sheetH), transform: `translateY(${sheetH}px)` });
  crop(co, CAP('checkout-1'), 0, sTop, VW, bodyTop - sTop, { left: 0, top: 0 });
  const coBody = $('div', null, co, { position: 'absolute', left: '0', top: px(bodyTop - sTop), width: px(VW), height: px(bodyH), overflow: 'hidden', background: '#fff' });
  const coInner = $('div', null, coBody, { position: 'absolute', left: '0', top: '0', width: px(VW) });
  const shots = Object.fromEntries(M.checkoutShots.map((s) => [s.file.replace('.png', ''), s.scrollTop]));
  const body2 = crop(coInner, CAP('checkout-2'), 0, bodyTop, VW, bodyH, { left: 0, top: shots['checkout-2'], style: { opacity: 0 } });
  const body3 = crop(coInner, CAP('checkout-3'), 0, bodyTop, VW, bodyH, { left: 0, top: shots['checkout-3'], style: { opacity: 0 } });
  const body1 = crop(coInner, CAP('checkout-1'), 0, bodyTop, VW, bodyH, { left: 0, top: 0, style: { opacity: 0 } });
  const body0 = crop(coInner, CAP('checkout-0'), 0, bodyTop, VW, bodyH, { left: 0, top: 0 });
  const footTop = bodyTop + bodyH;
  crop(co, CAP('checkout-0'), 0, footTop, VW, VH - footTop, { left: 0, top: footTop - sTop });
  const foot1 = crop(co, CAP('checkout-1'), 0, footTop, VW, VH - footTop, { left: 0, top: footTop - sTop, style: { opacity: 0 } });
  const track = img(V, CAP('track'), VW, VH, { transform: `translateX(${VW}px)` });

  // recortes que saltam da tela (a interface "explodida" em camadas)
  const vx = (x) => 14 + x;
  const vy = (y) => 14 + 47 + y;
  const pop = (x, y, w, h, r = 16) => crop(A.el, CAP('menu-top'), x, y, w, h, { cls: 'pop', left: vx(x), top: vy(y), style: { borderRadius: px(r), visibility: 'hidden' } });
  const popBrand = pop(8, 12, 318, 82, 20);
  const popStatus = pop(10, 94, 284, 40, 20);
  const popTiles = pop(10, 279, 344, 243, 18);

  tl.set(A.el, { autoAlpha: 0, x: 0, y: 335, scale: 1.42, rotationX: 7, rotationY: -90, rotation: -2.5 }, 0);
  tl.set(A.el, { autoAlpha: 1 }, 3.62);
  tl.to(A.el, { rotationY: -14, rotation: 0, scale: 1.45, y: 318, duration: 1.0, ease: 'expo.out' }, 3.62);
  tl.fromTo(flash, { opacity: 0 }, { opacity: 0.55, duration: 0.08, ease: 'none', immediateRender: false }, 3.6).to(flash, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 3.7);
  tl.to(glowWine, { opacity: 0.85, duration: 1.2, ease: 'power2.out' }, 3.7);
  tl.to(glowWarm, { opacity: 0.25, duration: 1.5 }, 3.8);
  cue(3.62, 'shimmer');
  cue(2.5, 'riser', { end: 5.0 });

  // =====================================================================
  // CENA 2 · a solução (5–13 s)
  // =====================================================================
  cue(5.0, 'impact');
  tl.fromTo(glowWine, { scale: 1.25 }, { scale: 1, duration: 1.4, ease: 'expo.out', immediateRender: false }, 5.0);
  tl.fromTo(A.sweep, { x: -120 }, { x: 900, duration: 1.2, ease: 'power2.inOut', immediateRender: false }, 5.0);
  pose(A.el, 4.62, 3.4, { rotationY: -6, rotationX: 6, y: 306 }, 'sine.inOut');

  const h2a = headline([['Transforme a experiência', 'sans'], ['de compra', 'serif']], 270);
  showHL(h2a, 5.15);
  hideHL(h2a, 8.0);
  const h2b = headline([['Com um cardápio digital', 'sans'], ['totalmente', 'serif'], ['personalizado.', 'serif']], 250);
  showHL(h2b, 8.45, 0.08);
  hideHL(h2b, 12.3);
  cue(5.15, 'word', { v: 0.5 });
  cue(8.45, 'word', { v: 0.5 });

  // camadas da interface saltando
  for (const [el, t0, t1, z] of [[popBrand, 6.0, 7.55, 260], [popStatus, 6.3, 7.65, 340], [popTiles, 6.62, 7.8, 230]]) {
    tl.set(el, { visibility: 'visible' }, t0);
    tl.fromTo(el, { z: 1, scale: 1 }, { z, scale: 1.05, duration: 0.75, ease: 'expo.out', immediateRender: false }, t0);
    tl.to(el, { z: 1, scale: 1, duration: 0.5, ease: 'power3.inOut' }, t1);
    tl.set(el, { visibility: 'hidden' }, t1 + 0.5);
    cue(t0, 'pop', { v: 0.7 });
  }
  pose(A.el, 8.0, 4.4, { rotationY: 9, rotationX: 4, y: 318 }, 'sine.inOut');
  tl.to(P, { scroll: 300, duration: 4.1, ease: 'power2.inOut' }, 8.15);
  pose(A.el, 12.35, 0.75, { x: 0, y: 178, scale: 1.72, rotationX: 3, rotationY: 0 }, 'power3.inOut');
  tl.to(glowWine, { y: -100, scale: 1.2, duration: 0.8, ease: 'power3.inOut' }, 12.35);
  cue(12.35, 'whoosh', { v: 0.5 });

  // =====================================================================
  // CENA 3 · demonstração (13–23 s): navegar, escolher, pedir, acompanhar
  // =====================================================================
  cue(13.0, 'impact', { v: 0.45 });
  const c1 = caption('Navegue por categorias');
  const c2 = caption('Fotos, tamanhos e detalhes');
  const c3 = caption('Encomenda com data e hora');
  const c4 = caption('Pix, cartão ou dinheiro');
  const c5 = caption('O pedido chega no seu painel');
  capIn(c1, 13.0); capOut(c1, 14.85);
  const bolos = M.tabs.find((t) => t.label === 'Bolos');
  tap(V, bolos.x + bolos.w / 2, bolos.y - M.nav.y + bolos.h / 2, 13.35);
  tl.to(navO2, { opacity: 1, duration: 0.22, ease: 'none' }, 13.42).to(navO1, { opacity: 0, duration: 0.22, ease: 'none' }, 13.42);
  tl.to(P, { scroll: M.premiumScroll, duration: 1.4, ease: 'power3.inOut' }, 13.45);
  tl.to(scrPremium, { opacity: 1, duration: 0.14, ease: 'none' }, 14.86);

  capIn(c2, 15.0); capOut(c2, 17.25);
  const pt = M.premiumTile;
  tap(V, pt.x + pt.w / 2, pt.y + pt.w / 2, 15.3);
  tl.to(sheet, { y: 0, duration: 0.55, ease: 'expo.out' }, 15.45);
  tl.to(dim, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 15.45);
  cue(15.45, 'swoosh');
  pose(A.el, 15.45, 0.8, { scale: 1.8, y: 205 }, 'power3.out');
  const vr = M.variantRect;
  tap(V, vr.x + vr.w * 0.62, vr.y + vr.h / 2, 16.55);
  tl.to(sheet2, { opacity: 1, duration: 0.18, ease: 'none' }, 16.62);
  const ar = M.addRect;
  tap(V, ar.x + ar.w / 2, ar.y + ar.h / 2, 17.3);
  tl.to(sheet, { y: sheetH, duration: 0.42, ease: 'power3.in' }, 17.42);
  tl.to(dim, { opacity: 0, duration: 0.3 }, 17.5);
  cue(17.42, 'swoosh', { v: 0.6 });
  tl.fromTo(bag, { opacity: 0, y: 90, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.5)', immediateRender: false }, 17.78);
  cue(17.8, 'pop');
  pose(A.el, 17.5, 0.7, { scale: 1.72, y: 178 }, 'power3.inOut');

  capIn(c3, 18.65); capOut(c3, 20.3);
  const br = M.bagRect;
  tap(V, br.x + br.w / 2, br.y + br.h / 2, 18.32);
  tl.to(co, { y: 0, duration: 0.55, ease: 'expo.out' }, 18.45);
  tl.to(dim, { opacity: 1, duration: 0.3 }, 18.45);
  cue(18.45, 'swoosh');
  const ag = M.agendarRect;
  tap(V, ag.x + ag.w / 2, ag.y + ag.h / 2, 19.3);
  tl.to([body1, body2, body3, foot1], { opacity: 1, duration: 0.2, ease: 'none' }, 19.36).to(body0, { opacity: 0, duration: 0.2, ease: 'none' }, 19.36);
  tl.to(P, { co: shots['checkout-3'], duration: 0.95, ease: 'power2.inOut' }, 19.95);
  cue(19.95, 'scroll');
  capIn(c4, 20.42); capOut(c4, 21.7);
  const sr = M.sendRect;
  tap(V, sr.x + sr.w / 2, sr.y + sr.h / 2, 21.08);
  tl.to(track, { x: 0, duration: 0.5, ease: 'expo.out' }, 21.22);
  cue(21.38, 'success');

  // o pedido aparece no painel da loja (Encomendas)
  const card = crop(world, CAP('painel-encomendas'), M.encCard.x, M.encCard.y, M.encCard.w, M.encCard.h,
    { base: [1280, 800], cls: 'card', left: 540 - M.encCard.w / 2, top: 960 - M.encCard.h / 2 });
  const ring = $('div', 'ring', card, { left: '10px', top: px(M.encRow.y - M.encCard.y - 14), width: px(M.encCard.w - 20), height: '56px' });
  capIn(c5, 21.85); capOut(c5, 22.6);
  pose(A.el, 21.75, 0.6, { x: -190, rotationY: 16, scale: 1.4, y: 150, z: -120 }, 'power3.inOut');
  tl.set(card, { autoAlpha: 0, x: 760, y: 330, z: 180, rotationY: -28, scale: 1.5 }, 0);
  tl.to(card, { autoAlpha: 1, x: 150, rotationY: -8, duration: 0.65, ease: 'expo.out' }, 21.95);
  tl.to(ring, { opacity: 1, duration: 0.25 }, 22.3).to(ring, { opacity: 0.55, duration: 0.3, yoyo: true, repeat: 1 }, 22.55);
  cue(21.95, 'whoosh', { v: 0.45 });
  cue(22.3, 'notify');
  // saída
  tl.to(card, { x: 1100, rotationY: -40, duration: 0.45, ease: 'power3.in' }, 22.6);
  pose(A.el, 22.6, 0.45, { y: 1500, rotationX: 38, rotationY: -10 }, 'power3.in');
  tl.set(A.el, { autoAlpha: 0 }, 23.06);
  cue(22.6, 'whoosh', { v: 0.7 });

  // =====================================================================
  // CENA 4 · benefícios (23–31 s)
  // =====================================================================
  cue(23.0, 'impact', { v: 0.8 });
  // 4a: a mesma plataforma com a identidade de cada loja
  const ringWorld = $('div', 'world', layers, { perspectiveOrigin: '50% 52%' });
  const ringRoot = $('div', 'full', ringWorld, { perspective: '2200px', perspectiveOrigin: '50% 58%' });
  const RING = [['theme-1', '#7d2949'], ['theme-2', '#5d3e2d'], ['theme-3', '#295c52'], ['theme-4', '#964624']].map(([n, c]) => {
    const ph = makePhone(ringRoot, c);
    img(ph.view, CAP(n), VW, VH);
    return ph;
  });
  tl.set(ringWorld, { autoAlpha: 0 }, 0);
  tl.set(ringWorld, { autoAlpha: 1 }, 22.98);
  tl.fromTo(ringRoot, { y: 520, scale: 0.7 }, { y: 0, scale: 1, duration: 0.9, ease: 'expo.out', immediateRender: false }, 22.98);
  tl.set(P, { ring: -0.35 }, 22.98);
  tl.to(P, { ring: 0, duration: 0.8, ease: 'expo.out' }, 22.98);
  for (const [t, v] of [[23.85, 1], [24.55, 2], [25.25, 3]]) { tl.to(P, { ring: v, duration: 0.55, ease: 'power3.inOut' }, t); cue(t, 'swish'); }
  tl.to(ringRoot, { z: 700, duration: 0.45, ease: 'power3.in' }, 25.95);
  tl.to(ringWorld, { autoAlpha: 0, duration: 0.3, ease: 'none' }, 26.1);
  cue(25.95, 'whoosh', { v: 0.6 });
  const h4a = headline([['Sua marca', 'sans'], ['em cada detalhe.', 'serif']], 250);
  showHL(h4a, 23.2);
  hideHL(h4a, 25.9);
  const sub4 = $('div', 'hl sub', layers, { top: '532px' });
  sub4.textContent = 'Logo  ·  cores  ·  fonte  ·  acabamento';
  tl.set(sub4, { opacity: 0 }, 0);
  tl.fromTo(sub4, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, immediateRender: false }, 23.8).to(sub4, { opacity: 0, duration: 0.3 }, 25.85);

  // 4b: parede com os produtos do cardápio real
  const wallWorld = $('div', 'world', layers, { perspective: '1800px' });
  const wall = $('div', 'p3d', wallWorld, { position: 'absolute', left: '-210px', top: '-300px', width: '1500px', height: '2600px' });
  const tiles = M.tiles.filter((t) => t.y + t.h < M.stripHeight - 4 && t.x >= 0 && t.x + t.w <= VW + 1);
  const K = 1.62;
  const cols = [0, 1, 2, 3].map((i) => $('div', null, wall, { position: 'absolute', left: px(120 + i * 330), top: '0', width: '300px', height: '2600px' }));
  for (let i = 0; i < 28; i++) {
    const t = tiles[i % tiles.length];
    const col = cols[i % 4];
    const row = Math.floor(i / 4);
    const tile = crop(col, CAP('menu-strip'), t.x - 6, t.y - 6, t.w + 12, t.h + 12, { base: [VW, M.stripHeight], k: K, cls: 'tile', left: 0, top: row * 420 + (i % 4 === 1 || i % 4 === 3 ? 160 : 0) });
    tile.style.backgroundColor = '#fffaf6';
  }
  const wallScrim = $('div', 'scrim', layers, { top: '0', height: '880px', background: 'linear-gradient(180deg, rgba(12,8,7,.94) 0%, rgba(12,8,7,.82) 48%, rgba(12,8,7,0) 100%)', opacity: 0 });
  tl.set(wallWorld, { autoAlpha: 0 }, 0);
  tl.set(wall, { rotationX: 34, rotation: -13, z: -700 }, 0);
  tl.set(wallWorld, { autoAlpha: 1 }, 26.15);
  tl.to(wall, { z: -230, duration: 1.0, ease: 'expo.out' }, 26.15);
  cols.forEach((c, i) => tl.fromTo(c, { y: 260 + i * 40 }, { y: -560 - (i % 2) * 220, duration: 2.9, ease: 'none', immediateRender: false }, 26.15));
  tl.to(wallScrim, { opacity: 1, duration: 0.4 }, 26.15).to(wallScrim, { opacity: 0, duration: 0.35 }, 28.75);
  tl.to(wallWorld, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 28.7);
  const h4b = headline([['Seus produtos', 'sans'], ['valorizados.', 'serif']], 270);
  showHL(h4b, 26.35);
  hideHL(h4b, 28.55);
  cue(26.15, 'impact', { v: 0.35 });

  // 4c: pedidos e encomendas organizados no painel, sem comissão por pedido
  const monitor = $('div', 'monitor', world, { left: px(540 - 470), top: px(960 - 304), width: '940px', height: '608px' });
  $('div', null, monitor).style.backgroundImage = `url(${CAP('painel-encomendas')})`;
  tl.set(monitor, { autoAlpha: 0, x: 900, y: 250, z: -220, rotationY: -34, scale: 1.08 }, 0);
  tl.to(monitor, { autoAlpha: 1, x: 90, rotationY: -16, duration: 0.8, ease: 'expo.out' }, 28.75);
  tl.to(monitor, { x: 60, rotationY: -11, duration: 2.0, ease: 'sine.inOut' }, 29.5);
  tl.set(A.el, { autoAlpha: 1, x: -250, y: 1600, z: 180, rotationX: 30, rotationY: 30, scale: 1.02 }, 28.7);
  pose(A.el, 28.75, 0.85, { y: 470, rotationX: 4, rotationY: 18 }, 'expo.out');
  pose(A.el, 29.55, 1.6, { rotationY: 12, y: 450 }, 'sine.inOut');
  const h4c = headline([['Pedidos direto para você,', 'sans'], ['sem comissão por pedido.', 'serif']], 270);
  showHL(h4c, 28.8);
  hideHL(h4c, 30.7);
  cue(28.75, 'whoosh', { v: 0.55 });
  tl.to(monitor, { x: 900, autoAlpha: 0, duration: 0.45, ease: 'power3.in' }, 30.7);
  pose(A.el, 30.7, 0.4, { y: 1500, rotationX: 30 }, 'power3.in');
  cue(30.7, 'whoosh', { v: 0.6 });

  // =====================================================================
  // CENA 5 · chamada final (31–39 s)
  // =====================================================================
  // volta o celular para o topo do cardápio
  tl.set([scrPremium, bag, foot1, sheet2, body1, body2, body3], { opacity: 0 }, 31.0);
  tl.set(track, { x: VW }, 31.0);
  tl.set(co, { y: sheetH }, 31.0);
  tl.set(dim, { opacity: 0 }, 31.0);
  tl.set(P, { scroll: 0, co: 0 }, 31.0);
  tl.set([navO1], { opacity: 1 }, 31.0);
  tl.set([navO2], { opacity: 0 }, 31.0);
  tl.set(A.el, { x: 0, y: 1600, z: 0, rotationX: 34, rotationY: -26, scale: 1.3 }, 31.05);
  pose(A.el, 31.1, 1.0, { y: 340, rotationX: 6, rotationY: -16 }, 'expo.out');
  pose(A.el, 32.1, 2.4, { rotationY: 12, y: 330 }, 'sine.inOut');
  tl.fromTo(A.sweep, { x: -120 }, { x: 900, duration: 1.3, ease: 'power2.inOut', immediateRender: false }, 31.6);
  tl.to(glowWine, { opacity: 1, scale: 1.35, y: 120, duration: 1.4, ease: 'power2.out' }, 31.0);
  tl.to(glowLow, { opacity: 0.9, duration: 1.6 }, 31.0);
  tl.to(glowWarm, { opacity: 0.45, duration: 1.6 }, 31.0);
  cue(31.0, 'swell');
  const bok = rng(5);
  for (let i = 0; i < 14; i++) {
    const s = 30 + bok() * 90;
    const b = $('div', 'bokeh', layers, { left: px(bok() * 1080 - s / 2), top: px(500 + bok() * 1400), width: px(s), height: px(s),
      background: i % 3 ? 'rgba(243,188,203,.35)' : 'rgba(255,226,196,.32)', opacity: 0 });
    tl.to(b, { opacity: 0.5 + bok() * 0.4, duration: 1.2 }, 31.2 + bok());
    tl.to(b, { y: -200 - bok() * 250, x: (bok() - 0.5) * 120, duration: 7.5, ease: 'none' }, 31.2);
  }
  const h5a = headline([['Seu cardápio merece ser', 'sans'], ['tão especial quanto', 'serif'], ['seus produtos.', 'serif']], 220);
  showHL(h5a, 31.3, 0.075);
  hideHL(h5a, 34.45);
  cue(31.3, 'word', { v: 0.5 });
  pose(A.el, 34.5, 0.9, { y: 760, rotationX: 10, rotationY: 0, scale: 1.22 }, 'power3.inOut');
  const h5b = headline([['Crie seu cardápio', 'sans'], ['digital personalizado.', 'serif']], 250);
  showHL(h5b, 34.95, 0.08);
  cue(34.95, 'impact', { v: 0.7 });
  const ctaWrap = $('div', 'cta', layers, { top: '600px' });
  const cta = $('div', null, ctaWrap);
  cta.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg><span>Entre em contato</span><div class="shine"></div>';
  const shine = cta.querySelector('.shine');
  tl.set(cta, { opacity: 0 }, 0);
  tl.fromTo(cta, { opacity: 0, scale: 0.7, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.7)', immediateRender: false }, 35.6);
  cue(35.6, 'cta');
  tl.fromTo(shine, { x: -100 }, { x: 900, duration: 0.9, ease: 'power2.inOut', immediateRender: false }, 36.6);
  tl.fromTo(shine, { x: -100 }, { x: 900, duration: 0.9, ease: 'power2.inOut', immediateRender: false }, 37.9);
  const h5c = headline([['e transforme sua doceria.', 'serif']], 762);
  h5c.box.querySelector('.ln').style.fontSize = '74px';
  showHL(h5c, 36.0, 0.06);
  pose(A.el, 35.4, 3.6, { y: 740, rotationY: -6, rotationX: 8 }, 'sine.inOut');
  tl.to(glowWine, { scale: 1.2, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 34.9);
  cue(37.0, 'end');
  tl.set({}, {}, D);

  // ---------- estado calculado a cada quadro ----------
  function applyState(t) {
    strip.style.transform = `translate3d(0,${-P.scroll}px,0)`;
    navWrap.style.visibility = P.scroll >= 157 ? 'visible' : 'hidden';
    coInner.style.transform = `translate3d(0,${-P.co}px,0)`;
    // carrossel: o tema da frente maior, os vizinhos girados para os lados
    RING.forEach((ph, i) => {
      const o = i - P.ring;
      const a = Math.max(-1.6, Math.min(1.6, o));
      ph.el.style.transform = `translate3d(${a * 330}px, 300px, ${-Math.abs(a) * 330}px) rotateY(${-a * 38}deg) scale(1.12)`;
      ph.el.style.zIndex = String(10 - Math.round(Math.abs(o) * 2));
      ph.shade.style.opacity = String(Math.min(0.7, Math.abs(o) * 0.45));
    });
    const r = rng(Math.round(t * FPS) * 7919 + 3);
    grain.style.backgroundPosition = `${Math.floor(r() * 256)}px ${Math.floor(r() * 256)}px`;
  }

  // títulos que passam da largura diminuem para caber
  function fit() {
    for (const h of heads) {
      for (const ln of h.box.querySelectorAll('.ln')) {
        const w = [...ln.children].reduce((s, c) => s + c.getBoundingClientRect().width, 0);
        if (w > 960) ln.style.fontSize = `${parseFloat(getComputedStyle(ln).fontSize) * (960 / w)}px`;
      }
    }
  }

  window.DURATION = D;
  window.FPS = FPS;
  window.CUES = CUES.sort((a, b) => a.t - b.t);
  window.renderAt = (t) => { tl.time(Math.min(t, D)); applyState(t); };
  window.READY = (async () => {
    await document.fonts.ready;
    await Promise.all([...urls].map((u) => new Promise((res) => { const i = new Image(); i.onload = () => i.decode().then(res, res); i.onerror = res; i.src = u; })));
    await Promise.all([...document.images].map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((res) => { i.onload = i.onerror = res; }))));
    fit();
    // força a primeira passada da linha do tempo (sem ela o quadro 0 sai com o estado inicial do HTML)
    tl.time(D);
    tl.time(0.001);
    window.renderAt(0);
    return true;
  })();
})();
