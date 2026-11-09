// V01 · "A fatia que fica no caminho" — taxas dos apps e canal próprio.
// Grafite + laranja-alerta, Anton + Inter Tight, cortes secos e câmera agressiva.
(() => {
  const OR = '#ff5a1f';
  L.init({ bg: '#121214', grain: 0.07, vignette: 0.6 });
  const { tl, $, px } = L;
  const T = L.n;
  const W = L.wt;
  const D = L.D;
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const cchip = (parent, top, html, style = {}) => {
    const row = $('div', null, parent, { position: 'absolute', left: '0', top: px(top), width: '1080px', display: 'flex', justifyContent: 'center' });
    const c = $('div', 'chip', row, { position: 'relative', ...style });
    c.innerHTML = html;
    return c;
  };
  const pop = (el, t, from = {}, to = {}, d = 0.5) => tl.fromTo(el, { autoAlpha: 0, scale: 0.7, ...from }, { autoAlpha: 1, scale: 1, duration: d, ease: 'back.out(1.8)', immediateRender: false, ...to }, t);

  // ---------- fundo: grade técnica que corre e brilho laranja ----------
  const grid = $('div', 'full', L.bg, { backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize: '90px 90px' });
  const glow = $('div', 'glow', L.bg, { width: '1500px', height: '1500px', left: '-210px', top: '700px', background: 'radial-gradient(circle, rgba(255,90,31,.26), rgba(255,90,31,0) 62%)' });
  L.onFrame((t) => { grid.style.backgroundPosition = `0 ${-t * 16}px`; });
  tl.to(glow, { top: 120, duration: 3, ease: 'power2.inOut' }, T(2) - 0.3)
    .to(glow, { top: 520, left: -600, duration: 3, ease: 'power2.inOut' }, T(4) - 0.3)
    .to(glow, { top: 300, left: -210, duration: 2, ease: 'power2.inOut' }, T(6) - 0.3);

  const world = $('div', 'world', L.layers);
  const ui = $('div', 'full', L.frame, { pointerEvents: 'none' });

  // etiqueta de honestidade (telas reais com dados de demonstração)
  const real = L.tag(ui, 'Tela real · dados de demonstração', { left: 60, top: 150, bg: 'rgba(18,18,20,.72)', dot: OR, style: { border: '1.5px solid rgba(255,255,255,.18)', fontSize: '21px' } });
  const realOn = (a, b) => { tl.to(real, { autoAlpha: 1, duration: 0.2 }, a).to(real, { autoAlpha: 0, duration: 0.15 }, b); };

  // flash de transição: faixa laranja que atravessa o quadro
  const wipe = $('div', null, ui, { position: 'absolute', left: '0', top: '-10%', width: '1080px', height: '120%', background: OR, visibility: 'hidden' });
  const whips = [];
  const whip = (t, dir = 1) => { whips.push([t - 0.21, dir]); L.cue(t - 0.21, 'whoosh'); };
  L.onFrame((t) => {
    const w = whips.find(([a]) => t >= a && t < a + 0.42);
    wipe.style.visibility = w ? 'visible' : 'hidden';
    if (w) { const k = L.ease.inOut((t - w[0]) / 0.42); wipe.style.transform = `translateX(${w[1] * (-140 + 280 * k)}%) skewX(-12deg)`; }
  });

  // ---------- S1 · "Você trabalha, produz, vende…" (cortes secos nas palavras) ----------
  const s1 = L.scene(0, T(1));
  const cuts = [
    [0, 'bolo-premium-brigadeiro-com-morango', 'Você'],
    [W(0, 'trabalha') - 0.03, 'brownie-ninho-com-nutella', 'trabalha,'],
    [W(0, 'produz') - 0.03, 'bombom-de-morango-leite-ninho', 'produz,'],
    [W(0, 'vende') - 0.03, null, 'vende…'],
  ];
  cuts.forEach(([a, foto, word], i) => {
    const b = cuts[i + 1] ? cuts[i + 1][0] : T(1);
    const sc = L.scene(a, b, s1);
    if (foto) {
      const card = $('div', 'shadow', sc, { position: 'absolute', left: '110px', top: '250px', width: '860px', height: '860px', borderRadius: '40px', overflow: 'hidden' });
      const im = L.img(card, L.F(foto), 860, 860, { objectFit: 'cover' });
      tl.fromTo(im, { scale: 1.22 }, { scale: 1.06, duration: b - a + 0.2, ease: 'none', immediateRender: false }, a);
      tl.fromTo(card, { scale: 1.1, rotate: i % 2 ? -3 : 3 }, { scale: 1, rotate: i % 2 ? -1 : 1, duration: 0.32, ease: 'expo.out', immediateRender: false }, a);
    } else {
      // celular com uma notificação genérica de pedido vibrando
      const ph = L.phone(sc, '#1b1416');
      ph.el.style.transform = 'translateY(-262px)';
      ph.view.style.background = 'linear-gradient(170deg,#3a1b24,#140c0f 70%)';
      const clock = $('div', null, ph.view, { left: '0', top: '50px', width: '390px', textAlign: 'center', font: "600 86px/1 'Inter Tight', sans-serif", color: 'rgba(255,255,255,.92)' });
      clock.textContent = '18:26';
      const n = $('div', 'notif', ph.view);
      n.innerHTML = '<div class="ic"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div><div><b>Novo pedido</b><span>Você recebeu um pedido agora.</span></div>';
      tl.fromTo(n, { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, a + 0.05);
      L.onFrame((t) => { const v = t >= a && t < a + 0.55 ? Math.sin((t - a) * 120) * 7 * (1 - (t - a) / 0.55) : 0; ph.el.style.transform = `translate(${v}px,-262px) rotate(${v * 0.25}deg)`; });
      L.cue(a + 0.05, 'vibrate');
    }
    const w = $('div', 'big', sc, { top: '1150px', color: i === 3 ? OR : '#fff' });
    w.textContent = word;
    tl.fromTo(w, { scale: 1.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, ease: 'expo.out', immediateRender: false }, a);
    if (i) L.cue(a, 'hit', { n: i });
  });

  // ---------- S2 · "e ainda entrega uma parte do seu dinheiro para os aplicativos?" ----------
  const s2 = L.scene(T(1), T(2) - 0.02);
  const CX = 540;
  const CY = 900;
  const R = 380;
  const a1 = -28;
  const a2 = 30;
  const arc = (from, to, steps = 24) => {
    const pts = [`${R}px ${R}px`];
    for (let i = 0; i <= steps; i++) {
      const ang = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
      pts.push(`${R + Math.cos(ang) * R * 1.02}px ${R + Math.sin(ang) * R * 1.02}px`);
    }
    return `polygon(${pts.join(',')})`;
  };
  const pie = $('div', null, s2, { position: 'absolute', left: px(CX - R), top: px(CY - R), width: px(2 * R), height: px(2 * R) });
  const mk = (clip) => {
    const d = $('div', null, pie, { position: 'absolute', inset: '0', clipPath: clip });
    const c = $('div', null, d, { position: 'absolute', inset: '0', borderRadius: '50%', overflow: 'hidden', boxShadow: 'inset 0 0 0 6px rgba(255,255,255,.08)' });
    L.img(c, L.F('bolo-premium-brigadeiro-com-morango'), 2 * R, 2 * R, { objectFit: 'cover', transform: 'scale(1.25)' });
    return d;
  };
  const rest = mk(arc(a2, 360 + a1, 60));
  const slice = mk(arc(a1, a2));
  const mid = (((a1 + a2) / 2) * Math.PI) / 180;
  const svg = $('div', null, pie, { position: 'absolute', inset: '0' });
  svg.innerHTML = `<svg width="${2 * R}" height="${2 * R}" style="overflow:visible"><path id="cut" d="M${R + Math.cos((a1 * Math.PI) / 180) * R} ${R + Math.sin((a1 * Math.PI) / 180) * R} L${R} ${R} L${R + Math.cos((a2 * Math.PI) / 180) * R} ${R + Math.sin((a2 * Math.PI) / 180) * R}" fill="none" stroke="${OR}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const cut = svg.querySelector('path');
  const cutLen = 2 * R;
  cut.style.strokeDasharray = cutLen;
  tl.fromTo(pie, { scale: 0.6, rotate: -40, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out', immediateRender: false }, T(1));
  tl.to(pie, { rotate: 6, duration: T(2) - T(1), ease: 'none' }, T(1) + 0.55);
  tl.fromTo(cut, { strokeDashoffset: cutLen }, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.inOut', immediateRender: false }, W(1, 'entrega'));
  L.cue(W(1, 'entrega'), 'knife');
  const sx = Math.cos(mid);
  const sy = Math.sin(mid);
  tl.to(slice, { x: sx * 90, y: sy * 90, duration: 0.45, ease: 'back.out(2)' }, W(1, 'parte'));
  const sliceTag = $('div', 'chip', s2, { left: '560px', top: '1300px', background: OR, color: '#121214' });
  sliceTag.textContent = 'TAXAS E COMISSÕES';
  pop(sliceTag, W(1, 'dinheiro'), { y: 20 }, { y: 0 });
  L.cue(W(1, 'dinheiro'), 'pop');
  tl.to([slice], { x: sx * 1100, y: sy * 700 + 400, rotate: 50, duration: 0.7, ease: 'power3.in' }, W(1, 'aplicativos'));
  tl.to(sliceTag, { x: 700, y: 380, rotate: 18, duration: 0.7, ease: 'power3.in' }, W(1, 'aplicativos'));
  tl.to(cut, { opacity: 0, duration: 0.2 }, W(1, 'aplicativos'));
  L.cue(W(1, 'aplicativos'), 'slide');
  const askBox = $('div', 'anton', s2, { position: 'absolute', left: '0', top: '240px', width: '1080px', textAlign: 'center', fontSize: '112px', lineHeight: '1' });
  askBox.innerHTML = `UMA PARTE <span style="color:${OR}">FICA</span><br>NO CAMINHO`;
  hid(askBox);
  tl.fromTo(askBox, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, W(1, 'parte'));

  // ---------- S3 · "Os apps trazem clientes novos. Isso tem valor." ----------
  const s3 = L.scene(T(2), T(4) - 0.02);
  const dotsWrap = $('div', 'full', s3);
  const rnd = L.rng(42);
  const dots = [];
  for (let i = 0; i < 170; i++) {
    let x;
    let y;
    do { x = 70 + rnd() * 940; y = 330 + rnd() * 1050; } while (Math.hypot(x - 540, y - 860) < 150);
    const d = $('div', null, dotsWrap, { position: 'absolute', left: px(x - 9), top: px(y - 9), width: '18px', height: '18px', borderRadius: '50%', background: '#fff' });
    dots.push({ d, x, y, k: Math.hypot(x - 540, y - 860) });
  }
  dots.sort((p, q) => p.k - q.k);
  const tDots = W(2, 'clientes') - 0.25;
  dots.forEach((p, i) => {
    hid(p.d);
    tl.fromTo(p.d, { autoAlpha: 0, scale: 0 }, { autoAlpha: 0.85, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, tDots + (i / dots.length) * 1.1);
  });
  L.cue(tDots, 'dots');
  const hub = $('div', null, s3, { position: 'absolute', left: '440px', top: '760px', width: '200px', height: '200px', borderRadius: '50%', border: `4px solid ${OR}`, display: 'grid', placeItems: 'center', boxShadow: `0 0 80px rgba(255,90,31,.45)` });
  hub.innerHTML = '<svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 18h4"/></svg>';
  pop(hub, T(2));
  const h3 = $('div', 'anton', s3, { position: 'absolute', left: '0', top: '170px', width: '1080px', textAlign: 'center', fontSize: '120px', lineHeight: '1' });
  h3.innerHTML = `CLIENTES <span style="color:${OR}">NOVOS</span>`;
  hid(h3);
  tl.fromTo(h3, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, W(2, 'clientes'));
 const ok = cchip(s3, 1030, '', { background: '#121214', color: '#fff', border: '2px solid rgba(255,255,255,.3)' });
  ok.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>ISSO TEM VALOR';
  pop(ok, W(2, 'isso'));
  L.cue(W(2, 'isso'), 'pop');

  // ---------- S4 · "Mas e o cliente que já ama a sua doceria? Ele pode pedir direto com você." ----------
  const tMas = T(3);
  tl.to([ok, h3, hub], { autoAlpha: 0, duration: 0.25 }, tMas);
  const fav = dots[18];
  dots.forEach((p) => { if (p !== fav) tl.to(p.d, { autoAlpha: 0.12, duration: 0.4 }, tMas); });
  tl.to(fav.d, { background: OR, scale: 2.4, autoAlpha: 1, boxShadow: `0 0 30px ${OR}`, duration: 0.4 }, tMas);
  dotsWrap.style.transformOrigin = `${fav.x}px ${fav.y}px`;
  tl.to(dotsWrap, { scale: 3.2, x: 540 - fav.x, y: 600 - fav.y, duration: 1.1, ease: 'power3.inOut' }, tMas + 0.1);
  tl.to(dotsWrap, { autoAlpha: 0, duration: 0.4 }, W(3, 'ele') - 0.1);
  L.cue(tMas + 0.1, 'riser', { d: 1.1 });
  // cartão real do cliente fiel (linha da tela Clientes)
  const favCard = $('div', null, s3, { position: 'absolute', left: '0', top: '0' });
  L.crop(favCard, L.P('d-clientes'), 280, 252, 850, 34, { k: 1.2, left: 30, top: 640, style: { borderRadius: '18px 18px 0 0', backgroundColor: '#fff' } });
  L.crop(favCard, L.P('d-clientes'), 280, 571, 850, 56, { k: 1.2, left: 30, top: 640 + 34 * 1.2, style: { borderRadius: '0 0 18px 18px', backgroundColor: '#fff', boxShadow: `0 40px 90px -20px rgba(0,0,0,.8)` } });
  const favRing = $('div', null, favCard, { position: 'absolute', left: '26px', top: '636px', width: px(850 * 1.2 + 8), height: px(90 * 1.2 + 8), borderRadius: '22px', border: `5px solid ${OR}` });
  const favLbl = $('div', 'chip', favCard, { left: '30px', top: '540px', background: OR, color: '#121214', fontSize: '30px', padding: '14px 24px' });
  favLbl.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="#121214"><path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.9 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>CLIENTE FIEL';
  const favStats = $('div', null, favCard, { position: 'absolute', left: '0', top: '820px', width: '1080px', display: 'flex', justifyContent: 'center', gap: '24px' });
  const st = [['9', 'pedidos'], ['559', 'pontos']].map(([v, l]) => { const b = $('div', null, favStats, { padding: '22px 34px', borderRadius: '24px', background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.2)', textAlign: 'center', minWidth: '260px' }); b.innerHTML = `<div class="anton" style="font-size:96px;line-height:1;color:${OR}">${v}</div><div class="it" style="font:700 30px/1.2 'Inter Tight';color:#fff;letter-spacing:.08em;text-transform:uppercase">${l}</div>`; return b; });
  st.forEach((b, i) => { hid(b); pop(b, W(3, 'doceria') - 0.1 + i * 0.12, { y: 40 }, { y: 0 }); });
  L.cue(W(3, 'doceria') - 0.1, 'tick');
  void favRing;
  hid(favCard);
  tl.fromTo(favCard, { autoAlpha: 0, y: 80, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, W(3, 'ama') - 0.1);
  L.cue(W(3, 'ama') - 0.1, 'pop');
  realOn(W(3, 'ama') - 0.1, W(3, 'ele') - 0.05);
  tl.to(favCard, { y: -260, scale: 0.8, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, W(3, 'ele') - 0.1);

  // ---------- S4b/S5 · celular com o cardápio real → pedido cai no painel ----------
  const s5 = L.scene(W(3, 'ele') - 0.15, W(4, 'cai') - 0.05, world);
  const ph = L.phone(s5, '#7d2949');
  const menuImg = L.img(ph.view, L.M('menu-top'), 390, 797);
  const chk = L.img(ph.view, L.M('checkout-3'), 390, 797);
  hid(chk);
  tl.fromTo(ph.el, { y: 1300, rotateX: 38, rotateY: -14, scale: 0.9 }, { y: -40, rotateX: 10, rotateY: -12, scale: 1.02, duration: 0.85, ease: 'expo.out', immediateRender: false }, W(3, 'ele') - 0.15);
  tl.to(ph.el, { rotateX: 4, rotateY: 8, y: -60, duration: W(4, 'cai') - W(3, 'ele'), ease: 'sine.inOut' }, W(3, 'ele') + 0.7);
  L.cue(W(3, 'ele') - 0.15, 'whoosh');
  L.tap(ph.view, 150, 418, W(3, 'pedir'));
  const direct = cchip(s5, 330, '', { background: '#fff', color: '#121214', fontSize: '34px', padding: '16px 28px' });
  direct.innerHTML = `<i style="width:14px;height:14px;border-radius:50%;background:${OR}"></i>PEDIDO DIRETO`;
  pop(direct, W(3, 'direto'));
  tl.to(direct, { autoAlpha: 0, duration: 0.2 }, T(4));
  const brandChip = cchip(s5, 330, '', { background: OR, color: '#121214', fontSize: '34px', padding: '16px 28px' });
  brandChip.textContent = 'COM A SUA MARCA';
  pop(brandChip, W(4, 'marca') - 0.15);
  tl.to(brandChip, { autoAlpha: 0, duration: 0.2 }, W(4, 'pedido') - 0.1);
  tl.to(menuImg, { y: -260, duration: 1.0, ease: 'power2.inOut' }, W(4, 'cardapio'));
  tl.fromTo(ph.sweep, { x: 0 }, { x: 900, duration: 0.9, ease: 'power2.inOut', immediateRender: false }, W(4, 'marca') - 0.3);
  tl.fromTo(chk, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out', immediateRender: false }, W(4, 'pedido') - 0.35);
  L.tap(ph.view, 195, 760, W(4, 'pedido') + 0.2);
  tl.to(ph.el, { y: 1500, rotateX: -30, duration: 0.4, ease: 'power3.in' }, W(4, 'cai') - 0.42);

  // ---------- S5b · o pedido cai no painel (quadro de pedidos real) ----------
  const s6 = L.scene(W(4, 'cai') - 0.05, T(5) - 0.02, world);
  const mon = L.monitor(s6, 1000, L.P('d-pedidos'));
  const novo = mon.layer(L.P('d-pedidos-novo'));
  hid(novo);
  tl.fromTo(mon.el, { y: -1300, rotateX: -24 }, { y: 0, rotateX: 6, duration: 0.42, ease: 'power4.in', immediateRender: false }, W(4, 'cai') - 0.05);
  tl.to(mon.el, { rotateX: 0, duration: 0.5, ease: 'back.out(2)' }, W(4, 'cai') + 0.37);
  L.cue(W(4, 'cai') + 0.35, 'slam');
  tl.fromTo(novo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, immediateRender: false }, W(4, 'hora') - 0.05);
  L.cue(W(4, 'hora') - 0.05, 'ding');
  // empurra a câmera até o card novo e o aviso
  const fx = 14 + 585 * mon.k;
  const fy = 14 + 850 * mon.k;
  mon.el.style.transformOrigin = `${fx}px ${fy}px`;
  const mx = 40 + fx;
  const my = 960 - mon.h / 2 + fy;
  tl.to(mon.el, { scale: 2.25, x: 540 - mx, y: 860 - my, duration: 0.9, ease: 'expo.inOut' }, W(4, 'painel') - 0.35);
  L.cue(W(4, 'painel') - 0.35, 'zoom');
  realOn(W(4, 'cai'), T(5) - 0.02);

  // ---------- S6 · "Sem comissão por pedido do sistema." ----------
  whip(T(5));
  const s7 = L.scene(T(5), W(5, 'e') - 0.02);
  const hs = $('div', 'anton', s7, { position: 'absolute', left: '0', top: '520px', width: '1080px', textAlign: 'center', lineHeight: '0.98' });
  const l1 = $('div', null, hs, { fontSize: '150px' });
  l1.textContent = 'SEM';
  const l2 = $('div', null, hs, { fontSize: '210px', color: OR });
  l2.textContent = 'COMISSÃO';
  const l3 = $('div', null, hs, { fontSize: '150px' });
  l3.textContent = 'POR PEDIDO';
  const l4 = $('div', 'it', hs, { fontSize: '44px', fontWeight: '700', marginTop: '26px', color: 'rgba(255,255,255,.85)', textTransform: 'none' });
  l4.textContent = 'do sistema';
  const note = $('div', 'it', s7, { position: 'absolute', left: '120px', width: '840px', top: '1250px', textAlign: 'center', font: "500 30px/1.35 'Inter Tight', sans-serif", color: 'rgba(255,255,255,.6)' });
  note.textContent = 'Taxas de Pix e cartão seguem as do seu meio de pagamento.';
  [[l1, W(5, 'sem')], [l2, W(5, 'comissao')], [l3, W(5, 'por')], [l4, W(5, 'sistema')], [note, W(5, 'sistema') + 0.25]].forEach(([el, t], i) => {
    hid(el);
    tl.fromTo(el, { autoAlpha: 0, scale: i === 1 ? 1.6 : 1.2, y: 10 }, { autoAlpha: 1, scale: 1, y: 0, duration: i === 1 ? 0.3 : 0.25, ease: 'expo.out', immediateRender: false }, t - 0.03);
    if (i < 3) L.cue(t - 0.03, i === 1 ? 'impact' : 'hit');
  });

  // ---------- S6b · "E o cliente fica na sua base, com histórico e WhatsApp." ----------
  const s8 = L.scene(W(5, 'e') - 0.02, T(6) - 0.02, world);
  const tb = $('div', null, s8, { position: 'absolute', left: '22px', top: '420px', width: px(1136 * 0.91), height: px(390 * 0.91), transformStyle: 'preserve-3d' });
  L.crop(tb, L.P('d-clientes'), 280, 250, 1136, 390, { k: 0.91, cls: 'panel', style: { borderRadius: '20px' } });
  tl.fromTo(tb, { rotateX: 50, y: 500, autoAlpha: 0 }, { rotateX: 16, y: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', immediateRender: false }, W(5, 'e') - 0.02);
  tl.to(tb, { rotateX: 8, rotateY: -6, duration: 2.6, ease: 'sine.inOut' }, W(5, 'e') + 0.7);
  L.cue(W(5, 'e') - 0.02, 'whoosh');
  const modal = L.crop(s8, L.P('d-cliente'), 384, 240, 672, 418, { k: 1.38, cls: 'panel', left: 76, top: 820, style: { borderRadius: '26px' } });
  hid(modal);
  tl.fromTo(modal, { autoAlpha: 0, y: 160, scale: 0.85 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)', immediateRender: false }, W(5, 'historico') - 0.1);
  L.cue(W(5, 'historico') - 0.1, 'pop');
  const wa = $('div', 'chip', s8, { left: '620px', top: '700px', background: '#25d366', color: '#05230f', fontSize: '32px' });
  wa.innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24" fill="#05230f"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.4.1.1.1.7-.1 1.3z"/></svg>WHATSAPP';
  pop(wa, W(5, 'whatsapp') - 0.1);
  L.cue(W(5, 'whatsapp') - 0.1, 'pop');
  realOn(W(5, 'e'), T(6) - 0.02);

  // ---------- S7 · "Crie cupons para trazer o cliente para o seu canal…" ----------
  whip(T(6), -1);
  const s9 = L.scene(T(6), T(7) - 0.02, world);
  const cupT = L.crop(s9, L.P('d-cupons'), 280, 150, 780, 140, { k: 1.3, cls: 'panel', left: 33, top: 470, style: { borderRadius: '20px' } });
  tl.fromTo(cupT, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.45, immediateRender: false }, T(6));
  const cupRow = L.crop(s9, L.P('d-cupons'), 280, 238, 780, 50, { k: 1.3, cls: 'panel', left: 33, top: 470 + 88 * 1.3, style: { borderRadius: '14px', backgroundColor: '#fff' } });
  hid(cupRow);
  tl.fromTo(cupRow, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, W(6, 'trazer') - 0.1)
    .to(cupRow, { scale: 1.12, y: -26, boxShadow: `0 40px 80px -10px rgba(0,0,0,.7), 0 0 0 5px ${OR}`, duration: 0.4, ease: 'back.out(2.2)' }, W(6, 'trazer') - 0.1);
  L.cue(W(6, 'trazer') - 0.1, 'pop');
  // campo de cupom do cardápio real, com o código sendo digitado
  const field = L.crop(s9, L.M('checkout-3'), 14, 462, 362, 56, { k: 2.55, base: [390, 797], cls: 'panel', left: 78, top: 980, style: { borderRadius: '24px' } });
  const typed = $('div', null, s9, { position: 'absolute', left: '112px', top: '1010px', width: '560px', height: '80px', background: '#fff', font: "700 44px/80px 'Inter Tight', sans-serif", color: '#2a1a1f', letterSpacing: '.02em' });
  hid(field);
  hid(typed);
  tl.fromTo([field, typed], { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, W(6, 'cliente') - 0.3);
  const code = 'PRIMEIRACOMPRA';
  const tType = W(6, 'cliente');
  L.onFrame((t) => { const n = Math.round(L.clamp((t - tType) / 0.75) * code.length); typed.textContent = code.slice(0, n) + (t > tType && n < code.length && Math.floor(t * 6) % 2 ? '|' : ''); });
  L.cue(tType, 'type', { d: 0.75 });
  realOn(T(6), T(7) - 0.02);

  // ---------- S8 · "e veja nos relatórios quanto vende cada canal." ----------
  whip(T(7));
  const s10 = L.scene(T(7), T(8) - 0.02, world);
  const RK = 1.5;
  const rows = [
    [486, 32, 'title'],
    [545, 32, 'head'],
    [578, 41, 'card'],
    [619, 41, 'pdv'],
    [660, 41, 'wa'],
    [701, 41, 'tel'],
  ];
  let yy = 520;
  const rowEls = rows.map(([y, h, id], i) => {
    const el = L.crop(s10, L.P('d-relatorios'), 280, y, 680, h, { k: RK, cls: 'crop', left: 30, top: yy, style: { backgroundColor: '#fff', borderRadius: i === 0 ? '22px 22px 0 0' : i === rows.length - 1 ? '0 0 22px 22px' : '0' } });
    el.dataset.id = id;
    yy += h * RK + (i === 0 ? 6 : 0);
    return el;
  });
  const bgCard = $('div', null, s10, { position: 'absolute', left: '30px', top: '520px', width: px(680 * RK), height: px(yy - 520), borderRadius: '22px', background: '#fff', boxShadow: '0 60px 120px -30px rgba(0,0,0,.85)' });
  s10.insertBefore(bgCard, s10.firstChild);
  hid(bgCard);
  tl.fromTo(bgCard, { autoAlpha: 0, scaleY: 0.3, transformOrigin: '50% 0%' }, { autoAlpha: 1, scaleY: 1, duration: 0.45, ease: 'expo.out', immediateRender: false }, T(7));
  rowEls.forEach((el, i) => {
    hid(el);
    const t = i < 2 ? T(7) + 0.1 + i * 0.08 : W(7, 'relatorios') + (i - 2) * 0.16;
    tl.fromTo(el, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.35, immediateRender: false }, t);
    if (i >= 2) L.cue(t, 'tick');
  });
  const hiBar = $('div', null, s10, { position: 'absolute', left: '8px', top: px(rowEls[2].offsetTop || 0), width: '12px', height: px(40 * RK), background: OR, borderRadius: '6px' });
  hiBar.style.top = rowEls[2].style.top;
  hid(hiBar);
  tl.fromTo(hiBar, { autoAlpha: 0, scaleY: 0 }, { autoAlpha: 1, scaleY: 1, duration: 0.3, immediateRender: false }, W(7, 'canal') - 0.1);
  tl.to(rowEls[2], { boxShadow: `0 0 0 4px ${OR}`, scale: 1.04, duration: 0.3 }, W(7, 'canal') - 0.1);
  L.cue(W(7, 'canal') - 0.1, 'pop');
  const relNote = $('div', 'it', s10, { position: 'absolute', left: '30px', top: px(yy + 30), width: '1020px', font: "600 28px/1.35 'Inter Tight', sans-serif", color: 'rgba(255,255,255,.62)' });
  relNote.textContent = 'Recorte do relatório "Faturamento por canal": cardápio digital, balcão (PDV), WhatsApp e telefone.';
  hid(relNote);
  L.show(relNote, W(7, 'relatorios') + 0.5);
  realOn(T(7), T(8) - 0.02);

  // ---------- S9 · CTA "Tenha o seu canal próprio. Fale com a gente." ----------
  const s11 = L.scene(T(8) - 0.02, null);
  const orange = $('div', 'full', s11, { background: OR });
  tl.fromTo(orange, { clipPath: 'circle(0% at 50% 60%)' }, { clipPath: 'circle(150% at 50% 60%)', duration: 0.55, ease: 'power3.inOut', immediateRender: false }, T(8) - 0.25);
  L.cue(T(8) - 0.25, 'impact');
  const cta = $('div', 'anton', s11, { position: 'absolute', left: '0', top: '430px', width: '1080px', textAlign: 'center', color: '#121214', lineHeight: '0.96' });
  const c1 = $('div', null, cta, { fontSize: '150px' });
  c1.textContent = 'TENHA O SEU';
  const c2 = $('div', null, cta, { fontSize: '196px', color: '#fff' });
  c2.textContent = 'CANAL';
  const c3 = $('div', null, cta, { fontSize: '196px', color: '#fff' });
  c3.textContent = 'PRÓPRIO.';
  [[c1, W(8, 'tenha')], [c2, W(8, 'canal')], [c3, W(8, 'proprio')]].forEach(([el, t]) => {
    hid(el);
    tl.fromTo(el, { autoAlpha: 0, scale: 1.4 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'expo.out', immediateRender: false }, t - 0.03);
    L.cue(t - 0.03, 'hit');
  });
  const sub = $('div', 'it', s11, { position: 'absolute', left: '90px', width: '900px', top: '1060px', textAlign: 'center', font: "700 40px/1.3 'Inter Tight', sans-serif", color: '#121214' });
  sub.textContent = 'Cardápio digital com a sua marca + gestão completa da doceria.';
  hid(sub);
  L.show(sub, W(8, 'proprio') + 0.3);
  const btn = $('div', 'chip', s11, { left: '170px', top: '1250px', width: '740px', justifyContent: 'center', background: '#121214', color: '#fff', fontSize: '44px', padding: '34px 40px' });
  btn.innerHTML = `Quero meu canal próprio <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${OR}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
  pop(btn, W(8, 'fale') - 0.1);
  L.cue(W(8, 'fale') - 0.1, 'pop');
  L.tap(s11, 700, 1300, W(8, 'gente') + 0.25);
  tl.to(btn, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, W(8, 'gente') + 0.25);
  tl.to(btn, { scale: 1.04, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 3 }, W(8, 'gente') + 0.6);
  const fin = $('div', 'it', s11, { position: 'absolute', left: '0', width: '1080px', top: '1480px', textAlign: 'center', font: "800 34px/1 'Inter Tight', sans-serif", color: '#121214', letterSpacing: '.18em' });
  fin.textContent = 'FALE COM A GENTE';
  hid(fin);
  L.show(fin, W(8, 'fale') + 0.2);

  // legendas integradas (somem quando o título cinético já diz a frase)
  const capLayer = $('div', 'full', ui);
  L.captions(capLayer, { maxWords: 3, top: 1470, upper: true, cls: 'v1', hideIn: [[0, T(1) - 0.05], [T(5) - 0.05, W(5, 'e') - 0.05], [T(8) - 0.1, D + 1]] });

  L.cue(D - 2.4, 'tail');
  L.finish();
})();
