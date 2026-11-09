// V05 · "Um dia inteiro sob controle" — a plataforma completa, hora a hora.
// Preto, branco e magenta; Archivo expandida/condensada; relógio que vira a cada hora, cortes no tempo da batida.
(() => {
  const MG = '#ff2e7e';
  L.init({ bg: '#0b0b0d', grain: 0.06, vignette: 0.5 });
  const { tl, $, px } = L;
  const T = L.n;
  const W = L.wt;
  const D = L.D;
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const slam = (el, t, from = {}, d = 0.28) => tl.fromTo(el, { autoAlpha: 0, scale: 1.45, ...from }, { autoAlpha: 1, scale: 1, x: 0, y: 0, rotate: 0, duration: d, ease: 'power4.out', immediateRender: false }, t);
  const B_INI = [1440, 1197];
  const B_DRE = [1440, 1134];

  // fundo: faixas diagonais discretas que correm
  const stripes = $('div', 'full', L.bg, { backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,.025) 0 40px, transparent 40px 120px)' });
  L.onFrame((t) => { stripes.style.backgroundPosition = `${t * 60}px 0`; });
  const glow = $('div', 'glow', L.bg, { width: '1400px', height: '1400px', left: '-160px', top: '420px', background: 'radial-gradient(circle, rgba(255,46,126,.22), rgba(255,46,126,0) 60%)' });
  L.onFrame((t) => { glow.style.opacity = String(0.7 + 0.3 * Math.sin(t * 2 * Math.PI * (124 / 60) / 2)); });

  const world = $('div', 'world', L.layers);
  const ui = $('div', 'full', L.frame, { pointerEvents: 'none' });
  const tagReal = L.tag(ui, 'Telas reais · dados de demonstração', { left: 60, top: 120, bg: 'rgba(11,11,13,.8)', color: '#fff', dot: MG, style: { border: '1.5px solid rgba(255,255,255,.2)', fontSize: '20px' } });
  tl.to(tagReal, { autoAlpha: 1, duration: 0.2 }, T(2) + 0.3).to(tagReal, { autoAlpha: 0, duration: 0.2 }, T(11) - 0.2);

  // flash de corte (1–2 quadros brancos) e tremida
  const flash = $('div', 'full', ui, { background: '#fff', opacity: 0 });
  const flashes = [];
  const cut = (t) => { flashes.push(t); L.cue(t, 'impact'); };
  L.onFrame((t) => { const f = flashes.find((a) => t >= a && t < a + 0.18); flash.style.opacity = f != null ? String(0.55 * (1 - (t - f) / 0.18)) : '0'; });
  const shakes = [];
  L.onFrame((t) => {
    const s = shakes.find(([a, d]) => t >= a && t < a + d);
    L.layers.style.transform = s ? `translate(${Math.sin(t * 90) * 14 * (1 - (t - s[0]) / s[1])}px, ${Math.cos(t * 77) * 10 * (1 - (t - s[0]) / s[1])}px)` : '';
  });

  // ---------- S0 · gancho: "Você abriu uma doceria para empreender… ou para apagar incêndio o dia inteiro?" ----------
  const s0 = L.scene(0, T(2) - 0.12);
  const hk = $('div', 'full', s0);
  const line = (txt, top, size, color, t) => {
    const e = $('div', 'xw', hk, { position: 'absolute', left: '0', width: '1080px', top: px(top), textAlign: 'center', fontSize: px(size), lineHeight: '1', color });
    e.textContent = txt;
    if (t > 0.05) { hid(e); slam(e, t); L.cue(t, 'hit'); } else tl.fromTo(e, { scale: 1.2 }, { scale: 1, duration: 0.3, ease: 'power4.out', immediateRender: false }, 0);
    return e;
  };
  const k1 = line('Você abriu', 520, 104, '#fff', 0);
  const k2 = line('uma doceria', 650, 104, '#fff', W(0, 'uma') - 0.03);
  const k3 = line('para', 820, 80, 'rgba(255,255,255,.6)', W(0, 'para') - 0.03);
  const k4 = line('empreender…', 930, 88, MG, W(0, 'empreender') - 0.03);
  tl.to([k1, k2, k3, k4], { scale: 0.7, autoAlpha: 0.15, y: -260, duration: 0.4, ease: 'power3.in' }, T(1) - 0.15);
  const notes = ['Pedido atrasado!', 'Acabou o leite condensado', 'Cadê a encomenda das 15h?', 'Quanto vendi hoje?', 'O caixa não bate', 'Cliente sem resposta', 'Faltou embalagem'];
  const rnd = L.rng(7);
  notes.forEach((n, i) => {
    const e = $('div', 'stick', hk, { left: px(40 + rnd() * 420), top: px(380 + i * 150 + rnd() * 40), background: i % 3 === 0 ? MG : i % 3 === 1 ? '#fff' : '#ffd23f', color: i % 3 === 0 ? '#fff' : '#111' });
    e.textContent = n;
    hid(e);
    const t = W(1, 'ou') + 0.1 + i * 0.22;
    tl.fromTo(e, { autoAlpha: 0, scale: 2.2, rotate: (rnd() - 0.5) * 50 }, { autoAlpha: 1, scale: 1, rotate: (rnd() - 0.5) * 16, duration: 0.22, ease: 'power4.out', immediateRender: false }, t);
    L.cue(t, 'sticker', { n: i });
  });
  const fire = $('div', 'xw', hk, { position: 'absolute', left: '0', width: '1080px', top: '1500px', textAlign: 'center', fontSize: '104px', lineHeight: '1', color: '#fff', textShadow: '0 0 40px rgba(255,90,40,.9), 0 0 90px rgba(255,46,126,.7)' });
  fire.textContent = 'apagar incêndio';
  hid(fire);
  slam(fire, W(1, 'apagar') - 0.03);
  L.cue(W(1, 'apagar') - 0.03, 'impact');
  L.onFrame((t) => { fire.style.filter = t > W(1, 'apagar') ? `brightness(${1 + 0.25 * Math.sin(t * 40)})` : ''; });
  shakes.push([W(1, 'dia') - 0.05, 0.5]);
  L.cue(W(1, 'dia') - 0.05, 'boom');
  tl.to(hk, { autoAlpha: 0, scale: 1.3, filter: 'blur(14px)', duration: 0.35, ease: 'power2.in' }, T(2) - 0.5);

  // ---------- relógio do dia + barra de horas ----------
  const clockBox = $('div', 'full', ui);
  hid(clockBox);
  tl.to(clockBox, { autoAlpha: 1, duration: 0.01 }, T(2) - 0.12).to(clockBox, { autoAlpha: 0, duration: 0.3 }, T(10) - 0.1);
  const bar = $('div', null, clockBox, { position: 'absolute', left: '90px', top: '432px', width: '900px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,.18)' });
  const fill = $('div', null, bar, { position: 'absolute', left: '0', top: '0', height: '6px', width: '0', borderRadius: '3px', background: MG, boxShadow: `0 0 20px ${MG}` });
  const hours = [8, 10, 12, 15, 18];
  const hx = (h) => ((h - 8) / 10) * 900;
  hours.forEach((h) => {
    const tk = $('div', 'cw5', bar, { position: 'absolute', left: px(hx(h) - 30), top: '16px', width: '60px', textAlign: 'center', fontSize: '26px', color: 'rgba(255,255,255,.55)' });
    tk.textContent = `${h}h`;
  });
  const fillTo = (h, t) => tl.to(fill, { width: hx(h), duration: 0.6, ease: 'power3.out' }, t);
  const clocks = [];
  const clock = (txt, t, until) => {
    const c = $('div', 'clock', clockBox);
    c.innerHTML = txt;
    hid(c);
    tl.fromTo(c, { autoAlpha: 0, rotateX: 90, y: 40 }, { autoAlpha: 1, rotateX: 0, y: 0, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, t);
    if (until) tl.to(c, { autoAlpha: 0, rotateX: -90, y: -40, duration: 0.2, ease: 'power2.in' }, until - 0.2);
    L.cue(t, 'flip');
    clocks.push(c);
    return c;
  };

  // ---------- S1 · "Oito da manhã: abre o caixa." ----------
  cut(T(2) - 0.12);
  clock('08<b>:</b>00', T(2) - 0.1, T(3));
  fillTo(8.05, T(2));
  const s1 = L.scene(T(2) - 0.1, T(3) - 0.02, world);
  const m1 = L.monitor(s1, 1000, L.P('d-caixa'));
  m1.el.style.top = '560px';
  tl.fromTo(m1.el, { y: 700, rotateX: -30, autoAlpha: 0 }, { y: 0, rotateX: 8, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, W(2, 'manha') - 0.2);
  L.cue(W(2, 'manha') - 0.2, 'whoosh');
  const troco = L.crop(s1, L.P('d-caixa'), 280, 150, 278, 108, { k: 2.4, cls: 'pn5', left: 540 - (278 * 2.4) / 2, top: 820 });
  hid(troco);
  slam(troco, W(2, 'caixa') - 0.12, { y: 120 }, 0.4);
  L.cue(W(2, 'caixa') - 0.12, 'register');
  tl.to(m1.el, { filter: 'brightness(.45)', duration: 0.3 }, W(2, 'caixa') - 0.12);

  // ---------- S2 · "Dez: as encomendas do dia." ----------
  cut(T(3) - 0.05);
  clock('10<b>:</b>00', T(3) - 0.05, T(4));
  fillTo(10, T(3));
  const s2 = L.scene(T(3) - 0.05, T(4) - 0.02, world);
  const EK = 1.7;
  const enc = L.crop(s2, L.P('d-encomendas'), 285, 145, 565, 405, { k: EK, cls: 'pn5', left: 540 - (565 * EK) / 2, top: 560 });
  tl.fromTo(enc, { rotateX: 60, y: 300, autoAlpha: 0 }, { rotateX: 0, y: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out', immediateRender: false }, T(3) - 0.05);
  L.cue(T(3), 'page');
  const sweepB = $('div', null, s2, { position: 'absolute', left: px(540 - (565 * EK) / 2), width: px(565 * EK), height: px(62 * EK), top: '0', background: 'rgba(255,46,126,.14)', borderLeft: `10px solid ${MG}`, borderRadius: '6px' });
  hid(sweepB);
  const encY = [180, 242, 304, 366].map((y) => 560 + (y - 145) * EK);
  tl.set(sweepB, { autoAlpha: 1, top: encY[0] }, W(3, 'encomendas') - 0.1);
  encY.slice(1).forEach((y, i) => { tl.to(sweepB, { top: y, duration: 0.18, ease: 'power3.inOut' }, W(3, 'encomendas') + 0.12 + i * 0.22); L.cue(W(3, 'encomendas') + 0.12 + i * 0.22, 'tick'); });

  // ---------- S3 · "Meio-dia: todos os pedidos num quadro só." ----------
  cut(T(4) - 0.05);
  clock('12<b>:</b>00', T(4) - 0.05, T(6));
  fillTo(12, T(4));
  const s3 = L.scene(T(4) - 0.05, T(5) - 0.02, world);
  const m3 = L.monitor(s3, 1040, L.P('d-pedidos'));
  m3.el.style.top = '560px';
  tl.fromTo(m3.el, { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.4)', immediateRender: false }, T(4) - 0.05);
  // câmera: aproxima nas colunas e percorre o quadro da esquerda para a direita
  m3.el.style.transformOrigin = '0 0';
  const s3k = 1.5;
  const tx0 = -20 - s3k * (14 + 280 * m3.k);
  const tx1 = 1080 - 20 - s3k * (14 + 1440 * m3.k);
  const ty0 = 520 - 560 - s3k * (14 + 60 * m3.k);
  tl.to(m3.el, { scale: s3k, x: tx0, y: ty0, duration: 0.7, ease: 'expo.inOut' }, W(4, 'todos') - 0.25);
  tl.to(m3.el, { x: tx1, duration: 1.5, ease: 'sine.inOut' }, W(4, 'pedidos'));
  L.cue(W(4, 'todos') - 0.25, 'zoom');
  [0, 0.35, 0.7].forEach((d, i) => L.cue(W(4, 'todos') + 0.2 + d, 'notif', { n: i }));

  // ---------- S4 · "A cozinha vê tudo na tela." ----------
  cut(T(5) - 0.05);
  const s4 = L.scene(T(5) - 0.05, T(6) - 0.02, world);
  const m4 = L.monitor(s4, 1000, L.P('d-cozinha'));
  m4.el.style.top = '600px';
  m4.el.querySelector('.mon-body').style.borderRadius = '44px';
  m4.el.querySelector('.mon-body').style.background = '#1b1b1f';
  tl.fromTo(m4.el, { rotateY: 55, x: 600, autoAlpha: 0 }, { rotateY: -8, x: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, T(5) - 0.05);
  L.cue(W(5, 'cozinha'), 'bell');
  m4.el.style.transformOrigin = '0 0';
  const s4k = 1.5;
  tl.to(m4.el, { rotateY: 0, scale: s4k, x: 540 - 40 - s4k * (14 + 690 * m4.k), y: 520 - 600 - s4k * (14 + 120 * m4.k), duration: 0.8, ease: 'expo.inOut' }, W(5, 'tudo') - 0.2);
  L.cue(W(5, 'tudo') - 0.2, 'zoom');

  // ---------- S5 · "Três da tarde: alerta de estoque baixo." ----------
  cut(T(6) - 0.05);
  clock('15<b>:</b>00', T(6) - 0.05, T(8));
  fillTo(15, T(6));
  const s5 = L.scene(T(6) - 0.05, T(7) - 0.02, world);
  const LK = 2.6;
  const low = L.crop(s5, L.P('d-inicio-full'), 1048, 700, 368, 122, { k: LK, base: B_INI, cls: 'pn5', left: 540 - (368 * LK) / 2, top: 700, style: { borderRadius: '24px' } });
  tl.fromTo(low, { y: 500, rotateX: 50, autoAlpha: 0 }, { y: 0, rotateX: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out', immediateRender: false }, T(6) + 0.2);
  L.cue(T(6) + 0.2, 'whoosh');
  const alarm = $('div', null, s5, { position: 'absolute', left: px(540 - (368 * LK) / 2 - 12), top: '688px', width: px(368 * LK + 24), height: px(122 * LK + 24), borderRadius: '32px', border: `6px solid ${MG}`, boxShadow: `0 0 60px rgba(255,46,126,.6)` });
  hid(alarm);
  tl.fromTo(alarm, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 1.12, duration: 0.5, repeat: 3, ease: 'power2.out', immediateRender: false }, W(6, 'alerta') - 0.05);
  L.cue(W(6, 'alerta') - 0.05, 'alarm');
  shakes.push([W(6, 'alerta') - 0.05, 0.25]);

  // ---------- S6 · "Clientes com histórico e fidelidade." ----------
  cut(T(7) - 0.05);
  clock('16<b>:</b>30', T(7) - 0.05, T(8));
  fillTo(16.5, T(7));
  const s6 = L.scene(T(7) - 0.05, T(8) - 0.02, world);
  const CK = 0.93;
  const cl = $('div', null, s6, { position: 'absolute', left: px(540 - (1136 * CK) / 2), top: '620px', width: px(1136 * CK), height: px(440 * CK), transformStyle: 'preserve-3d' });
  L.crop(cl, L.P('d-clientes'), 280, 200, 1136, 440, { k: CK, cls: 'pn5' });
  tl.fromTo(cl, { rotateY: -50, x: -700, autoAlpha: 0 }, { rotateY: 0, x: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out', immediateRender: false }, T(7) - 0.05);
  const colBox = (x0, x1, t) => {
    const b = $('div', null, cl, { position: 'absolute', left: px((x0 - 280) * CK), top: px(50 * CK), width: px((x1 - x0) * CK), height: px(390 * CK), border: `5px solid ${MG}`, borderRadius: '12px', background: 'rgba(255,46,126,.08)' });
    hid(b);
    tl.fromTo(b, { autoAlpha: 0, scaleY: 0 }, { autoAlpha: 1, scaleY: 1, duration: 0.25, ease: 'power3.out', immediateRender: false }, t);
    L.cue(t, 'pop');
  };
  colBox(915, 1040, W(7, 'historico') - 0.1);
  colBox(1255, 1340, W(7, 'fidelidade') - 0.1);
  const tab = $('div', null, cl, { position: 'absolute', left: px((530 - 280) * CK), top: px((204 - 200) * CK), width: px(140 * CK), height: px(32 * CK), border: `4px solid ${MG}`, borderRadius: '10px' });
  hid(tab);
  tl.fromTo(tab, { autoAlpha: 0, scale: 1.4 }, { autoAlpha: 1, scale: 1, duration: 0.25, immediateRender: false }, W(7, 'fidelidade') + 0.1);

  // ---------- S7 · "Seis da tarde: o resultado do dia." ----------
  cut(T(8) - 0.05);
  clock('18<b>:</b>00', T(8) - 0.05, T(9));
  fillTo(18, T(8));
  const s7 = L.scene(T(8) - 0.05, T(9) - 0.02, world);
  const KK = 1.24;
  const kpi = L.crop(s7, L.P('d-inicio'), 280, 151, 849, 118, { k: KK, cls: 'pn5', left: 540 - (849 * KK) / 2, top: 600 });
  tl.fromTo(kpi, { autoAlpha: 0, y: -200 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)', immediateRender: false }, W(8, 'tarde') - 0.1);
  L.cue(W(8, 'tarde') - 0.1, 'whoosh');
  const chart = L.crop(s7, L.P('d-inicio'), 280, 285, 752, 394, { k: 1.2, cls: 'pn5', left: 540 - (752 * 1.2) / 2, top: 800 });
  hid(chart);
  tl.fromTo(chart, { autoAlpha: 0, y: 200 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, W(8, 'resultado') - 0.2);
  L.cue(W(8, 'resultado') - 0.2, 'rise');
  [0, 1, 2].forEach((i) => {
    const u = $('div', null, s7, { position: 'absolute', left: px(540 - (849 * KK) / 2 + (i * 287 + 14) * KK), top: px(600 + 112 * KK), width: px(250 * KK), height: '8px', borderRadius: '4px', background: MG });
    hid(u);
    tl.fromTo(u, { autoAlpha: 1, scaleX: 0, transformOrigin: '0 50%' }, { autoAlpha: 1, scaleX: 1, duration: 0.3, immediateRender: false }, W(8, 'resultado') + i * 0.12);
  });

  // ---------- S8 · "No fim do mês, o DRE mostra se sobrou dinheiro." ----------
  cut(T(9) - 0.05);
  clock('<span style="font-size:150px">FIM DO MÊS</span>', T(9) - 0.05, null);
  tl.to(fill, { width: 900, duration: 0.8, ease: 'power3.inOut' }, T(9));
  const s8 = L.scene(T(9) - 0.05, T(10) - 0.02, world);
  const RK = 1.3;
  const rows = [[247, 49], [615, 41], [1025, 41], [1066, 45]];
  let ry = 620;
  const rEls = rows.map(([y, h], i) => {
    const e = L.crop(s8, L.P('d-fin-dre-full'), 280, y, 800, h, { k: RK, base: B_DRE, cls: 'crop', left: 540 - (800 * RK) / 2, top: ry, style: { backgroundColor: '#fff', borderRadius: i === 0 ? '18px 18px 0 0' : i === 3 ? '0 0 18px 18px' : '0' } });
    ry += h * RK + (i === 0 ? 0 : 8);
    hid(e);
    tl.fromTo(e, { autoAlpha: 0, x: i % 2 ? 600 : -600 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'expo.out', immediateRender: false }, W(9, 'dre') - 0.2 + i * 0.12);
    return e;
  });
  L.cue(W(9, 'dre') - 0.2, 'whoosh');
  tl.to(rEls[3], { scale: 1.08, boxShadow: `0 0 0 6px ${MG}, 0 30px 80px rgba(255,46,126,.45)`, duration: 0.35, ease: 'back.out(2)' }, W(9, 'sobrou') - 0.05);
  L.cue(W(9, 'sobrou') - 0.05, 'impact');

  // ---------- S9 · "Tudo numa plataforma, no computador e no celular." ----------
  cut(T(10) - 0.05);
  const s9 = L.scene(T(10) - 0.05, T(11) - 0.02, world);
  const m9 = L.monitor(s9, 900, L.P('d-inicio'));
  m9.el.style.left = '30px';
  m9.el.style.top = '560px';
  const ph = L.phone(s9, '#7d2949');
  L.img(ph.view, L.P('m-inicio'), 390, 797);
  tl.fromTo(m9.el, { x: -800, rotateY: 30, autoAlpha: 0 }, { x: 0, rotateY: 14, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, T(10) - 0.05);
  tl.fromTo(ph.el, { x: 900, y: 120, rotateY: -30, scale: 0.78, autoAlpha: 0 }, { x: 290, y: 160, rotateY: -16, scale: 0.78, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, W(10, 'celular') - 0.25);
  L.cue(T(10) - 0.05, 'whoosh');
  L.cue(W(10, 'celular') - 0.25, 'whoosh');
  tl.to(m9.el, { boxShadow: `0 0 0 4px ${MG}`, duration: 0.2 }, W(10, 'computador') - 0.1);
  const one = $('div', 'xw', s9, { position: 'absolute', left: '0', width: '1080px', top: '260px', textAlign: 'center', fontSize: '96px', lineHeight: '1' });
  one.innerHTML = `TUDO NUMA<br><span style="color:${MG}">PLATAFORMA</span>`;
  hid(one);
  slam(one, W(10, 'tudo') - 0.05);

  // ---------- S10 · CTA "Gestão de verdade para docerias. Fale com a gente." ----------
  cut(T(11) - 0.05);
  const s10 = L.scene(T(11) - 0.05, null);
  const g1 = $('div', 'xw', s10, { position: 'absolute', left: '0', width: '1080px', top: '440px', textAlign: 'center', fontSize: '104px', lineHeight: '1' });
  g1.innerHTML = 'GESTÃO<br>DE VERDADE';
  hid(g1);
  slam(g1, W(11, 'gestao') - 0.05);
  const g2 = $('div', 'xw', s10, { position: 'absolute', left: '0', width: '1080px', top: '680px', textAlign: 'center', fontSize: '92px', lineHeight: '1', color: MG });
  g2.textContent = 'PARA DOCERIAS.';
  hid(g2);
  slam(g2, W(11, 'docerias') - 0.1);
  L.cue(W(11, 'docerias') - 0.1, 'hit');
  const sub = $('div', 'cw5', s10, { position: 'absolute', top: '830px', width: '960px', left: '60px', textAlign: 'center', fontSize: '40px', color: 'rgba(255,255,255,.75)', letterSpacing: '.04em' });
  sub.textContent = 'Pedidos · caixa · estoque · clientes · financeiro';
  hid(sub);
  tl.fromTo(sub, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, W(11, 'docerias') + 0.4);
  const btn = $('div', 'cw5', s10, { position: 'absolute', left: '170px', top: '1100px', width: '740px', padding: '36px 30px', borderRadius: '999px', background: MG, color: '#fff', textAlign: 'center', fontSize: '58px', boxShadow: '0 30px 70px -20px rgba(255,46,126,.7)' });
  btn.textContent = 'Fale com a gente →';
  hid(btn);
  slam(btn, W(11, 'fale') - 0.1, { scale: 0.6 }, 0.4);
  L.cue(W(11, 'fale') - 0.1, 'pop');
  L.tap(s10, 640, 1160, W(11, 'gente') + 0.45);
  tl.to(btn, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, W(11, 'gente') + 0.45);
  tl.to(btn, { scale: 1.05, duration: 0.24, yoyo: true, repeat: 5, ease: 'sine.inOut' }, W(11, 'gente') + 0.8);

  // aproximações de câmera nos trechos em que a cena já se montou e a fala continua
  L.drift(s0, { amp: 0, scale: 0, pushes: [[W(0, 'empreender'), T(1) + 0.2, 0.07]] });
  L.drift(s6, { amp: 0, scale: 0, pushes: [[W(7, 'fidelidade'), T(8), 0.04]] });
  L.drift(s8, { amp: 0, scale: 0, pushes: [[W(9, 'sobrou'), T(10), 0.1]] });
  L.drift(s10, { amp: 0, scale: 0, pushes: [[T(11) + 0.1, W(11, 'docerias'), 0.08], [W(11, 'gente'), D, 0.06]] });
  const capLayer = $('div', 'full', ui);
  L.captions(capLayer, { maxWords: 3, top: 1490, cls: 'v5', upper: true, hideIn: [[0, T(2) - 0.15], [T(11) - 0.1, D + 1]] });
  L.cue(D - 2.4, 'tail');
  L.finish();
})();
