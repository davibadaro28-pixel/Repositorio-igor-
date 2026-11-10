// Tema "taxas" (V01): grafite + laranja-alerta, Anton + Inter Tight, cortes secos e câmera agressiva.
// Biblioteca de cenas: cada função recebe os tempos (início/fim e marcas de palavra) e monta a cena.
window.TEMA = (() => {
  const OR = '#ff5a1f';
  const M = {};
  let tl, $, px, world, ui, real;
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const pop = (el, t, from = {}, to = {}, d = 0.5) => tl.fromTo(el, { autoAlpha: 0, scale: 0.7, ...from }, { autoAlpha: 1, scale: 1, duration: d, ease: 'back.out(1.8)', immediateRender: false, ...to }, t);
  const cchip = (parent, top, html, style = {}) => {
    const row = $('div', null, parent, { position: 'absolute', left: '0', top: px(top), width: '1080px', display: 'flex', justifyContent: 'center' });
    const c = $('div', 'chip', row, { position: 'relative', ...style });
    c.innerHTML = html;
    return c;
  };
  const HEART = '<svg width="30" height="30" viewBox="0 0 24 24" fill="#121214"><path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.9 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  const WA = '<svg width="36" height="36" viewBox="0 0 24 24" fill="#05230f"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.4.1.1.1.7-.1 1.3z"/></svg>';

  M.init = () => {
    L.init({ bg: '#121214', grain: 0.07, vignette: 0.6 });
    ({ tl, $, px } = L);
    const grid = $('div', 'full', L.bg, { backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize: '90px 90px' });
    const glow = $('div', 'glow', L.bg, { width: '1500px', height: '1500px', left: '-210px', top: '700px', background: 'radial-gradient(circle, rgba(255,90,31,.26), rgba(255,90,31,0) 62%)' });
    L.onFrame((t) => { grid.style.backgroundPosition = `0 ${-t * 16}px`; glow.style.transform = `translate(${Math.sin(t * 0.35) * 260}px, ${Math.cos(t * 0.27) * -380}px)`; });
    world = $('div', 'world', L.layers);
    ui = $('div', 'full', L.frame, { pointerEvents: 'none' });
    real = L.tag(ui, 'Tela real · dados de demonstração', { left: 60, top: 150, bg: 'rgba(18,18,20,.72)', dot: OR, style: { border: '1.5px solid rgba(255,255,255,.18)', fontSize: '21px' } });
    const wipe = $('div', null, ui, { position: 'absolute', left: '0', top: '-10%', width: '1080px', height: '120%', background: OR, visibility: 'hidden' });
    M.whips = [];
    L.onFrame((t) => {
      const w = M.whips.find(([a]) => t >= a && t < a + 0.42);
      wipe.style.visibility = w ? 'visible' : 'hidden';
      if (w) { const k = L.ease.inOut((t - w[0]) / 0.42); wipe.style.transform = `translateX(${w[1] * (-140 + 280 * k)}%) skewX(-12deg)`; }
    });
    return { T: L.n, W: L.wt, E: L.nEnd, D: L.D };
  };
  M.real = (a, b) => tl.to(real, { autoAlpha: 1, duration: 0.2 }, a).to(real, { autoAlpha: 0, duration: 0.15 }, b);
  M.whip = (t, dir = 1) => { M.whips.push([t - 0.21, dir]); L.cue(t - 0.21, 'whoosh'); };

  // cortes secos sincronizados às palavras: [tempo, foto | 'celular' | null, texto, cor]
  M.cortes = (a, b, cuts) => {
    const s = L.scene(a, b);
    cuts.forEach(([t0, foto, word, color], i) => {
      const t1 = cuts[i + 1] ? cuts[i + 1][0] : b;
      const sc = L.scene(t0, t1, s);
      if (foto === 'celular') {
        const ph = L.phone(sc, '#1b1416');
        ph.view.style.background = 'linear-gradient(170deg,#3a1b24,#140c0f 70%)';
        const clock = $('div', null, ph.view, { left: '0', top: '50px', width: '390px', textAlign: 'center', font: "600 86px/1 'Inter Tight', sans-serif", color: 'rgba(255,255,255,.92)' });
        clock.textContent = '18:26';
        const n = $('div', 'notif', ph.view);
        n.innerHTML = '<div class="ic"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div><div><b>Novo pedido</b><span>Você recebeu um pedido agora.</span></div>';
        tl.fromTo(n, { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, t0 + 0.05);
        L.onFrame((t) => { const v = t >= t0 && t < t0 + 0.55 ? Math.sin((t - t0) * 120) * 7 * (1 - (t - t0) / 0.55) : 0; ph.el.style.transform = `translate(${v}px,-262px) rotate(${v * 0.25}deg)`; });
        L.cue(t0 + 0.05, 'vibrate');
      } else if (foto) {
        const card = $('div', 'shadow', sc, { position: 'absolute', left: '110px', top: '250px', width: '860px', height: '860px', borderRadius: '40px', overflow: 'hidden' });
        const im = L.img(card, L.F(foto), 860, 860, { objectFit: 'cover' });
        tl.fromTo(im, { scale: 1.22 }, { scale: 1.06, duration: t1 - t0 + 0.2, ease: 'none', immediateRender: false }, t0);
        tl.fromTo(card, { scale: 1.1, rotate: i % 2 ? -3 : 3 }, { scale: 1, rotate: i % 2 ? -1 : 1, duration: 0.32, ease: 'expo.out', immediateRender: false }, t0);
      }
      const w = $('div', 'big', sc, { top: foto ? '1150px' : '700px', color: color || '#fff', fontSize: word.length > 9 ? '150px' : '210px' });
      w.innerHTML = word;
      tl.fromTo(w, { scale: 1.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, ease: 'expo.out', immediateRender: false }, t0);
      if (i) L.cue(t0, 'hit', { n: i });
    });
    return s;
  };

  // título cinético em linhas (Anton): [[tempo, html, {fontSize, color}], ...]
  M.titulo = (a, b, lines, o = {}) => {
    const s = L.scene(a, b);
    L.linhas(s, lines, { cls: 'anton', top: o.top ?? 560, line: { fontSize: '150px', lineHeight: '1' }, scale: 1.35, dur: 0.26 });
    if (o.nota) {
      const n = $('div', 'it', s, { position: 'absolute', left: '120px', width: '840px', top: px(o.notaTop ?? 1250), textAlign: 'center', font: "500 30px/1.35 'Inter Tight', sans-serif", color: 'rgba(255,255,255,.62)' });
      n.textContent = o.nota[1];
      hid(n);
      L.show(n, o.nota[0]);
    }
    L.drift(s, { amp: 0, scale: 0, pushes: [[a, b, 0.06]] });
    return s;
  };

  // bolo fatiado: a fatia "taxas e comissões" sai do quadro
  M.fatia = (a, b, o) => {
    const s2 = L.scene(a, b);
    const CX = 540, CY = 900, R = 380, a1 = -28, a2 = 30;
    const arc = (from, to, steps = 24) => {
      const pts = [`${R}px ${R}px`];
      for (let i = 0; i <= steps; i++) { const ang = ((from + ((to - from) * i) / steps) * Math.PI) / 180; pts.push(`${R + Math.cos(ang) * R * 1.02}px ${R + Math.sin(ang) * R * 1.02}px`); }
      return `polygon(${pts.join(',')})`;
    };
    const pie = $('div', null, s2, { position: 'absolute', left: px(CX - R), top: px(CY - R), width: px(2 * R), height: px(2 * R) });
    const mk = (clip) => {
      const d = $('div', null, pie, { position: 'absolute', inset: '0', clipPath: clip });
      const c = $('div', null, d, { position: 'absolute', inset: '0', borderRadius: '50%', overflow: 'hidden', boxShadow: 'inset 0 0 0 6px rgba(255,255,255,.08)' });
      L.img(c, L.F('bolo-premium-brigadeiro-com-morango'), 2 * R, 2 * R, { objectFit: 'cover', transform: 'scale(1.25)' });
      return d;
    };
    mk(arc(a2, 360 + a1, 60));
    const slice = mk(arc(a1, a2));
    const mid = (((a1 + a2) / 2) * Math.PI) / 180;
    const svg = $('div', null, pie, { position: 'absolute', inset: '0' });
    svg.innerHTML = `<svg width="${2 * R}" height="${2 * R}" style="overflow:visible"><path d="M${R + Math.cos((a1 * Math.PI) / 180) * R} ${R + Math.sin((a1 * Math.PI) / 180) * R} L${R} ${R} L${R + Math.cos((a2 * Math.PI) / 180) * R} ${R + Math.sin((a2 * Math.PI) / 180) * R}" fill="none" stroke="${OR}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const cut = svg.querySelector('path');
    cut.style.strokeDasharray = 2 * R;
    tl.fromTo(pie, { scale: 0.6, rotate: -40, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out', immediateRender: false }, a);
    tl.to(pie, { rotate: 6, duration: Math.max(0.5, b - a - 0.55), ease: 'none' }, a + 0.55);
    const tc = o.corte;
    tl.fromTo(cut, { strokeDashoffset: 2 * R }, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.inOut', immediateRender: false }, tc - 0.3);
    L.cue(tc - 0.3, 'knife');
    const sx = Math.cos(mid), sy = Math.sin(mid);
    tl.to(slice, { x: sx * 90, y: sy * 90, duration: 0.45, ease: 'back.out(2)' }, tc);
    const tag = $('div', 'chip', s2, { left: '560px', top: '1300px', background: OR, color: '#121214' });
    tag.textContent = 'TAXAS E COMISSÕES';
    hid(tag);
    pop(tag, tc + 0.25, { y: 20 }, { y: 0 });
    L.cue(tc + 0.25, 'pop');
    const ts = o.sai;
    tl.to(slice, { x: sx * 1100, y: sy * 700 + 400, rotate: 50, duration: 0.7, ease: 'power3.in' }, ts);
    tl.to(tag, { x: 700, y: 380, rotate: 18, duration: 0.7, ease: 'power3.in' }, ts);
    tl.to(cut, { opacity: 0, duration: 0.2 }, ts);
    L.cue(ts, 'slide');
    const head = $('div', 'anton', s2, { position: 'absolute', left: '0', top: '240px', width: '1080px', textAlign: 'center', fontSize: '112px', lineHeight: '1' });
    head.innerHTML = o.titulo || `UMA PARTE <span style="color:${OR}">FICA</span><br>NO CAMINHO`;
    hid(head);
    tl.fromTo(head, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, tc);
    return s2;
  };

  // mapa de clientes: pontos acendem ("clientes novos"); opcional: escurece e mergulha num cliente fiel
  M.pontos = (a, b, o) => {
    const s3 = L.scene(a, b);
    const wrap = $('div', 'full', s3);
    const rnd = L.rng(42);
    const dots = [];
    for (let i = 0; i < 170; i++) {
      let x, y;
      do { x = 70 + rnd() * 940; y = 330 + rnd() * 1050; } while (Math.hypot(x - 540, y - 860) < 150);
      const d = $('div', null, wrap, { position: 'absolute', left: px(x - 9), top: px(y - 9), width: '18px', height: '18px', borderRadius: '50%', background: '#fff' });
      dots.push({ d, x, y, k: Math.hypot(x - 540, y - 860) });
    }
    dots.sort((p, q) => p.k - q.k);
    const t0 = o.acende ?? a + 0.2;
    dots.forEach((p, i) => { hid(p.d); tl.fromTo(p.d, { autoAlpha: 0, scale: 0 }, { autoAlpha: 0.85, scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, t0 + (i / dots.length) * 1.1); });
    L.cue(t0, 'dots');
    const hub = $('div', null, s3, { position: 'absolute', left: '440px', top: '760px', width: '200px', height: '200px', borderRadius: '50%', border: `4px solid ${OR}`, display: 'grid', placeItems: 'center', boxShadow: '0 0 80px rgba(255,90,31,.45)' });
    hub.innerHTML = '<svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 18h4"/></svg>';
    pop(hub, a);
    const h3 = $('div', 'anton', s3, { position: 'absolute', left: '0', top: '170px', width: '1080px', textAlign: 'center', fontSize: '120px', lineHeight: '1' });
    h3.innerHTML = o.titulo || `CLIENTES <span style="color:${OR}">NOVOS</span>`;
    hid(h3);
    tl.fromTo(h3, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, t0 + 0.2);
    const out = [h3, hub];
    if (o.ok) {
      const ok = cchip(s3, 1030, '', { background: '#121214', color: '#fff', border: '2px solid rgba(255,255,255,.3)' });
      hid(ok);
      ok.innerHTML = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>${o.ok[1]}`;
      pop(ok, o.ok[0]);
      L.cue(o.ok[0], 'pop');
      out.push(ok);
    }
    if (o.fiel) {
      const tf = o.fiel;
      tl.to(out, { autoAlpha: 0, duration: 0.25 }, tf);
      const fav = dots[18];
      dots.forEach((p) => { if (p !== fav) tl.to(p.d, { autoAlpha: 0.12, duration: 0.4 }, tf); });
      tl.to(fav.d, { background: OR, scale: 2.4, autoAlpha: 1, boxShadow: `0 0 30px ${OR}`, duration: 0.4 }, tf);
      wrap.style.transformOrigin = `${fav.x}px ${fav.y}px`;
      tl.to(wrap, { scale: 3.2, x: 540 - fav.x, y: 600 - fav.y, duration: 1.1, ease: 'power3.inOut' }, tf + 0.1);
      L.cue(tf + 0.1, 'riser', { d: 1.1 });
      if (o.fielTexto) {
        const ft = $('div', 'anton', s3, { position: 'absolute', left: '0', top: '1060px', width: '1080px', textAlign: 'center', fontSize: '110px', color: OR });
        ft.innerHTML = o.fielTexto;
        hid(ft);
        tl.fromTo(ft, { autoAlpha: 0, scale: 1.3 }, { autoAlpha: 1, scale: 1, duration: 0.3, immediateRender: false }, tf + 0.6);
        L.cue(tf + 0.6, 'hit');
      }
    }
    return s3;
  };

  // cliente fiel: linha real da tela Clientes + 9 pedidos / 559 pontos
  M.fiel = (a, b, o = {}) => {
    const s = L.scene(a, b);
    const card = $('div', null, s, { position: 'absolute', left: '0', top: '0' });
    L.crop(card, L.P('d-clientes'), 280, 252, 850, 34, { k: 1.2, left: 30, top: 640, style: { borderRadius: '18px 18px 0 0', backgroundColor: '#fff' } });
    L.crop(card, L.P('d-clientes'), 280, 571, 850, 56, { k: 1.2, left: 30, top: 640 + 34 * 1.2, style: { borderRadius: '0 0 18px 18px', backgroundColor: '#fff', boxShadow: '0 40px 90px -20px rgba(0,0,0,.8)' } });
    $('div', null, card, { position: 'absolute', left: '26px', top: '636px', width: px(850 * 1.2 + 8), height: px(90 * 1.2 + 8), borderRadius: '22px', border: `5px solid ${OR}` });
    const lbl = $('div', 'chip', card, { left: '30px', top: '540px', background: OR, color: '#121214', fontSize: '30px', padding: '14px 24px' });
    lbl.innerHTML = `${HEART}CLIENTE FIEL`;
    const stats = $('div', null, card, { position: 'absolute', left: '0', top: '820px', width: '1080px', display: 'flex', justifyContent: 'center', gap: '24px' });
    const st = [['9', 'pedidos'], ['559', 'pontos']].map(([v, l]) => { const bx = $('div', null, stats, { padding: '22px 34px', borderRadius: '24px', background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.2)', textAlign: 'center', minWidth: '260px' }); bx.innerHTML = `<div class="anton" style="font-size:96px;line-height:1;color:${OR}">${v}</div><div class="it" style="font:700 30px/1.2 'Inter Tight';color:#fff;letter-spacing:.08em;text-transform:uppercase">${l}</div>`; return bx; });
    const te = o.em ?? a + 0.1;
    hid(card);
    tl.fromTo(card, { autoAlpha: 0, y: 80, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, te);
    L.cue(te, 'pop');
    st.forEach((bx, i) => { hid(bx); pop(bx, te + 0.45 + i * 0.12, { y: 40 }, { y: 0 }); });
    L.cue(te + 0.45, 'tick');
    if (o.titulo) {
      const h = $('div', 'anton', s, { position: 'absolute', left: '0', top: '260px', width: '1080px', textAlign: 'center', fontSize: '120px', lineHeight: '1' });
      h.innerHTML = o.titulo;
      hid(h);
      tl.fromTo(h, { autoAlpha: 0, scale: 1.3 }, { autoAlpha: 1, scale: 1, duration: 0.3, immediateRender: false }, o.tTitulo ?? te);
      L.cue(o.tTitulo ?? te, 'hit');
    }
    M.real(te, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[te + 0.5, b, 0.06]] });
    return s;
  };

  // celular com o cardápio real; o pedido é enviado e o celular sai (a = entra, b = sai)
  M.celular = (a, b, o = {}) => {
    const s = L.scene(a, b, world);
    const ph = L.phone(s, '#7d2949');
    const menu = L.img(ph.view, L.M('menu-top'), 390, 797);
    const chk = L.img(ph.view, L.M('checkout-3'), 390, 797);
    hid(chk);
    tl.fromTo(ph.el, { y: 1300, rotateX: 38, rotateY: -14, scale: 0.9 }, { y: -40, rotateX: 10, rotateY: -12, scale: 1.02, duration: 0.85, ease: 'expo.out', immediateRender: false }, a);
    tl.to(ph.el, { rotateX: 4, rotateY: 8, y: -60, duration: Math.max(0.5, b - a - 0.9), ease: 'sine.inOut' }, a + 0.85);
    L.cue(a, 'whoosh');
    if (o.toque) L.tap(ph.view, 150, 418, o.toque);
    if (o.direto) { const d = cchip(s, 330, `<i style="width:14px;height:14px;border-radius:50%;background:${OR}"></i>PEDIDO DIRETO`, { background: '#fff', color: '#121214', fontSize: '34px', padding: '16px 28px' }); hid(d); pop(d, o.direto); tl.to(d, { autoAlpha: 0, duration: 0.2 }, o.marca ? o.marca - 0.3 : b - 0.3); }
    if (o.marca) {
      const c = cchip(s, 330, o.marcaTexto || 'COM A SUA MARCA', { background: OR, color: '#121214', fontSize: '34px', padding: '16px 28px' });
      hid(c);
      pop(c, o.marca - 0.15);
      tl.to(c, { autoAlpha: 0, duration: 0.2 }, (o.pedido ?? b) - 0.2);
      tl.fromTo(ph.sweep, { x: 0 }, { x: 900, duration: 0.9, ease: 'power2.inOut', immediateRender: false }, o.marca - 0.3);
    }
    tl.to(menu, { y: -260, duration: 1.0, ease: 'power2.inOut' }, a + 0.9);
    const tp = o.pedido ?? b - 0.6;
    tl.fromTo(chk, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out', immediateRender: false }, tp - 0.35);
    L.tap(ph.view, 195, 760, tp + 0.15);
    tl.to(ph.el, { y: 1500, rotateX: -30, duration: 0.4, ease: 'power3.in' }, b - 0.38);
    return s;
  };

  // o pedido cai no quadro de pedidos real, com aviso e aproximação
  M.painel = (a, b, o = {}) => {
    const s = L.scene(a, b, world);
    const mon = L.monitor(s, 1000, L.P('d-pedidos'));
    const novo = mon.layer(L.P('d-pedidos-novo'));
    hid(novo);
    tl.fromTo(mon.el, { y: -1300, rotateX: -24 }, { y: 0, rotateX: 6, duration: 0.42, ease: 'power4.in', immediateRender: false }, a);
    tl.to(mon.el, { rotateX: 0, duration: 0.5, ease: 'back.out(2)' }, a + 0.42);
    L.cue(a + 0.4, 'slam');
    const th = o.hora ?? a + 0.6;
    tl.fromTo(novo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, immediateRender: false }, th);
    L.cue(th, 'ding');
    const fx = 14 + 585 * mon.k, fy = 14 + 850 * mon.k;
    mon.el.style.transformOrigin = `${fx}px ${fy}px`;
    const tz = o.zoom ?? th + 0.5;
    tl.to(mon.el, { scale: 2.25, x: 540 - (40 + fx), y: 860 - (960 - mon.h / 2 + fy), duration: 0.9, ease: 'expo.inOut' }, tz);
    L.cue(tz, 'zoom');
    M.real(a + 0.05, b);
    return s;
  };

  // "SEM COMISSÃO POR PEDIDO": tempos das 3 linhas e da linha menor (opcional)
  M.semComissao = (a, b, tt, o = {}) => {
    M.whip(a);
    const s = L.scene(a, b);
    const hs = $('div', 'anton', s, { position: 'absolute', left: '0', top: '520px', width: '1080px', textAlign: 'center', lineHeight: '0.98' });
    const ls = [['SEM', '150px', '#fff'], ['COMISSÃO', '210px', OR], ['POR PEDIDO', '150px', '#fff']].map(([t, f, c]) => { const e = $('div', null, hs, { fontSize: f, color: c }); e.textContent = t; return e; });
    if (o.sub) { const e = $('div', 'it', hs, { fontSize: '44px', fontWeight: '700', marginTop: '26px', color: 'rgba(255,255,255,.85)', textTransform: 'none' }); e.textContent = o.sub; ls.push(e); }
    const note = $('div', 'it', s, { position: 'absolute', left: '120px', width: '840px', top: '1250px', textAlign: 'center', font: "500 30px/1.35 'Inter Tight', sans-serif", color: 'rgba(255,255,255,.6)' });
    note.textContent = 'Taxas de Pix e cartão seguem as do seu meio de pagamento.';
    ls.push(note);
    ls.forEach((el, i) => {
      const t = tt[Math.min(i, tt.length - 1)] + (i >= tt.length ? 0.25 * (i - tt.length + 1) : 0);
      hid(el);
      tl.fromTo(el, { autoAlpha: 0, scale: i === 1 ? 1.6 : 1.2, y: 10 }, { autoAlpha: 1, scale: 1, y: 0, duration: i === 1 ? 0.3 : 0.25, ease: 'expo.out', immediateRender: false }, t - 0.03);
      if (i < 3) L.cue(t - 0.03, i === 1 ? 'impact' : 'hit');
    });
    L.drift(s, { amp: 0, scale: 0, pushes: [[tt[tt.length - 1], b, 0.06]] });
    return s;
  };

  // tela real de clientes + ficha do cliente + WhatsApp
  M.clientes = (a, b, o = {}) => {
    const s = L.scene(a, b, world);
    const tb = $('div', null, s, { position: 'absolute', left: '22px', top: '420px', width: px(1136 * 0.91), height: px(390 * 0.91), transformStyle: 'preserve-3d' });
    L.crop(tb, L.P('d-clientes'), 280, 250, 1136, 390, { k: 0.91, cls: 'panel', style: { borderRadius: '20px' } });
    tl.fromTo(tb, { rotateX: 50, y: 500, autoAlpha: 0 }, { rotateX: 16, y: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', immediateRender: false }, a);
    tl.to(tb, { rotateX: 8, rotateY: -6, duration: Math.max(0.6, b - a - 0.7), ease: 'sine.inOut' }, a + 0.7);
    L.cue(a, 'whoosh');
    const th = o.historico ?? a + 0.6;
    const modal = L.crop(s, L.P('d-cliente'), 384, 240, 672, 418, { k: 1.38, cls: 'panel', left: 76, top: 820, style: { borderRadius: '26px' } });
    hid(modal);
    tl.fromTo(modal, { autoAlpha: 0, y: 160, scale: 0.85 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)', immediateRender: false }, th);
    L.cue(th, 'pop');
    if (o.whatsapp) {
      const wa = $('div', 'chip', s, { left: '620px', top: '700px', background: '#25d366', color: '#05230f', fontSize: '32px' });
      wa.innerHTML = `${WA}WHATSAPP`;
      hid(wa);
      pop(wa, o.whatsapp);
      L.cue(o.whatsapp, 'pop');
    }
    if (o.cupom) {
      const c = cchip(s, 330, 'CUPOM PARA PEDIR DIRETO', { background: OR, color: '#121214', fontSize: '34px', padding: '16px 28px' });
      hid(c);
      pop(c, o.cupom);
      L.cue(o.cupom, 'pop');
    }
    M.real(a, b - 0.02);
    return s;
  };

  // cupons reais + código digitado no cardápio
  M.cupons = (a, b, o = {}) => {
    M.whip(a, -1);
    const s = L.scene(a, b, world);
    const cupT = L.crop(s, L.P('d-cupons'), 280, 150, 780, 140, { k: 1.3, cls: 'panel', left: 33, top: 470, style: { borderRadius: '20px' } });
    tl.fromTo(cupT, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.45, immediateRender: false }, a);
    const row = L.crop(s, L.P('d-cupons'), 280, 238, 780, 50, { k: 1.3, cls: 'panel', left: 33, top: 470 + 88 * 1.3, style: { borderRadius: '14px', backgroundColor: '#fff' } });
    hid(row);
    const tr = o.destaque ?? a + 0.6;
    tl.fromTo(row, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, tr)
      .to(row, { scale: 1.12, y: -26, boxShadow: `0 40px 80px -10px rgba(0,0,0,.7), 0 0 0 5px ${OR}`, duration: 0.4, ease: 'back.out(2.2)' }, tr);
    L.cue(tr, 'pop');
    const field = L.crop(s, L.M('checkout-3'), 14, 462, 362, 56, { k: 2.55, base: [390, 797], cls: 'panel', left: 78, top: 980, style: { borderRadius: '24px' } });
    const typed = $('div', null, s, { position: 'absolute', left: '112px', top: '1010px', width: '560px', height: '80px', background: '#fff', font: "700 44px/80px 'Inter Tight', sans-serif", color: '#2a1a1f', letterSpacing: '.02em' });
    hid(field); hid(typed);
    const td = o.digita ?? tr + 0.4;
    tl.fromTo([field, typed], { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, td - 0.3);
    const code = 'PRIMEIRACOMPRA';
    L.onFrame((t) => { const n = Math.round(L.clamp((t - td) / 0.75) * code.length); typed.textContent = code.slice(0, n) + (t > td && n < code.length && Math.floor(t * 6) % 2 ? '|' : ''); });
    L.cue(td, 'type', { d: 0.75 });
    M.real(a, b - 0.02);
    return s;
  };

  // prova: +30% de lucro (resultado informado pelo criador do sistema)
  M.prova = (a, b, o = {}) => {
    if (o.whip !== false) M.whip(a);
    const s = L.scene(a, b);
    L.prova(s, a, { imediato: o.whip === false, top: 470, numSize: 300, kickFont: "800 34px/1.2 'Inter Tight', sans-serif", kickColor: 'rgba(255,255,255,.8)', numFont: "400 300px/1 'Anton', sans-serif", numColor: OR, lblFont: "400 120px/1 'Anton', sans-serif", lblColor: '#fff', noteFont: "500 30px/1.35 'Inter Tight', sans-serif", noteColor: 'rgba(255,255,255,.6)' });
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 1, b, 0.06]] });
    return s;
  };

  // chamada final laranja: linhas [[tempo, texto, {fontSize, color}]] + botão [tempo, texto] + toque
  M.cta = (a, o) => {
    const s = L.scene(a - 0.02, null);
    const orange = $('div', 'full', s, { background: OR });
    tl.fromTo(orange, { clipPath: 'circle(0% at 50% 60%)' }, { clipPath: 'circle(150% at 50% 60%)', duration: 0.55, ease: 'power3.inOut', immediateRender: false }, a - 0.25);
    L.cue(a - 0.25, 'impact');
    L.linhas(s, o.linhas, { cls: 'anton', top: o.top ?? 430, line: { fontSize: '150px', lineHeight: '0.98', color: '#121214' }, scale: 1.4, dur: 0.28 });
    const sub = $('div', 'it', s, { position: 'absolute', left: '90px', width: '900px', top: px(o.subTop ?? 1060), textAlign: 'center', font: "700 40px/1.3 'Inter Tight', sans-serif", color: '#121214' });
    sub.textContent = o.sub || 'Cardápio digital com a sua marca + gestão completa da doceria.';
    hid(sub);
    L.show(sub, o.tSub ?? a + 0.8);
    const btn = $('div', 'chip', s, { left: '170px', top: '1250px', width: '740px', justifyContent: 'center', background: '#121214', color: '#fff', fontSize: '44px', padding: '34px 40px' });
    btn.innerHTML = `${o.botao[1]} <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${OR}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
    hid(btn);
    pop(btn, o.botao[0]);
    L.cue(o.botao[0], 'pop');
    L.tap(s, 700, 1300, o.toque);
    tl.to(btn, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, o.toque);
    tl.to(btn, { scale: 1.04, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 3 }, o.toque + 0.35);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a, L.D, 0.05]] });
    return s;
  };

  M.fim = (hideIn = []) => {
    const capLayer = $('div', 'full', ui);
    L.captions(capLayer, { maxWords: 3, top: 1470, upper: true, cls: 'v1', hideIn });
    L.cue(L.D - 2.4, 'tail');
    L.finish();
  };
  return M;
})();
