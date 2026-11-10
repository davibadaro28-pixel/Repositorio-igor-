// Tema "gestao" (V05): preto, branco e magenta; Archivo expandida/condensada; relógio, cortes com flash e tremida.
window.TEMA = (() => {
  const MG = '#ff2e7e';
  const B_INI = [1440, 1197];
  const B_DRE = [1440, 1134];
  const M = {};
  let tl, $, px, world, ui, tagReal, clockBox, fill;
  const flashes = [];
  const shakes = [];
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const slam = (el, t, from = {}, d = 0.28) => tl.fromTo(el, { autoAlpha: 0, scale: 1.45, ...from }, { autoAlpha: 1, scale: 1, x: 0, y: 0, rotate: 0, duration: d, ease: 'power4.out', immediateRender: false }, t);
  const push = (s, a, b, k = 0.06) => L.drift(s, { amp: 0, scale: 0, pushes: [[a, b, k]] });
  const hx = (h) => ((h - 8) / 10) * 900;

  M.init = () => {
    L.init({ bg: '#0b0b0d', grain: 0.06, vignette: 0.5 });
    ({ tl, $, px } = L);
    const stripes = $('div', 'full', L.bg, { backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,.025) 0 40px, transparent 40px 120px)' });
    L.onFrame((t) => { stripes.style.backgroundPosition = `${t * 60}px 0`; });
    const glow = $('div', 'glow', L.bg, { width: '1400px', height: '1400px', left: '-160px', top: '420px', background: 'radial-gradient(circle, rgba(255,46,126,.22), rgba(255,46,126,0) 60%)' });
    L.onFrame((t) => { glow.style.opacity = String(0.7 + 0.3 * Math.sin(t * Math.PI * (124 / 60))); });
    world = $('div', 'world', L.layers);
    ui = $('div', 'full', L.frame, { pointerEvents: 'none' });
    tagReal = L.tag(ui, 'Telas reais · dados de demonstração', { left: 60, top: 120, bg: 'rgba(11,11,13,.8)', color: '#fff', dot: MG, style: { border: '1.5px solid rgba(255,255,255,.2)', fontSize: '20px' } });
    const flash = $('div', 'full', ui, { background: '#fff', opacity: 0 });
    L.onFrame((t) => { const f = flashes.find((a) => t >= a && t < a + 0.18); flash.style.opacity = f != null ? String(0.55 * (1 - (t - f) / 0.18)) : '0'; });
    L.onFrame((t) => {
      const s = shakes.find(([a, d]) => t >= a && t < a + d);
      L.layers.style.transform = s ? `translate(${Math.sin(t * 90) * 14 * (1 - (t - s[0]) / s[1])}px, ${Math.cos(t * 77) * 10 * (1 - (t - s[0]) / s[1])}px)` : '';
    });
    clockBox = $('div', 'full', ui);
    tl.set(clockBox, { autoAlpha: 0 }, 0);
    return { T: L.n, W: L.wt, E: L.nEnd, D: L.D };
  };
  M.real = (a, b) => tl.to(tagReal, { autoAlpha: 1, duration: 0.2 }, a).to(tagReal, { autoAlpha: 0, duration: 0.2 }, b);
  M.corte = (t) => { flashes.push(t); L.cue(t, 'impact'); };
  M.tremer = (t, d = 0.4) => { shakes.push([t, d]); };

  // relógio do topo: aparece em a, some em b; barra de horas opcional
  M.relogio = (a, b, o = {}) => {
    tl.to(clockBox, { autoAlpha: 1, duration: 0.01 }, a).to(clockBox, { autoAlpha: 0, duration: 0.3 }, b);
    if (o.barra !== false) {
      const bar = $('div', null, clockBox, { position: 'absolute', left: '90px', top: '432px', width: '900px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,.18)' });
      fill = $('div', null, bar, { position: 'absolute', left: '0', top: '0', height: '6px', width: '0', borderRadius: '3px', background: MG, boxShadow: `0 0 20px ${MG}` });
      (o.marcas || [8, 10, 12, 15, 18]).forEach((h) => {
        const tk = $('div', 'cw5', bar, { position: 'absolute', left: px(((typeof h === 'number' ? h - 8 : 0) / 10) * 900 - 30), top: '16px', width: '60px', textAlign: 'center', fontSize: '26px', color: 'rgba(255,255,255,.55)' });
        tk.textContent = typeof h === 'number' ? `${h}h` : h;
      });
    }
  };
  M.hora = (html, t, until, h) => {
    const c = $('div', 'clock', clockBox);
    c.innerHTML = html;
    hid(c);
    tl.fromTo(c, { autoAlpha: 0, rotateX: 90, y: 40 }, { autoAlpha: 1, rotateX: 0, y: 0, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, t);
    if (until) tl.to(c, { autoAlpha: 0, rotateX: -90, y: -40, duration: 0.2, ease: 'power2.in' }, until - 0.2);
    L.cue(t, 'flip');
    if (h != null && fill) tl.to(fill, { width: h === 'fim' ? 900 : hx(h), duration: 0.6, ease: 'power3.out' }, t + 0.1);
    return c;
  };

  // gancho: linhas que batem nas palavras, bilhetes de "incêndio", texto em chamas e tremida
  M.gancho = (a, b, o) => {
    const s = L.scene(a, b);
    // faixa de texto vazado que corre sem parar ao fundo (o caos não para)
    if (o.faixa) {
      const fx = $('div', 'xw', s, { position: 'absolute', left: '0', top: '1180px', whiteSpace: 'nowrap', fontSize: '180px', lineHeight: '1', color: 'transparent', WebkitTextStroke: `3px rgba(255,46,126,.55)` });
      fx.textContent = o.faixa.repeat(6);
      const fx2 = $('div', 'xw', s, { position: 'absolute', left: '0', top: '200px', whiteSpace: 'nowrap', fontSize: '120px', lineHeight: '1', color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,.22)' });
      fx2.textContent = o.faixa.repeat(6);
      L.onFrame((t) => { fx.style.transform = `translateX(${-((t * 420) % 2400)}px)`; fx2.style.transform = `translateX(${-2400 + ((t * 300) % 2400)}px)`; });
    }
    const hk = $('div', 'full', s);
    const els = (o.linhas || []).map(([t, txt, top, size, color]) => {
      const e = $('div', 'xw', hk, { position: 'absolute', left: '0', width: '1080px', top: px(top), textAlign: 'center', fontSize: px(size), lineHeight: '1', color: color || '#fff' });
      e.innerHTML = txt;
      if (t > 0.05) { hid(e); slam(e, t); L.cue(t, 'hit'); } else tl.fromTo(e, { scale: 1.2 }, { scale: 1, duration: 0.3, ease: 'power4.out', immediateRender: false }, 0);
      return e;
    });
    if (o.recua) tl.to(els, { scale: 0.7, autoAlpha: 0.15, y: -260, duration: 0.4, ease: 'power3.in' }, o.recua);
    const rnd = L.rng(7);
    (o.notas || []).forEach(([t, n], i) => {
      const e = $('div', 'stick', hk, { left: px(40 + rnd() * 420), top: px(380 + i * 150 + rnd() * 40), background: i % 3 === 0 ? MG : i % 3 === 1 ? '#fff' : '#ffd23f', color: i % 3 === 0 ? '#fff' : '#111' });
      e.textContent = n;
      hid(e);
      tl.fromTo(e, { autoAlpha: 0, scale: 2.2, rotate: (rnd() - 0.5) * 50 }, { autoAlpha: 1, scale: 1, rotate: (rnd() - 0.5) * 16, duration: 0.22, ease: 'power4.out', immediateRender: false }, t);
      L.cue(t, 'sticker', { n: i });
    });
    if (o.fogo) {
      const f = $('div', 'xw', hk, { position: 'absolute', left: '0', width: '1080px', top: '1500px', textAlign: 'center', fontSize: '96px', lineHeight: '1', color: '#fff', textShadow: '0 0 40px rgba(255,90,40,.9), 0 0 90px rgba(255,46,126,.7)' });
      f.innerHTML = o.fogo[1];
      hid(f);
      slam(f, o.fogo[0]);
      L.cue(o.fogo[0], 'impact');
      L.onFrame((t) => { f.style.filter = t > o.fogo[0] ? `brightness(${1 + 0.25 * Math.sin(t * 40)})` : ''; });
    }
    if (o.tremer) { M.tremer(o.tremer, 0.5); L.cue(o.tremer, 'boom'); }
    tl.to(hk, { autoAlpha: 0, scale: 1.3, filter: 'blur(14px)', duration: 0.35, ease: 'power2.in' }, b - 0.4);
    const e = o.empurra ?? a + 0.6;
    L.drift(s, { amp: 0, scale: 0, pushes: [[e, e + 1.4, 0.08], [e + 1.4, b - 0.4, 0.05]] });
    return s;
  };

  // título em linhas (Archivo expandida)
  M.titulo = (a, b, lines, o = {}) => {
    if (a > 0.05) M.corte(a);
    const s = L.scene(a, b);
    L.linhas(s, lines, { cls: 'xw', top: o.top ?? 560, line: { fontSize: o.size ?? '100px', lineHeight: '1.02' }, scale: 1.45, dur: 0.28, ease: 'power4.out' });
    push(s, a + 0.4, b, 0.06);
    return s;
  };

  const tela = (s, src, w, top, enter) => {
    const m = L.monitor(s, w, L.P(src));
    m.el.style.top = px(top);
    return m;
  };

  M.caixa = (a, b, o) => {
    M.corte(a);
    const s = L.scene(a, b, world);
    const m = tela(s, 'd-caixa', 1000, 560);
    tl.fromTo(m.el, { y: 700, rotateX: -30, autoAlpha: 0 }, { y: 0, rotateX: 8, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, a + 0.1);
    L.cue(a + 0.1, 'whoosh');
    const troco = L.crop(s, L.P('d-caixa'), 280, 150, 278, 108, { k: 2.4, cls: 'pn5', left: 540 - (278 * 2.4) / 2, top: 820 });
    hid(troco);
    slam(troco, o.caixa, { y: 120 }, 0.4);
    L.cue(o.caixa, 'register');
    tl.to(m.el, { filter: 'brightness(.45)', duration: 0.3 }, o.caixa);
    M.real(a + 0.2, b - 0.05);
    push(s, o.caixa + 0.4, b, 0.06);
    return s;
  };

  M.encomendas = (a, b, o) => {
    M.corte(a);
    const s = L.scene(a, b, world);
    const EK = 1.7;
    const enc = L.crop(s, L.P('d-encomendas'), 285, 145, 565, 405, { k: EK, cls: 'pn5', left: 540 - (565 * EK) / 2, top: 560 });
    tl.fromTo(enc, { rotateX: 60, y: 300, autoAlpha: 0 }, { rotateX: 0, y: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out', immediateRender: false }, a);
    L.cue(a + 0.05, 'page');
    const sw = $('div', null, s, { position: 'absolute', left: px(540 - (565 * EK) / 2), width: px(565 * EK), height: px(62 * EK), top: '0', background: 'rgba(255,46,126,.14)', borderLeft: `10px solid ${MG}`, borderRadius: '6px' });
    hid(sw);
    const ys = [180, 242, 304, 366].map((y) => 560 + (y - 145) * EK);
    tl.set(sw, { autoAlpha: 1, top: ys[0] }, o.lista - 0.1);
    ys.slice(1).forEach((y, i) => { tl.to(sw, { top: y, duration: 0.18, ease: 'power3.inOut' }, o.lista + 0.12 + i * 0.22); L.cue(o.lista + 0.12 + i * 0.22, 'tick'); });
    M.real(a + 0.2, b - 0.05);
    push(s, o.lista + 1, b, 0.06);
    return s;
  };

  M.pedidos = (a, b, o) => {
    M.corte(a);
    const s = L.scene(a, b, world);
    const m = tela(s, 'd-pedidos', 1040, 560);
    tl.fromTo(m.el, { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.4)', immediateRender: false }, a);
    m.el.style.transformOrigin = '0 0';
    const k = 1.5;
    tl.to(m.el, { scale: k, x: -20 - k * (14 + 280 * m.k), y: 520 - 560 - k * (14 + 60 * m.k), duration: 0.7, ease: 'expo.inOut' }, o.zoom);
    tl.to(m.el, { x: 1080 - 20 - k * (14 + 1440 * m.k), duration: Math.max(1, (o.fimPan ?? b) - o.zoom - 0.8), ease: 'sine.inOut' }, o.zoom + 0.75);
    L.cue(o.zoom, 'zoom');
    [0, 0.35, 0.7].forEach((d, i) => L.cue(o.zoom + 0.45 + d, 'notif', { n: i }));
    M.real(a + 0.2, b - 0.05);
    return s;
  };

  M.cozinha = (a, b, o) => {
    M.corte(a);
    const s = L.scene(a, b, world);
    const m = tela(s, 'd-cozinha', 1000, 600);
    m.el.querySelector('.mon-body').style.borderRadius = '44px';
    m.el.querySelector('.mon-body').style.background = '#1b1b1f';
    tl.fromTo(m.el, { rotateY: 55, x: 600, autoAlpha: 0 }, { rotateY: -8, x: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, a);
    L.cue(o.sino ?? a + 0.2, 'bell');
    m.el.style.transformOrigin = '0 0';
    const k = 1.5;
    tl.to(m.el, { rotateY: 0, scale: k, x: 540 - 40 - k * (14 + 690 * m.k), y: 520 - 600 - k * (14 + 120 * m.k), duration: 0.8, ease: 'expo.inOut' }, o.zoom);
    L.cue(o.zoom, 'zoom');
    M.real(a + 0.2, b - 0.05);
    return s;
  };

  M.estoque = (a, b, o) => {
    M.corte(a);
    const s = L.scene(a, b, world);
    const LK = 2.6;
    const low = L.crop(s, L.P('d-inicio-full'), 1048, 700, 368, 122, { k: LK, base: B_INI, cls: 'pn5', left: 540 - (368 * LK) / 2, top: 700, style: { borderRadius: '24px' } });
    tl.fromTo(low, { y: 500, rotateX: 50, autoAlpha: 0 }, { y: 0, rotateX: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out', immediateRender: false }, a + 0.1);
    L.cue(a + 0.1, 'whoosh');
    const al = $('div', null, s, { position: 'absolute', left: px(540 - (368 * LK) / 2 - 12), top: '688px', width: px(368 * LK + 24), height: px(122 * LK + 24), borderRadius: '32px', border: `6px solid ${MG}`, boxShadow: '0 0 60px rgba(255,46,126,.6)' });
    hid(al);
    tl.fromTo(al, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 1.12, duration: 0.5, repeat: 3, ease: 'power2.out', immediateRender: false }, o.alerta);
    L.cue(o.alerta, 'alarm');
    M.tremer(o.alerta, 0.25);
    M.real(a + 0.2, b - 0.05);
    push(s, o.alerta + 0.3, b, 0.06);
    return s;
  };

  M.clientes = (a, b, o) => {
    M.corte(a);
    const s = L.scene(a, b, world);
    const CK = 0.93;
    const cl = $('div', null, s, { position: 'absolute', left: px(540 - (1136 * CK) / 2), top: '620px', width: px(1136 * CK), height: px(440 * CK), transformStyle: 'preserve-3d' });
    L.crop(cl, L.P('d-clientes'), 280, 200, 1136, 440, { k: CK, cls: 'pn5' });
    tl.fromTo(cl, { rotateY: -50, x: -700, autoAlpha: 0 }, { rotateY: 0, x: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out', immediateRender: false }, a);
    const colBox = (x0, x1, t) => {
      const bx = $('div', null, cl, { position: 'absolute', left: px((x0 - 280) * CK), top: px(50 * CK), width: px((x1 - x0) * CK), height: px(390 * CK), border: `5px solid ${MG}`, borderRadius: '12px', background: 'rgba(255,46,126,.08)' });
      hid(bx);
      tl.fromTo(bx, { autoAlpha: 0, scaleY: 0 }, { autoAlpha: 1, scaleY: 1, duration: 0.25, ease: 'power3.out', immediateRender: false }, t);
      L.cue(t, 'pop');
    };
    if (o.historico) colBox(915, 1040, o.historico);
    if (o.fidelidade) {
      colBox(1255, 1340, o.fidelidade);
      const tab = $('div', null, cl, { position: 'absolute', left: px((530 - 280) * CK), top: px(4 * CK), width: px(140 * CK), height: px(32 * CK), border: `4px solid ${MG}`, borderRadius: '10px' });
      hid(tab);
      tl.fromTo(tab, { autoAlpha: 0, scale: 1.4 }, { autoAlpha: 1, scale: 1, duration: 0.25, immediateRender: false }, o.fidelidade + 0.2);
    }
    M.real(a + 0.2, b - 0.05);
    push(s, (o.fidelidade ?? o.historico ?? a) + 0.4, b, 0.04);
    return s;
  };

  M.resultado = (a, b, o) => {
    M.corte(a);
    const s = L.scene(a, b, world);
    const KK = 1.24;
    const kpi = L.crop(s, L.P('d-inicio'), 280, 151, 849, 118, { k: KK, cls: 'pn5', left: 540 - (849 * KK) / 2, top: 600 });
    tl.fromTo(kpi, { autoAlpha: 0, y: -200 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)', immediateRender: false }, a + 0.2);
    L.cue(a + 0.2, 'whoosh');
    const chart = L.crop(s, L.P('d-inicio'), 280, 285, 752, 394, { k: 1.2, cls: 'pn5', left: 540 - (752 * 1.2) / 2, top: 800 });
    hid(chart);
    tl.fromTo(chart, { autoAlpha: 0, y: 200 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, o.resultado - 0.2);
    L.cue(o.resultado - 0.2, 'rise');
    [0, 1, 2].forEach((i) => {
      const u = $('div', null, s, { position: 'absolute', left: px(540 - (849 * KK) / 2 + (i * 287 + 14) * KK), top: px(600 + 112 * KK), width: px(250 * KK), height: '8px', borderRadius: '4px', background: MG });
      hid(u);
      tl.fromTo(u, { autoAlpha: 1, scaleX: 0, transformOrigin: '0 50%' }, { autoAlpha: 1, scaleX: 1, duration: 0.3, immediateRender: false }, o.resultado + i * 0.12);
    });
    M.real(a + 0.2, b - 0.05);
    push(s, o.resultado + 0.5, b, 0.05);
    return s;
  };

  M.dre = (a, b, o) => {
    M.corte(a);
    const s = L.scene(a, b, world);
    const RK = 1.3;
    const rows = [[247, 49], [615, 41], [1025, 41], [1066, 45]];
    let ry = 620;
    const els = rows.map(([y, h], i) => {
      const e = L.crop(s, L.P('d-fin-dre-full'), 280, y, 800, h, { k: RK, base: B_DRE, cls: 'crop', left: 540 - (800 * RK) / 2, top: ry, style: { backgroundColor: '#fff', borderRadius: i === 0 ? '18px 18px 0 0' : i === 3 ? '0 0 18px 18px' : '0' } });
      ry += h * RK + (i === 0 ? 0 : 8);
      hid(e);
      tl.fromTo(e, { autoAlpha: 0, x: i % 2 ? 600 : -600 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'expo.out', immediateRender: false }, o.dre - 0.2 + i * 0.12);
      return e;
    });
    L.cue(o.dre - 0.2, 'whoosh');
    tl.to(els[3], { scale: 1.08, boxShadow: `0 0 0 6px ${MG}, 0 30px 80px rgba(255,46,126,.45)`, duration: 0.35, ease: 'back.out(2)' }, o.sobrou);
    L.cue(o.sobrou, 'impact');
    M.real(a + 0.2, b - 0.05);
    push(s, o.sobrou + 0.3, b, 0.08);
    return s;
  };

  // computador + celular lado a lado (d-inicio e m-inicio reais)
  M.plataforma = (a, b, o = {}) => {
    M.corte(a);
    const s = L.scene(a, b, world);
    const m = tela(s, 'd-inicio', 900, 560);
    m.el.style.left = '30px';
    const ph = L.phone(s, '#7d2949');
    L.img(ph.view, L.P('m-inicio'), 390, 797);
    tl.fromTo(m.el, { x: -800, rotateY: 30, autoAlpha: 0 }, { x: 0, rotateY: 14, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, a);
    const tc = o.celular ?? a + 0.6;
    tl.fromTo(ph.el, { x: 900, y: 120, rotateY: -30, scale: 0.78, autoAlpha: 0 }, { x: 290, y: 160, rotateY: -16, scale: 0.78, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, tc - 0.25);
    L.cue(a, 'whoosh');
    L.cue(tc - 0.25, 'whoosh');
    if (o.computador) tl.to(m.el, { boxShadow: `0 0 0 4px ${MG}`, duration: 0.2 }, o.computador - 0.1);
    if (o.titulo) { const one = $('div', 'xw', s, { position: 'absolute', left: '0', width: '1080px', top: '260px', textAlign: 'center', fontSize: '96px', lineHeight: '1' }); one.innerHTML = o.titulo[1]; hid(one); slam(one, o.titulo[0]); }
    M.real(a + 0.2, b - 0.05);
    push(s, tc + 0.4, b, 0.06);
    return s;
  };

  // montagem: telas reais trocando no ritmo das palavras
  M.montagem = (a, b, cortes) => {
    const s = L.scene(a, b, world);
    const m = tela(s, cortes[0][1], 1000, 600);
    const layers = cortes.map(([t, src], i) => { const l = i ? m.layer(L.P(src)) : m.base; if (i) { hid(l); tl.set(l, { autoAlpha: 1 }, t); } return l; });
    cortes.forEach(([t, , label], i) => {
      if (i) { M.corte(t); tl.fromTo(m.el, { scale: 1.06 }, { scale: 1, duration: 0.25, ease: 'power3.out', immediateRender: false }, t); }
      const lb = $('div', 'cw5', s, { position: 'absolute', left: '0', width: '1080px', top: '380px', textAlign: 'center', fontSize: '84px', color: '#fff' });
      lb.textContent = label;
      hid(lb);
      tl.set(lb, { autoAlpha: 1 }, t);
      if (cortes[i + 1]) tl.set(lb, { autoAlpha: 0 }, cortes[i + 1][0]);
    });
    tl.fromTo(m.el, { y: 600, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'expo.out', immediateRender: false }, a);
    void layers;
    M.real(a, b - 0.05);
    push(s, a, b, 0.05);
    return s;
  };

  M.prova = (a, b) => {
    M.corte(a);
    const s = L.scene(a, b);
    L.prova(s, a, { top: 470, numSize: 300, kickFont: "800 34px/1.2 'Archivo', sans-serif", kickColor: 'rgba(255,255,255,.8)', numFont: "900 300px/1 'Archivo', sans-serif", numColor: MG, lblFont: "900 110px/1 'Archivo', sans-serif", lblSize: 110, lblColor: '#fff', noteFont: "600 28px/1.4 'Archivo', sans-serif", noteColor: 'rgba(255,255,255,.6)' });
    s.querySelectorAll('div').forEach((d) => { d.style.fontStretch = '112%'; });
    push(s, a + 1, b, 0.06);
    return s;
  };

  M.cta = (a, o) => {
    M.corte(a);
    const s = L.scene(a, null);
    L.linhas(s, o.linhas, { cls: 'xw', top: 440, line: { fontSize: '104px', lineHeight: '1' }, scale: 1.45, dur: 0.28, ease: 'power4.out' });
    const sub = $('div', 'cw5', s, { position: 'absolute', top: '830px', width: '960px', left: '60px', textAlign: 'center', fontSize: '40px', color: 'rgba(255,255,255,.75)', letterSpacing: '.04em' });
    sub.textContent = o.sub || 'Pedidos · caixa · estoque · clientes · financeiro';
    hid(sub);
    tl.fromTo(sub, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, o.tSub ?? a + 0.8);
    const btn = $('div', 'cw5', s, { position: 'absolute', left: '170px', top: '1100px', width: '740px', padding: '36px 30px', borderRadius: '999px', background: MG, color: '#fff', textAlign: 'center', fontSize: '58px', boxShadow: '0 30px 70px -20px rgba(255,46,126,.7)' });
    btn.textContent = o.botao[1];
    hid(btn);
    slam(btn, o.botao[0], { scale: 0.6 }, 0.4);
    L.cue(o.botao[0], 'pop');
    L.tap(s, 640, 1160, o.toque);
    tl.to(btn, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, o.toque);
    tl.to(btn, { scale: 1.05, duration: 0.24, yoyo: true, repeat: 5, ease: 'sine.inOut' }, o.toque + 0.35);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.1, o.botao[0], 0.06], [o.toque, L.D, 0.05]] });
    return s;
  };

  M.fim = (hideIn = []) => {
    const capLayer = $('div', 'full', ui);
    L.captions(capLayer, { maxWords: 3, top: 1490, cls: 'v5', upper: true, hideIn });
    L.cue(L.D - 2.4, 'tail');
    L.finish();
  };
  return M;
})();
